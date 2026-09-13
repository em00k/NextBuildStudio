# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

import unittest

import src.arch.z80.optimizer.flow_graph
import src.arch.z80.optimizer.main
from src.arch.z80.optimizer import basicblock
from src.arch.z80.peephole import evaluator


class TestBasicBlock(unittest.TestCase):
    """Tests basic blocks implementation"""

    def setUp(self) -> None:
        self.optimizer = src.arch.z80.optimizer.Optimizer()
        self.blk = basicblock.BasicBlock([], optimizer=self.optimizer)

    def tearDown(self) -> None:
        evaluator.Evaluator.UNARY = dict(evaluator.UNARY)

    def test_block_partition_jp(self):
        code = """
        nop
        jp __UNKNOWN
        nop
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 2)
        self.assertEqual(blks[0].code, ["nop", "jp __UNKNOWN"])
        self.assertEqual(blks[1].code, ["nop"])
        self.assertFalse(blks[1] in blks[0].goes_to)
        self.assertFalse(blks[0] in blks[1].comes_from)

    def test_block_partition_call(self):
        code = """
        nop
        call __UNKNOWN
        nop
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 2)
        self.assertEqual(blks[0].code, ["nop", "call __UNKNOWN"])
        self.assertEqual(blks[1].code, ["nop"])
        self.assertFalse(blks[1] in blks[0].goes_to)
        self.assertFalse(blks[0] in blks[1].comes_from)

    def test_block_partition_jp_flag(self):
        code = """
        nop
        jp z, __UNKNOWN
        nop
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 2)
        self.assertEqual(blks[0].code, ["nop", "jp z, __UNKNOWN"])
        self.assertEqual(blks[1].code, ["nop"])
        self.assertTrue(blks[1] in blks[0].goes_to)
        self.assertTrue(blks[0] in blks[1].comes_from)

    def test_block_partition_call_flag(self):
        code = """
        nop
        call z, __UNKNOWN
        nop
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 2)
        self.assertEqual(blks[0].code, ["nop", "call z, __UNKNOWN"])
        self.assertEqual(blks[1].code, ["nop"])
        self.assertTrue(blks[1] in blks[0].goes_to)
        self.assertTrue(blks[0] in blks[1].comes_from)

    def test_empty_basic_block_is_false(self):
        assert not self.blk

    def test_call_part(self):
        code = """
        my_block:
        ld a, 3
        ret
        ld a, 1
        call my_block
        ld a, 2
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 3)
        self.assertEqual(blks[0].code, ["my_block:", "ld a, 3", "ret"])
        self.assertEqual(blks[1].code, ["ld a, 1", "call my_block"])
        self.assertEqual(blks[2].code, ["ld a, 2"])
        self.assertTrue(blks[1] in blks[0].comes_from)
        self.assertTrue(blks[0] in blks[1].goes_to)
        self.assertTrue(blks[0] in blks[2].comes_from)
        self.assertTrue(blks[2] in blks[0].goes_to)

    def test_call_ret2(self):
        code = """
        ld a, 1
        call my_block
        ld a, 2
        ret
        my_block:
        ld a, 3
        ret
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 3)
        self.assertEqual(blks[0].code, ["ld a, 1", "call my_block"])
        self.assertEqual(blks[1].code, ["ld a, 2", "ret"])
        self.assertEqual(blks[2].code, ["my_block:", "ld a, 3", "ret"])

        self.assertTrue(blks[2] in blks[0].goes_to)
        self.assertTrue(blks[1] in blks[2].goes_to)
        self.assertFalse(blks[1].goes_to)  # empty

    def test_call_ret_after_branch(self):
        """A callee that branches before its ret must still return to the caller.
        The walk used to stop at the first jp, leaving the block after the call
        reached only from the jump that skipped it.
        """
        code = """
        ld a, (_g)
        or a
        jp z, __LABEL3
        call my_sub
    __LABEL3:
        ld a, 2
        ret
    my_sub:
        ld a, (_g)
        jp nz, __LABEL0
        ld hl, 1
        jp __LABEL1
    __LABEL0:
        ld hl, 2
    __LABEL1:
        ret
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(blks[1].code, ["call my_sub"])
        self.assertEqual(blks[2].code, ["__LABEL3:", "ld a, 2", "ret"])
        self.assertEqual(blks[6].code, ["__LABEL1:", "ret"])

        self.assertTrue(blks[6] in blks[2].comes_from)
        self.assertTrue(blks[0] in blks[2].comes_from)

    def test_call_ret_after_nested_call(self):
        """The return from a nested call carries on inside the callee."""
        code = """
        call my_sub
        ld a, 2
        ret
    my_sub:
        call __UNKNOWN
        ld hl, 1
        ret
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(blks[1].code, ["ld a, 2", "ret"])
        self.assertEqual(blks[3].code, ["ld hl, 1", "ret"])
        self.assertTrue(blks[1] in blks[3].goes_to)

    def test_call_ret_through_indirect_jump(self):
        """A callee leaving by `jp (hl)` cannot be followed, so it must be taken
        as possibly returning, not as never returning.
        """
        code = """
        call my_sub
        ld a, 2
        ret
    my_sub:
        pop hl
        jp (hl)
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(blks[1].code, ["ld a, 2", "ret"])
        self.assertTrue(blks[1].comes_from)

    def test_long_block(self):
        code = """
        ld a, 0
        jp __LABEL2
    __LABEL0:
        ld a, 1
        jp z, __LABEL1
        ld a, 2
    __LABEL1:
        ld a, 3
    __LABEL2:
        ld a, 4
        jp nc, __LABEL0
        ld a, 5
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        self.assertEqual(len(blks), 6)
        self.assertEqual(blks[0].code, ["ld a, 0", "jp __LABEL2"])
        self.assertEqual(blks[1].code, ["__LABEL0:", "ld a, 1", "jp z, __LABEL1"])
        self.assertEqual(blks[2].code, ["ld a, 2"])
        self.assertEqual(blks[3].code, ["__LABEL1:", "ld a, 3"])
        self.assertEqual(blks[4].code, ["__LABEL2:", "ld a, 4", "jp nc, __LABEL0"])
        self.assertEqual(blks[5].code, ["ld a, 5"])

        self.assertTrue(blks[4] in blks[0].goes_to)
        self.assertTrue(blks[4] in blks[1].comes_from)
        self.assertTrue(blks[1] in blks[4].goes_to)
        self.assertTrue(blks[4] in blks[3].goes_to)
        self.assertTrue(blks[5] in blks[4].goes_to)

        self.assertFalse(blks[1] in blks[2].goes_to)
        self.assertFalse(blks[1] in blks[3].goes_to)
        self.assertFalse(blks[5].goes_to)  # empty

    def test_basic_block_clean_ld_hl(self):
        code = """
        ld hl, (30001 - 1)
        """
        basicblock.BasicBlock.clean_asm_args = True
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.assertEqual(1, len(self.blk))
        self.assertEqual(["ld hl, (30000)"], self.blk.code)

    def test_mempos_requires(self):
        code = """
        ld hl, (_k - 1)
        ld (_k), a
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.assertTrue(self.blk.is_used(["(_k)"], 0))

    def test_is_used_or_ix(self):
        code = """
        or (ix-1)
        ld (ix-1), a
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        assert self.blk.is_used(["(ix-1)"], 0)

    def test_is_used_and_ix(self):
        code = """
        and (ix-1)
        ld (ix-1), a
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        assert self.blk.is_used(["(ix-1)"], 0)

    def test_is_used_xor_ix(self):
        code = """
        xor (ix-1)
        ld (ix-1), a
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        assert self.blk.is_used(["(ix-1)"], 0)

    def test_loop_goes_and_comes(self):
        code = """
        ld (_dir), hl
        .LABEL.__LABEL0:
        ld a, (_n)
        ld hl, (_dir)
        ld (hl), a
        ld hl, _n
        inc (hl)
        jp .LABEL.__LABEL0
        ld (ix-1), a
        """
        self.blk.code = [x for x in code.split("\n") if x.strip()]
        self.optimizer.initialize_memory(self.blk)
        blks = src.arch.z80.optimizer.flow_graph.get_basic_blocks(self.blk)
        assert len(blks) == 3
        b1, b2, b3 = blks
        assert b1.goes_to == b2.goes_to == {b2}
        assert not b3.comes_from
