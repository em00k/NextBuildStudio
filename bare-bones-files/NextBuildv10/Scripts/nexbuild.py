#!/usr/bin/env python3
"""
NEX packaging for NextBuild.

Builds a .nex from an existing .bin (and data/ assets) without compiling.
Used by nextbuild.py after zxbc, and as a standalone CLI:

  python Scripts/nexbuild.py -b Sources/Foo/Foo.bas
  python Scripts/nexbuild.py --from-cfg Sources/Foo/Foo.cfg
"""

import argparse
import glob
import json
import os
import re
import shutil
import sys

RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
MAGENTA = "\033[35m"

NUMBER_PATTERN = r"(\$[0-9A-Fa-f]+|0x[0-9A-Fa-f]+|\d+)"


def parse_number(number_str):
    number_str = str(number_str)
    if number_str.startswith("$"):
        return int(number_str[1:], 16)
    if number_str.startswith("0x"):
        return int(number_str[2:], 16)
    return int(number_str, 10)


# --------------------------------------------------------------------------
#  Named banks in LoadSDBank
#
#  LoadSDBank is found by scanning the source as text, so its arguments used to
#  have to be numeric literals - a BASIC CONST meant nothing here.  That forced
#  every bank number to be written twice, once in a bank map and once in the
#  call, with nothing keeping them equal.
#
#  These let an argument be a name, or a name plus/minus a number.  The symbol
#  table is built ONLY when an argument fails to parse as a number (see
#  resolve_arg in ParseNEXCfg), so a project using plain literals opens no extra
#  files and runs exactly the code it always did.
# --------------------------------------------------------------------------

INCLUDE_PATTERN = re.compile(r'^\s*#include\s+([<"])([^>"]+)[>"]', re.M | re.I)
# `CONST BK_X as ubyte = 30` and the older `const fntbank1 = 34` both appear
# in the tree, so the `as <type>` clause has to be optional.
CONST_PATTERN = re.compile(
    r"^[ \t]*const[ \t]+([A-Za-z_]\w*)[ \t]*(?:as[ \t]+\w+[ \t]*)?=([^\r\n']+)",
    re.M | re.I,
)
DEFINE_PATTERN = re.compile(r"^[ \t]*#define[ \t]+([A-Za-z_]\w*)[ \t]+([^\r\n']+)$", re.M)


def collect_symbols(inputfile, scripts_dir):
    """Gather numeric CONST / #define values from a file and everything it includes.

    Quoted includes resolve against the including file, <angled> ones against
    Scripts/.  First definition wins, and the top-level file is walked first, so
    a project's own constants take precedence over the library's.
    """
    symbols = {}
    unresolved = []
    seen = set()

    def walk(path):
        path = os.path.abspath(path)
        if path in seen or not os.path.isfile(path):
            return
        seen.add(path)
        try:
            with open(path, "rt", errors="replace") as f:
                text = f.read()
        except OSError:
            return
        for pattern in (CONST_PATTERN, DEFINE_PATTERN):
            for name, value in pattern.findall(text):
                key = name.upper()
                if key in symbols:
                    continue
                value = value.strip()
                try:
                    symbols[key] = parse_number(value)
                except ValueError:
                    # e.g. `CONST BK_TITLEPAL as ubyte = BANK_TITLE + 10`
                    unresolved.append((key, value))
        for kind, name in INCLUDE_PATTERN.findall(text):
            root = scripts_dir if kind == "<" else os.path.dirname(path)
            walk(os.path.join(root, name))

    walk(inputfile)

    # Constants defined in terms of other constants.  A couple of passes is
    # plenty for the one-deep chains that occur in practice.
    for _ in range(4):
        if not unresolved:
            break
        still = []
        for key, value in unresolved:
            try:
                symbols[key] = resolve_expr(value, symbols)
            except ValueError:
                still.append((key, value))
        if len(still) == len(unresolved):
            break
        unresolved = still
    return symbols


def resolve_expr(text, symbols):
    """A number, a name, or names and numbers joined by + and -.

    Deliberately no parentheses and no commas: the LoadSDBank scan splits the
    whole line on those, so an argument containing either would shift every
    field along.
    """
    text = str(text).strip()
    try:
        return parse_number(text)
    except ValueError:
        pass
    total = 0
    op = "+"
    for token in re.split(r"([+-])", text):
        token = token.strip()
        if not token:
            continue
        if token in ("+", "-"):
            op = token
            continue
        try:
            value = parse_number(token)
        except ValueError:
            if token.upper() not in symbols:
                raise ValueError("unknown name '%s'" % token)
            value = symbols[token.upper()]
        total = total + value if op == "+" else total - value
    return total


# ANSI colour codes must not count toward column width.
_ANSI_RE = re.compile(r'\x1b\[[0-9;]*m')


def vislen(text):
    return len(_ANSI_RE.sub('', str(text)))


def pad_ansi(text, width):
    text = str(text)
    return text + ' ' * max(0, width - vislen(text))


