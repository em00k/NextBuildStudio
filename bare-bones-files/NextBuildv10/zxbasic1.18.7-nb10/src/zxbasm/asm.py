# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

from typing import Any, NamedTuple

from src.api import errmsg
from src.api import global_ as gl
from src.api.exception import Error
from src.zxbasm.asm_instruction import AsmInstruction
from src.zxbasm.expr import Expr
from src.zxbasm.label import Label


class Container(NamedTuple):
    """Single class container"""

    item: Any
    lineno: int


def collect_labels(args) -> list[Label]:
    """Recursively collects every Label referenced by a sequence of Expr trees."""
    result: list[Label] = []
    pending = list(args or ())

    while pending:
        node = pending.pop()
        if isinstance(node, Label):
            result.append(node)
            continue

        if isinstance(node, Expr):
            item = node.symbol.item if node.symbol is not None else None
            if isinstance(item, Label):
                result.append(item)
            elif isinstance(item, (tuple, list)):
                pending.extend(item)
            pending.extend(c for c in node.children if c is not None)

    return result


class Asm(AsmInstruction):
    """Class extension to AsmInstruction with a short name :-P
    and will trap some exceptions and convert them to error msgs.

    It will also record source line
    """

    def __init__(self, lineno, asm, arg=None):
        self.lineno = lineno
        self.label_refs: tuple = ()

        if asm not in ("DEFB", "DEFS", "DEFW"):
            try:
                super().__init__(asm, arg)
            except Error as v:
                errmsg.error(lineno, v.msg)
                return

            self.pending = len([x for x in self.arg if isinstance(x, Expr) and x.try_eval() is None]) > 0

            # Remember which labels this instruction refers to. Once an already
            # defined label is folded into a literal below, that information is
            # otherwise lost, and the CODEBANK cross-segment check needs it.
            self.label_refs = tuple(collect_labels(self.arg))

            if not self.pending:
                self.arg = self.argval()
        else:
            self.asm = asm
            self.pending = True

            if isinstance(arg, str):
                self.arg = tuple([Expr(Container(ord(x), lineno)) for x in arg])
            else:
                self.arg = arg
                # A DEFW may well hold a pointer to a label, so record those too
                # -- the CODEBANK cross-segment check has to see a table of bank
                # addresses just as much as it sees a JP or a CALL. Raw bytes
                # (INCBIN lowers to DEFB <file contents>) can hold no label, so
                # skip walking what may be several KB of them.
                if not isinstance(arg, (bytes, bytearray)):
                    self.label_refs = tuple(collect_labels(self.arg))

            self.arg_num = len(self.arg)

    def bytes(self) -> bytearray:
        """Returns opcodes"""
        if self.asm not in ("DEFB", "DEFS", "DEFW"):
            if self.pending:
                tmp = self.arg  # Saves current arg temporarily
                self.arg = (0,) * self.arg_num
                result = super(Asm, self).bytes()
                self.arg = tmp  # And recovers it

                return result

            return super(Asm, self).bytes()

        if self.asm == "DEFB":
            if self.pending:
                return bytearray((0,) * self.arg_num)

            return bytearray(x & 0xFF for x in self.argval())

        if self.asm == "DEFS":
            if self.pending:
                N = self.arg[0]
                if isinstance(N, Expr):
                    N = N.eval()
                return (0,) * N

            args = self.argval()
            arg0 = args[0]
            arg1 = args[1]
            assert isinstance(arg0, int)
            assert isinstance(arg1, int)

            if arg1 > 255:
                errmsg.warning_value_will_be_truncated(self.lineno)
            num = arg1 & 0xFF
            return bytearray((num,) * arg0)

        if self.pending:  # DEFW
            return bytearray((0,) * 2 * self.arg_num)

        result = bytearray()
        for i in self.argval():
            x = i & 0xFFFF
            result.extend([x & 0xFF, x >> 8])

        return bytearray(result)

    def argval(self):
        """Solve args values or raise errors if not
        defined yet
        """
        if gl.has_errors:
            return [None]

        if self.asm in ("DEFB", "DEFS", "DEFW"):
            result = tuple([x.eval() if isinstance(x, Expr) else x for x in self.arg])
            if self.asm == "DEFB" and any(x > 255 for x in result):
                errmsg.warning_value_will_be_truncated(self.lineno)
            return result

        self.arg = tuple([x if not isinstance(x, Expr) else x.eval() for x in self.arg])
        if gl.has_errors:
            return [None]

        if self.asm.split(" ")[0] in ("JR", "DJNZ"):  # A relative jump?
            if self.arg[0] < -128 or self.arg[0] > 127:
                errmsg.error(self.lineno, "Relative jump out of range")
                return [None]

        return super(Asm, self).argval()
