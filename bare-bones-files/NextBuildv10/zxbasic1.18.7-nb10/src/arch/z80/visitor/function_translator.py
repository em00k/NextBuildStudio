# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

from collections import defaultdict

import src.api
from src.api import global_ as gl
from src.api.codebank_options import FAR_ADDR_SUFFIX
from src.api.config import OPTIONS
from src.api.constants import CLASS, CONVENTION, SCOPE, TYPE
from src.api.debug import __DEBUG__
from src.api.global_ import optemps
from src.arch.z80 import backend
from src.arch.z80.backend import codebank, common
from src.arch.z80.backend.runtime import LABEL_REQUIRED_MODULES
from src.arch.z80.backend.runtime import Labels as RuntimeLabel
from src.arch.z80.visitor.translator import LabelledData
from src.arch.zx48k.backend import Backend
from src.symbols import sym as symbols

from .translator import Translator


class FunctionTranslator(Translator):
    REQUIRES = backend.REQUIRES

    def __init__(self, backend: Backend, function_list: list[symbols.ID]):
        if function_list is None:
            function_list = []
        super().__init__(backend)

        assert isinstance(function_list, list)
        assert all(x.token == "FUNCTION" for x in function_list)
        self.functions = function_list
        # Emitted only once every code bank has been closed, so that they land
        # in the resident program (see start()).
        self._deferred_bound_tables: list[LabelledData] = []
        self._deferred_resident: list[symbols.ID] = []

    def _local_array_load(self, scope, local_var):
        t2 = optemps.new_t()
        if scope == SCOPE.parameter:
            self.ic_pload(gl.PTR_TYPE, t2, "%i" % (local_var.offset - self.TYPE(gl.PTR_TYPE).size))
        elif scope == SCOPE.local:
            self.ic_pload(gl.PTR_TYPE, t2, "%i" % -(local_var.offset - self.TYPE(gl.PTR_TYPE).size))
        self.ic_fparam(gl.PTR_TYPE, t2)

    def start(self):
        """Translates every pending function, resident ones first.

        Banked routines are then emitted bank by bank, each group fenced by a
        `CODEBANK n` assembler directive, and the run of banks closed with
        `CODEBANK 0` so that whatever the compiler emits afterwards (deferred
        bound tables, DATA blocks, strings, the runtime library) lands back in
        the resident program.

        Any module-level asm block diverted into a bank is replayed inside that
        bank's fence, ahead of its routines. This is the point in the pipeline
        where that has to happen: the main body has been walked, so the set is
        complete, and Backend.emit() has not run, so the replayed text still
        goes through the ordinary inline-asm path and stays opaque to the
        optimizer.
        """
        banked: dict[int, list] = defaultdict(list)

        def drain(queue) -> None:
            while queue:
                f = queue.pop(0)
                bank = codebank.bank_of(f)
                if bank:
                    banked[bank].append(f)
                    continue
                __DEBUG__("Translating function " + f.__repr__())
                self.visit(f)

        drain(self.functions)

        # Module-level asm blocks the Translator diverted into a bank. A bank
        # may hold nothing else, in which case it still needs a fence and a
        # __CODE_BANK_TABLE entry, exactly like a bank holding only variables.
        diverted = codebank.DIVERTED
        codebank.BANKS_WITH_DATA.update(diverted)

        if not banked and not diverted:
            return

        if banked:
            # A bank holding only diverted asm has no routine to call, so it
            # must not drag in the far-call runtime or force __EXIT_FUNCTION
            # resident. Same as a bank holding only bank-local variables.
            self._prepare_far_calls(banked)

        emitted: set[int] = set()

        while True:
            # Recomputed each pass: visiting a bank can discover a nested
            # FUNCDECL belonging to a bank not seen yet.
            todo = sorted((set(banked) | set(diverted)) - emitted)
            if not todo:
                break

            bank = todo[0]
            emitted.add(bank)

            self.ic_inline("CODEBANK %i" % bank)

            for node in diverted.get(bank, ()):
                if node.token == "LABEL":
                    self.ic_label(node.mangled)
                    # A FARPTR naming this label needs a name the resident
                    # program is allowed to hold; see codebank.far_alias.
                    if node.ref.has_faraddress:
                        self.ic_label(f"{node.mangled}{FAR_ADDR_SUFFIX}")
                else:
                    self.emit_asm_node(node)

            queue = banked.pop(bank, [])

            while queue:
                f = queue.pop(0)
                __DEBUG__(f"Translating function {f!r} into CODEBANK {bank}")
                self.visit(f)

                # visit() may have discovered nested FUNCDECLs. Anything for
                # this bank is appended to the current queue; anything else is
                # rerouted, and resident ones are emitted after the banks close.
                while self.functions:
                    g = self.functions.pop(0)
                    g_bank = codebank.bank_of(g)
                    if g_bank == bank:
                        queue.append(g)
                    elif g_bank:
                        banked.setdefault(g_bank, []).append(g)
                    else:
                        self._deferred_resident.append(g)

        self.ic_inline("CODEBANK 0")

        for bank, nodes in sorted(diverted.items()):
            codebank.warn_if_no_routines(bank, nodes[0].lineno, getattr(nodes[0], "filename", None))

        drain(self._deferred_resident)

        for bound_table in self._deferred_bound_tables:
            self.ic_vard(bound_table.label, bound_table.data)
        self._deferred_bound_tables.clear()

    def _prepare_far_calls(self, banked: dict[int, list]) -> None:
        """Emits the resident trampolines and wires up the far-call runtime."""
        for bank, functions in sorted(banked.items()):
            for f in functions:
                if f.mangled in backend.INITS:
                    src.api.errmsg.error(
                        f.lineno,
                        f"'{f.name}' is used as an #init routine and cannot live in a CODEBANK, because "
                        f"it would run before the far-call runtime is initialised",
                    )
                    continue

                codebank.BANKS_USED.add(bank)
                codebank.FAR_TRAMPOLINES[f.mangled] = codebank.banked_label(f.mangled)
                self.ic_inline(
                    "\n".join(
                        (
                            f"{f.mangled}:",
                            f"call {RuntimeLabel.FAR_CALL}",
                            f"DEFB {bank}",
                            f"DEFW {codebank.banked_label(f.mangled)}",
                        )
                    )
                )

        if not codebank.is_banking_active():
            return

        backend.REQUIRES.add(LABEL_REQUIRED_MODULES[RuntimeLabel.FAR_CALL])
        backend.INITS.add(RuntimeLabel.FAR_INIT)

        # __EXIT_FUNCTION is emitted inline inside the *first* function whose
        # parameter block exceeds 11 bytes, and every later one jumps to it. If
        # that first function were banked, the shared label would end up inside
        # a bank. Force it into the resident epilogue up front instead.
        if not common.FLAG_use_function_exit:
            common.FLAG_use_function_exit = True
            common.AT_END.extend(
                (
                    "__EXIT_FUNCTION:",
                    f"ld sp, {common.IDX_REG}",
                    f"pop {common.IDX_REG}",
                    "pop de",
                    "add hl, sp",
                    "ld sp, hl",
                    "push de",
                    "exx",
                    "ret",
                )
            )

    def visit_FUNCTION(self, node):
        bound_tables = []
        bank = codebank.bank_of(node)

        # A banked routine's body lives under a separate label; its ordinary
        # mangled label is taken by the resident trampoline, so that call sites
        # need no special handling at all.
        self.ic_label(codebank.banked_label(node.mangled) if bank else node.mangled)
        if node.convention == CONVENTION.fastcall:
            self.ic_enter("__fastcall__")
        else:
            self.ic_enter(node.locals_size)

        for local_var in node.local_symbol_table.values():
            if not local_var.accessed:  # HINT: This should never happen as values() is already filtered
                src.api.errmsg.warning_not_used(local_var.lineno, local_var.name)
                # HINT: Cannot optimize local variables now, since the offsets are already calculated
                # if self.O_LEVEL > 1:
                #    return

            if local_var.class_ == CLASS.const or local_var.scope == SCOPE.parameter:
                continue

            if local_var.class_ == CLASS.array and local_var.scope == SCOPE.local:
                lbound_label = local_var.mangled + ".__LBOUND__"
                ubound_label = local_var.mangled + ".__UBOUND__"
                lbound_needed = not local_var.is_zero_based and (
                    local_var.is_dynamically_accessed or local_var.lbound_used or OPTIONS.array_check
                )
                ubound_needed = local_var.ubound_used or OPTIONS.array_check
                bound_ptrs = [lbound_label if lbound_needed else "0", ubound_label if ubound_needed else "0"]

                if lbound_needed or ubound_needed:
                    OPTIONS["__DEFINES"].value["__ZXB_USE_LOCAL_ARRAY_WITH_BOUNDS__"] = ""

                if lbound_needed:
                    l = ["%04X" % bound.lower for bound in local_var.bounds]
                    bound_tables.append(LabelledData(lbound_label, l))

                if ubound_needed:
                    l = ["%04X" % bound.upper for bound in local_var.bounds]
                    bound_tables.append(LabelledData(ubound_label, l))

                l = [len(local_var.bounds) - 1] + [x.count for x in local_var.bounds[1:]]  # TODO Check this
                q = []
                for x in l:
                    q.append("%02X" % (x & 0xFF))
                    q.append("%02X" % ((x & 0xFF) >> 8))

                q.append("%02X" % local_var.type_.size)
                r = []
                if local_var.default_value is not None:
                    r.extend(self.array_default_value(local_var.type_, local_var.default_value))
                self.ic_larrd(local_var.offset, q, local_var.size, r, bound_ptrs)  # Initializes array bounds

            else:  # Local vars always defaults to 0, so if 0 we do nothing
                if (
                    local_var.token != "FUNCTION"
                    and local_var.default_value is not None
                    and local_var.default_value != 0
                ):
                    if (
                        isinstance(local_var.default_value, symbols.CONSTEXPR)
                        and local_var.default_value.token == "CONSTEXPR"
                    ):
                        self.ic_lvarx(local_var.type_, local_var.offset, [self.traverse_const(local_var.default_value)])
                    else:
                        q = self.default_value(local_var.type_, local_var.default_value)
                        self.ic_lvard(local_var.offset, q)

        for i in node.ref.body:
            yield i

        self.ic_label("%s__leave" % node.mangled)

        # Now free any local string from memory.
        preserve_hl = False
        if node.convention == CONVENTION.stdcall:
            for local_var in node.local_symbol_table.values():
                scope = local_var.scope
                if local_var.type_ == self.TYPE(TYPE.string):
                    if local_var.class_ == CLASS.const or local_var.token == "FUNCTION":
                        continue

                    # Only if it's string we free it
                    if local_var.class_ != CLASS.array:  # Ok just free it
                        if scope == SCOPE.local or (scope == SCOPE.parameter and not local_var.byref):
                            if not preserve_hl:
                                preserve_hl = True
                                self.ic_exchg()

                            offset = -local_var.offset if scope == SCOPE.local else local_var.offset
                            self.ic_fpload(TYPE.string, local_var.t, offset)
                            self.runtime_call(RuntimeLabel.MEM_FREE, 0)
                    else:  # This is an array of strings, we must free it unless it's a by_ref array
                        if scope == SCOPE.local or (scope == SCOPE.parameter and not local_var.byref):
                            if not preserve_hl:
                                preserve_hl = True
                                self.ic_exchg()

                            self.ic_param(gl.BOUND_TYPE, local_var.count)
                            self._local_array_load(scope, local_var)
                            self.runtime_call(RuntimeLabel.ARRAYSTR_FREE_MEM, 0)

                if (
                    local_var.class_ == CLASS.array
                    and local_var.type_ != self.TYPE(TYPE.string)
                    and (scope == SCOPE.local or (scope == SCOPE.parameter and not local_var.byref))
                ):
                    if not preserve_hl:
                        preserve_hl = True
                        self.ic_exchg()

                    self._local_array_load(scope, local_var)
                    self.runtime_call(RuntimeLabel.MEM_FREE, 0)

        if preserve_hl:
            self.ic_exchg()

        if node.convention == CONVENTION.fastcall:
            self.ic_leave(CONVENTION.to_string(node.convention))
        else:
            self.ic_leave(node.ref.params.size)

        if bank:
            # These tables are emitted *after* ic_leave, so in a banked routine
            # they would land inside the bank. A BYREF array passed to a routine
            # in another bank would then have LBOUND()/UBOUND() dereference a
            # table that is not paged in. Keep them resident.
            self._deferred_bound_tables.extend(bound_tables)
        else:
            for bound_table in bound_tables:
                self.ic_vard(bound_table.label, bound_table.data)

    def visit_FUNCDECL(self, node):
        """Nested scope functions"""
        self.functions.append(node.entry)
