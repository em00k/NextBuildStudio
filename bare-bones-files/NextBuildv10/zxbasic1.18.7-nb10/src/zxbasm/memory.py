# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

from bisect import bisect_left, bisect_right
from collections import defaultdict
from typing import Final

from src.api import global_ as gl
from src.api.codebank_options import FAR_POINTER_SUFFIXES
from src.api.debug import __DEBUG__
from src.api.errmsg import error, warning
from src.zxbasm import global_ as asm_gl
from src.zxbasm.asm import Asm
from src.zxbasm.global_ import DOT
from src.zxbasm.label import Label


# Mnemonic prefixes that transfer control to an absolute/relative label. Used by
# the CODEBANK cross-segment check to word the error correctly. `JP (HL)/(IX)/(IY)/(C)`
# carry no label operand so they never match a Label reference and are harmless here.
_BRANCH_PREFIXES: Final = ("JP ", "JR ", "CALL ", "DJNZ ")


class _Segment:
    """A separately-assembled output region.

    Segment 0 is the resident program and behaves exactly as the single flat
    address space did before code banking existed. Segments 1..n are ZX Next
    code banks: each is assembled at the code-window address and written out as
    its own binary, to be paged in at run time.
    """

    __slots__ = ("ORG", "base", "id", "index", "max_size", "memory_bytes", "orgs")

    def __init__(self, id_: int, org: int, max_size: int | None = None):
        self.id = id_
        self.base = org
        self.index = org  # ORG address (can be changed on the fly)
        self.ORG = org  # last ORG value set
        self.max_size = max_size
        self.memory_bytes: dict[int, int] = {}  # An array (associative) containing memory bytes
        # Origins of code for asm mnemonics. This will store corresponding asm instructions
        self.orgs: dict[int, list[Asm]] = {}


