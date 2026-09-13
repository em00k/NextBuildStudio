#!/usr/bin/env python3
"""
Simplified CSpect Launcher for NextBuild projects.

Can launch either a specific .nex file or with a mounted HDF image.
Reads configuration from nextbuild.config.
Use --echo to see CSpect stdout/stderr output in real-time.
Features minimal color coding for better readability.
"""

import argparse
import os
import platform
import subprocess
import sys

# Simple color support for important messages
class Colors:
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    RESET = '\033[0m'

# Get base directory (where this script is located)
SCRIPT_PATH = os.path.abspath(__file__)
SCRIPTS_DIR = os.path.dirname(SCRIPT_PATH)
BASE_DIR = os.path.dirname(SCRIPTS_DIR)

def read_config(config_path):
    """Read simple key=value config file."""
    config = {}
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    return config

def find_master_file(target_file, directive_type):
    """
    Simplified version: look for '!master=' or '!origin=' directive in corresponding .bas file.
    Returns the master/origin file path if found and exists, otherwise returns original.
    """
    # Get .bas file path (same name as target but .bas extension)
    target_dir = os.path.dirname(target_file)
    target_basename = os.path.splitext(os.path.basename(target_file))[0]

    # Remove extension suffixes for map files (.bas.map -> .bas)
    if target_basename.endswith('.bas'):
        target_basename = target_basename[:-4]

    bas_file = os.path.join(target_dir, f"{target_basename}.bas")

    if not os.path.isfile(bas_file):
        return target_file

    try:
        with open(bas_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if line.startswith(f"'!{directive_type}="):
                    master_file = line[len(f"'!{directive_type}="):].strip()
                    master_path = os.path.join(target_dir, master_file)

                    if os.path.isfile(master_path):
                        print(f"{Colors.GREEN}Found {directive_type} directive: {master_path}{Colors.RESET}")
                        return master_path
                    else:
                        print(f"{Colors.YELLOW}Warning: {directive_type} file not found: {master_path}{Colors.RESET}")
                        break
    except Exception as e:
        print(f"{Colors.YELLOW}Warning: Could not read .bas file {bas_file}: {e}{Colors.RESET}")

    return target_file

def main():
    parser = argparse.ArgumentParser(description='CSpect Launcher for NextBuild')
    parser.add_argument('--config', help='Path to nextbuild.config file')
    parser.add_argument('--nex', help='Path to the .nex file to launch')
    parser.add_argument('--hdf', action='store_true', help='Launch using HDF image from config')
    parser.add_argument('--map', help='Path to the .map file for CSpect debugging')
    parser.add_argument('--echo', action='store_true', help='Echo CSpect stdout/stderr instead of exiting immediately')

    args = parser.parse_args()

    # Determine config file path
    config_path = args.config if args.config else os.path.join(SCRIPTS_DIR, 'nextbuild.config')

    # Read configuration
    config = read_config(config_path)
    if not config:
        print(f"{Colors.RED}Error: Cannot proceed without configuration.{Colors.RESET}")
        sys.exit(1)

    # Validate required arguments
    if not args.nex and not args.hdf:
        print(f"{Colors.RED}Error: Must specify either --nex PATH or --hdf{Colors.RESET}")
        parser.print_help()
        sys.exit(1)
    if args.nex and args.hdf:
        print(f"{Colors.RED}Error: Cannot use --nex and --hdf together{Colors.RESET}")
        parser.print_help()
        sys.exit(1)

    # Get CSpect executable path
    cspect_dir_rel = config.get('CSPECT')
    if not cspect_dir_rel:
        print(f"{Colors.RED}Error: CSPECT path not found in configuration{Colors.RESET}")
        sys.exit(1)

    cspect_exe = os.path.abspath(os.path.join(BASE_DIR, cspect_dir_rel, 'CSpect.exe'))
    if not os.path.isfile(cspect_exe):
        print(f"{Colors.RED}Error: CSpect executable not found: {cspect_exe}{Colors.RESET}")
        sys.exit(1)

    # Build CSpect arguments
    # On Linux, we need to use 'mono' to run CSpect.exe
    is_linux = platform.system() == 'Linux'
    if is_linux:
        # Check if mono is available
        try:
            subprocess.run(['which', 'mono'], capture_output=True, check=True)
            cspect_args = ['mono', cspect_exe]
            print(f"{Colors.BLUE}Running on Linux - using mono to launch CSpect{Colors.RESET}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"{Colors.YELLOW}Warning: mono not found in PATH. Attempting to run CSpect.exe directly...{Colors.RESET}")
            print(f"{Colors.YELLOW}If this fails, please install mono: sudo apt install mono-complete{Colors.RESET}")
            cspect_args = [cspect_exe]
    else:
        cspect_args = [cspect_exe]

    # Add custom args from config, or use defaults
    cspect_args_config = config.get('CSPECT_ARGS', '').strip()
    if cspect_args_config:
        print(f"{Colors.BLUE}Using custom CSpect args: {cspect_args_config}{Colors.RESET}")
        cspect_args.extend(cspect_args_config.split())
    else:
        # Essential defaults only
        cspect_args.extend([
            "-w3", "-16bit", "-brk", "-tv", "-vsync", "-nextrom", "-basickeys"
        ])

    # Add map file if specified
    if args.map:
        map_file = os.path.abspath(args.map)
        map_file = find_master_file(map_file, "origin")

        if os.path.isfile(map_file):
            cspect_args.append(f"-map={map_file}")
            print(f"{Colors.BLUE}Using map file: {map_file}{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}Warning: Map file not found: {map_file}{Colors.RESET}")

    # Handle launch modes
    if args.nex:
        # NEX file mode
        nex_file = os.path.abspath(args.nex)
        nex_file = find_master_file(nex_file, "master")

        if not os.path.isfile(nex_file):
            print(f"{Colors.RED}Error: NEX file not found: {nex_file}{Colors.RESET}")
            sys.exit(1)

        print(f"{Colors.BLUE}Launching NEX file: {nex_file}{Colors.RESET}")
        cspect_args.extend(["-zxnext", nex_file])

        # Check for data directory
        data_dir = os.path.join(os.path.dirname(nex_file), "data")
        if os.path.isdir(data_dir):
            cspect_args.append(f"-mmc={data_dir}")
            print(f"{Colors.BLUE}Adding data directory: {data_dir}{Colors.RESET}")

    elif args.hdf:
        # HDF image mode
        img_file_rel = config.get('IMG_FILE')
        if not img_file_rel:
            print(f"{Colors.RED}Error: IMG_FILE not found in configuration{Colors.RESET}")
            sys.exit(1)

        img_file = os.path.abspath(os.path.join(BASE_DIR, img_file_rel))
        if not os.path.isfile(img_file):
            print(f"{Colors.RED}Error: HDF image not found: {img_file}{Colors.RESET}")
            sys.exit(1)

        print(f"{Colors.BLUE}Launching with HDF image: {img_file}{Colors.RESET}")
        cspect_args.extend(["-zxnext", f"-mmc={img_file}"])

    # Launch CSpect
    print(f"\nLaunching: {' '.join(cspect_args)}")

    try:
        args.echo = 1

        if args.echo:
            # Echo mode: capture and display stdout/stderr in real-time
            process = subprocess.Popen(
                cspect_args,
                cwd=os.path.dirname(cspect_exe),  # Launch from CSpect directory
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )



            print(f"{Colors.GREEN}CSpect launched (PID: {process.pid}){Colors.RESET}")
            print("CSpect output:")

            # Read and echo output in real-time
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    print(output.strip())

            # Get final return code
            return_code = process.poll()
            if return_code != 0:
                print(f"{Colors.RED}CSpect exited with code: {return_code}{Colors.RESET}")
        else:
            # Default mode: launch and wait (no stdout capture)
            process = subprocess.Popen(
                cspect_args,
                cwd=os.path.dirname(cspect_exe),  # Launch from CSpect directory
                start_new_session=True
            )

            print(f"{Colors.GREEN}CSpect launched (PID: {process.pid}){Colors.RESET}")
            print("CSpect is running... (use --echo to see output)")

            # Wait for process to complete or user interrupt
            process.wait()

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted by user{Colors.RESET}")
        if 'process' in locals():
            process.terminate()
    except Exception as e:
        print(f"{Colors.RED}Error launching CSpect: {e}{Colors.RESET}")
        sys.exit(-1)

if __name__ == "__main__":
    main()
