#!/usr/bin/env bash
#
# One command to run everything that guards this fork.
#
#   ./codebanks-fork/run-tests.sh            everything
#   ./codebanks-fork/run-tests.sh --quick    skip the 1200-file functional sweep
#   ./codebanks-fork/run-tests.sh --unit     unit suites only
#   ./codebanks-fork/run-tests.sh --func     functional (golden .asm) sweep only
#   ./codebanks-fork/run-tests.sh --codebank CODEBANK examples + emulator only
#
# The first run creates a virtualenv and installs pytest into it; after that it
# is offline. Upstream drives its own tests with `poetry run poe test`, which
# needs poetry and a lockfile install; this needs neither.
#
set -uo pipefail

FORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TREE="$(dirname "$FORK_DIR")"
VENV="${ZXB_TEST_VENV:-$TREE/venv}"          # 'venv/' is already gitignored
PY="$VENV/bin/python"
# The CODEBANK examples live outside the compiler tree, next to the sources
# they are meant to build. Override if the checkout is laid out differently.
EXAMPLES="${ZXB_BANKED_EXAMPLES:-$TREE/../Sources/Tests/BankedCode}"
INCLUDES="${ZXB_INCLUDES:-$TREE/../Scripts}"
KNOWN_FAILURES="$FORK_DIR/known-failures.txt"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; OFF=$'\033[0m'
rc=0

run_unit=1; run_func=1; run_codebank=1
case "${1:-}" in
    --quick)    run_func=0 ;;
    --unit)     run_func=0; run_codebank=0 ;;
    --func)     run_unit=0; run_codebank=0 ;;
    --codebank) run_unit=0; run_func=0 ;;
    "")         ;;
    *)          sed -n '3,12p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac

section() { printf '\n%s== %s ==%s\n' "$BOLD" "$1" "$OFF"; }
verdict() { if [ "$1" -eq 0 ]; then printf '%s  PASS%s  %s\n' "$GREEN" "$OFF" "$2"; else printf '%s  FAIL%s  %s\n' "$RED" "$OFF" "$2"; rc=1; fi; }

# --- setup ------------------------------------------------------------------
if [ ! -x "$PY" ]; then
    section "creating test virtualenv at $VENV"
    python3 -m venv "$VENV" || { echo "${RED}could not create a virtualenv${OFF}"; exit 1; }
    "$VENV/bin/pip" install -q pytest pytest-xdist || {
        echo "${RED}could not install pytest (no network?)${OFF}"; exit 1; }
    # z80 backs run_far.py, the far-call emulator. Optional: without it that
    # one phase is skipped rather than failing the run.
    "$VENV/bin/pip" install -q z80 || echo "${YELLOW}z80 not installed; the emulator phase will be skipped${OFF}"
fi

# pyproject's addopts asks for `--cov=src`, which needs pytest-cov and roughly
# doubles the run; it is replaced rather than disabled, so pytest-cov need not
# be installed at all. The xdist half is kept -- it is what turns the
# 1200-file sweep from minutes into seconds.
# -p no:cacheprovider keeps .pytest_cache out of the tree. --color=no because
# the failure list is parsed below and ANSI escapes sit in front of the FAILED.
PYTEST=("$PY" -m pytest -o addopts="-n auto --dist=loadgroup" -p no:cacheprovider --no-header -q --color=no)

# tests/functional/cmdline/*.txt are doctests that open with
# `from test_ import process_file`, so tests/functional has to be importable.
# Without it they fail on the import and hide whatever they were checking.
export PYTHONPATH="$TREE/tests/functional${PYTHONPATH:+:$PYTHONPATH}"

# --- unit suites ------------------------------------------------------------
if [ "$run_unit" -eq 1 ]; then
    section "unit suites (api, arch, symbols, zxbc, cmdline)"
    "${PYTEST[@]}" "$TREE/tests" --ignore="$TREE/tests/functional" --ignore="$TREE/tests/runtime"
    verdict $? "unit suites"
fi

