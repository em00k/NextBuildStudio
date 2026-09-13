# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

"""ZX Spectrum Next: module-level `asm` blocks written inside a CODEBANK block.

`CODEBANK n` is not lexically scoped. It is a parse-time flag read at a
SUB/FUNCTION header and at a global `DIM`, and nothing else records that a
statement was written inside the block. A module-level `asm` block therefore
used to compile into the resident main body and run inline, which is never what
anyone writing one inside a bank intends::

    CODEBANK 1
        my_table:
        asm
            db "h", "i"
        end asm

        SUB Show()
            PRINT PEEK @my_table        ' silently read a *resident* copy
        END SUB
    END CODEBANK

The parser marks every candidate (see `zxbparser.make_asm_sentence`); this pass
decides which of them are really compiled into the bank, and which labels move
with them. It has to run after parsing because the association between a label
and the block it names is positional: `my_table:` and the `asm` on the next line
reduce as two separate program lines, so the grammar never sees them together.
"""

from __future__ import annotations

from src.api import errmsg
from src.symbols.symbol_ import Symbol

__all__ = ("bind_module_level_asm", "check_at_address_banks", "check_label_bank_access")


def bind_module_level_asm(ast) -> None:
    """Decides which module-level `asm` blocks are compiled into a code bank.

    Only a *direct child of the top-level statement list* qualifies. A block
    nested in an IF, a FOR or any other statement is executable code in a
    control-flow position, so it keeps running exactly where it was written.
    """
    if ast is None or ast.token != "BLOCK":
        return

    diverted: set[int] = set()
    pending: list = []  # Labels not yet claimed by a block

    for node in ast.children:
        token = node.token

        if token == "LABEL":
            # A BASIC line number is a control-flow target, never a name for a
            # data block, so leave it resident and keep `GOTO 100` working.
            if node.ref.is_line_number:
                pending.clear()
                continue

            pending.append(node)
            continue

        if token == "CHKBREAK":
            continue  # Compiler-inserted by --enable-break. Names nothing

        if token == "ASM" and node.bank:
            for label in pending:
                label.ref.bank = node.bank
            pending.clear()

            diverted.add(id(node))
            continue

        pending.clear()  # Anything else ends the run

    _clear_nested(ast, diverted)


def _clear_nested(ast, diverted: set[int]) -> None:
    """Un-marks every `asm` block that is not at the top level.

    The parser marks by `OPTIONS.codebank` alone, so a block inside
    `IF x THEN ... END IF` written in a CODEBANK block is marked too. Left
    marked, the translator would lift it out of the control flow it belongs to.
    Clearing the bank restores exactly the behaviour it has always had:
    resident, and run where it stands.
    """
    for node in _walk(ast):
        if node.token == "ASM" and node.bank and id(node) not in diverted:
            node.bank = 0


def check_label_bank_access(ast) -> None:
    """Errors on a reference to a bank-local label from outside its own bank.

    Only one code bank is paged into the code window at a time, so the address
    of a label in bank n means nothing anywhere else. The assembler's
    cross-segment check is what actually guarantees this, and covers routes that
    never reach here; this exists to put a BASIC line number on the common case,
    exactly as SymbolTable._check_codebank_access does for variables.

    It cannot live there: label banks are assigned by the pass above, long after
    every access_label() call has run, so the check would never fire.
    """
    if ast is None:
        return

    stack: list[tuple[Symbol, int]] = [(ast, 0)]
    seen: set[int] = set()

    while stack:
        node, bank = stack.pop()
        if id(node) in seen:
            continue
        seen.add(id(node))

        if node.token == "UNARY" and node.operator == "FARADDRESS":
            continue  # FARPTR: naming a bank-local symbol is exactly the point

        for child in node.children:
            if child.token == "LABEL":
                # A label whose parent is a BLOCK is a *definition*. Anywhere
                # else it is a reference: GOTO/GOSUB/ON GOTO hold it as an
                # argument, `@lbl` as the operand of a UNARY ADDRESS.
                if node.token != "BLOCK":
                    _check_label(child, getattr(node, "lineno", child.lineno), bank)
                continue  # Never descend into a label

            if child.token == "FUNCDECL":
                # FuncRef puts the body in entry.children[1], so the routine is
                # reached through its entry -- with *its* bank in scope.
                entry = child.entry
                stack.append((entry, int(getattr(entry.ref, "bank", 0) or 0)))
                continue

            if child.token == "FUNCTION":
                continue  # Reached through a FUNCCALL: not the definition

            stack.append((child, bank))


def check_at_address_banks(data_ast) -> None:
    """Errors on a `DIM ... AT addr` whose address lies in the wrong bank.

    `DIM a(n) AT @label` still emits the descriptor __ARRAY indexes through,
    including a word holding the address itself. That word has to sit in the
    same bank as what it points at, so the declaration and its address must
    agree about which bank they are in.

    Pointing *into* the resident program is always fine -- it is permanently
    mapped -- so only a non-zero target bank that differs is rejected.

    This cannot be done while parsing: the address expression is dropped by
    `p_arr_decl` and never reaches the program AST, so it is only reachable
    here, through `entry.addr` on the declarations in `data_ast`. Label banks
    are also not assigned until `bind_module_level_asm` has run.
    """
    if data_ast is None:
        return

    for node in data_ast.children:
        entry = getattr(node, "entry", None)
        if entry is None or getattr(entry, "addr", None) is None:
            continue

        bank = int(getattr(entry.ref, "bank", 0) or 0)
        for target, name in _addressed_symbols(entry.addr):
            if not target or target == bank:
                continue

            errmsg.error(
                entry.lineno,
                "'%s' is declared in %s but its AT address '%s' lives in CODEBANK %i. The two must be in the "
                "same bank, because the array descriptor holding that address is only mapped with it"
                % (entry.name, _where(bank), name, target),
                fname=entry.filename,
            )
            break


def _addressed_symbols(addr):
    """Every banked symbol named by an AT address expression, as (bank, name).

    The expression is a constant tree -- typically CONSTEXPR/TYPECAST wrapping a
    UNARY ADDRESS whose operand is the label or variable being addressed -- so
    walking it for anything carrying a `bank` is enough.
    """
    stack = [addr]
    seen: set[int] = set()

    while stack:
        node = stack.pop()
        if node is None or id(node) in seen:
            continue
        seen.add(id(node))

        if node.token in ("LABEL", "VAR", "ARRAY"):
            yield int(getattr(node.ref, "bank", 0) or 0), node.name
            continue  # Never descend into a symbol's own definition

        stack.extend(getattr(node, "children", ()))


def _check_label(label, lineno: int, bank: int) -> None:
    target = int(getattr(label.ref, "bank", 0) or 0)
    if not target or target == bank:
        return

    errmsg.error(
        lineno,
        "'%s' lives in CODEBANK %i and cannot be reached from %s. Bank-local data is only addressable "
        "while its own bank is paged in" % (label.name, target, _where(bank)),
        fname=getattr(label, "filename", None),
    )


def _where(bank: int) -> str:
    return "CODEBANK %i" % bank if bank else "the resident program"


def _walk(root):
    """Every node under `root`, stopping at a routine boundary.

    A function body is a child of its FUNCTION id (FuncRef sets
    `parent.children = [PARAMLIST, BLOCK]`), so an unguarded walk would descend
    into every routine -- repeatedly, once per FUNCCALL naming it.
    """
    stack = [root]
    seen: set[int] = set()

    while stack:
        node = stack.pop()
        if id(node) in seen or node.token in ("FUNCDECL", "FUNCTION"):
            continue
        seen.add(id(node))

        yield node
        stack.extend(node.children)
