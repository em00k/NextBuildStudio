# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

from .symbol_ import Symbol


class SymbolASM(Symbol):
    """Defines an ASM sentence"""

    def __init__(self, asm: str, lineno: int, filename: str, is_sentinel: bool = False, bank: int = 0):
        super().__init__()
        self.asm = asm
        self.lineno = lineno
        self.filename = filename
        self.is_sentinel = is_sentinel
        # ZX Next code bank this block is compiled into (0 = emitted inline,
        # where it was written). Set for a block written at module level inside
        # a CODEBANK block; see zxbparser.make_asm_sentence and zxbc.codebank_asm
        self.bank = bank
