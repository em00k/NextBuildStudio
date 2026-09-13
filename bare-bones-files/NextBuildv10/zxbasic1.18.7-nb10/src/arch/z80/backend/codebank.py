# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

"""ZX Spectrum Next banked-code (CODEBANK) support.

A SUB/FUNCTION may be assigned to a *code bank*. Its body is emitted into a
separate output segment assembled at the code-window address, and a small
resident trampoline is emitted under the routine's ordinary mangled label, so
that call sites need no modification at all::

    _Foo:   call .core.__FAR_CALL
            DEFB  <logical bank>
            DEFW  _Foo.__far

At run time ``.core.__FAR_CALL`` pages the requested bank into the code window
and jumps to the real body. See ``lib/arch/zxnext/runtime/farcall.asm``.
"""

from __future__ import annotations

from src.api.codebank_options import (
    FAR_ADDR_SUFFIX,
    FAR_BODY_SUFFIX,
    init_codebank_options,
    physical_page,
    window_mmu_reg,
    window_slots,
)
from src.api.config import OPTIONS
from src.api.constants import CLASS

from .runtime import NAMESPACE

__all__ = (
    "BANKS_USED",
    "BANKS_WITH_DATA",
    "DIVERTED",
    "FAR_TRAMPOLINES",
    "bank_of",
    "bank_of_var",
    "banked_label",
    "collect_if_diverted",
    "diverted_bank",
    "emit_prologue_data",
    "far_alias",
    "init_codebank_options",
    "is_banking_active",
    "physical_page",
    "reset",
    "warn_if_no_routines",
    "window_mmu_reg",
)


# Maps a resident trampoline label ("_Foo") onto the real banked body label
# ("_Foo.__far"). Consumed by the optimizer's call-graph builder, so that a
# banked function's `ret` block is still linked back to its callers and its
# return value is not mistaken for dead.
FAR_TRAMPOLINES: dict[str, str] = {}

# Logical code banks that actually hold something.
BANKS_USED: set[int] = set()

# Logical code banks holding bank-local variables or arrays. A bank may appear
# here without holding any routine at all, in which case nothing ever pages it
# in automatically -- see VarTranslator and the warning raised for that case.
BANKS_WITH_DATA: set[int] = set()

# Module-level `asm` blocks -- and the BASIC labels naming them -- written
# inside a CODEBANK block. Bank -> the nodes to emit into it, in source order.
# Filled by the Translator as it walks the main body, and replayed by
# FunctionTranslator.start() inside that bank's `CODEBANK n` fence.
DIVERTED: dict[int, list] = {}

# id() of every node already parked in DIVERTED. The translator may visit a
# node more than once, and a block must not be emitted twice into a bank.
_DIVERTED_SEEN: set[int] = set()

# Banks already warned about for holding data but no routine, so that a bank
# holding both a diverted asm block and bank-local variables warns once.
_NO_ROUTINE_WARNED: set[int] = set()

# 8K page normally mapped at each MMU slot on a stock machine. Only used as the
# static default for logical bank 0; __FAR_INIT overwrites it at startup with
# whatever the loader really had mapped.
_DEFAULT_SLOT_PAGE = (0xFF, 0xFF, 10, 11, 4, 5, 0, 1)


def reset() -> None:
    """Clears per-compilation state. Called from backend.common.init()."""
    FAR_TRAMPOLINES.clear()
    BANKS_USED.clear()
    BANKS_WITH_DATA.clear()
    DIVERTED.clear()
    _DIVERTED_SEEN.clear()
    _NO_ROUTINE_WARNED.clear()


def is_banking_active() -> bool:
    """True once at least one banked routine or bank-local variable exists.

    Bank-local data counts because __CODE_BANK_TABLE has to cover its bank even
    if no routine lives there, so that the program can page it in by hand.
    """
    return bool(FAR_TRAMPOLINES) or bool(BANKS_WITH_DATA)


