#!/usr/bin/env python3
"""Execute a banked-code binary on a Z80 emulator with a minimal ZX Next MMU.

Enough of the Next is emulated to exercise the far-call runtime for real:
  * NEXTREG n,A (ED 92 nn), NEXTREG n,n (ED 91 nn mm), MUL D,E (ED 30)
  * TBBlue register select/access via ports $243B / $253B
  * the 8 MMU slots, with pages backed by the .bankN.bin files
"""

import json
import os
import re
import sys

import z80

ORG = 0x8000
WINDOW_SLOT = 3  # $6000-$7FFF
BOOT_MMU = [0xFF, 0xFF, 10, 11, 4, 5, 0, 1]  # stock mapping, as the compiler assumes


class Next(z80.Z80Machine):
    def __init__(self, resident, pages, org=ORG, window_slots=(WINDOW_SLOT,)):
        super().__init__()
        self.trace = []
        self.window_slots = tuple(window_slots)
        self.mmu = list(BOOT_MMU)
        self.pages = pages  # physical 8K page -> bytearray(8192)
        # Page currently materialised in each slot, so that its contents can be
        # written back when it is paged out again.
        self.loaded = [None] * 8
        self.selected_reg = 0
        self.stopped = False
        self.extended_bps = set()

        self.mem = bytearray(0x10000)
        self.mem[org : org + len(resident)] = resident
        self.set_memory_block(0, bytes(self.mem))
        for slot in self.window_slots:
            self._page_in(slot, self.mmu[slot])

        self.set_input_callback(self._on_in)
        self.set_output_callback(self._on_out)

    # --- MMU ---------------------------------------------------------
    def _page_in(self, slot, page):
        base = slot * 0x2000
        prev = self.loaded[slot]
        if prev == page:
            return  # already mapped; reloading it would discard writes

        data = self.pages.get(page)
        if data is None:
            return  # page not backed by anything we loaded; leave RAM as-is

        if prev is not None and prev in self.pages:
            # A bank holds bank-local variables as well as code, so writes made
            # while it was mapped have to follow it out to its page.
            self.pages[prev][:] = self.read(base, 0x2000)

        self.set_memory_block(base, bytes(data))
        self.loaded[slot] = page
        self.trace.append(("page", slot, page))
        self._rescan(base, base + 0x2000)

    def _write_nextreg(self, reg, value):
        if 0x50 <= reg <= 0x57:
            slot = reg - 0x50
            self.mmu[slot] = value
            self._page_in(slot, value)

    # --- TBBlue register port pair -----------------------------------
    def _on_out(self, addr, value):
        if addr == 0x243B:
            self.selected_reg = value
        elif addr == 0x253B:
            self._write_nextreg(self.selected_reg, value)

    def _on_in(self, addr):
        if addr == 0x253B:
            reg = self.selected_reg
            if 0x50 <= reg <= 0x57:
                return self.mmu[reg - 0x50]
            return 0
        return 0xFF

    # --- run loop ----------------------------------------------------
    MEM_OFFSET = 40  # the state view is <registers><64K of memory>

    def read16(self, addr):
        v = self.read(addr, 2)
        return v[0] | (v[1] << 8)

    def read(self, addr, n):
        base = self.MEM_OFFSET + addr
        return bytes(self.get_state_view()[base : base + n])

    EXTENDED = (b"\xed\x92", b"\xed\x91", b"\xed\x30")

    def _rescan(self, lo, hi):
        """(Re)places breakpoints on the ZX Next opcodes this emulator handles
        itself. Called again whenever a bank is paged in, since a code bank
        brings its own instructions into the window."""
        for a in [x for x in self.extended_bps if lo <= x < hi]:
            self.clear_breakpoint(a)
            self.extended_bps.discard(a)
        blob = self.read(lo, hi - lo + 1)
        for i in range(len(blob) - 1):
            if bytes(blob[i : i + 2]) in self.EXTENDED:
                self.set_breakpoint(lo + i)
                self.extended_bps.add(lo + i)

    def execute(self, stop_pc, max_steps=8_000_000):
        """Runs until PC hits any of stop_pc, emulating ZX Next opcodes as they appear.

        `run()` returns on a breakpoint *or* when its tick budget expires, so a
        stop at an instruction we do not handle is simply a resume, not an
        error. `max_steps` counts stops, not instructions, and is only a
        backstop against a program that never reaches stop_pc.
        """
        stops = {stop_pc} if isinstance(stop_pc, int) else set(stop_pc)
        for addr in stops:
            self.set_breakpoint(addr)
        self._rescan(0x4000, 0xFFFE)

        for _ in range(max_steps):
            self.run()
            pc = self.pc
            if pc in stops:
                return True
            if self.halted:
                raise RuntimeError(f"halted at ${pc:04X}")

            op = self.read(pc, 2)
            if op == b"\xed\x92":  # NEXTREG n, A
                self._write_nextreg(self.read(pc + 2, 1)[0], self.a)
                self.pc = pc + 3
            elif op == b"\xed\x91":  # NEXTREG n, n
                self._write_nextreg(self.read(pc + 2, 1)[0], self.read(pc + 3, 1)[0])
                self.pc = pc + 4
            elif op == b"\xed\x30":  # MUL D,E  ->  DE = D * E
                self.de = (self.d * self.e) & 0xFFFF
                self.pc = pc + 2
            # anything else: the tick budget ran out mid-program, so loop round
        raise RuntimeError("step limit exceeded")