def print_table(rows):
    """Print a two-column box, aligning tuple values as fields inside each row."""
    if not rows:
        return
    labels = [str(label) for label, _ in rows]
    # Plain strings (including the gauge) span the value area. Tuple fields
    # share tab stops; the final field can use all the remaining space.
    field_widths = {}
    for _, value in rows:
        if isinstance(value, tuple):
            for index, field in enumerate(value[:-1]):
                field_widths[index] = max(field_widths.get(index, 0), vislen(field))
    values = []
    for _, value in rows:
        if isinstance(value, tuple):
            value = '  '.join(
                pad_ansi(field, field_widths[index]) if index < len(value) - 1 else str(field)
                for index, field in enumerate(value)
            )
        values.append(str(value))
    label_w = max(vislen(label) for label in labels)
    value_w = max(vislen(value) for value in values)
    print(f"┌─{'─' * label_w}─┬─{'─' * value_w}─┐")
    for label, value in zip(labels, values):
        print(f"│ {pad_ansi(label, label_w)} │ {pad_ansi(value, value_w)} │")
    print(f"└─{'─' * label_w}─┴─{'─' * value_w}─┘")


def display_gauge_simple(percentage):
    total_slots = 32
    if percentage > 100:
        percent_text = f"{RED}{percentage:.2f}%{RESET}"
        filled_slots = total_slots
    elif percentage >= 99:
        percent_text = f"{RED}{percentage:.2f}% {BOLD}WARNING {RESET}"
        filled_slots = min(total_slots, int((percentage / 100) * total_slots))
    elif percentage > 90:
        percent_text = f"{RED}{percentage:.2f}% {RESET}"
        filled_slots = int((percentage / 100) * total_slots)
    elif percentage >= 60:
        percent_text = f"{YELLOW}{percentage:.2f}%{RESET}"
        filled_slots = int((percentage / 100) * total_slots)
    else:
        percent_text = f"{GREEN}{percentage:.2f}%{RESET}"
        filled_slots = int((percentage / 100) * total_slots)

    filled_slots = max(0, min(total_slots, filled_slots))
    safe_slots = total_slots - 4
    safe_filled = min(filled_slots, safe_slots)
    danger_filled = max(0, filled_slots - safe_slots)
    empty_slots = total_slots - filled_slots
    bar = f"{YELLOW}{'#' * safe_filled}{RED}{'#' * danger_filled}{GREEN}{'-' * empty_slots}"
    return f"{CYAN}[{bar}{CYAN}] {percent_text}"


def count_nex_8k_pages(nextcreator):
    """Count 8K pages that received data, and the bytes packed into them.

    Leading zeros in a page (e.g. sysvars at $5C00) are not counted.
    """
    banks = nextcreator.HEADER512.banks
    big = nextcreator.bigFile
    get_real = nextcreator.get_real_bank
    pages = 0
    data_bytes = 0
    for bank16, used in enumerate(banks):
        if not used:
            continue
        real = get_real(bank16)
        block = memoryview(big)[real * 16384:(real + 1) * 16384]
        for half in (0, 1):
            page = bytes(block[half * 8192:(half + 1) * 8192])
            end = len(page.rstrip(b'\x00'))
            if not end:
                continue
            start = len(page) - len(page.lstrip(b'\x00'))
            pages += 1
            data_bytes += end - start
    return pages, data_bytes


