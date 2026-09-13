# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

"""Options describing the ZX Spectrum Next banked-code (CODEBANK) layout.

These live here rather than in the backend because both the compiler front end
and the standalone assembler need them: zxbasm has to know the code-window
address to honour a `CODEBANK n` directive, and the binary writer has to know
the window size to detect an overflowing bank.
"""

from src.api import errmsg
from src.api.config import OPTIONS
from src.api.options import Action, UndefinedOptionError

__all__ = (
    "FAR_ADDR_SUFFIX",
    "FAR_BODY_SUFFIX",
    "current_codebank",
    "init_codebank_options",
    "physical_page",
    "validate_codebank_options",
    "window_mmu_reg",
    "window_slots",
)

# Code-window sizes that can actually be paged. One 8K MMU slot, or two
# adjacent ones. Anything else has no meaning: the window is mapped by writing
# whole MMU slots, so it can only ever be a whole number of them, and the
# runtime maps at most two.
_VALID_WINDOW_SIZES = (8192, 16384)

# Suffix of the label under which a banked routine's real body is emitted. Its
# ordinary mangled label is taken by the resident trampoline, whose `DEFW` of
# this label is the one legitimate pointer from the resident program into a
# bank -- __FAR_CALL pages the bank in before using it. Lives here so that the
# assembler can recognise it without importing from the z80 backend.
FAR_BODY_SUFFIX = ".__far"

# Suffix of the alias label emitted beside a bank-local variable, array or asm
# label that is the target of a FARPTR. The alias sits at the same address as
# the real thing; naming it rather than the original is what lets the resident
# program hold the pointer without tripping the cross-segment check, on the same
# terms as a trampoline's DEFW: the address is only ever dereferenced by a
# runtime that pages the bank in first.
FAR_ADDR_SUFFIX = ".__faraddr"

# Every label suffix the resident program is allowed to point into a bank with.
FAR_POINTER_SUFFIXES = (FAR_BODY_SUFFIX, FAR_ADDR_SUFFIX)


def init_codebank_options() -> None:
    """Registers the CODEBANK options.

    Called from Backend.init() (which runs before the BASIC source is parsed, so
    every one of these is settable with `#pragma <name> = <value>`) and from
    asmparse.init() so that standalone zxbasm works too. ADD_IF_NOT_DEFINED
    makes it idempotent.
    """
    # Bank that subsequently declared SUB/FUNCTIONs belong to (0 = resident)
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codebank", type=int, default=0, ignore_none=True)
    # Address of the code window. The MMU slot paged at run time is address >> 13
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codewindow", type=int, default=0x6000, ignore_none=True)
    # Size of the code window: 8192 (one MMU slot) or 16384 (two adjacent ones)
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codewindowsize", type=int, default=8192, ignore_none=True)
    # Physical 8K page backing logical bank 1. A bank takes window_slots() pages,
    # so bank n -> codebankbase + (n - 1) * window_slots()
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codebankbase", type=int, default=30, ignore_none=True)
    # Explicit physical page list, overriding codebankbase. e.g. "30,31,34"
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codebankpages", type=str, default="", ignore_none=True)
    # Maximum *cross-bank* call nesting depth (3 shadow-stack bytes per level)
    OPTIONS(Action.ADD_IF_NOT_DEFINED, name="codebankdepth", type=int, default=16, ignore_none=True)


def current_codebank() -> int:
    """The code bank currently in effect, 0 (resident) if there is none.

    Tolerates the CODEBANK options not being registered at all. They are
    registered by Backend.init(), which anything exercising the symbol table on
    its own -- a unit test, or an embedder using the front end directly -- has
    no reason to have called.
    """
    try:
        return int(OPTIONS.codebank or 0)
    except UndefinedOptionError:
        return 0


def window_mmu_reg() -> int:
    """NextReg number of the first MMU slot covering the code window ($50..$57).

    A 16K window covers this slot and the next one.
    """
    return 0x50 + (OPTIONS.codewindow >> 13)


def window_slots() -> int:
    """Number of 8K MMU slots the code window spans: 1 or 2.

    Clamped rather than trusted, so a bad `codewindowsize` cannot produce a
    nonsensical layout in the window between the option being set and
    validate_codebank_options() rejecting it.
    """
    return 2 if OPTIONS.codewindowsize >= 16384 else 1


def validate_codebank_options() -> bool:
    """Checks the code-window geometry, reporting the first problem found.

    Called once the source has been parsed, so that a `#pragma` has had its say.
    Returns False if the layout cannot work, in which case nothing downstream
    should be trusted -- physical_page() and the bank table both assume the
    window is a whole number of MMU slots that fits in the address space.
    """
    size = OPTIONS.codewindowsize
    window = OPTIONS.codewindow

    if size not in _VALID_WINDOW_SIZES:
        errmsg.error(
            0,
            "Invalid code window size %i. It must be 8192 (one 8K MMU slot) or 16384 (two)" % size,
        )
        return False

    if window % 8192:
        errmsg.error(
            0,
            "The code window address $%04X is not on an 8K boundary. It is paged by whole MMU slots, "
            "so it must be a multiple of 8192" % window,
        )
        return False

    if window + size > 0x10000:
        errmsg.error(
            0,
            "The code window ($%04X-$%04X) runs past the end of the address space" % (window, window + size - 1),
        )
        return False

    return True


def physical_page(logical_bank: int) -> int:
    """First physical 8K page backing a logical code bank.

    A bank occupies window_slots() consecutive pages, so with a 16K window bank
    n owns this page and the next one. `codebankpages` therefore lists the
    *first* page of each bank.

    Logical bank 0 means 'resident' and has no page of its own; its slot in
    __CODE_BANK_TABLE is filled in at run time by __FAR_INIT with whatever the
    loader had mapped into the window.
    """
    if logical_bank <= 0:
        return 0

    stride = window_slots()
    pages = [p.strip() for p in (OPTIONS.codebankpages or "").split(",") if p.strip()]
    if pages:
        if logical_bank <= len(pages):
            return int(pages[logical_bank - 1], 0)
        # Past the end of an explicit list, keep allocating sequentially
        return int(pages[-1], 0) + (logical_bank - len(pages)) * stride

    return OPTIONS.codebankbase + (logical_bank - 1) * stride