def main(binpath, manifestpath, mappath, org=ORG, srcpath=None):
    org = int(str(org), 0)
    resident = open(binpath, "rb").read()
    # A program with no CODEBANK writes no manifest. It can still be run here:
    # the machine is a plain Next with nothing paged into the window.
    try:
        manifest = json.load(open(manifestpath))
    except FileNotFoundError:
        manifest = {"banks": []}
    window = manifest.get("window", 0x6000)
    window_size = manifest.get("window_size", 0x2000)
    first_slot = window >> 13
    slots = tuple(range(first_slot, first_slot + (window_size >> 13)))

    pages = {}
    base = binpath.rsplit(".bin", 1)[0]
    for entry in manifest["banks"]:
        raw = open(f"{base}.bank{entry['bank']}.bin", "rb").read()
        # A 16K bank spans two physical pages, so split the blob across them
        # exactly as the loader does.
        for i, page in enumerate(entry.get("pages") or [entry["page"]]):
            chunk = raw[i * 0x2000 : (i + 1) * 0x2000]
            data = bytearray(0x2000)
            data[: len(chunk)] = chunk
            pages[page] = data

    for slot in slots:  # the window's boot pages
        pages.setdefault(BOOT_MMU[slot], bytearray(0x2000))

    labels = {}
    for line in open(mappath):
        if ": ." not in line:
            continue
        addr, name = line.strip().split(": .", 1)
        # A label inside a code bank is written "B1:6000", a resident one as a
        # bare hex address. Telling them apart by the colon rather than by a
        # leading "B" matters: $B000-$BFFF is an ordinary resident address, and
        # a program org'd at $A000 puts labels there.
        if ":" in addr:
            continue
        labels[name] = int(addr, 16)

    m = Next(resident, pages, org=org, window_slots=slots)
    sentinel = 0xFFF0
    m.sp = 0xFF00
    m.mem[m.sp] = sentinel & 0xFF
    m.mem[m.sp + 1] = sentinel >> 8
    m.set_memory_block(m.sp, bytes(m.mem[m.sp : m.sp + 2]))
    m.pc = labels["core.__START_PROGRAM"]

    # A program that parks in a display loop instead of returning marks the
    # spot with a `finished:` label; everything it was going to do has already
    # happened by the time it gets there. A BASIC label is emitted as
    # `.LABEL._finished` and a raw asm one as `._finished`, so accept both --
    # otherwise the run spins to the step limit instead of reporting.
    stops = {sentinel}
    for name in ("_finished", "LABEL._finished"):
        if name in labels:
            stops.add(labels[name])
    ok = m.execute(stops)
    swaps = "  ".join(f"MMU{s} page swaps: {sum(1 for t in m.trace if t[1] == s)}" for s in slots)
    print(f"ran to completion: {ok}   {swaps}")

    # A self-checking program: it declares `t_run` and `t_fail` and writes one
    # pass/fail byte per check to RESULTS. That is more informative than a fixed
    # table of expected values, and it survives a program that dies part way --
    # the count says how far it got.
    if "_t_run" in labels and "_t_fail" in labels:
        return _report_self_checks(m, labels, slots, srcpath)

    if window_size > 0x2000:
        # farcall_test16: every routine sits past $7FFF, so these only come
        # back right if the window's second slot is mapped too.
        results = {
            "r1 High1()      ": (m.read16(0xF000), 4242),
            "r2 High2()      ": (m.read16(0xF002), 5353),
            "guard Resident()": (m.read16(0xF004), 7),
        }
    else:
        results = _results8(m)

    bad = 0
    for name, (got, want) in results.items():
        flag = "ok " if got == want else "FAIL"
        if got != want:
            bad += 1
        print(f"  [{flag}] {name} = {got:<12} (expected {want})")

    return _finish(m, labels, slots, bad)


RESULTS = 0xF000  # where a self-checking program leaves its per-check bytes