def emit_prologue_data() -> list[str]:
    """Resident data and constants the far-call runtime needs.

    Emitted from Backend.emit_prologue(), which runs after the function
    translator has decided what goes in a bank. Names are fully qualified
    because the prologue sits outside the `core` namespace.
    """
    if not is_banking_active():
        return []

    slot = OPTIONS.codewindow >> 13
    slots = window_slots()
    highest = max(BANKS_USED | BANKS_WITH_DATA)

    # One byte per logical bank for a single-slot window, two for a 16K one.
    # The boot row cannot be derived from its first byte: the stock mapping is
    # (.., 10, 11, 4, 5, ..), so a window at $6000 boots with pages 11 and 4,
    # which are not consecutive even though banked pairs always are.
    pages = [_DEFAULT_SLOT_PAGE[(slot + i) & 7] for i in range(slots)]
    for bank in range(1, highest + 1):
        first = physical_page(bank)
        pages.extend(first + i for i in range(slots))

    output = [
        "; --- ZX Next banked code (CODEBANK) ---",
        f"{NAMESPACE}.__FAR_MMU_REG EQU {window_mmu_reg()}",
    ]

    if slots > 1:
        # A separate EQU rather than `__FAR_MMU_REG + 1` in the nextreg operand,
        # so the runtime does not depend on the assembler folding an expression
        # into an immediate.
        output.append(f"{NAMESPACE}.__FAR_MMU_REG2 EQU {window_mmu_reg() + 1}")

    output.extend(
        [
            f"{NAMESPACE}.__FAR_STACK_SIZE EQU {3 * int(OPTIONS.codebankdepth)}",
            f"{NAMESPACE}.__CODE_BANK_TABLE:",
            "DEFB %s" % ", ".join(str(p) for p in pages),
        ]
    )

    return output


def bank_of(func) -> int:
    """Code bank of a FUNCTION symbol, 0 (resident) if unset."""
    return int(getattr(func.ref, "bank", 0) or 0)


def bank_of_var(entry) -> int:
    """Code bank holding a global variable or array, 0 (resident) if unset.

    A *scalar* `DIM x AT addr` is emitted as a bare EQU with no storage of its
    own, so there is nothing to place and it stays in the resident pass. That
    keeps a bank whose only declaration is such an alias from reserving a page
    and emitting an empty binary. Using it from the wrong bank is still caught,
    by SymbolTable._check_codebank_access at the use site and by
    codebank_asm.check_at_address_banks at the declaration.

    An array is different: `DIM a(n) AT addr` still emits the descriptor that
    __ARRAY indexes through, including a DEFW of the address itself. That
    storage belongs in the same bank as the data it points at, or the resident
    program ends up holding a pointer into a page that is not mapped.
    """
    if entry is None:
        return 0

    if getattr(entry, "addr", None) is not None and entry.class_ != CLASS.array:
        return 0

    return int(getattr(entry.ref, "bank", 0) or 0)


def far_alias(entry, name: str) -> str:
    """The label a FARPTR names: an alias for bank-local storage, else the name.

    Keyed on bank_of_var() rather than entry.ref.bank so that it cannot drift
    from the pass that emits the alias -- notably for a scalar `DIM x AT addr`,
    which carries a bank but is emitted as a resident EQU with no storage to
    alias, and needs none: an EQU belongs to no segment.
    """
    return f"{name}{FAR_ADDR_SUFFIX}" if bank_of_var(entry) else name


def banked_label(mangled: str) -> str:
    """Label of the real body of a banked routine, as opposed to its trampoline."""
    return f"{mangled}{FAR_BODY_SUFFIX}"


def diverted_bank(node) -> int:
    """Code bank a module-level ASM or LABEL node is compiled into, 0 if none."""
    if node.token == "ASM":
        return int(getattr(node, "bank", 0) or 0)

    if node.token == "LABEL":
        return int(getattr(node.ref, "bank", 0) or 0)

    return 0


def collect_if_diverted(node) -> bool:
    """Parks a node for replay into its bank.

    Returns True when the caller must *not* emit it where it stands, which is
    the whole point: a module-level asm block inside a CODEBANK block belongs
    in the bank, not in the resident main body.
    """
    bank = diverted_bank(node)
    if not bank:
        return False

    if id(node) not in _DIVERTED_SEEN:
        _DIVERTED_SEEN.add(id(node))
        DIVERTED.setdefault(bank, []).append(node)

    return True


def warn_if_no_routines(bank: int, lineno: int, fname: str | None = None) -> None:
    """Warns that a bank holds data but nothing that will ever page it in.

    Deduplicated, because a bank may reach this from both a diverted asm block
    and a bank-local variable, and one warning is enough.
    """
    import src.api.errmsg

    if bank in BANKS_USED or bank in _NO_ROUTINE_WARNED:
        return

    _NO_ROUTINE_WARNED.add(bank)
    src.api.errmsg.warning_codebank_has_no_routines(lineno, bank, fname)