# --- functional golden sweep ------------------------------------------------
if [ "$run_func" -eq 1 ]; then
    section "functional sweep (compiles every tests/functional/**/*.bas)"
    out="$(mktemp)"
    "${PYTEST[@]}" "$TREE/tests/functional" >"$out" 2>&1
    grep -E '[0-9]+ (passed|failed)' "$out" | tail -1 | sed 's/^/  /'
    # Some of these fail *because of* this fork, deliberately: the goldens
    # embed the runtime library source, and our zxnext runtime keeps its own
    # implementations where upstream stubs out to zx48k. See known-failures.txt
    # for the breakdown. Compare against the recorded set rather than a count,
    # so a new failure cannot hide behind an old one.
    grep -oE '^FAILED [^ ]+' "$out" | sed "s|^FAILED ||; s|$TREE/||g" | sort > "$out.now"
    if [ -f "$KNOWN_FAILURES" ]; then
        grep -v '^[[:space:]]*\(#\|$\)' "$KNOWN_FAILURES" | sort > "$out.known"
        if diff -q "$out.known" "$out.now" >/dev/null; then
            verdict 0 "functional sweep ($(wc -l < "$out.now") known failures, unchanged)"
        else
            printf '%s  changes against %s:%s\n' "$YELLOW" "${KNOWN_FAILURES#"$TREE/"}" "$OFF"
            diff "$out.known" "$out.now" | sed 's/^</  no longer failing:/;s/^>/  NEWLY FAILING:  /' | grep -E 'failing' || true
            verdict 1 "functional sweep"
        fi
    else
        printf '  no %s yet; recording the current set\n' "${KNOWN_FAILURES#"$TREE/"}"
        cp "$out.now" "$KNOWN_FAILURES"
        verdict 0 "functional sweep (baseline recorded)"
    fi
    rm -f "$out" "$out.now" "$out.known"
fi

# --- CODEBANK examples and the far-call emulator ----------------------------
if [ "$run_codebank" -eq 1 ]; then
    section "CODEBANK examples and far-call emulator"
    if [ ! -d "$EXAMPLES" ]; then
        printf '%s  SKIP%s  %s not found (set ZXB_BANKED_EXAMPLES)\n' "$YELLOW" "$OFF" "$EXAMPLES"
    else
        tmp="$(mktemp -d)"
        bad=0

        # `'!org=` and friends are NextBuild directives, invisible to zxbc, so
        # they have to be turned into flags here -- exactly what nextbuild.py
        # does. Reading them from the source keeps this honest when an example
        # moves its window or its program.
        directive() {   # directive <file> <name> -> value, or empty
            local v
            v="$(grep -oiE "^[[:space:]]*'![[:space:]]*$2=[^[:space:]']+" "$1" | head -1 | sed "s/.*=//")"
            case "$v" in
                \$*) printf '%d' "$((16#${v#\$}))" ;;
                "")  ;;
                *)   printf '%s' "$v" ;;
            esac
        }

        for f in "$EXAMPLES"/*.bas; do
            [ -f "$f" ] || continue
            name="$(basename "$f" .bas)"
            args=(--arch=zxnext -O4 -I "$INCLUDES")
            org="$(directive "$f" org)";  args+=(-S "${org:-32768}")
            for d in codewindow:--code-window codewindowsize:--code-window-size \
                     codebank:--code-bank-base codebankpages:--code-bank-pages; do
                v="$(directive "$f" "${d%%:*}")"
                [ -n "$v" ] && args+=("${d#*:}" "$v")
            done
            (cd "$EXAMPLES" && "$PY" "$TREE/zxbc.py" "$name.bas" "${args[@]}" \
                -o "$tmp/$name.bin" -M "$tmp/$name.map") >"$tmp/$name.log" 2>&1
            if [ $? -ne 0 ] || grep -qi ": error:" "$tmp/$name.log"; then
                printf '  %sbuild failed%s  %s\n' "$RED" "$OFF" "$name"
                grep -i ": error:" "$tmp/$name.log" | head -2 | sed 's/^/      /'
                bad=1
            fi
        done
        verdict $bad "example builds ($(ls "$EXAMPLES"/*.bas 2>/dev/null | wc -l) sources)"

        # The emulator runs these for real. farcall_test* assert the far-call
        # ABI against a fixed table; array_test checks itself and reports the
        # source line of anything that failed.
        if ! "$PY" -c "import z80" 2>/dev/null; then
            printf '%s  SKIP%s  emulator (no z80 module: pip install z80)\n' "$YELLOW" "$OFF"
        else
            for name in farcall_test farcall_test16 array_test farmem_test bankinit_test; do
                [ -f "$tmp/$name.bin" ] || continue
                org="$(directive "$EXAMPLES/$name.bas" org)"
                if (cd "$EXAMPLES" && "$PY" run_far.py "$tmp/$name.bin" "$tmp/$name.banks.json" \
                        "$tmp/$name.map" "${org:-32768}" "$name.bas") >"$tmp/$name.far" 2>&1; then
                    verdict 0 "$name (emulator)$(grep -oE '[0-9]+ checks ran' "$tmp/$name.far" | sed 's/^/ -- /')"
                else
                    verdict 1 "$name (emulator)"
                    grep -E 'FAIL|checks ran|Error|error' "$tmp/$name.far" | head -8 | sed 's/^/      /'
                fi
            done
        fi
        rm -rf "$tmp"
    fi
fi

section "result"
[ "$rc" -eq 0 ] && printf '%sall green%s\n' "$GREEN" "$OFF" || printf '%ssomething failed%s\n' "$RED" "$OFF"
exit "$rc"
