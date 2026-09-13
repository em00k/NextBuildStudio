#!/usr/bin/env python3
"""Compile NextBuild projects/modules and launch their resolved entry point."""

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

# Isolated Windows Python (safe_path) does not put this script's folder on
# sys.path, so sibling imports like project_config would fail without this.
SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from project_config import is_module, resolve_project

SOURCES_DIR = SCRIPTS_DIR.parent / 'Sources'


def run_command(command):
    """Stream tool output and propagate failures to the caller."""
    # The Output pane uses one ordered stream so compiler diagnostics cannot
    # arrive after the launch marker and be mistaken for emulator output.
    stderr = subprocess.STDOUT if os.environ.get('NEXTBUILD_LAUNCH_MARKER') else None
    result = subprocess.run([str(arg) for arg in command], check=False, stderr=stderr)
    if result.returncode:
        raise RuntimeError(f'{Path(command[1]).name} failed (exit {result.returncode})')


def compile_source(source, module=False):
    """Compile exactly one source, rejecting absent or stale expected output."""
    if not source.is_file():
        raise ValueError(f'Source file not found: {source}')
    if source.suffix.lower() not in ('.bas', '.asm') or source.name.lower() == 'nextlib.bas':
        raise ValueError(f'Not a compilable project source: {source}')
    output = source.with_suffix('.bin' if module else '.nex')
    # A failed compiler must not leave a previous artifact looking like success.
    output.unlink(missing_ok=True)
    run_command([sys.executable, SCRIPTS_DIR / 'nextbuild.py', '-b', source,
                 '-q', '-m' if module else '-s'])
    if not output.is_file():
        raise RuntimeError(f'Compiler did not produce expected output: {output}')
    return output


def compile_module(source, project):
    """Compile and stage a module beside the master, failing on copy errors."""
    binary = compile_source(source, module=True)
    destination = project.master.parent / 'data' / binary.name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(binary, destination)
    print(f'Module copied to {destination}', flush=True)


def wants_nextzxos(source):
    """True if the first 64 lines request '!nb=autostart' (or ;! for .asm)."""
    prefix = ';!' if source.suffix.lower() == '.asm' else "'!"
    needle = f'{prefix}nb=autostart'
    try:
        with source.open(encoding='utf-8', errors='ignore') as handle:
            for index, line in enumerate(handle):
                if index >= 64:
                    break
                if line.strip().lower().startswith(needle):
                    return True
    except OSError:
        return False
    return False


def launch_project(project):
    """Launch the NEX, or NextZXOS via the HDF image when '!nb=autostart' is set."""
    command = [sys.executable, SCRIPTS_DIR / 'launch_cspect.py', '--echo']
    if wants_nextzxos(project.master):
        print(f'Launching NextZXOS (HDF) for {project.master}', flush=True)
        command.append('--hdf')
    else:
        if not project.nex.is_file():
            raise RuntimeError(f'NEX file not found: {project.nex}. Build the project first.')
        command.extend(['--nex', project.nex])
    if project.map_file.is_file():
        command.extend(['--map', project.map_file])
    run_command(command)


def main(argv=None):
    """Run a build action, returning a failing exit status before any bad launch."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('-b', '--file', required=True, help='Selected source file')
    parser.add_argument('-q', '--quiet', action='store_true', help='Hide wrapper banner')
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('-m', '--modules', action='store_true', help='Build all project modules')
    modes.add_argument('-s', '--singlefile', action='store_true', help='Build selected module or project source')
    modes.add_argument('--project', action='store_true', help='Build configured entry source, regardless of selected file')
    modes.add_argument('--sync-hdf', action='store_true', help='Sync the configured entry project to HDF')
    parser.add_argument('-e', '--lastnex', action='store_true', help='Launch after building, or launch only if no build mode')
    args = parser.parse_args(argv)
    try:
        if args.sync_hdf and args.lastnex:
            raise ValueError('--sync-hdf cannot be combined with --lastnex')
        project = resolve_project(args.file.strip("'"), SOURCES_DIR, args.modules)
        if not args.quiet:
            print('NextBuild project builder', flush=True)
        if args.sync_hdf:
            run_command([sys.executable, SCRIPTS_DIR / 'nextbuild.py', '-b', project.master, '--sync-hdf'])
            return 0
        if args.modules:
            modules = sorted((p for p in project.root.iterdir() if p.is_file() and is_module(p)),
                             key=lambda p: p.name.lower())
            if not modules:
                raise ValueError(f'No Module000–Module255 sources found in {project.root}')
            for source in modules:
                compile_module(source, project)
            if args.lastnex:
                compile_source(project.master)
        elif args.project:
            compile_source(project.master)
        elif args.singlefile or not args.lastnex:
            if is_module(project.selected):
                compile_module(project.selected, project)
                if args.lastnex:
                    if project.nex.is_file():
                        print(f'Reusing existing master NEX: {project.nex}', flush=True)
                    else:
                        compile_source(project.master)
            else:
                compile_source(project.master)
        if args.lastnex:
            marker = os.environ.get('NEXTBUILD_LAUNCH_MARKER')
            if marker:
                print(f'\n{marker}', flush=True)
            launch_project(project)
        return 0
    except KeyboardInterrupt:
        print("Build/run interrupted", file=sys.stdout if os.environ.get('NEXTBUILD_LAUNCH_MARKER') else sys.stderr, flush=True)
        return 130
    except (OSError, ValueError, RuntimeError) as exc:
        print(f'Error: {exc}', file=sys.stdout if os.environ.get('NEXTBUILD_LAUNCH_MARKER') else sys.stderr, flush=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
