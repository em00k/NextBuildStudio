# Repository Guidelines

## Project Structure & Module Organization
- `Sources/` holds ZX Basic projects, example suites (`NextBuild_Examples/`), and shared docs; keep new game demos under a dedicated subfolder with its assets beside the `.bas`.
- `Scripts/` contains the Python tooling (`nextbuild.py`, `build.py`, `launch_cspect.py`) plus `nextbuild.config`; treat it as the canonical automation layer.
- `Tools/` bundles external helpers (`pyscripts/`, `hdfmonkey`, image converters) that the build scripts call; avoid modifying binaries without replacing them across platforms.
- Emulator resources live in `Emu/` and disk images in `img/`; check paths in `nextbuild.config` after moving either directory.
- Tests and smoke projects belong in `Sources/Tests/`, which already includes a minimal `Tests.bas` and `build/` output staging.

## Build, Test, and Development Commands
- `python Scripts/nextbuild.py -b Sources/InputTest/InputTile.bas` — standard compile to `.nex`, respecting in-file `'!` directives and syncing assets.
- `python Scripts/build.py -b Sources/Matrix3D/Matrix3D.bas --modules` — rebuild module sets when changing reusable routines.
- `python Scripts/nextbuild.py -b Sources/Tests/Tests.bas --sync-hdf` — verify HDF sync without launching CSpect.
- `python Scripts/launch_cspect.py --nex Sources/Tests/build/Tests.nex --echo` — boot CSpect with live logging; add `--map build/Tests.map` when debugging.
- `python Scripts/update-config.py --show` — confirm toolchain paths after relocating compilers or emulator builds.

## Coding Style & Naming Conventions
- **Python**: Match existing files — 4-space indentation, descriptive `snake_case` for functions, keep CLI entry points under `if __name__ == "__main__":`, and add short docstrings for public helpers.
- **ZX Basic**: Uppercase keywords, place all `'!directive` lines within the first 64 lines, and group sprite/tile data in block comments that explain format.
- **Assets**: Use lowercase hyphenated filenames (e.g., `assets/title-screen.bmp`) so scripts resolve them on case-sensitive systems; store generated NEX files under a `build/` folder beside the source.

## Testing Guidelines
- Exercise new features by compiling a focused `.bas` file and running it through CSpect; capture emulator stdout when reporting bugs.
- Extend `Sources/Tests/` with regression cases; mirror the `Tests.bas` pattern and keep expected assets within `Tests/data/`.
- When changing sync behaviour, run `--sync-hdf` after deleting the prior `build/` output to ensure fresh artifacts.
- Aim for parity between real hardware expectations and CSpect by stepping through with `--map` when altering memory layout directives.

## Commit & Pull Request Guidelines
- Follow the existing history of concise imperative subject lines (`Update launch_cspect echo handling`); append scope tags only when necessary.
- Squash noisy WIP commits locally; include the relevant `.bas` path or script name in the body when behaviour changes.
- Pull requests should list reproduction commands, mention any `nextbuild.config` adjustments, and attach CSpect logs or screenshots when UI output changes.
- Link related Trello/GitHub issues in the description and call out required follow-up tasks so downstream module maintainers can plan their sync cadence.

## Configuration & Tooling Tips
- Keep a clean, versioned copy of `Scripts/nextbuild.config`; run `python Scripts/update-config.py --list-paths` after tool upgrades to refresh `Sources/.vscode/tasks.json`.
- Treat `Tools/pyscripts/` wrappers (e.g., `cspect_wrapper.py`) as single-source-of-truth for platform quirks; propose changes via PR so other environments stay aligned.

## ZX Basic library reference
- **[nextlib.md](nextlib.md)** is the companion to this file: the nextlib and
  `nextlib_primitives` API, the Boriel compiler traps that compile silently and
  give wrong answers, the inline-asm calling convention, CODEBANK, the Layer 2
  memory layouts and port `$123B`, and how to test any of it without hardware.
  Read it before writing or changing a `.bas`.