class Memory:
    """A class to describe memory"""

    MAX_MEM = 65535  # Max memory limit
    _tmp_labels: dict[tuple[str, int], dict[str, Label]]
    _tmp_labels_lines: dict[str, list[int]]
    _tmp_pending_labels: dict[str, list[Label]]

    def __init__(self, org: int = 0):
        """Initializes the origin of code.
        0 by default"""
        self.segments: dict[int, _Segment] = {0: _Segment(0, org)}
        self._cur = self.segments[0]
        self.local_labels: list[dict[str, Label]] = [{}]  # Local labels in the current memory scope
        self.global_labels = self.local_labels[0]  # Global memory labels
        self.scopes: list[int] = []
        self.clear_temporary_labels()

    # Segment-local state is proxied so that the rest of the assembler (and
    # zxbasm.py) can keep using MEMORY.org / .memory_bytes / .orgs unchanged.
    @property
    def memory_bytes(self) -> dict[int, int]:
        return self._cur.memory_bytes

    @property
    def orgs(self) -> dict[int, list[Asm]]:
        return self._cur.orgs

    @property
    def index(self) -> int:
        return self._cur.index

    @index.setter
    def index(self, value: int) -> None:
        self._cur.index = value

    @property
    def ORG(self) -> int:
        return self._cur.ORG

    @ORG.setter
    def ORG(self, value: int) -> None:
        self._cur.ORG = value

    @property
    def current_segment(self) -> int:
        """Id of the segment currently being assembled into (0 = resident)."""
        return self._cur.id

    def set_segment(self, segment_id: int, base: int, max_size: int, lineno: int) -> None:
        """Switches the current output segment (ZX Next code bank).

        Entering a bank for the first time starts it at the code-window address;
        re-entering one resumes where it left off. Switching back to segment 0
        likewise resumes the resident cursor.
        """
        if segment_id < 0:
            error(lineno, "Invalid CODEBANK number %i. Must be 0 or greater" % segment_id)
            return

        if len(self.local_labels) > 1:
            error(lineno, "CODEBANK cannot be used inside a PROC")
            return

        if segment_id not in self.segments:
            self.segments[segment_id] = _Segment(segment_id, base, max_size)

        self._cur = self.segments[segment_id]
        self.flush_temporary_labels(lineno)

    def enter_proc(self, lineno: int):
        """Enters (pushes) a new context"""
        self.local_labels.append({})  # Add a new context
        self.scopes.append(lineno)
        __DEBUG__("Entering scope level %i at line %i" % (len(self.scopes), lineno))

    def set_org(self, value: int, lineno: int):
        """Sets a new ORG value"""
        if value < 0 or value > self.MAX_MEM:
            error(lineno, "Memory ORG out of range [0 .. 65535]. Current value: %i" % value)

        self.clear_temporary_labels()
        self.index = self.ORG = value

    @staticmethod
    def id_name(label: str, namespace: str | None = None) -> tuple[str, str]:
        """Given a name and a namespace, resolves
        returns the name as namespace + '.' + name. If namespace
        is none, the current NAMESPACE is used
        """
        if namespace is None:
            namespace = asm_gl.NAMESPACE

        # temporary labels are just integer numbers
        if label.isdecimal() or label[-1] in "BF" and label[:-1].isdecimal():
            return label, namespace

        if not label.startswith(DOT):
            ex_label = asm_gl.normalize_namespace(f"{namespace}{DOT}{label}")  # The mangled namespace.labelname label
            return ex_label, namespace

        return label, namespace

    @property
    def org(self) -> int:
        """Returns current ORG index"""
        return self.index

    def __set_byte(self, byte: int, lineno: int):
        """Sets a byte at the current location,
        and increments org in one. Raises an error if org > MAX_MEMORY
        """
        if byte < 0 or byte > 255:
            error(lineno, "Invalid byte value %i" % byte)

        self.memory_bytes[self.org] = byte
        self.index += 1  # Increment current memory pointer

    def exit_proc(self, lineno: int):
        """Exits current procedure. Local labels are transferred to global
        scope unless they have been marked as local ones.
        Temporary labels are "forgotten", and used ones must be resolved at this point.

        Raises an error if no current local context (stack underflow)
        """
        __DEBUG__("Exiting current scope from lineno %i" % lineno)

        if len(self.local_labels) <= 1:
            error(lineno, "ENDP in global scope (with no PROC)")
            return

        for label in self.local_labels[-1].values():
            if label.local:
                if not label.defined:
                    error(lineno, "Undefined LOCAL label '%s'" % label.name)
                    return
                continue

            name = label.name
            _lineno = label.lineno
            value = label.value

            if name not in self.global_labels.keys():
                self.global_labels[name] = label
            else:
                self.global_labels[name].define(value, _lineno)
                self.global_labels[name].segment = label.segment

        self.local_labels.pop()  # Removes current context
        self.scopes.pop()

    def set_memory_slot(self):
        if self.org not in self.orgs:
            self.orgs[self.org] = []  # Declares an empty memory slot if not already done
            self.memory_bytes[self.org] = 0  # Declares an empty memory slot if not already done

    def resolve_temporary_label(self, fname: str, label: Label):
        if label.direction == -1:
            idx = bisect_right(self._tmp_labels_lines[fname], label.lineno)
            for line in self._tmp_labels_lines[fname][:idx][::-1]:
                if label == self._tmp_labels[(fname, line)].get(label.name):
                    label.value = self._tmp_labels[(fname, line)][label.name].value
                    return
        elif label.direction == +1:
            idx = bisect_left(self._tmp_labels_lines[fname], label.lineno)
            for line in self._tmp_labels_lines[fname][idx:]:
                if label == self._tmp_labels[(fname, line)].get(label.name):
                    label.value = self._tmp_labels[(fname, line)][label.name].value
                    return

    def flush_temporary_labels(self, lineno: int):
        """Resolves every pending temporary label reference, then forgets them all.

        Temporary labels (`1:`, and `jr 1f` / `jr 1b` to reach them) are
        positional, so they must not resolve across an output segment boundary.
        They are otherwise only resolved at the very end of assembly, which
        means simply forgetting them at a CODEBANK switch would orphan
        references that earlier code had already satisfied -- they would survive
        as undefined Labels and surface much later as a bogus
        "Undefined label '1'" out of dump().

        A reference left unresolved here is a genuine error: its target lies in
        a different segment, which is never reachable.
        """
        for fname, labels in self._tmp_pending_labels.items():
            for label in labels:
                self.resolve_temporary_label(fname, label)
                if not label.defined:
                    error(lineno, "Undefined temporary label '%s'" % label.name)

        self.clear_temporary_labels()

    def clear_temporary_labels(self):
        self._tmp_labels_lines = defaultdict(list)
        self._tmp_labels = defaultdict(dict)
        self._tmp_pending_labels = defaultdict(list)

    def add_instruction(self, instr: Asm):
        """This will insert an asm instruction at the current memory position
        in a t-uple as (mnemonic, params).

        It will also insert the opcodes at the memory_bytes
        """
        if gl.has_errors:
            return

        __DEBUG__("%04Xh [%04Xh] ASM: %s" % (self.org, self.org - self.ORG, instr.asm))
        self.set_memory_slot()
        self.orgs[self.org].append(instr)

        for byte in instr.bytes():
            self.__set_byte(byte, instr.lineno)

    def check_undefined_labels(self):
        """Resolves pending temporary labels and reports any label left undefined.

        Kept apart from dump() so that it runs exactly once, no matter how many
        segments are being written out.
        """
        for filename in self._tmp_pending_labels:
            for label in self._tmp_pending_labels[filename]:
                self.resolve_temporary_label(filename, label)
                if not label.defined:
                    error(label.lineno, "Undefined temporary label '%s'" % label.name)

        for label in self.global_labels.values():
            if not label.defined:
                error(label.lineno, "Undefined GLOBAL label '%s'" % label.name)

    def check_cross_segment_refs(self):
        """Reports any reference from outside a code bank to a label inside it.

        Two banks are never paged in at once, and the resident program sees
        whatever bank happens to be mapped, so an address in bank N is only
        meaningful to code in bank N. That covers both control transfers and
        plain data: `LD HL, _table` reaching into another bank is exactly as
        broken as a `CALL` into one, and it is the check that makes bank-local
        variables safe to offer at all.

        References *to* the resident segment 0 are always fine, since it is
        permanently mapped, and are what lets banked code use global variables,
        the runtime library and DATA blocks freely.
        """
        if len(self.segments) < 2:
            return

        for seg in self.segments.values():
            for instrs in seg.orgs.values():
                for instr in instrs:
                    if not isinstance(instr, Asm):
                        continue

                    for label in instr.label_refs:
                        target = getattr(label, "segment", 0)
                        if not target or target == seg.id:
                            continue

                        # Two pointers into a bank are meant to exist, both
                        # marked by a compiler-generated suffix user code cannot
                        # produce: the trampoline's `DEFW _Foo.__far`, and the
                        # `.__faraddr` alias a FARPTR names. Neither is ever
                        # dereferenced without the runtime paging the bank in
                        # first, which is what makes them safe.
                        if label.name.endswith(FAR_POINTER_SUFFIXES):
                            continue

                        where = "CODEBANK %i" % seg.id if seg.id else "the resident program"
                        if instr.asm.startswith(_BRANCH_PREFIXES):
                            error(
                                instr.lineno,
                                "'%s' branches from %s to '%s' in CODEBANK %i. Only calls through the "
                                "resident trampoline may cross banks" % (instr.asm, where, label.name, target),
                            )
                        else:
                            error(
                                instr.lineno,
                                "'%s' in %s refers to '%s', which lives in CODEBANK %i. Bank-local data is "
                                "only addressable while its own bank is paged in"
                                % (instr.asm, where, label.name, target),
                            )

    def dump(self, segment_id: int = 0):
        """Returns a tuple containing code ORG (origin address), and a list of bytes (OUTPUT)
        for the given output segment.
        """
        seg = self.segments.get(segment_id)
        if seg is None or not seg.memory_bytes:
            return (seg.base if seg is not None else 0), []

        org = min(seg.memory_bytes.keys())  # Org is the lowest one
        OUTPUT = []
        align = []

        for i in range(org, max(seg.memory_bytes.keys()) + 1):
            if gl.has_errors:
                return org, OUTPUT

            try:
                try:
                    a = [x for x in seg.orgs[i] if isinstance(x, Asm)]  # search for asm instructions

                    if not a:
                        align.append(0)  # Fill with ZEROes not used memory regions
                        continue

                    OUTPUT += align
                    align = []
                    a = a[0]
                    if a.pending:
                        a.arg = a.argval()
                        a.pending = False
                        tmp = a.bytes()

                        for r in range(len(tmp)):
                            seg.memory_bytes[i + r] = tmp[r]
                except KeyError:
                    pass

                OUTPUT.append(seg.memory_bytes[i])

            except KeyError:
                OUTPUT.append(0)  # Fill with ZEROes not used memory regions

        return org, OUTPUT

    def dump_all(self) -> dict[int, tuple[int, list[int]]]:
        """Dumps every segment, keyed by segment id. Segment 0 is the resident program."""
        return {seg_id: self.dump(seg_id) for seg_id in sorted(self.segments)}

    def declare_label(
        self, label: str, lineno: int, value: int = None, local: bool = False, namespace: str | None = None
    ) -> None:
        """Sets a label with the given value or with the current address (org)
        if no value is passed.

        Exits with error if label already set, otherwise return the label object
        """
        ex_label, namespace = Memory.id_name(label, namespace)

        is_address = value is None
        if value is None:
            value = self.org

        if is_address:
            __DEBUG__(f"Declaring '{ex_label}' (value {'%04Xh' % value}) in {lineno}")
        else:
            __DEBUG__(f"Declaring '{ex_label}' in {lineno}")

        fname = gl.FILENAME
        if label.isdecimal():  # Temporary label?
            assert not self._tmp_labels_lines[fname] or self._tmp_labels_lines[fname][-1] <= lineno, (
                "Temporary label out of order"
            )
            if not self._tmp_labels_lines[fname] or self._tmp_labels_lines[fname][-1] != lineno:
                self._tmp_labels_lines[fname].append(lineno)

            self._tmp_labels[(fname, lineno)][ex_label] = Label(
                ex_label, lineno, value, False, namespace, is_address=True
            )
            return

        if ex_label in self.local_labels[-1].keys():
            self.local_labels[-1][ex_label].define(value, lineno)
            self.local_labels[-1][ex_label].is_address = is_address
        else:
            self.local_labels[-1][ex_label] = Label(ex_label, lineno, value, local, namespace, is_address)

        if is_address:
            self.local_labels[-1][ex_label].segment = self._cur.id

        self.set_memory_slot()

    def get_label(self, label: str, lineno: int) -> Label:
        """Returns a label in the current context or in the global one.
        If the label does not exist, creates a new one and returns it.
        """

        ex_label, namespace = Memory.id_name(label)
        result = Label(ex_label, lineno, namespace=namespace)

        if result.is_temporary:
            self._tmp_pending_labels[gl.FILENAME].append(result)
            return result

        for local_label in self.local_labels[::-1]:
            lbl = local_label.get(ex_label)
            if lbl is not None:
                return lbl

        self.local_labels[-1][ex_label] = result  # HINT: no namespace

        return result

    def set_label(self, label: str, lineno: int, local: bool = False) -> Label:
        """Sets a label, lineno and local flag in the current scope
        (even if it exists in previous scopes). If the label exist in
        the current scope, changes it flags.

        The resulting label is returned.
        """
        ex_label, _ = Memory.id_name(label)

        if ex_label in self.local_labels[-1].keys():
            result = self.local_labels[-1][ex_label]
            result.lineno = lineno
        else:
            result = self.local_labels[-1][ex_label] = Label(ex_label, lineno, namespace=asm_gl.NAMESPACE)

        if result.local == local:
            warning(lineno, "label '%s' already declared as LOCAL" % label)

        result.local = local

        return result

    @property
    def memory_map(self) -> str:
        """Returns a (very long) string containing a memory map
        hex address: label

        Labels living in a code bank are prefixed with `B<n>:`, since their
        16-bit address is the code-window address and is therefore shared with
        every other bank.
        """

        def entry(label: Label) -> str:
            prefix = "B%i:" % label.segment if getattr(label, "segment", 0) else ""
            return "%s%04X: %s" % (prefix, label.value, label.name)

        return "\n".join(sorted(entry(x) for x in self.global_labels.values() if x.is_address))