def read_config(config_path):
    config = {}
    if not os.path.exists(config_path):
        return config
    with open(config_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            config[key.strip()] = value.strip()
    return config


def load_nextcreator(base_dir, config=None):
    """Import ZX Basic's nextcreator without pulling in zxbc."""
    if config is None:
        config = read_config(os.path.join(base_dir, "Scripts", "nextbuild.config"))
    zxbasic_path = config.get("ZXBASIC", "zxbasic")
    if "zxbasic\\zxbasic" in zxbasic_path:
        zxbasic_path = "zxbasic"
    zxbasic_dir = os.path.abspath(os.path.join(base_dir, zxbasic_path))
    tools_dir = os.path.abspath(os.path.join(base_dir, config.get("TOOLS", "Tools")))
    for directory in (
        zxbasic_dir,
        os.path.join(zxbasic_dir, "src"),
        tools_dir,
        os.path.join(base_dir, "Scripts"),
    ):
        if os.path.exists(directory) and directory not in sys.path:
            sys.path.append(directory)
    try:
        from tools import nextcreator  # type: ignore
        return nextcreator
    except ImportError:
        try:
            import nextcreator  # type: ignore
            return nextcreator
        except ImportError:
            print(f"{RED}Error: Could not import nextcreator module.{RESET}")
            sys.exit(1)


def resolve_intermediate(input_dir, filename):
    """Prefer a fresh compile next to the source, else the last copy in build/.

    Returns (abs_path, relpath_from_input_dir). relpath uses forward slashes
    and has no leading './' (so './' + relpath is valid in a .cfg).
    """
    local = os.path.join(input_dir, filename)
    if os.path.isfile(local):
        return local, filename.replace("\\", "/")
    in_build = os.path.join(input_dir, "build", filename)
    if os.path.isfile(in_build):
        return in_build, ("build/" + filename).replace("\\", "/")
    return local, filename.replace("\\", "/")


def list_intermediate_files(input_dir, name):
    """Compiler leftovers in the project dir to relocate after NEX packaging."""
    files = [
        os.path.join(input_dir, name + ".bin"),
        os.path.join(input_dir, name + ".cfg"),
        os.path.join(input_dir, name + ".banks.json"),
    ]
    files.extend(sorted(glob.glob(os.path.join(input_dir, name + ".bank*.bin"))))
    seen = set()
    out = []
    for path in files:
        if path in seen or not os.path.isfile(path):
            continue
        seen.add(path)
        out.append(path)
    return out


def _rewrite_cfg_for_build(text, name):
    """Point ./Name.bin and ./Name.bank* at ./build/ so a moved .cfg still packs."""
    if f"./build/{name}.bin" not in text:
        text = text.replace(f"./{name}.bin", f"./build/{name}.bin")
    if f"./build/{name}.bank" not in text:
        text = text.replace(f"./{name}.bank", f"./build/{name}.bank")
    return text


def move_intermediates_to_build(input_dir, name):
    """Move compiler intermediates from the project dir into ./build."""
    build_dir = os.path.join(input_dir, "build")
    os.makedirs(build_dir, exist_ok=True)
    to_move = list_intermediate_files(input_dir, name)
    if not to_move:
        return
    moved = []
    for src in to_move:
        dest = os.path.join(build_dir, os.path.basename(src))
        try:
            if src.lower().endswith(".cfg"):
                with open(src, "rt") as f:
                    text = _rewrite_cfg_for_build(f.read(), name)
                with open(src, "wt") as f:
                    f.write(text)
            if os.path.exists(dest):
                os.remove(dest)
            shutil.move(src, dest)
            moved.append(os.path.basename(src))
        except Exception as e:
            print(f"{RED}Failed to move {src}: {e}{RESET}")
    if moved:
        # One line, not one per file.  The VSCode terminal panel is only a few
        # rows tall, so five lines of this pushed the whole memory report off
        # the top of the screen.  Names share a stem, so print it once.
        stem = os.path.commonprefix(moved).rstrip(".")
        tails = " ".join(m[len(stem):] or m for m in moved)
        print(f"{YELLOW}-> build/{RESET}   {CYAN}{stem}{RESET}  {tails}")


def CreateNEXFile(state, base_dir, show_done=True):
    if state.no_nex:
        bin_filepath, _ = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
        if not os.path.exists(bin_filepath):
            print(f"{RED}ERROR: Binary file not found for size calculation: {bin_filepath}{RESET}")
            return
        file_size = os.path.getsize(bin_filepath)
        percent = (file_size * 100) / 32000
        print(f"BIN filesize :  {GREEN}{file_size}b{RESET} - {YELLOW}{percent:.2f}%{RESET} of 32000b available")
        return

    nextcreator = load_nextcreator(base_dir)
    original_cwd = os.getcwd()
    try:
        os.chdir(state.input_dir)

        print("====================================================")
        cfg_abs, cfg_relpath = resolve_intermediate(state.input_dir, state.filenamenoext + ".cfg")
        nex_relpath = state.filenamenoext + ".nex"
        bin_abs, _ = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
        map_relpath = "./build/" + state.filenamenoext + ".bas.map"

        if not os.path.exists(cfg_abs):
            print(f"{RED}ERROR: NEX config not found: {cfg_abs}{RESET}")
            sys.exit(1)
        if not os.path.exists(bin_abs):
            print(f"{RED}ERROR: Binary file not found: {bin_abs}{RESET}")
            print(f"{RED}Compile the project first, or pass an existing .bin.{RESET}")
            sys.exit(1)

        print(f"{YELLOW}Generating NEX : {CYAN}{nex_relpath}{RESET}")
        nextcreator.parse_file(cfg_relpath)
        nextcreator.generate_file(nex_relpath)
        org_val = parse_number(state.org)
        end_raw = getattr(state, "end", None)
        end_val = parse_number(str(end_raw)) if end_raw is not None else 65536
        working_space_left = end_val - org_val
        file_size = os.path.getsize(bin_abs)
        if working_space_left > 0:
            percent = (file_size * 100) / working_space_left
        else:
            percent = 0.0 if file_size == 0 else 100.0 * file_size
        space_left = working_space_left - file_size
        bin_last = org_val + file_size - 1 if file_size else org_val
        total_end = org_val + file_size
        percent_text = display_gauge_simple(percent)
        codebanks = getattr(state, "codebanks", None) or []
        codebank_total = sum(bank["size"] for bank in codebanks)
        page_count, bank_bytes = count_nex_8k_pages(nextcreator)

        if not os.path.exists(nex_relpath):
            print(f"{RED}ERROR: NEX file not found for size calculation: {nex_relpath}{RESET}")
            return
        nex_file_size = os.path.getsize(nex_relpath)

        # Everything above is now an int in memory, so the intermediates can go
        # first.  They must not move any earlier: parse_file reads the .cfg and
        # getsize reads the .bin, both from the project dir.
        try:
            move_intermediates_to_build(state.input_dir, state.filenamenoext)
        except Exception as move_err:
            print(f"{RED}ERROR moving intermediate files: {str(move_err)}{RESET}")
        print(f"{YELLOW}   map    {RESET}  {MAGENTA}{map_relpath}{RESET}\n")

        # Ordered least-useful first: the terminal panel is short, so the LAST
        # lines are the ones visible without scrolling.  BIN headroom and the
        # NEX size therefore sit at the bottom, closest to the prompt.
        rows = []
        if page_count:
            rows.append(("8K banks",
                         (f"{GREEN}{page_count}{RESET} used",
                          f"{GREEN}{bank_bytes}{RESET} ({CYAN}${bank_bytes:04X}{RESET})")))

        for bank in codebanks:
            window = bank["window"]
            window_size = bank["window_size"]
            size = bank["size"]
            pct = size * 100 // window_size if window_size else 0
            bank_last = window + max(size, 1) - 1
            pages = bank.get("pages") or [bank["page"]]
            where = str(pages[0]) if len(pages) == 1 else ", ".join(map(str, pages))
            rows.append((f"CODEBANK {bank['bank']}",
                         (f"{GREEN}{size:5}{RESET} / {GREEN}{window_size}{RESET} ({pct}%)",
                          f"page {where}",
                          f"{CYAN}${window:04X}-${bank_last:04X}{RESET}")))

        if codebanks:
            total_code = codebank_total + file_size
            rows.append(("Total code",
                         (f"{GREEN}{codebank_total}{RESET} (banks)",
                          f"{GREEN}{file_size}{RESET} (bin)",
                          f"{GREEN}{total_code}{RESET} ({CYAN}${total_code:04X}{RESET})")))

        rows.append(("Total size",
                     (f"{GREEN}{org_val}{RESET} ({CYAN}${org_val:04X}{RESET})",
                      f"{GREEN}{file_size}{RESET} ({CYAN}${file_size:04X}{RESET})",
                      f"{GREEN}{total_end}{RESET} ({CYAN}${total_end:04X}{RESET})")))

        pc_raw = getattr(state, "pc", None)
        sp_raw = getattr(state, "sp", None)
        pc = parse_number(str(pc_raw)) if pc_raw is not None else org_val
        if sp_raw is None:
            sp = 0 if pc == 0 else pc - 2
        else:
            sp = parse_number(str(sp_raw))
        rows.append(("PC / SP", f"{CYAN}${pc:04X} / ${sp:04X}{RESET}"))

        rows.append(("NEX", f"{GREEN}{nex_file_size}{RESET} ({nex_file_size / 1024:.2f}KB)"))
        if space_left < 0:
            over = -space_left
            remain = f"{RED}{over}{RESET} ({CYAN}${over:04X}{RESET}) over"
        else:
            remain = f"{GREEN}{space_left}{RESET} ({CYAN}${space_left:04X}{RESET}) free"
        rows.append(("BIN",
                     (f"{CYAN}${org_val:04X}-${bin_last:04X}{RESET}",
                      f"{GREEN}{file_size}{RESET} / {GREEN}{max(working_space_left, 0)}{RESET} used,",
                      remain)))
        rows.append(("", percent_text))
        print_table(rows)

        if show_done:
            print(f"{BOLD}{GREEN}NEX created OK! All done.{RESET}")

    except SystemExit:
        raise
    except Exception as e:
        print(f"{RED}ERROR creating NEX file! {str(e)}{RESET}")
        sys.exit(1)
    finally:
        if os.getcwd() != original_cwd:
            os.chdir(original_cwd)


def ParseNEXCfgASM(state, base_dir=None):
    if state.nonex:
        print(f"{RED}NONEX mode detected - skipping NEX config generation{RESET}")
        return

    print("====================================================")
    print(f"{YELLOW}Generating minimal Nexcreator Config for Assembly ...{RESET}")
    print("")

    CRLF = "\r\n"
    default_org = parse_number(state.org) if state.org else 32768
    default_pc = default_org
    default_sp = default_org - 2
    org_val = default_org
    rambank = "?"
    if 0x4000 <= org_val <= 0x7FFF:
        rambank = "5"
    elif 0x8000 <= org_val <= 0xBFFF:
        rambank = "2"
    elif 0xC000 <= org_val <= 0xFFFF:
        rambank = "0"
    elif 0x0000 <= org_val <= 0x3FFF:
        rambank = "7"

    codestart = org_val % 0x4000
    outstring = "; Built with NextBuild (Assembly)" + CRLF
    outstring += "!COR3,0,0" + CRLF
    outstring += f"!PCSP${default_pc:04X},${default_sp:04X}" + CRLF
    _, bin_rel = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
    outstring += f"./{bin_rel},{rambank},${codestart:04X}" + CRLF

    cfg_filepath = os.path.join(state.input_dir, state.filenamenoext + ".cfg")
    with open(cfg_filepath, "wt") as f:
        f.write(outstring)
    print(f"{YELLOW}Saved assembly config file : {cfg_filepath}{RESET}")


def ParseNEXCfg(state, base_dir):
    if state.module == 1:
        print("Module compilation - skipping NEX config generation")
        print("====================================================")
        bin_filepath, _ = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
        if os.path.exists(bin_filepath):
            file_size = os.path.getsize(bin_filepath)
            module_start = 24576
            module_end = 56576
            module_space = 32000
            percent = (file_size * 100) / module_space
            space_left = module_space - file_size
            percent_text = display_gauge_simple(percent)
            print(
                f"BIN filesize :\t{GREEN}{file_size} bytes{RESET} - {percent_text}"
                f" Used of {GREEN}{module_space} bytes{RESET}, \n\r\t\t{GREEN}{space_left} bytes{RESET} Free"
                f" ({GREEN}{file_size / 1024:.2f}KB{RESET} Used/{GREEN}{space_left / 1024:.2f}KB{RESET} Free)"
            )
            print(
                f"Module Range :  {GREEN}${module_start:04X} to ${module_end:04X}{RESET} "
                f"({GREEN}{module_space} bytes{RESET} available)"
            )
            print(
                f"Module End   :  {GREEN}${module_start:04X} + {file_size} = "
                f"${module_start + file_size:04X}{RESET}"
            )

            data_dir = os.path.join(state.input_dir, "data")
            if not os.path.exists(data_dir):
                os.makedirs(data_dir)
                print(f"{GREEN}Created data directory: {data_dir}{RESET}")
            module_dest = os.path.join(data_dir, state.filenamenoext + ".bin")
            try:
                shutil.copy(bin_filepath, module_dest)
                print(f"{GREEN}Copied module binary to data directory: {module_dest}{RESET}")
            except Exception as e:
                print(f"{RED}Failed to copy module binary to data directory: {str(e)}{RESET}")
            print(f"{BOLD}{GREEN}Module compiled OK! All done.{RESET}")
        else:
            print(f"{RED}ERROR: Module binary file not found: {bin_filepath}{RESET}")
        return

    if state.nonex:
        print(f"{RED}NONEX mode detected - skipping NEX config generation{RESET}")
        return

    CRLF = "\r\n"
    print("====================================================")
    print(f"{YELLOW}Generating Nexcreator Config ...{RESET}")
    print("")

    outstring = "; Built with NextBuild " + CRLF
    outstring += "!COR3,0,0" + CRLF
    if state.nosys is False:
        sysvars_abs_path = os.path.join(base_dir, "Tools", "sysvars.bin")
        sysvars_rel_path = os.path.relpath(sysvars_abs_path, state.input_dir)
        sysvars_rel_path_cfg = sysvars_rel_path.replace("\\", "/")
        print(f"Adding sysvars using path: {sysvars_rel_path_cfg}")
        mmu_path_prefix = "" if ".." in sysvars_rel_path_cfg else "./"
        outstring += f"!MMU{mmu_path_prefix}{sysvars_rel_path_cfg},10,$1C00" + CRLF
    else:
        print("Not adding sysvars")

    if state.bmpfile is not None:
        bmp_abs_path = os.path.abspath(os.path.join(state.input_dir, state.bmpfile))
        bmp_abs_path = bmp_abs_path.replace("\\", "/")
        print(f"Adding BMP from: {bmp_abs_path}")
        outstring += f"!BMP8{bmp_abs_path},0,0,0,0,255" + CRLF

    claims = []

    def claim_range(first_page, offset, byte_length, owner, is_code=False):
        start = first_page * 0x2000 + offset
        end = start + max(byte_length, 1)
        for other_start, other_end, other_owner, other_is_code in claims:
            if start >= other_end or end <= other_start:
                continue
            lo = max(start, other_start)
            hi = min(end, other_end)
            fatal = is_code or other_is_code
            tag = f"{RED}##ERROR" if fatal else f"{YELLOW}##WARNING"
            print(
                f"{tag} - {hi - lo} bytes overlap in 8K page {lo // 0x2000} "
                f"at ${lo % 0x2000:04X}:{RESET}"
            )
            print(f"    {other_owner}")
            print(f"    {owner}")
            if fatal:
                print(f"{RED}    A code bank cannot share bytes with anything.{RESET}")
                sys.exit(1)
            print(
                f"{YELLOW}    '{owner}' is written last, so it overwrites those "
                f"bytes. Harmless if that tail is padding.{RESET}"
            )
        claims.append((start, end, owner, is_code))

    # Lazy symbol table: only built if a LoadSDBank argument is not a plain
    # number.  Projects using literals never open a single extra file.
    symbols = {}
    symbols_loaded = [False]

    def resolve_arg(text, what, raw_line):
        text = str(text).strip()
        try:
            return parse_number(text)
        except ValueError:
            pass
        if not symbols_loaded[0]:
            symbols_loaded[0] = True
            symbols.update(collect_symbols(
                state.inputfile, os.path.join(base_dir, "Scripts")))
        try:
            return resolve_expr(text, symbols)
        except ValueError as name_err:
            print(f"{RED}##ERROR - LoadSDBank {what}: {name_err}{RESET}")
            print(f"{RED}Referenced in: {raw_line.strip()}{RESET}")
            print(f"{RED}A name must be a CONST or #define with a numeric value, "
                  f"in this file or something it #includes.{RESET}")
            sys.exit(1)

    try:
        current_line = 0
        with open(state.inputfile, "rt") as f:
            lines = f.read().splitlines()
            trimmed = 0
            for x in lines:
                x_mod = x.replace(")", ",").replace("(", ",")
                xl = x_mod.lower().strip()
                if xl.find("loadsdbank,") != -1:
                    # Skip the DECLARATION, not every line that says "sub".  The
                    # old test was xl.find("sub") == -1, which also swallowed any
                    # call whose arguments happened to contain those three
                    # letters - a bank named BK_SUBTITLE would make the whole
                    # load silently vanish.  Anchoring it to the start of the
                    # line keeps `Sub LoadSDBank(...)` in nextlib out while
                    # leaving real call sites alone.  Verified against the tree:
                    # every line containing both "loadsdbank" and "sub" today is
                    # a declaration or a comment, so nothing changes behaviour.
                    is_declaration = re.match(r"(sub|function|declare)\b", xl) is not None
                    if not is_declaration and xl[0] != "'":
                        try:
                            partname = x_mod.split('"')[1]
                        except IndexError:
                            print(f"{RED}{current_line}- #ERROR - Failed to parse loadsdbank parameters: {x}{RESET}")
                            print(
                                f"{RED}{current_line}- #ERROR - Are you using LoadSDBank syntax correctly? "
                                f"Variables/strings are not processed unless '!nonex is used.{RESET}"
                            )
                            sys.exit(1)

                        is_system_file = False
                        actual_filename = partname
                        if partname.startswith("[]"):
                            is_system_file = True
                            actual_filename = partname[2:]
                            filename = os.path.abspath(
                                os.path.join(base_dir, "Scripts", "system_data", actual_filename)
                            )
                            print(f"System file specified: {partname} -> {filename}")
                        else:
                            filename = os.path.abspath(os.path.join(state.input_dir, "data", partname))

                        try:
                            with open(filename, "rb") as bank_f:
                                bank_content = bank_f.read()

                            parts = x_mod.split(",")
                            offval = resolve_arg(parts[2], "offset", x) & 0x1FFF
                            fileoffset = resolve_arg(parts[4], "file offset", x)

                            if is_system_file and fileoffset > 0:
                                print(
                                    f"{RED}##ERROR - File offset/trimming is not supported for system files "
                                    f"(starting with []): {partname}{RESET}"
                                )
                                print(f"{RED}Referenced in: {x}{RESET}")
                                sys.exit(1)

                            if fileoffset > 0:
                                print(f"File {partname} has an offset of : {fileoffset}")
                                new_file_content = bank_content[fileoffset:]
                                trimmed_filename_base = "tr_" + actual_filename[:-4] + str(trimmed) + ".bnk"
                                trimmed_filepath = os.path.join(state.input_dir, "data", trimmed_filename_base)
                                with open(trimmed_filepath, "wb") as f_trim:
                                    f_trim.write(new_file_content)
                                filename = trimmed_filepath
                                print(f"Trimmed as : {filename}")
                                trimmed += 1

                            bank = resolve_arg(parts[5], "bank", x)
                            claim_range(
                                bank,
                                offval,
                                len(bank_content) - fileoffset,
                                f"data '{partname}' (line {current_line + 1})",
                            )

                            filename_rel = os.path.relpath(filename, state.input_dir)
                            filename_cfg = filename_rel.replace("\\", "/")
                            outstring += "; " + x + CRLF
                            mmu_path_prefix = "" if filename_cfg.startswith("..") else "./"
                            outstring += f"!MMU{mmu_path_prefix}{filename_cfg},{bank},${offval:04X}" + CRLF

                        except (IOError, FileNotFoundError):
                            error_path = (
                                os.path.abspath(
                                    os.path.join(base_dir, "Scripts", "system_data", actual_filename)
                                )
                                if is_system_file
                                else os.path.abspath(os.path.join(state.input_dir, "data", partname))
                            )
                            print(f"{RED}##ERROR - Failed to find or read bank file: {error_path}{RESET}")
                            if is_system_file:
                                print(
                                    f"{RED}Please make sure this file exists in the "
                                    f"'/Scripts/system_data/' directory!{RESET}"
                                )
                            else:
                                print(
                                    f"{RED}Please make sure this file exists in the "
                                    f"'data' subdirectory of your project!{RESET}"
                                )
                            print(f"{RED}Referenced in: {x}{RESET}")
                            sys.exit(1)
                        except (IndexError, ValueError) as parse_err:
                            print(f"{RED}##ERROR - Failed to parse loadsdbank parameters: {x}{RESET}")
                            print(f"{RED}Error details: {parse_err}{RESET}")
                            sys.exit(1)
                current_line += 1

        banks_manifest, _ = resolve_intermediate(state.input_dir, state.filenamenoext + ".banks.json")
        state.codebanks = []
        if os.path.exists(banks_manifest):
            with open(banks_manifest, "rt") as bf:
                manifest = json.load(bf)
            window = manifest.get("window", 0x6000)
            window_size = manifest.get("window_size", 0x2000)
            print(
                f"{YELLOW}Found {len(manifest['banks'])} code bank(s), window "
                f"${window:04X}-${window + window_size - 1:04X}{RESET}"
            )
            outstring += "; --- banked code ---" + CRLF
            for entry in manifest["banks"]:
                bank_bin, bank_rel = resolve_intermediate(state.input_dir, entry["file"])
                if not os.path.exists(bank_bin):
                    print(f"{RED}##ERROR - Missing code bank binary: {bank_bin}{RESET}")
                    sys.exit(1)
                claim_range(entry["page"], 0, entry["size"], f"CODEBANK {entry['bank']}", is_code=True)
                pct = entry["size"] * 100 // window_size
                # A 16K bank owns two consecutive pages. One !MMU line still
                # covers it: nextcreator streams a blob across banks, and
                # claim_range models the spill in the same flat page*8K space.
                pages = entry.get("pages") or [entry["page"]]
                where = "8K page %s" % pages[0] if len(pages) == 1 else "8K pages %s" % ", ".join(map(str, pages))
                print(
                    f"  CODEBANK {entry['bank']:<3} -> {where:<16} "
                    f"{entry['size']:5} / {window_size} bytes ({pct}%)"
                )
                state.codebanks.append({
                    "bank": entry["bank"],
                    "page": entry["page"],
                    "pages": pages,
                    "size": entry["size"],
                    "window": window,
                    "window_size": window_size,
                })
                outstring += f"!MMU./{bank_rel},{entry['page']},$0000" + CRLF

        if state.pc is None:
            print(f"No PC has been set so setting to ORG : {CYAN}{state.org}{RESET} ")
            state.pc = state.org
        else:
            state.pc = str(state.pc)

        if state.sp is None:
            pc_val = parse_number(str(state.pc))
            if pc_val == 0:
                print(f"PC is 0 so setting SP to 0 : {CYAN}0{RESET} ")
                state.sp = 0
            else:
                state.sp = pc_val - 2
                print(f"No SP has been set so setting to PC-2 : {CYAN}{state.sp}{RESET} ")
        else:
            state.sp = parse_number(str(state.sp))

        pc = parse_number(str(state.pc))
        sp = state.sp
        outstring += f"!PCSP${pc:04X},${sp:04X}" + CRLF

        org_val = parse_number(str(state.org))
        rambank = "?"
        if 0x4000 <= org_val <= 0x7FFF:
            rambank = "5"
        elif 0x8000 <= org_val <= 0xBFFF:
            rambank = "2"
        elif 0xC000 <= org_val <= 0xFFFF:
            rambank = "0"
        elif 0x0000 <= org_val <= 0x3FFF:
            rambank = "7"

        codestart = org_val % 0x4000
        _, bin_rel = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
        outstring += f"./{bin_rel},{rambank},${codestart:04X}" + CRLF

        cfg_filepath = os.path.join(state.input_dir, state.filenamenoext + ".cfg")
        with open(cfg_filepath, "wt") as f:
            f.write(outstring)
        print(f"{YELLOW}Saved config file : {cfg_filepath}{RESET}")

    except SystemExit:
        raise
    except Exception as e:
        print(f"{RED}ERROR generating config file: {str(e)}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def build_nex(state, base_dir):
    """Generate .cfg from source (unless skipped) and package the .nex."""
    if getattr(state, "filetype", None) == "asm":
        ParseNEXCfgASM(state, base_dir)
    else:
        ParseNEXCfg(state, base_dir)
    if not state.module:
        CreateNEXFile(state, base_dir)


def parse_nex_header(state):
    """Read NEX-related '! / ;! directives from the first 64 lines."""
    prefix = ";!" if state.filetype == "asm" else "'!"
    patterns = {
        "org": re.compile(r"{}org={}".format(re.escape(prefix), NUMBER_PATTERN)),
        "end": re.compile(r"{}end={}".format(re.escape(prefix), NUMBER_PATTERN)),
        "nonex": re.compile(r"{}nonex".format(re.escape(prefix))),
        "nosys": re.compile(r"{}$".format(re.escape(prefix + "nosys"))),
        "pc": re.compile(r"{}pc={}".format(re.escape(prefix), NUMBER_PATTERN)),
        "sp": re.compile(r"{}sp={}".format(re.escape(prefix), NUMBER_PATTERN)),
        "bmp": re.compile(r"{}bmp=(.+)".format(re.escape(prefix))),
        "module": re.compile(r"{}module=(\w+)".format(re.escape(prefix))),
    }
    current_line = 0
    with open(state.inputfile, "rt") as f:
        for line in f:
            current_line += 1
            if current_line > 64:
                break
            original_line = line.strip()
            line = original_line.lower()
            for key, pattern in patterns.items():
                match = pattern.search(line)
                if not match:
                    continue
                if key == "org":
                    state.org = match.group(1)
                    print(f"Found ORG    :  {CYAN}{parse_number(state.org)}{RESET}")
                elif key == "end":
                    state.end = match.group(1)
                    print(f"Found END    :  {CYAN}{parse_number(state.end)}{RESET}")
                elif key == "pc":
                    state.pc = match.group(1)
                    print(f"Found PC     :  {CYAN}{state.pc}{RESET}")
                elif key == "sp":
                    state.sp = parse_number(match.group(1))
                    print(f"Found SP     :  {CYAN}{state.sp}{RESET}")
                elif key == "nosys":
                    state.nosys = True
                    print("Found NOSYS")
                elif key == "nonex":
                    state.nonex = True
                    state.no_nex = True
                    print("Found NONEX")
                elif key == "module":
                    state.module = True
                    print("Found MODULE directive")
                elif key == "bmp":
                    original_match = pattern.search(original_line)
                    state.bmpfile = "./data/" + (original_match.group(1) if original_match else match.group(1))
                    print(f"Loading BMP  :  {CYAN}{state.bmpfile}{RESET}")


class _NexState:
    def __init__(self, inputfile):
        self.inputfile = inputfile
        self.input_dir = os.path.dirname(inputfile)
        self.input_basename = os.path.basename(inputfile)
        self.filenamenoext = os.path.splitext(self.input_basename)[0]
        ext = os.path.splitext(self.input_basename)[1].lower()
        self.filetype = "asm" if ext == ".asm" else "bas"
        self.org = "32768"
        self.end = None
        self.pc = None
        self.sp = None
        self.nosys = False
        self.nonex = False
        self.no_nex = False
        self.bmpfile = None
        self.module = False


def _resolve_input(path, base_dir):
    path = path.strip("'")
    cwd = os.getcwd()
    candidates = [
        os.path.abspath(os.path.join(cwd, path)),
        os.path.abspath(os.path.join(base_dir, path)),
        os.path.abspath(path),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    print(f"{RED}Error: Input file not found: {path}{RESET}")
    sys.exit(1)


def _create_from_cfg(cfg_path, base_dir):
    cfg_path = cfg_path.strip("'")
    cwd = os.getcwd()
    search = [
        os.path.abspath(os.path.join(cwd, cfg_path)),
        os.path.abspath(os.path.join(base_dir, cfg_path)),
        os.path.abspath(cfg_path),
    ]
    found = None
    for candidate in search:
        if os.path.isfile(candidate):
            found = candidate
            break
        in_build = os.path.join(os.path.dirname(candidate), "build", os.path.basename(candidate))
        if os.path.isfile(in_build):
            found = in_build
            break
    if not found:
        print(f"{RED}Error: Input file not found: {cfg_path}{RESET}")
        sys.exit(1)

    cfg_path = found
    cfg_dir = os.path.dirname(cfg_path)
    name = os.path.splitext(os.path.basename(cfg_path))[0]
    input_dir = os.path.dirname(cfg_dir) if os.path.basename(cfg_dir) == "build" else cfg_dir
    bin_path, _ = resolve_intermediate(input_dir, name + ".bin")
    if not os.path.exists(bin_path):
        print(f"{RED}ERROR: Binary file not found: {bin_path}{RESET}")
        sys.exit(1)
    state = _NexState(os.path.join(input_dir, name + ".bas"))
    state.filenamenoext = name
    state.input_dir = input_dir
    print(f"{YELLOW}Using existing config: {CYAN}{cfg_path}{RESET}")
    CreateNEXFile(state, base_dir)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Rebuild a NEX from existing binaries (no compile)")
    parser.add_argument("-b", dest="file", help=".bas or .asm file to package")
    parser.add_argument("--from-cfg", dest="cfg", help="Use an existing .cfg and skip source scan")
    parser.add_argument("--config", help="Path to nextbuild.config")
    args = parser.parse_args(argv)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    if args.cfg:
        _create_from_cfg(args.cfg, base_dir)
        return 0
    if not args.file:
        parser.print_help()
        return 1

    abs_input = _resolve_input(args.file, base_dir)
    ext = os.path.splitext(abs_input)[1].lower()
    if ext not in (".bas", ".asm"):
        print(f"{RED}Unsupported file type '{ext}' - use .bas, .asm, or --from-cfg{RESET}")
        return 1

    state = _NexState(abs_input)
    print(f"{YELLOW}Rebuilding NEX (no compile) : {CYAN}{abs_input}{RESET}")
    parse_nex_header(state)
    bin_path, _ = resolve_intermediate(state.input_dir, state.filenamenoext + ".bin")
    if not os.path.exists(bin_path):
        print(f"{RED}ERROR: Binary file not found: {bin_path}{RESET}")
        print(f"{RED}Compile first with: python Scripts/nextbuild.py -b {args.file}{RESET}")
        return 1
    build_nex(state, base_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
