# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

import src.api
from src.api import global_ as gl
from src.api.codebank_options import FAR_ADDR_SUFFIX
from src.api.config import OPTIONS
from src.api.constants import CLASS
from src.arch.z80 import Translator
from src.arch.z80.backend import codebank
from src.arch.z80.visitor.translator_visitor import TranslatorVisitor
from src.symbols import sym as symbols


class VarTranslator(TranslatorVisitor):
    """Var Translator
    This translator emits memory var space

    Emits only the variables belonging to a single code bank, so that the whole
    of `data_ast` can be walked once per bank. Bank 0 is the resident variable
    area and is what an ordinary compilation emits; a ZX Next program using
    CODEBANK gets one extra pass per bank that holds data, fenced by `CODEBANK`
    assembler directives (see zxbc.py).
    """

    def __init__(self, backend, bank: int = 0):
        super().__init__(backend)
        self.bank = bank

    def _should_emit(self, entry) -> bool:
        """True if this declaration belongs to this pass and survives it.

        Both tests are made up front so that a pass neither warns twice about
        the same unused variable nor burns a temporary label on an array it is
        not going to emit. A bank is recorded as holding data only once
        something has actually survived for it, so that a bank whose only
        variable was dropped as unused does not reserve a page.
        """
        if codebank.bank_of_var(entry) != self.bank:
            return False

        if not entry.accessed:
            src.api.errmsg.warning_not_used(entry.lineno, entry.name, fname=entry.filename)
            if self.O_LEVEL > 1:  # HINT: Unused vars not compiled
                return False

        if self.bank:
            codebank.BANKS_WITH_DATA.add(self.bank)

        self._emit_line_marker(entry)
        return True

    def _emit_line_marker(self, entry) -> None:
        """Attributes the storage about to be emitted to its BASIC declaration.

        Generated variable storage carries no `#line`, so the assembler counts
        its own lines and reports them against the .bas filename -- a
        cross-segment reference in an array descriptor came out as a line number
        from a different part of the file entirely.

        Only when banking is active, because that is the only time the
        assembler has anything to complain about here, and it keeps every
        ordinary compilation byte for byte as it was.

        The marker names the line *before* the declaration: `#line N` sets the
        current line, so the line following the directive is N+1. That is why
        visit_ASM can pass the `asm` keyword's own line and have the first line
        of the block come out right.
        """
        if not codebank.is_banking_active():
            return

        self.ic_inline(f'#line {max(entry.lineno - 1, 0)} "{entry.filename}"')

    def _far_alias(self, entry) -> str | None:
        """The alias label to lay down beside this entry's storage, if any.

        Only bank-local storage that some FARPTR actually names gets one. A
        label costs no bytes, but emitting them unconditionally would still move
        every existing .map, and there is nothing to point at in the resident
        pass anyway.
        """
        if not self.bank or not entry.ref.has_faraddress:
            return None

        name = entry.data_label if entry.class_ == CLASS.array else entry.mangled
        return f"{name}{FAR_ADDR_SUFFIX}"

    def visit_LABEL(self, node):
        if self.bank:  # Labels are always resident
            return

        self.ic_label(node.mangled)
        for tmp in node.aliased_by:
            self.ic_label(tmp.mangled)

    def visit_VARDECL(self, node):
        entry = node.entry
        if not self._should_emit(entry):
            return

        alias = self._far_alias(entry)

        if entry.addr is not None:
            addr = self.traverse_const(entry.addr) if isinstance(entry.addr, symbols.SYMBOL) else entry.addr
            self.ic_deflabel(entry.mangled, addr)
            if alias:
                self.ic_deflabel(alias, addr)
        else:
            if alias:
                self.ic_label(alias)
            if entry.default_value is None:
                self.ic_var(entry.mangled, entry.size)
            else:
                if entry.default_value.token == "CONSTEXPR":
                    self.ic_varx(node.mangled, node.type_, [self.traverse_const(entry.default_value)])
                else:
                    self.ic_vard(node.mangled, Translator.default_value(node.type_, entry.default_value))

    def visit_ARRAYDECL(self, node):
        entry = node.entry
        assert entry.default_value is None or entry.addr is None, "Cannot use address and default_value at once"

        if not self._should_emit(entry):
            return

        lbound_label = entry.mangled + ".__LBOUND__"
        ubound_label = entry.mangled + ".__UBOUND__"
        bound_ptrs = ["0", "0"]  # NULL by default

        if not entry.is_zero_based and (entry.is_dynamically_accessed or entry.lbound_used):
            bound_ptrs[0] = lbound_label

        if entry.ubound_used or OPTIONS.array_check:
            bound_ptrs[1] = ubound_label

        data_label = entry.data_label
        idx_table_label = src.api.tmp_labels.tmp_label()
        l = ["%04X" % (len(node.bounds) - 1)]  # Number of dimensions - 1

        for bound in node.bounds[1:]:
            l.append("%04X" % (bound.upper - bound.lower + 1))

        l.append("%02X" % node.type_.size)
        arr_data = []

        alias = self._far_alias(entry)

        if entry.addr:
            addr = self.traverse_const(entry.addr) if isinstance(entry.addr, symbols.SYMBOL) else entry.addr
            self.ic_deflabel(data_label, "%s" % addr)
            if alias:
                self.ic_deflabel(alias, "%s" % addr)
        else:
            if entry.default_value is not None:
                arr_data = Translator.array_default_value(node.type_, entry.default_value)
            else:
                arr_data = ["00"] * node.size

        self.ic_varx(node.mangled, gl.PTR_TYPE, [idx_table_label])

        if entry.addr:
            self.ic_varx(entry.data_ptr_label, gl.PTR_TYPE, [self.traverse_const(entry.addr)])
            if bound_ptrs:
                self.ic_data(gl.PTR_TYPE, bound_ptrs)
        else:
            self.ic_varx(entry.data_ptr_label, gl.PTR_TYPE, [data_label])
            if bound_ptrs:
                self.ic_data(gl.PTR_TYPE, bound_ptrs)
            if alias:
                self.ic_label(alias)
            self.ic_vard(data_label, arr_data)

        self.ic_vard(idx_table_label, l)

        if bound_ptrs[0] != "0":
            l = ["%04X" % bound.lower for bound in node.bounds]
            self.ic_vard(lbound_label, l)

        if bound_ptrs[1] != "0":
            l = ["%04X" % bound.upper for bound in node.bounds]
            self.ic_vard(ubound_label, l)