def _check_sites(srcpath):
    """Source line of each Ck(...) call, in order.

    The checks are numbered by the order they execute, which is the order they
    appear -- so a result byte can be mapped back to the line that produced it
    without the program carrying any names, and without an index table in the
    source going stale.
    """
    if not srcpath or not os.path.exists(srcpath):
        return []

    sites = []
    for n, line in enumerate(open(srcpath, encoding="utf-8"), 1):
        code = line.split("'", 1)[0]
        if re.search(r"\bCk\s*\(", code) and "SUB Ck" not in code:
            sites.append((n, code.strip()))
    return sites


def _report_self_checks(m, labels, slots, srcpath=None, expected=None):
    """Reports a program that checked itself and left the verdicts in memory.

    The verdict bytes go wherever the program says. A `DIM t_verdict(n) as
    uByte` is the tidy way -- the program just writes t_verdict(t_run) and never
    names an address -- and is the only way that works when the fixed RESULTS
    address happens to fall inside the program's own code window.
    """
    run = m.read16(labels["_t_run"])
    failed = m.read16(labels["_t_fail"])
    results = labels.get("_t_verdict.__DATA__", RESULTS)
    verdicts = m.read(results, run) if run else b""
    sites = _check_sites(srcpath)

    print(f"  {run} checks ran, {failed} failed")
    bad = failed
    for n, ok in enumerate(verdicts):
        if not ok:
            where = f"  {os.path.basename(srcpath)}:{sites[n][0]}  {sites[n][1]}" if n < len(sites) else ""
            print(f"  [FAIL] check #{n}{where}")
    # The checks are counted in source order, so a mismatch means the source and
    # the binary have drifted apart and the line numbers above cannot be trusted.
    if sites and len(sites) != run and run:
        print(f"  [warn] {len(sites)} Ck() calls in {os.path.basename(srcpath)} but {run} ran")
    if failed != sum(1 for v in verdicts if not v):
        print(f"  [FAIL] counter says {failed} but {sum(1 for v in verdicts if not v)} bytes are zero")
        bad += 1
    if run == 0:
        print("  [FAIL] no checks ran at all")
        bad += 1
    # A program that stops early leaves the rest of its checks unrun, which a
    # pass/fail byte cannot express -- so the count is asserted too.
    if expected is not None and run != expected:
        print(f"  [FAIL] expected {expected} checks, {run} ran (program stopped early?)")
        bad += 1
    return _finish(m, labels, slots, bad)


def _results8(m):
    return {
        "r1 Byte1()      ": (m.read(0x9000, 1)[0], 42),
        "r2 AddU(40,2)   ": (m.read16(0x9002), 142),
        "r3 Long1()      ": (int.from_bytes(m.read(0x9004, 4), "little"), 305419896),
        "r4 Nested(10)   ": (m.read16(0x9008), 311),
        "r5 Byte1() again": (m.read(0x900A, 1)[0], 42),
        "guard Resident()": (m.read16(0x900C), 7),
        "regs preserved  ": (m.read16(0x900E), 0xA5A5),
        # Bank-local data: bank 1's array and counter, and bank 2's own data
        # sitting at the same window addresses.
        "r6 SumLut()     ": (m.read16(0x9010), 31),
        "r7 Hits()       ": (m.read(0x9012, 1)[0], 3),
        "r8 Bump(1)      ": (m.read16(0x9014), 4031),
        "r9 SumLut() again": (m.read16(0x9016), 31),
    }


def _finish(m, labels, slots, bad):
    # Every slot the window covers must be back on its boot page. For a 16K
    # window that pair is not consecutive -- the stock mapping puts 11 and 4 at
    # slots 3 and 4 -- so this is what catches a runtime that restored only the
    # first slot, or derived the second with `inc a`.
    boot = [BOOT_MMU[s] for s in slots]
    live = [m.mmu[s] for s in slots]
    ok_boot = live == boot
    if not ok_boot:
        bad += 1
    print(f"  [{'ok ' if ok_boot else 'FAIL'}] window slots restored to boot pages {live} (expected {boot})")

    if "core.__FAR_CUR_BANK" not in labels:
        # No CODEBANK in this program, so there is no far-call state to unwind.
        print("\nALL PASS" if bad == 0 else f"\n{bad} FAILURE(S)")
        return 1 if bad else 0

    final_bank = m.read(labels["core.__FAR_CUR_BANK"], 1)[0]
    far_sp = m.read16(labels["core.__FAR_SP"])
    stack_base = labels["core.__FAR_STACK"]
    print(f"  [{'ok ' if final_bank == 0 else 'FAIL'}] final logical bank = {final_bank} (expected 0)")
    print(
        f"  [{'ok ' if far_sp == stack_base else 'FAIL'}] shadow stack unwound: "
        f"__FAR_SP=${far_sp:04X} base=${stack_base:04X}"
    )
    bad += (final_bank != 0) + (far_sp != stack_base)
    print("\nALL PASS" if bad == 0 else f"\n{bad} FAILURE(S)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:6]))
