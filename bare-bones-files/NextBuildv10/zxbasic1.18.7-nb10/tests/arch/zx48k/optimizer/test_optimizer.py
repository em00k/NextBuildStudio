# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

from src.arch.z80 import optimizer
from src.arch.z80.peephole import engine
from tests.arch.zx48k.optimizer.common import mock_options_level


class TestOptimizer:
    def setup_class(cls):
        engine.main()

    def test_unrequired_or_a(self):
        code_src = """
        call .core.__LTI8
        or a
        ld bc, 0
        di
        ld hl, (.core.__CALL_BACK__)
        ld sp, hl
        exx
        pop hl
        pop iy
        pop ix
        exx
        ei
        ret
        """
        code = [x.strip() for x in code_src.split("\n") if x.strip()]

        with mock_options_level(4):
            optimized_code = optimizer.Optimizer().optimize(code)
            assert optimized_code.split("\n")[:2] == ["call .core.__LTI8", "ld bc, 0"]

    def test_ld_sp_requires_sp(self):
        code_src = """
        ld sp, hl
        pop iy
        """
        code = [x.strip() for x in code_src.split("\n") if x.strip()]

        with mock_options_level(4):
            optimized_code = optimizer.Optimizer().optimize(code)
            assert optimized_code.split("\n")[:2] == ["ld sp, hl", "pop iy"]

    def test_hd_sp_requires_sp(self):
        code_src = """
        add hl, sp
        pop iy
        jp (hl)
        """
        code = [x.strip() for x in code_src.split("\n") if x.strip()]

        with mock_options_level(3):
            optimized_code = optimizer.Optimizer().optimize(code)
            assert optimized_code.split("\n") == ["add hl, sp", "pop iy", "jp (hl)"]

    def test_label_after_call_keeps_registers(self):
        """`if g then Other() : Take(a(s))` at -O4. The label after the call is
        also reached from `jp z`, where HL is still `s` zero-extended; Other()
        changes HL. The index widening must survive, or a(s) is read at HL.
        """
        code_src = """
        _Other:
        ld a, (_g)
        sub 3
        jp nz, .LABEL.__LABEL0
        ld hl, (_w)
        ld de, 12345
        add hl, de
        ld (_w), hl
        jp .LABEL.__LABEL1
        .LABEL.__LABEL0:
        ld hl, (_w)
        dec hl
        ld (_w), hl
        .LABEL.__LABEL1:
        ld a, (_g)
        ld (30000), a
        ret
        _Test:
        ld a, (_s)
        ld l, a
        ld h, 0
        ld (_w), hl
        ld a, (_g)
        or a
        jp z, .LABEL.__LABEL3
        call _Other
        .LABEL.__LABEL3:
        ld a, (_s)
        ld l, a
        ld h, 0
        push hl
        ld hl, _a
        call .core.__ARRAY
        ld a, (hl)
        ret
        """
        code = [x.strip() for x in code_src.split("\n") if x.strip()]

        with mock_options_level(4):
            optimized_code = optimizer.Optimizer().optimize(code).split("\n")
            i = optimized_code.index(".LABEL.__LABEL3:")
            assert optimized_code[i + 1 : i + 5] == ["ld a, (_s)", "ld l, a", "ld h, 0", "push hl"]
