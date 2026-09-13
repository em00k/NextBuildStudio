#!/usr/bin/env python3
"""
Part of the NextBuild project by em00k
https://github.com/em00k/NextBuildStudio

Monster NextBuild.py Script for controlling the build process.

"""

# v9.1 NextBuild / NextLib by David Saphier (c) 2025 / em00k 28-04-2025
# -- FIXED sysvars location
# ZX Basic Compiler by (c) Jose Rodriguez
# Thanks to Jari Komppa for help with the cfg parser
# Extra thanks to Jose for help integrating into the zxb python modules and nextcreator.py
# Big thanks to D Rimron Soutter as always
# Thanks to Deufectu for the original module concept
# This file takes a zx basic source file and compiles then generates a NEX file.
#
import sys
import subprocess, os
import re
from dataclasses import dataclass
import contextlib
import time
from functools import wraps
import json
import configparser
from pathlib import Path
import datetime
import platform
import glob
import shutil
import argparse
import threading

# parse command line arguments
#
parser = argparse.ArgumentParser(description='NextBuild.py Pre Processor')
parser.add_argument('-b', dest='file', type=str, required=False, help='.bas file to process - required unless using -v/--version')
parser.add_argument('-q' ,dest='quiet', action='store_true', help='Dont show splash')
parser.add_argument('-m', dest='modules', action='store_true' , help='Compile & Build module files')
parser.add_argument('-t', dest='tape', action='store_true' , help='Build a TAP file')
parser.add_argument('-l', dest='runmaster', action='store_true' , help='Build a TAP file')
parser.add_argument('-s', dest='singlefile', action='store_true' , help='Build a TAP file')
parser.add_argument('-D', dest='defines', type=ascii, required=False, help='Set global DEFINE - used for date #CDATE')
parser.add_argument('-v', '--version', action='store_true', help='Show version information')
parser.add_argument('--sync-hdf', action='store_true', help='Only sync build output and data to HDF image')
parser.add_argument('--config', help='Path to nextbuild.config file')

# Parse args but don't strip backslashes from paths
args = parser.parse_args()
if args.file:
    args.file = args.file.strip("'") # Only strip quotes, not backslashes

print(args.file)


# Get base directory (where this script is located)
SCRIPT_PATH = os.path.abspath(__file__)
SCRIPTS_DIR = os.path.dirname(SCRIPT_PATH)
BASE_DIR = os.path.dirname(SCRIPTS_DIR)

# --- NEW --- Define ParserState earlier
@dataclass
class ParserState:
    heap: str = None
    orgfound: bool = False
    destinationfile: str = None
    createasm: bool = False
    headerless: bool = False
    optimize: str = "2"
    bmpfile: str = None
    noemu: bool = False
    org: int = "32768"
    head_file: str = None
    inputfile: str = None      # Absolute path to the input .bas file
    input_dir: str = None      # Absolute directory of the input file
    input_basename: str = None # Basename of the input file
    filenamenoext: str = None  # Filename without extension
    autostart: bool = False
    nextzxos: bool = False
    # filename_path: str = None # Replaced by input_dir
    # filename_extension: str = None # Derived from input_basename if needed
    # filename_noextension: str = None # Replaced by filenamenoext
    copy: bool = False
    gentape: bool = False
    makebin: bool = False
    binfile: str = None
    pcadd: str = None
    sysvars: str = None
    origin_pos: int = None
    arch: str = None
    no_nex: bool = False
    module: str = None
    master: str = None
    check_cmd: bool = False
    cmd_: str = None
    hdf_: str = ""
    copy_hdf: str = None
    sp: int = None
    pc: int = None
    binary_size: str = None
    nex_size: str = None
    nosys: bool = False
    nosp: bool = False
    opt: int = 0
    nb_template: str = None  # Added for NextBASIC loader template
    nb_params: dict = None   # Added for NextBASIC loader parameters
# --- END NEW ---

# Function to read configuration file
def read_config(config_path):
    config = {}
    if os.path.exists(config_path):
        print(f"Reading configuration from: {config_path}")
        with open(config_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                # Parse key=value pairs
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    else:
        print(f"Configuration file not found: {config_path}")
    return config

# Path to the configuration file
# CONFIG_PATH = os.path.join(SCRIPTS_DIR, 'nextbuild.config')
# Determine config file path
CONFIG_PATH = args.config if args.config else os.path.join(SCRIPTS_DIR, 'nextbuild.config')

# Read configuration
CONFIG = read_config(CONFIG_PATH)

# Set up environment with proper Python paths
def setup_environment():
    """Set up the environment for running nextbuild.py"""
    # Get the zxbasic directory from config (fix double zxbasic path if needed)
    zxbasic_path = CONFIG.get('ZXBASIC', 'zxbasic')

    # Check if the path has a double "zxbasic" issue
    if "zxbasic\\zxbasic" in zxbasic_path:
        # Fix the path to use only one level
        zxbasic_path = "zxbasic"

    zxbasic_dir = os.path.abspath(os.path.join(BASE_DIR, zxbasic_path))

    # Add all necessary directories to sys.path
    src_dir = os.path.join(zxbasic_dir, 'src')
    lib_dir = os.path.join(zxbasic_dir, 'src', 'arch', 'zxnext', 'library')
    tools_dir = os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('TOOLS', 'Tools')))

    # Add all required directories to sys.path
    dirs_to_add = [
        zxbasic_dir,
        src_dir,
        lib_dir,
        SCRIPTS_DIR,
        tools_dir
    ]

    for directory in dirs_to_add:
        if directory not in sys.path and os.path.exists(directory):
            sys.path.append(directory)

    return CONFIG

# Set up all necessary paths before doing any imports
setup_environment()

# Set up paths with configuration values or defaults
EMU_DIR = '"' + os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('CSPECT', 'Emu/CSpect'))) + '"'
ZXBASIC_DIR = os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('ZXBASIC', 'zxbasic')))
TOOLS_DIR = os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('TOOLS', 'Tools')))
IMG_FILE = os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('IMG_FILE', 'Files/2GB.img')))
HDFMONKEY = os.path.abspath(os.path.join(BASE_DIR, CONFIG.get('HDFMONKEY', 'Tools/hdfmonkey.exe')))

LIB_DIR = os.path.join(ZXBASIC_DIR, 'src/arch/zxnext/library')
SRC_DIR = os.path.join(ZXBASIC_DIR, 'src')

# Default settings from config or hardcoded defaults
DEFAULT_HEAP = CONFIG.get('DEFAULT_HEAP', '4768')
DEFAULT_ORG = CONFIG.get('DEFAULT_ORG', '32768')
DEFAULT_OPTIMIZE = CONFIG.get('DEFAULT_OPTIMIZE', '3')

# Terminal colors
RESET = '\033[0m'
BOLD = '\033[1m'
RED = '\033[31m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
BLUE = '\033[34m'
MAGENTA = '\033[35m'
CYAN = '\033[36m'

##from shutil import copyfile
try:
    # First try importing from src.zxbc (newer ZX BASIC versions)
    from src.zxbc import zxbc # type: ignore
    from src.zxbc import version # type: ignore
except ImportError:
    # If that fails, try importing directly (older ZX BASIC versions)
    try:
        import zxbc # type: ignore
        try:
            import version # type: ignore
        except ImportError:
            # Create a dummy version if not found
            class DummyVersion:
                VERSION = "Unknown"
            import sys
            sys.modules['version'] = DummyVersion()

    except ImportError:
        print("Error: Could not import zxbc module from either src.zxbc or directly.")
        print("Please check your zxbasic installation.")
        sys.exit(1)

try:
    from tools import nextcreator # type: ignore
except ImportError:
    # If not found in zxbasic/tools, try the Tools directory instead
    sys.path.append(os.path.join(BASE_DIR, 'Tools'))
    try:
        import nextcreator # type: ignore
    except ImportError:
        print("Error: Could not import nextcreator module.")
        print("Please check your Tools directory.")
        sys.exit(1)

from datetime import datetime
try:
    import txt2nextbasic # type: ignore
except ImportError:
    # If txt2nextbasic is not found, create a dummy module
    class DummyTxt2NextBasic:
        def convert(self, *args, **kwargs):
            print("Warning: txt2nextbasic module not found. txt2bas conversion not supported.")
            return None

    # Create a module and add it to sys.modules
    import sys
    sys.modules['txt2nextbasic'] = DummyTxt2NextBasic()

import time
import glob
import shutil
import argparse

global heap, orgfound, destinationfile, createasm, headerless, optimize, org, head_file, inputfile ,autostart, nextzxos
global filename_path,filename_extension,filename_noextension,copy,gentape,makebin,binfile,pcadd,sysvars, arch, no_nex, check_cmd, cmd_
global module, master, runmaster, defines, date_define, hdf_, copy_hdf, filenamenoext

print(f"--- Using zxbc from: {zxbc.__file__} ---")


start=datetime.now()


# Check if version flag was specified
if hasattr(args, 'version') and args.version:
    print(f"Python version: {sys.version}")
    print(f"ZX Basic version: {version.VERSION}")
    print(f"Platform: {sys.platform}")
    sys.exit(0)

# Check if input file was provided
if not args.file:
    print(f"{RED}No input file specified. Use -b to specify an input .bas file.{RESET}")
    parser.print_help()
    sys.exit(1)

inputfile_arg = args.file.strip("'")
# --- NEW ---
# Get the absolute path of the input file IMMEDIATELY
# This assumes input paths are relative to the CWD when the script is launched
# (which you mentioned is typically ./Sources from the workspace root)
initial_cwd = os.getcwd() # Store the CWD at script launch
abs_inputfile = os.path.abspath(os.path.join(initial_cwd, inputfile_arg))

# Check if the absolute path exists
if not os.path.isfile(abs_inputfile):
    # If not found relative to CWD, try relative to BASE_DIR (project root)
    # This handles cases where the script might be called differently
    alt_inputfile = os.path.abspath(os.path.join(BASE_DIR, inputfile_arg))
    if os.path.isfile(alt_inputfile):
        abs_inputfile = alt_inputfile
    else:
        # If still not found, check if the original argument was already absolute
        if os.path.isfile(inputfile_arg):
             abs_inputfile = os.path.abspath(inputfile_arg) # Ensure it's clean absolute
        else:
            print(f"{RED}Error: Input file not found: {inputfile_arg}")
            print(f"Checked relative to CWD ({initial_cwd}): {os.path.join(initial_cwd, inputfile_arg)}")
            print(f"Checked relative to BASE_DIR ({BASE_DIR}): {os.path.join(BASE_DIR, inputfile_arg)}")
            if inputfile_arg != os.path.abspath(inputfile_arg): # Check if it looked absolute
                 print(f"Checked absolute path: {inputfile_arg}")
            sys.exit(1)

abs_inputdir = os.path.dirname(abs_inputfile)
inputfile_basename = os.path.basename(abs_inputfile)

# Update state with absolute paths
state = ParserState(inputfile=abs_inputfile) # Store absolute path
state.input_dir = abs_inputdir # Store absolute directory (NEW field needed in ParserState)
state.input_basename = inputfile_basename # Store just the name (NEW field)
state.filenamenoext = os.path.splitext(inputfile_basename)[0] # Store name without ext (NEW field)
# --- END NEW ---

# show info
if args.quiet == 0:
    print(f"{GREEN}==============================================================================================={RESET}")
    print(f"NextBuild v9.0    : David Saphier / em00k - 01-Jul-2025      https://github.com/em00k/NextBuild")
    print(f"ZX Basic Compiler : Jose Rodriguez                               https://zxbasic.readthedocs.io")
    print(f"Cspect Emulator   : Mike Dailly                                   https://mdf200.itch.io/cspect")
    print(f"{GREEN}==============================================================================================={RESET}")

    print(f"Input File   : {CYAN}{abs_inputfile}{RESET}") # Show absolute path
    print(f"Input Dir    : {CYAN}{abs_inputdir}{RESET}") # Show absolute dir
    print(f"Project Root : {CYAN}{BASE_DIR}{RESET}")
    print("")

# Add the input directory to sys.path if needed for local imports within the .bas file's project
if abs_inputdir not in sys.path:
     sys.path.append(abs_inputdir)

copy = 0                                        # for setting up copying to another location
heap = DEFAULT_HEAP                             # default heap from config
orgfound = 0
destinationfile = ""
createasm=0
headerless = 0
optimize = DEFAULT_OPTIMIZE                     # default optimize from config
bmpfile = None
noemu = 0
nextzxos = 0
makebin = 0
no_nex = 0
check_cmd = 0
module = args.modules
gentape = args.tape
autostart = 1
filename_path = ""
master = ""
cmd_ = ""
filename_extension = ""
filename_noextension = ""
pcadd = DEFAULT_ORG                             # default org from config
org = DEFAULT_ORG                               # default org from config
arch = "--arch=zxnext"
sysvars = 0
copy_hdf = 0
hdf_ = ""

# We already set state.filenamenoext, state.input_basename, state.input_dir
# filename_extension = os.path.splitext(state.input_basename)[1] # If needed

number_pattern = r"(\$[0-9A-Fa-f]+|0x[0-9A-Fa-f]+|\d+)"

directive_patterns = {
    'org': re.compile(r"'!org=" + number_pattern),
    'heap': re.compile(r"'!heap=" + number_pattern),
    'optimize': re.compile(r"'!opt=" + number_pattern),
    'module': re.compile(r"'!module=(\w+)"),
    'noemu': re.compile(r"'!noemu"),
    'docopy': re.compile(r"'!copy=(.+)"),
    'doasm': re.compile(r"'!asm"),
    'nosys': re.compile(r"'!nosys"),
    'nosp': re.compile(r"'!nosp"),
    'pc': re.compile(r"'!pc=" + number_pattern),
    'sp': re.compile(r"'!sp=" + number_pattern),
    'bmp': re.compile(r"'!bmp=(.+)"),
    'bin': re.compile(r"'!bin=(\w+)"),
    'hdf': re.compile(r"'!hdf=(\w+)"),
    'origin': re.compile(r"'!origin=(.+)"),
    'exe': re.compile(r"'!exe=(.+)"),  # Added exe pattern
    'nb': re.compile(r"'!nb=([a-zA-Z0-9_]+)(?:\(([^)]*)\))?")  # Added nb pattern with optional parameters
}

# procs

def CheckForBasic():
    # was ther file a .bas?
    # global filenamenoext # Should use state
    # Get the file extension from the basename stored in state
    try:
        extension = os.path.splitext(state.input_basename)[1].lower()
    except AttributeError:
        print(f"{RED}Error: State object not properly initialized before CheckForBasic.{RESET}")
        sys.exit(1)

    if extension == '.bas':
        #print("basic file")
        basic = True
    else:
        print(f"{RED}Not a basic file - ERROR{RESET}")
        sys.exit(1)

    # Check against the basename stored in state
    if state.input_basename.lower() == "nextlib.bas":
        print(f"{RED}Do you really want to compile nextlib.bas?{RESET}")
        sys.exit(1)

def GenerateLoader():
    if makebin == 1:
        # we are making a bin not nex
        print('Making a bin')
        ext = '.bin'
        #txt2nextbasic.b_makebin = 1
        outfile = os.path.split(binfile)
        outfilenoext = outfile[1].split('.')[1-1]
        print(outfilenoext)
    else:
        if state.no_nex == 1:
            print("Do not create NEX")
            return
        else:
            ext = '.nex'
            txt2nextbasic.b_makebin = 0
            outfilenoext = filenamenoext
            ParseNEXCfg()
            CreateNEXFile()

    txt2nextbasic.b_name = outfilenoext+ext              # filename of basic file
    txt2nextbasic.b_start = int(org)

    if autostart == 1:
        txt2nextbasic.b_auto = 1                 # filename of basic file
        txt2nextbasic.b_loadername = 'autoexec.bas'              # filename of basic file
        txt2nextbasic.main()
        # copies the autoexec.bas
        if nextzxos == 1:
            subprocess.run([EMU_DIR+'/hdfmonkey.exe','put','/CSpect/cspect-next-2gb.img','autoexec.bas','/nextzxos/autoexec.bas'])
    else:
        txt2nextbasic.b_auto = 0

    print("BAS created OK! All done.")

    if makebin == 1:
        loaderfile = filenamenoext+'loader.bas'

        txt2nextbasic.b_loadername = loaderfile              # filename of basic file
        txt2nextbasic.b_auto = 0
        txt2nextbasic.main()

        subprocess.run([EMU_DIR+'/hdfmonkey.exe','put','/CSpect/cspect-next-2gb.img',loaderfile,'/'+loaderfile])

    subprocess.run([EMU_DIR+'/hdfmonkey.exe','put','/CSpect/cspect-next-2gb.img',outfilenoext+ext,'/'+outfilenoext+ext])

    if state.noemu == 0:
        map_file = os.path.join('build', filenamenoext + '.bas.map')
        subprocess.Popen([EMU_DIR+'/launchnextzxos.bat', map_file, EMU_DIR])

def sync_to_hdf(state):
    """Copy compiled files (NEX/BIN and loader) to HDF image for emulator with enhanced sync control."""

    # Determine target HDF directory path
    target_hdf_dir_raw = state.nb_params.get('dir') if state.nb_params else None
    if not target_hdf_dir_raw:
        # Fallback to !hdf directive if !nb=(dir=...) is not set
        target_hdf_dir_raw = state.hdf_ if state.hdf_ else None

    if not target_hdf_dir_raw:
        # print(f"{YELLOW}Skipping HDF sync: No target directory specified via !nb=(dir=...) or !hdf= directive.{RESET}")
        return

    # --- Determine sync mode ---
    sync_mode = state.nb_params.get('sync', 'all') if state.nb_params else 'all'
    selected_files = []
    if sync_mode == 'selective' and state.nb_params and 'files' in state.nb_params:
        selected_files = [f.strip() for f in state.nb_params['files'].split(',')]

    # Auto-detect module projects for intelligent sync defaults
    is_module_project = (
        state.filenamenoext.lower() == 'master' or
        state.input_basename.lower().startswith('module') or
        sync_mode == 'modules' or
        (sync_mode == 'all' and _has_module_files(state))
    )

    if is_module_project and sync_mode == 'all':
        sync_mode = 'modules'  # Auto-upgrade to module mode
        print(f"{CYAN}Auto-detected module project, using sync=modules{RESET}")

    print(f"{YELLOW}Syncing files to HDF target directory: {CYAN}{target_hdf_dir_raw}{RESET} (mode: {CYAN}{sync_mode}{RESET})")

    # --- Clean the target HDF directory path ---
    # Remove potential drive prefix like C:
    if ":" in target_hdf_dir_raw:
        target_hdf_dir_raw = target_hdf_dir_raw.split(":", 1)[1]
    # Ensure it uses forward slashes
    target_hdf_dir_clean = target_hdf_dir_raw.replace('\\', '/')
    # Ensure it starts with / and doesn't end with / unless it's just "/"
    if not target_hdf_dir_clean.startswith('/'):
        target_hdf_dir_clean = '/' + target_hdf_dir_clean
    if target_hdf_dir_clean != '/' and target_hdf_dir_clean.endswith('/'):
        target_hdf_dir_clean = target_hdf_dir_clean[:-1]
    # --- End Path Cleaning ---

    # --- Check HDF tools ---
    if not os.path.exists(IMG_FILE):
        print(f"{RED}HDF image file not found: {IMG_FILE}{RESET}")
        return
    if not os.path.exists(HDFMONKEY):
        print(f"{RED}hdfmonkey tool not found: {HDFMONKEY}{RESET}")
        return
    # --- End Checks ---

    # --- Ensure target directory exists ---
    _ensure_hdf_dir(target_hdf_dir_clean)

    # --- Perform sync based on mode ---
    _sync_main_file(state, target_hdf_dir_clean)
    _sync_loader_file(state, target_hdf_dir_clean)

    if sync_mode == 'nex':
        print(f"{CYAN} - Sync mode 'nex': Skipping data directory sync{RESET}")
    elif sync_mode == 'modules':
        _sync_module_files(state, target_hdf_dir_clean)
    elif sync_mode == 'selective':
        _sync_selective_files(state, target_hdf_dir_clean, selected_files)
    else:  # sync_mode == 'all'
        _sync_all_data_files(state, target_hdf_dir_clean)

def _has_module_files(state):
    """Check if the project has Module*.bin files in the data directory."""
    local_data_dir = os.path.join(state.input_dir, 'data')
    if not os.path.isdir(local_data_dir):
        return False

    for item in os.listdir(local_data_dir):
        if item.lower().startswith('module') and item.lower().endswith('.bin'):
            return True
    return False

def _run_hdf_copy(src_abs, hdf_dest):
    """Helper function to copy a single file to HDF image."""
    if not src_abs or not os.path.exists(src_abs):
        print(f"{RED} - Source file not found, cannot copy to HDF: {src_abs}{RESET}")
        return False
    try:
        cmd = f'"{HDFMONKEY}" put "{IMG_FILE}" "{src_abs}" "{hdf_dest}"'
        print(f" {YELLOW}Executing: {CYAN}{cmd}{RESET}")
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f" {GREEN}- Copied {os.path.basename(src_abs)} to HDF:{hdf_dest} successfully{RESET}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{RED} - Failed HDF copy: {os.path.basename(src_abs)} -> HDF:{hdf_dest}{RESET}")
        print(f"{RED}   hdfmonkey stderr: {e.stderr.strip()}{RESET}")
        return False
    except Exception as e:
        print(f"{RED} - Error during HDF copy ({os.path.basename(src_abs)}): {str(e)}{RESET}")
        return False

def _sync_main_file(state, target_hdf_dir_clean):
    """Sync the main NEX or BIN file to HDF."""
    main_source_abs = None
    main_target_name = None

    if state.makebin:
        # .bin file gets moved to build directory by CreateNEXFile
        main_target_name = f"{state.filenamenoext}.bin"
        main_source_abs = os.path.join(state.input_dir, "build", main_target_name)
    elif not state.no_nex:
        # .nex file is NOT moved to build directory
        main_target_name = f"{state.filenamenoext}.nex"
        main_source_abs = os.path.join(state.input_dir, main_target_name)
    else:
        print(f"{YELLOW} - Skipping main file HDF sync (!no_nex=True, !makebin=False).{RESET}")
        return

    if main_source_abs and main_target_name:
        main_hdf_target_path = f"{target_hdf_dir_clean}/{main_target_name}"
        _run_hdf_copy(main_source_abs, main_hdf_target_path)
    else:
        print(f"{YELLOW} - Skipping main file HDF copy (no source file determined).{RESET}")

def _sync_loader_file(state, target_hdf_dir_clean):
    """Sync the generated loader file to HDF."""
    if not state.nb_template:
        return

    loader_target_name = f"{state.filenamenoext}_loader.bas"
    loader_source_abs = os.path.join(state.input_dir, loader_target_name)

    if not os.path.exists(loader_source_abs):
        print(f"{YELLOW} - Skipping loader file HDF copy (source not found): {loader_source_abs}{RESET}")
        return

    # Determine loader target path on HDF
    loader_hdf_target_path = None
    copy_dest_raw = state.nb_params.get('copy') if state.nb_params else None

    if copy_dest_raw:
        # Use the specified copy destination
        if ":" in copy_dest_raw:
            copy_dest_raw = copy_dest_raw.split(":", 1)[1]
        loader_hdf_target_path = copy_dest_raw.replace('\\', '/')
        if not loader_hdf_target_path.startswith('/'):
            loader_hdf_target_path = '/' + loader_hdf_target_path
        print(f" - Loader target HDF path (from copy): {loader_hdf_target_path}")
    elif state.nb_template and "autostart" in state.nb_template.lower():
        # Autostart goes to standard location
        loader_hdf_target_path = "/nextzxos/autoexec.bas"
        print(f" - Loader target HDF path (template implies autostart): {loader_hdf_target_path}")
    else:
        # Default: put it in the same directory as the main file
        loader_hdf_target_path = f"{target_hdf_dir_clean}/{loader_target_name}"
        print(f" - Loader target HDF path (default): {loader_hdf_target_path}")

    _run_hdf_copy(loader_source_abs, loader_hdf_target_path)

def _sync_module_files(state, target_hdf_dir_clean):
    """Sync only Module*.bin files to HDF."""
    local_data_dir = os.path.join(state.input_dir, 'data')
    if not os.path.isdir(local_data_dir):
        print(f"{YELLOW} - Local 'data' directory not found, skipping module sync: {local_data_dir}{RESET}")
        return

    hdf_data_dir = f"{target_hdf_dir_clean}/data"
    _ensure_hdf_data_dir(hdf_data_dir)

    module_files = []
    for item in os.listdir(local_data_dir):
        local_item_path = os.path.join(local_data_dir, item)
        if os.path.isfile(local_item_path) and item.lower().startswith('module') and item.lower().endswith('.bin'):
            module_files.append(item)
            hdf_item_path = f"{hdf_data_dir}/{item}"
            _run_hdf_copy(local_item_path, hdf_item_path)

    if module_files:
        print(f"{GREEN} - Synced {len(module_files)} module files: {', '.join(module_files)}{RESET}")
    else:
        print(f"{YELLOW} - No Module*.bin files found in data directory{RESET}")

def _sync_selective_files(state, target_hdf_dir_clean, selected_files):
    """Sync only specified files to HDF."""
    if not selected_files:
        print(f"{YELLOW} - No files specified for selective sync{RESET}")
        return

    local_data_dir = os.path.join(state.input_dir, 'data')
    if not os.path.isdir(local_data_dir):
        print(f"{YELLOW} - Local 'data' directory not found, skipping selective sync: {local_data_dir}{RESET}")
        return

    hdf_data_dir = f"{target_hdf_dir_clean}/data"
    _ensure_hdf_data_dir(hdf_data_dir)

    synced_files = []
    for filename in selected_files:
        local_item_path = os.path.join(local_data_dir, filename)
        if os.path.isfile(local_item_path):
            hdf_item_path = f"{hdf_data_dir}/{filename}"
            if _run_hdf_copy(local_item_path, hdf_item_path):
                synced_files.append(filename)
        else:
            print(f"{RED} - Selected file not found: {filename}{RESET}")

    if synced_files:
        print(f"{GREEN} - Synced {len(synced_files)} selected files: {', '.join(synced_files)}{RESET}")

def _sync_all_data_files(state, target_hdf_dir_clean):
    """Sync all files from data directory to HDF (original behavior)."""
    local_data_dir = os.path.join(state.input_dir, 'data')
    if not os.path.isdir(local_data_dir):
        print(f"{YELLOW} - Local 'data' directory not found, skipping data sync: {local_data_dir}{RESET}")
        return

    hdf_data_dir = f"{target_hdf_dir_clean}/data"
    _ensure_hdf_data_dir(hdf_data_dir)

    print(f"{YELLOW}Syncing all files from {local_data_dir} to HDF:{hdf_data_dir}{RESET}")
    synced_count = 0
    for item in os.listdir(local_data_dir):
        local_item_path = os.path.join(local_data_dir, item)
        if os.path.isfile(local_item_path):
            hdf_item_path = f"{hdf_data_dir}/{item}"
            if _run_hdf_copy(local_item_path, hdf_item_path):
                synced_count += 1

    print(f"{GREEN} - Synced {synced_count} data files{RESET}")

def _ensure_hdf_dir(hdf_dir):
    """Ensure the target directory exists on the HDF image."""
    try:
        mkdir_cmd = f'"{HDFMONKEY}" mkdir "{IMG_FILE}" "{hdf_dir}"'
        result = subprocess.run(mkdir_cmd, shell=True, capture_output=True, text=True)
        if result.returncode not in [0, 1, 255]:  # 0=created, 1=exists, 255=already exists
            print(f"{RED} - Failed creating HDF target directory: {hdf_dir}{RESET}")
            print(f"{RED}   hdfmonkey stderr: {result.stderr.strip()}{RESET}")
            return False
        return True
    except Exception as e:
        print(f"{RED} - Error during HDF mkdir for target directory ({hdf_dir}): {str(e)}{RESET}")
        return False

def _ensure_hdf_data_dir(hdf_data_dir):
    """Ensure the data directory exists on the HDF image."""
    try:
        mkdir_cmd = f'"{HDFMONKEY}" mkdir "{IMG_FILE}" "{hdf_data_dir}"'
        result = subprocess.run(mkdir_cmd, shell=True, capture_output=True, text=True)
        if result.returncode not in [0, 1, 255]:  # 0=created, 1=exists, 255=already exists
            print(f"{RED} - Failed creating HDF data directory: {hdf_data_dir}{RESET}")
            print(f"{RED}   hdfmonkey stderr: {result.stderr.strip()}{RESET}")
    except Exception as e:
        print(f"{RED} - Error during HDF mkdir for data directory ({hdf_data_dir}): {str(e)}{RESET}")

def CreateNEXFile():
    if state.no_nex:
        # Construct absolute path for .bin file
        bin_filepath = os.path.join(state.input_dir, state.filenamenoext + '.bin')
        if not os.path.exists(bin_filepath):
            print(f"{RED}ERROR: Binary file not found for size calculation: {bin_filepath}{RESET}")
            return
        file_size = os.path.getsize(bin_filepath)
        percent = (file_size * 100) / 32000
        print(f"BIN filesize :  {GREEN}{file_size}b{RESET} - {YELLOW}{percent:.2f}%{RESET} of 32000b available")
        return
    else:
        try:
            # Store the original CWD
            original_cwd = os.getcwd()
            # print(f"--- DEBUG: Original CWD: {original_cwd} ---") # Remove debug
            # Change CWD to the input directory where the cfg file is located
            os.chdir(state.input_dir)
            # print(f"--- DEBUG: Changed CWD to: {state.input_dir} ---") # Remove debug

            print("====================================================")
            # Construct relative paths for cfg and nex files (relative to new CWD)
            cfg_relpath = state.filenamenoext + '.cfg'
            nex_relpath = state.filenamenoext + '.nex'
            bin_relpath = state.filenamenoext + '.bin'
            map_relpath = os.path.join('build', state.filenamenoext + '.bas.map')  # Map is in build dir
            compile_log_relpath = 'Compile.txt'

            print(f"{YELLOW}Generating NEX : {CYAN}{nex_relpath}{RESET}")
            nextcreator.parse_file(cfg_relpath) # Use relative path
            nextcreator.generate_file(nex_relpath) # Use relative path
            print(f"\n{RESET}Compile Log  :  {MAGENTA}{compile_log_relpath}{RESET}")
            print(f"Memory Log   :  {MAGENTA}{map_relpath}{RESET}\n")

            working_space_left = 65536 - parse_number(state.org)

            if not os.path.exists(bin_relpath):
                 print(f"{RED}ERROR: Binary file not found for size calculation: {bin_relpath}{RESET}")
                 # Restore CWD before exiting
                 os.chdir(original_cwd)
                 # print(f"--- DEBUG: Restored CWD to: {original_cwd} ---") # Remove debug
                 return
            file_size = os.path.getsize(bin_relpath) # Use relative path

            percent = (file_size * 100) / working_space_left

            space_left = working_space_left - file_size

            org_plus_file_size = parse_number(state.org) + file_size

            # print space meter
            percent_text = display_gauge_simple(percent)

            print(f"BIN filesize :\t{GREEN}{file_size} bytes{RESET} - {percent_text}"
            f" Used of {GREEN}{working_space_left} bytes{RESET}, \n\r\t\t{GREEN}{space_left} bytes{RESET} Free"
            f" ({GREEN}{file_size / 1024:.2f}KB{RESET} Used/{GREEN}{space_left / 1024:.2f}KB{RESET} Free)")

            if not os.path.exists(nex_relpath):
                print(f"{RED}ERROR: NEX file not found for size calculation: {nex_relpath}{RESET}")
                # Restore CWD before exiting
                os.chdir(original_cwd)
                # print(f"--- DEBUG: Restored CWD to: {original_cwd} ---") # Remove debug
                return
            nex_file_size = os.path.getsize(nex_relpath) # Use relative path

            print(f"NEX filesize :  {GREEN}{nex_file_size} bytes{RESET} ({nex_file_size / 1024:.2f}KB)")
            print(f"Total Size   :  {GREEN}ORG : {state.org} + SIZE : {file_size} = {org_plus_file_size} END{RESET}")


            print(f"{BOLD}{GREEN}NEX created OK! All done.{RESET}")

            # --- Move intermediate files to build subdirectory ---
            try:
                build_dir = os.path.join(os.getcwd(), "build") # CWD is state.input_dir here
                os.makedirs(build_dir, exist_ok=True)
                print(f"{YELLOW}Moving intermediate files to: {build_dir}{RESET}")

                files_to_move = {
                    bin_relpath: "Binary",
                    cfg_relpath: "Config"
                    # map file is already created directly in build dir, no need to move
                    # compile_log_relpath: "Compile Log" # Optionally move this too
                }

                for src_rel, file_type in files_to_move.items():
                    src_path = os.path.join(os.getcwd(), src_rel) # Use getcwd() which is input_dir
                    dest_path = os.path.join(build_dir, src_rel)
                    if os.path.exists(src_path):
                    #    print(f" - Moving {file_type} ({src_rel})...", end='')
                        shutil.move(src_path, dest_path)
                    #    print(f"{GREEN}OK{RESET}")
                    else:
                        print(f" - {YELLOW}Skipping missing {file_type} file: {src_path}{RESET}")

            except Exception as move_err:
                print(f"{RED}ERROR moving intermediate files: {str(move_err)}{RESET}")
            # --- End move ---

        except Exception as e:
            print(f"{RED}ERROR creating NEX file! {str(e)}{RESET}")
            # Ensure CWD is restored even on error
            if 'original_cwd' in locals() and os.getcwd() != original_cwd:
                os.chdir(original_cwd)
                # print(f"--- DEBUG: Restored CWD after error to: {original_cwd} ---") # Remove debug
            sys.exit(1)
        finally:
            # Ensure CWD is always restored
            if 'original_cwd' in locals() and os.getcwd() != original_cwd:
                os.chdir(original_cwd)
                # print(f"--- DEBUG: Restored CWD in finally block to: {original_cwd} ---") # Remove debug

def display_gauge_simple(percentage):

        if percentage >= 99:
            percent_text = f"{RED}{percentage:.2f}% {BOLD}WARNING {RESET}"
        elif percentage > 90:
            percent_text = f"{RED}{percentage:.2f}% {RESET}"
        elif percentage >= 60:
            percent_text = f"{YELLOW}{percentage:.2f}%{RESET}"
        elif percentage <= 60:
            percent_text = f"{GREEN}{percentage:.2f}%{RESET}"


        total_slots = 16
        filled_slots = int((percentage / 100) * total_slots)
        empty_slots = total_slots - filled_slots

        filled_bar = '#' * filled_slots
        empty_bar = '-' * empty_slots

        # print(f"{CYAN}[{YELLOW}{filled_bar}{GREEN}{empty_bar}{CYAN}] {percent_text}")
        return (f"{CYAN}[{YELLOW}{filled_bar}{GREEN}{empty_bar}{CYAN}] {percent_text}")

def ParseNEXCfg():
    if state.module == 1:
        print("Module compilation - skipping NEX config generation")

        # Show module size analysis
        print("====================================================")
        bin_filepath = os.path.join(state.input_dir, state.filenamenoext + '.bin')
        if os.path.exists(bin_filepath):
            file_size = os.path.getsize(bin_filepath)

            # Module memory layout: $6000 to $DD00 (24576 to 56576 = 32000 bytes available)
            module_start = 24576  # $6000
            module_end = 56576    # $DD00
            module_space = 32000  # Available space for modules

            percent = (file_size * 100) / module_space
            space_left = module_space - file_size

            # Print module size analysis
            percent_text = display_gauge_simple(percent)

            print(f"BIN filesize :\t{GREEN}{file_size} bytes{RESET} - {percent_text}"
                  f" Used of {GREEN}{module_space} bytes{RESET}, \n\r\t\t{GREEN}{space_left} bytes{RESET} Free"
                  f" ({GREEN}{file_size / 1024:.2f}KB{RESET} Used/{GREEN}{space_left / 1024:.2f}KB{RESET} Free)")
            print(f"Module Range :  {GREEN}${module_start:04X} to ${module_end:04X}{RESET} ({GREEN}{module_space} bytes{RESET} available)")
            print(f"Module End   :  {GREEN}${module_start:04X} + {file_size} = ${module_start + file_size:04X}{RESET}")

            print(f"{BOLD}{GREEN}Module compiled OK! All done.{RESET}")
        else:
            print(f"{RED}ERROR: Module binary file not found: {bin_filepath}{RESET}")

        return

    CRLF = "\r\n"
    print("====================================================")
    print(f"{YELLOW}Generating Nexcreator Config ...{RESET}")
    print("")

    # default top lines
    outstring = "; Built with NextBuild " + CRLF
    outstring += "!COR3,0,0" + CRLF
    # we include sysvars
    if state.nosys == False:
        # Always use BASE_DIR/Tools/sysvars.bin regardless of current directory structure
        sysvars_abs_path = os.path.join(BASE_DIR, 'Tools', 'sysvars.bin')
        sysvars_rel_path = os.path.relpath(sysvars_abs_path, state.input_dir)
        # Ensure path uses forward slashes for cfg
        sysvars_rel_path_cfg = sysvars_rel_path.replace('\\', '/')
        print(f"Adding sysvars using path: {sysvars_rel_path_cfg}")

        # Check if we need to go up directories (contains ..)
        if '..' in sysvars_rel_path_cfg:
            # Path goes up from input dir - no ./ prefix needed
            mmu_path_prefix = ""
        else:
            # Path goes down from input dir - add ./ prefix
            mmu_path_prefix = "./"

        outstring += f"!MMU{mmu_path_prefix}{sysvars_rel_path_cfg},10,$1C00" + CRLF
    else:
        print(f"Not adding sysvars")

    defaultpc = parse_number(state.org)

    # Add !BMP8 directive if bmpfile is specified
    if state.bmpfile != None:
        # Assume bmpfile path needs resolving relative to input directory's data folder
        bmp_abs_path = os.path.abspath(os.path.join(state.input_dir, state.bmpfile))
        bmp_abs_path = bmp_abs_path.replace('\\', '/') # Use forward slashes
        print(f"Adding BMP from: {bmp_abs_path}")
        outstring += f'!BMP8{bmp_abs_path},0,0,0,0,255' + CRLF

    try:
        # Scan the input file ONLY for loadsdbank directives
        with open(state.inputfile, 'rt') as f:
            lines = f.read().splitlines()
            trimmed = 0
            for x in lines:
                # replace any brackets with commas so we can do string split
                x_mod = x.replace(")", ",").replace("(", ",")
                # convert to lower case so xl.find() will be case insensitive
                xl = x_mod.lower().strip()
                # look for SD command
                ldsd_pos = xl.find("loadsdbank,")
                if ldsd_pos != -1:
                    # if it isnt the main SUB or a commented out line
                    if xl.find("sub") == -1 and xl[0] != "'":
                        # get the filename + add the data path
                        partname = x_mod.split('"')[1] # Index 1 for filename in quotes
                        # Construct path relative to the input file's directory
                        # filename = os.path.join(state.input_dir, "data", partname)

                        # --- NEW: Handle [] prefix for system_data ---
                        is_system_file = False
                        actual_filename = partname
                        if partname.startswith('[]'):
                            is_system_file = True
                            actual_filename = partname[2:]
                            # Host path to check existence
                            filename = os.path.abspath(os.path.join(BASE_DIR, 'Scripts', 'system_data', actual_filename))
                            print(f"System file specified: {partname} -> {filename}")
                        else:
                            # Original logic: file relative to project's data dir
                            filename = os.path.abspath(os.path.join(state.input_dir, "data", partname))
                        # --- END NEW ---

                        try:
                            # Check if the constructed absolute path exists
                            # Read bank content first to get size info if needed
                            with open(filename, 'rb') as bank_f: # Open in binary for size/trimming
                                bank_content = bank_f.read()

                            # and load address in bank
                            parts = x_mod.split(',')
                            offset_str = parts[2].strip() # Index 2 for offset
                            offset = offset_str.replace("$", "0x")
                            offval = parse_number(offset) & 0x1fff # Use parse_number

                            #offset from start of file
                            fileoffset_str = parts[4].strip() # Index 4 for file offset
                            fileoffset = parse_number(fileoffset_str)

                            # --- NEW: Check offset for system files ---
                            if is_system_file and fileoffset > 0:
                                print(f"{RED}##ERROR - File offset/trimming is not supported for system files (starting with []): {partname}{RESET}")
                                print(f"{RED}Referenced in: {x}{RESET}")
                                sys.exit(1)
                            # --- END NEW ---

                            #creates a trimmed copy of the bank
                            if fileoffset > 0:
                                print(f"File {partname} has an offset of : {fileoffset}")
                                new_file_content = bank_content[fileoffset:]
                                # Construct temporary file path relative to input dir's data folder
                                trimmed_filename_base = 'tr_'+actual_filename[:-4]+str(trimmed)+'.bnk' # Use actual_filename
                                trimmed_filepath = os.path.join(state.input_dir, "data", trimmed_filename_base)
                                with open(trimmed_filepath, 'wb') as f_trim:
                                    f_trim.write(new_file_content)
                                filename = trimmed_filepath # Update filename to use the trimmed one
                                print(f"Trimmed as : {filename}")
                                trimmed+=1
                            # else:
                                # If no offset, use the original filename path calculated earlier
                                # filename = os.path.join(state.input_dir, "data", partname) # This line is redundant now

                            # get the bank
                            bank_str = parts[5].strip() # Index 5 for bank
                            bank = parse_number(bank_str)

                            # Calculate relative path for CFG file
                            # filename holds the absolute path to the final file (original or trimmed)
                            filename_rel = os.path.relpath(filename, state.input_dir)
                            filename_cfg = filename_rel.replace('\\','/')

                            # add to our outstring
                            outstring += "; " + x + CRLF
                            # --- NEW: Adjust prefix based on path type ---
                            if filename_cfg.startswith('..'):
                                mmu_path_prefix = "" # Path is already relative upwards
                            else:
                                mmu_path_prefix = "./" # Path is relative downwards or same level
                            # Corrected f-string: remove extra braces around offval
                            outstring += f"!MMU{mmu_path_prefix}{filename_cfg},{bank},${offval:04X}" + CRLF
                            # --- END NEW ---

                        except (IOError, FileNotFoundError):
                            # Use the originally calculated filename for error message
                            error_path = os.path.abspath(os.path.join(BASE_DIR, 'Scripts', 'system_data', actual_filename)) if is_system_file else os.path.abspath(os.path.join(state.input_dir, "data", partname))
                            print(f"{RED}##ERROR - Failed to find or read bank file: {error_path}{RESET}")
                            if is_system_file:
                                print(f"{RED}Please make sure this file exists in the '/Scripts/system_data/' directory!{RESET}")
                            else:
                                print(f"{RED}Please make sure this file exists in the 'data' subdirectory of your project!{RESET}")
                            print(f"{RED}Referenced in: {x}{RESET}")
                            sys.exit(1)
                        except (IndexError, ValueError) as parse_err:
                            print(f"{RED}##ERROR - Failed to parse loadsdbank parameters: {x}{RESET}")
                            print(f"{RED}Error details: {parse_err}{RESET}")
                            sys.exit(1)

        # generate PC and SP for cfg
        if state.pc == None:
            print(f"No PC has been set so setting to ORG : {CYAN}{state.org}{RESET} ")
            state.pc = state.org
        else:
            # Ensure state.pc is a string before passing to parse_number if needed
            state.pc = str(state.pc)

        if state.sp == None:
            pc_val = parse_number(str(state.pc))
            if pc_val == 0:
                print(f"PC is 0 so setting SP to 0 : {CYAN}0{RESET} ")
                state.sp = 0
            else:
                state.sp = pc_val - 2
                print(f"No SP has been set so setting to PC-2 : {CYAN}{state.sp}{RESET} ")
        else:
            # Ensure state.sp is suitable for hex conversion if needed
            state.sp = parse_number(str(state.sp))

        pc = parse_number(str(state.pc))
        sp = state.sp # SP is already an int here

        outstring += f"!PCSP${pc:04X},${sp:04X}" + CRLF

        # Determine rambank based on ORG
        org_val = parse_number(str(state.org))
        rambank = "?"
        if 0x4000 <= org_val <= 0x7fff:
            rambank="5"
        elif 0x8000 <= org_val <= 0xbfff:
            rambank="2"
        elif 0xc000 <= org_val <= 0xffff:
            rambank="0"
        elif 0x0000 <= org_val <= 0x3fff:
            rambank="7"

        codestart = org_val % 0x4000

        # Use relative path for the main binary file (relative to cfg location)
        bin_rel_path = state.filenamenoext + ".bin"
        bin_rel_path_cfg = bin_rel_path.replace('\\','/') # Should not have slashes, but just in case

        # Prepend ./ for the main bin file relative to the cfg
        outstring += f"./{bin_rel_path_cfg},{rambank},${codestart:04X}" + CRLF

        # save config
        cfg_filepath = os.path.join(state.input_dir, state.filenamenoext + ".cfg")
        with open(cfg_filepath, 'wt') as f:
            f.write(outstring)
        print(f"{YELLOW}Saved config file : {cfg_filepath}{RESET}")

    except Exception as e:
        print(f"{RED}ERROR generating config file: {str(e)}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def parse_directives(state):
    # version 2

    # global inputfile, filenamenoext # These globals should not be needed here

    print(f"{YELLOW}Processing precompiler settings from .bas header!{RESET}")

    # These defaults should ideally be set when state is initialized, but ok here for now.
    # state.org="32768"
    state.nb_params = {}  # Initialize the nb_params dictionary

    # Initialize filenamenoext if it's not already set - This should be done when state is created.
    # if 'filenamenoext' not in globals() or filenamenoext is None:
    #     # Extract filename without extension
    #     base_name = os.path.basename(state.inputfile)
    #     filenamenoext = os.path.splitext(base_name)[0]
    #     print(f"Setting filename: {filenamenoext}")
    # state.filenamenoext = os.path.splitext(state.input_basename)[0] # Already set

    current_line = 0

    try:
        # Use the absolute input file path
        with open(state.inputfile, 'rt') as f:

            for line in f:

                current_line += 1
                if current_line > 64:
                    #print(f"{RED}Too many lines{RESET}")
                    break

                original_line = line.strip()
                line = line.strip().lower()
                # print(line)
                # Check for each directive using regex

                match = ""

                for key, pattern in directive_patterns.items():
                    match = pattern.search(line)
                    if match:

                        if key in ['org', 'heap']:
                            number_str = match.group(1)
                            number = parse_number(number_str)
                            setattr(state, key, number)  # Stores as integer
                            print(f"Found {key.upper():<7}:  {CYAN}{number}{RESET}")

                            if key == 'org':
                                state.orgfound = True
                                state.org = match.group(1)

                            if key == 'heap':
                                state.heap = match.group(1)
                                #print(f"Found HEAP   :  {GREEN}{state.heap}{RESET}")

                        elif key == 'optimize':
                            state.optimize = match.group(1)
                            print(f"Found OPT    :  {state.optimize}")

                        elif key == 'module':
                            state.module = True
                            print("Found MODULE directive")

                        elif key == 'hdf':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.hdf_ = original_match.group(1) if original_match else match.group(1)
                            print(f"Found HDF    :  {CYAN}{state.hdf_}{RESET}")

                        elif key == 'bmp':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.bmpfile = original_match.group(1) if original_match else match.group(1)
                            state.bmpfile = './data/'+state.bmpfile
                            print(f"Loading BMP  :  {CYAN}{state.bmpfile}{RESET}")

                        elif key == 'bin':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.makebin = original_match.group(1) if original_match else match.group(1)
                            print(f"Found {state.makebin} directive")

                        elif key == 'docopy':
                            # we are going to copy the file to the destination
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.makebin = original_match.group(1) if original_match else match.group(1)
                            #print(f"{YELLOW}Copy flag set{RESET}")
                            state.copy = 1
                            state.destinationfile = os.path.join(abs_inputdir,state.makebin)
                            print(f"CopyFlag Set :  {CYAN}{state.destinationfile}{RESET}")

                        elif key == 'nb':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.nb_template = original_match.group(1) if original_match else match.group(1)
                            print(f"Found NB     :  {CYAN}{state.nb_template}{RESET}")

                            # Parse parameters if present
                            if original_match and original_match.group(2):
                                params = original_match.group(2).split(',')
                                for param in params:
                                    if '=' in param:
                                        param_name, param_value = param.split('=', 1)
                                        state.nb_params[param_name.strip()] = param_value.strip()
                                        print(f"  - {param_name.strip()} = {param_value.strip()}")

                        elif key == 'cmd':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.cmd = original_match.group(1) if original_match else match.group(1)
                            print(f"Found {state.cmd} directive")
                        elif key == 'pc':
                            state.pc = match.group(1)
                            print(f"Found PC     :  {CYAN}{int(state.pc)}{RESET}")
                        elif key == 'sp':
                            state.sp = parse_number(match.group(1))
                            print(f"Found SP     :  {CYAN}{(state.sp)}{RESET}")

                        elif key == 'doasm':
                            state.createasm = True
                            print(f"Found ASM directive")

                        elif key == 'nosp':
                            state.nosp = True
                            print(f"Found NOSP")

                        elif key == 'nosys':
                            state.nosys = True
                            print(f"Found NOSYS")
                        # elif key == 'opt':
                        #     state.opt = match.group(1)
                        #     print(f"Found OPT directive")

                        elif key == 'noemu':
                            state.noemu = True
                            print(f"Found NOEMU")

                        elif key == 'exe':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            state.cmd_ = original_match.group(1) if original_match else match.group(1)
                            print(f"Found EXE    :  {CYAN}{state.cmd_}{RESET}")
                            state.check_cmd = True

                        elif key == 'origin':
                            # Re-match on original line to preserve case
                            original_match = pattern.search(original_line)
                            origin_file = original_match.group(1) if original_match else match.group(1)
                            origin_abs = os.path.abspath(os.path.join(state.input_dir, origin_file))
                            if os.path.exists(origin_abs):
                                print(f"Found ORIGIN: {CYAN}{origin_file}{RESET} - switching target")
                                # Update state to point to origin file instead
                                state.inputfile = origin_abs
                                state.input_dir = os.path.dirname(origin_abs)
                                state.input_basename = os.path.basename(origin_abs)
                                state.filenamenoext = os.path.splitext(state.input_basename)[0]
                                break  # Stop parsing current file, will use origin

                        # Handle other directives similarly



    except FileNotFoundError:
        # This should ideally not happen now if initial path check works
        print(f"{RED}File {state.inputfile} not found during directive parsing.{RESET}")
        # Exit or handle appropriately
        sys.exit(1)
    except Exception as e:
        print(f"{RED}Error reading/parsing directives in {state.inputfile}: {str(e)}{RESET}")
        sys.exit(1)

    if args.singlefile == 1:         # true
        module = 0
        master = state.filenamenoext + ".nex"

    if state.makebin == 1:
        #if nextzxos == 0:
        #   print('Can only use !bin with !nextzxos')
        #    makebin = 0
        state.copy = 1

    if state.nextzxos == 1:
        print("Will launch from NextZXOS.")

    if state.orgfound == False :
        print("Never found ORG")             # if no org found, we had set it 32768
        print("Default ORG  :  "+state.org)

    # print("End of processing")

def parse_number(number_str):
    if number_str.startswith('$'):
        return int(number_str[1:], 16)
    elif number_str.startswith('0x'):
        return int(number_str[2:], 16)
    else:
        return int(number_str, 10)

def ZXBCompile():
    if args.quiet == 0:
        # Print the directory containing the input file
        print(f"Input Dir    :  {CYAN}{state.input_dir}{RESET}")

    # Make sure data and build directories exist within the input file's directory
    data_dir = os.path.join(state.input_dir, 'data')
    build_dir = os.path.join(state.input_dir, 'build')

    for directory, name in [(data_dir, 'data'), (build_dir, 'build')]:
        if not os.path.exists(directory):
            try:
                os.makedirs(directory)
                print(f"{GREEN}Created {name} directory: {directory}{RESET}")
            except Exception as e:
                print(f"{RED}Failed to create {name} directory: {str(e)}{RESET}")

    print(f"Compiling    :  {CYAN}{state.inputfile}{RESET}") # Use absolute path
    print(f"ZXbasic ver  :  {CYAN}{version.VERSION}{RESET}")
    print(f"Architechure :  {CYAN}{arch[7:]}{RESET}")
    print(f"BUILD_DATE   :  {CYAN}{args.defines}{RESET}")
    print(f"{RESET}")

    if args.quiet == 1:
        print(f"{YELLOW}Compiling    :  {CYAN}{state.inputfile}{RESET}") # Use absolute path

    # Construct absolute paths for output files based on input directory and name
    output_bin = os.path.join(state.input_dir, state.filenamenoext + '.bin')
    map_output = os.path.join(build_dir, state.filenamenoext + '.bas.map') # Create map directly in build dir
    tap_output = os.path.join(state.input_dir, state.filenamenoext + '.tap')
    asm_output = os.path.join(state.input_dir, state.filenamenoext + '.bas.asm')
    compile_txt_output = os.path.join(state.input_dir, 'Compile.txt') # Output compile log to input dir

    if state.createasm == 0:
        print(f"{YELLOW}Compiling .... {MAGENTA}")

        if headerless == 1:
            # runs if we are creating a headerless binary
            test=zxbc.main([state.inputfile, arch, '--headerless', '-W', '160', '-W', '140', '-W', '150', '-W', '170', '-W', '190', '-S', # Use state.inputfile
                            state.org, '-O', state.optimize, '-H', heap, '-M', map_output, '-o', output_bin, # Use absolute paths
                            '-I', LIB_DIR, '-I', SCRIPTS_DIR])
        else:
            # runs if we are not creating a headerless binary
            if gentape == 1:
                # runs if we are creating a tap file
                test=zxbc.main([state.inputfile, '-W', '160', '-W', '140', '-W', '150', '-W', '170', '-W', '190', '-S', # Use state.inputfile
                                state.org, '-O', state.optimize, '-H', heap, '-M', map_output, '-t', '-B', '-a', # Use absolute map path
                                '-o', tap_output, '-I', LIB_DIR, '-I', SCRIPTS_DIR]) # Use absolute tap path
            else:
                # this is the main zxbc call for a normal NEX compilation
                compile_args = [state.inputfile, arch, '-W', '160', '-W', '140', '-W', '150', '-W', '170', '-W', '190', # Use state.inputfile
                               '-S', state.org, '-O', state.optimize, '-H', heap, '-M', map_output,
                               '-o', output_bin,
                               '-I', LIB_DIR, '-I', SCRIPTS_DIR, '-D', 'ZXNEXT']

                # Add defines if provided
                if args.defines is not None:
                    compile_args.extend(['-D', 'BUILD_DATE="' + args.defines + '"'])

                test = zxbc.main(compile_args)

    else:
        # runs if we are creating an asm file
        test=zxbc.main([state.inputfile, arch, '-S', state.org, '-O', state.optimize, '-H', heap, # Use state.inputfile
                        '-e', compile_txt_output, '-f','asm',  # Use absolute compile log path
                        '-o', asm_output, '-I', LIB_DIR, '-I', SCRIPTS_DIR, '-D', 'ZXNEXT']) # Use absolute asm path
        state.noemu = 1
        state.docopy = 0

    if test == 0:
        if args.quiet == 0:
            print(f"{BOLD}{GREEN}YAY! Compiled OK! {RESET}")

        if gentape  == 1:
            print("")
            print(f"Compile Log  :  {compile_txt_output}") # Use absolute path
            print(f"Memory Log   :  {map_output}") # Use absolute path (map file)
            print("")
            print("TAP created OK! All done.")
            timetaken = str(datetime.now()-start)
            print('Overall build time : '+timetaken[:-5]+'s')
            sys.exit(0)
        if nextzxos == 1:
            print("Generating NextZXOS loader.bas")

            GenerateLoader() # This function will also need path updates

            timetaken = str(datetime.now()-start)
            print(f"{YELLOW}{BOLD}Overall build time : {timetaken[:-5]}s")
            sys.exit(1)
    else:
    # # # if compilation fails open the compile output as a system textfile
        print(f"{RED}Compile FAILED :( {BOLD}{str(test)}{RESET}")
    # #     #os.system('start notepad compile.txt')
    # #     if platform.system() == 'Darwin':       # macOS
    # #         subprocess.call(('open', 'compile.txt'))
    # #     elif platform.system() == 'Windows':    # Windows
    # #         os.startfile('compile.txt')
    # #     else:                                   # linux variants
    # #         subprocess.call(('xdg-open', 'compile.txt'))
    # #     print("Compile Log  :  "+head_tail[0]+"/Compile.txt")
        print(f"Compile Log  :  {compile_txt_output}") # Use absolute path even on failure
        sys.exit(-1)

    if state.createasm == 1:
        # display this massive message so you dont get confused when code isn't changing in your nex..... ;)
        print(f"{GREEN}Creating ASM file{RESET}")
        print(f"{YELLOW} █████╗ ███████╗███╗   ███╗{RESET}  ")
        print(f"{YELLOW}██╔══██╗██╔════╝████╗ ████║{RESET}")
        print(f"{YELLOW}███████║███████╗██╔████╔██║{RESET}")
        print(f"{YELLOW}██╔══██║╚════██║██║╚██╔╝██║{RESET}")
        print(f"{YELLOW}██║  ██║███████║██║ ╚═╝ ██║{RESET}")
        print(f"{YELLOW}╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝{RESET}")
        print(f"{YELLOW}Generated    : {CYAN}{asm_output}{RESET}") # Use absolute path
        print(f"{YELLOW}Compile Log  : {CYAN}{compile_txt_output}{RESET}") # Use absolute path
        print(f"{YELLOW}Map File     : {CYAN}{map_output}{RESET}") # Use absolute path
        print(f"{YELLOW}Exiting.{RESET}")
        sys.exit(1)

def timeout_after(seconds):
    """Decorator to timeout a function after specified seconds"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with contextlib.suppress(TimeoutError):
                start = time.time()
                while True:
                    try:
                        return func(*args, **kwargs)
                    except (IOError, OSError) as e:
                        if time.time() - start > seconds:
                            raise TimeoutError(f"Operation timed out after {seconds} seconds")
                        time.sleep(0.1)  # Small delay between retries
            raise TimeoutError(f"Operation timed out after {seconds} seconds")
        return wrapper
    return decorator

@timeout_after(3)  # 3 second timeout

def copy_with_timeout(src, dst):
    """Copy file with timeout"""
    print(src)
    shutil.copy(state.input_dir+"/"+src, dst)

def CopyToDestination(state):
    """Handles copying compiled files to their destination with timeouts"""
    if not state.copy:
        return
    print('')
    print(f"{YELLOW}Processing Copy to Destination{RESET}")

    state.filename_path = os.path.split(state.destinationfile)
    state.filename_extension = state.filename_path[1].split('.')[1-2]
    state.filename_noextension = state.filename_path[1].split('.')[1-1]

    if state.makebin == 1 and not state.no_nex:
        src = f"{state.filename_noextension}.bin"
        dst = state.binfile
        print(f"BINNEX : Copy {state.filename_noextension}.bin to : {dst}")

        try:
            copy_with_timeout(src, dst)
        except TimeoutError:
            print(f"{RED}1Timeout: Failed to copy to destination {dst} after 3 seconds{RESET}")
            return
        except Exception as e:
            print(f"{RED}Failed to copy to destination {dst}: {str(e)}{RESET}")
            return

    if state.no_nex:
        src = f"{state.filename_noextension}.{state.filename_extension}"
        dst = state.destinationfile
        try:
            copy_with_timeout(src, dst)
        except TimeoutError:
            print(f"{RED}2Timeout: Failed to copy to destination {dst} after 3 seconds{RESET}")
            return
        except Exception as e:
            print(f"{RED}Failed to copy to destination {dst}: {str(e)}{RESET}")
            return

    if state.filename_extension == 'bin' and not state.no_nex:
        try:
            src = f"{state.filename_noextension}.{state.filename_extension}"
            dst = state.filename_path[0]
            copy_with_timeout(src, dst)
            print(f"{MAGENTA}Copied {dst}/{state.filename_noextension}.{state.filename_extension}{RESET}")
        except TimeoutError:
            print(f"{RED}3Timeout: Failed to copy after 3 seconds{RESET}")
            return
        except Exception as e:
            print(f"{RED}Failed to copy: {str(e)}{RESET}")
            return
    else:
        #print("COPYNEX : Copying "+filenamenoext+".nex to "+state.destinationfile)
        src = f"{state.filename_noextension}.nex"
        dst = state.destinationfile
        print(f"{RESET}Copying {MAGENTA}{src}{RESET} to{MAGENTA} {dst}{RESET}")
        try:
            copy_with_timeout(src, dst)
        except TimeoutError:
            print(f"{RED}Timeout: Failed to copy to {dst} after 3 seconds{RESET}")
            return
        except Exception as e:
            print(f"{RED}Failed to copy {dst}: {str(e)}{RESET}")
            return

    if state.autostart:
        try:
            src = "loader.bas"
            dst = f"{state.filename_path[0]}nextzxos/autoexec.bas"
            copy_with_timeout(src, dst)
            print(f"{MAGENTA}Copied {src} to {dst}{RESET}")
        except TimeoutError:
            print(f"{RED}Timeout: Failed to copy autoexec.bas after 3 seconds{RESET}")
            return
        except Exception as e:
            print(f"{RED}Failed to copy autoexec.bas: {str(e)}{RESET}")
            return

    print(f"{GREEN}Copy SUCCESS!{RESET}")

def AnythingToRun():
    # print(args.modules)
    if args.modules == True:
        print("This is a module skipping CreateNEXFile()")
        return

    if master != '' and state.noemu == 0:
        print(master)
        cmd = BASE_DIR+'/Emu/Cspect/Cspect.exe -w3 -16bit -fill=0 -brk -tv -vsync -analytics -nextrom -map=build/'+filenamenoext+'.bas.map -zxnext -mmc=./data/ '+master
        p = subprocess.call(cmd, shell=True)

def delete_related_files(filename):
        """
        Deletes files related to the given filename with extensions .cfg, .map, and .bin.

        Parameters:
        filename (str): The full path to the file (e.g., '/path/to/myfilename.exe').

        Returns:
        None
        """
        return
        # Extract the directory and base name from the provided filename
        directory = os.path.dirname(filename)
        base_name = os.path.splitext(os.path.basename(filename))[0]

        # Define the extensions to delete
        extensions = ['.cfg', '.map', '.bin']

        # Iterate through the extensions and delete the corresponding files
        for ext in extensions:
            related_file = os.path.join(directory, base_name + ext)
            if os.path.exists(related_file):
                try:
                    os.remove(related_file)
                    print(f"Deleted file: {related_file}")
                except Exception as e:
                  print(f"Failed to delete file: {related_file}. Reason: {e}")

            else:
                print(f"File not found: {related_file}")

def CreateBasicLoader():
    """Creates a BASIC loader using nextbuild_basic.py middleware"""
    if not state.nb_template:
        return

    # Map template names to valid nextbuild_basic.py templates
    template_mapping = {
        'autostart': 'nex_autostart',
        'loader': 'nex',
        'nex': 'nex',
        'binary': 'binary',
        'development': 'development'
    }

    # Get the actual template name, defaulting to the original if not found
    actual_template = template_mapping.get(state.nb_template, state.nb_template)

    print(f"\n{YELLOW}Creating BASIC loader with template: {CYAN}{state.nb_template}{RESET} -> {CYAN}{actual_template}{RESET}")

    # Determine filename to load (relative to input dir)
    if state.makebin:
        load_filename = f"{state.filenamenoext}.bin"
    else:
        load_filename = f"{state.filenamenoext}.nex"

    # Define relative and absolute paths for the loader output
    loader_output_rel = f"{state.filenamenoext}_loader.bas"
    loader_output_abs = os.path.join(state.input_dir, loader_output_rel)

    cmd = [
        sys.executable,
        os.path.join(SCRIPTS_DIR, "nextbuild_basic.py"),
        "--template", actual_template,
        "--output", loader_output_rel, # Use relative path for arg
        "--filename", load_filename, # Use relative path for arg
        "--address", str(state.org)
    ]

    # Add optional parameters
    if state.autostart:
        cmd.append("--autostart")

    # Add custom parameters from nb_params
    if 'dir' in state.nb_params:
        cmd.extend(["--custom-dir", state.nb_params['dir']])

    custom_basic_abs = None
    if 'basic' in state.nb_params:
        # Construct absolute path for custom basic file
        custom_basic_abs = os.path.join(state.input_dir, state.nb_params['basic'])
        if os.path.exists(custom_basic_abs):
            cmd.extend(["--custom-basic", custom_basic_abs]) # Pass absolute path
        else:
            print(f"{RED}Custom BASIC file not found: {custom_basic_abs}{RESET}")
            custom_basic_abs = None # Reset if not found

    # --- Execute the command with CWD set to input dir ---
    original_cwd = os.getcwd()
    try:
        print(f"{YELLOW}Changing CWD to: {state.input_dir}{RESET}")
        os.chdir(state.input_dir)
        print(f"{YELLOW}Running: {CYAN}{' '.join(cmd)}{RESET}")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"{GREEN}BASIC loader created successfully: {loader_output_abs}{RESET}")

    except subprocess.CalledProcessError as e:
        print(f"{RED}Error creating BASIC loader: {e.stderr}{RESET}")
    except Exception as e:
        print(f"{RED}Exception creating BASIC loader: {str(e)}{RESET}")
    finally:
        # Ensure CWD is always restored
        os.chdir(original_cwd)
        print(f"{YELLOW}Restored CWD to: {original_cwd}{RESET}")
    # --- End execute block ---

    # Copy to custom location if specified (after CWD is restored)
    if 'copy' in state.nb_params:
        dest_rel = state.nb_params['copy']
        # Resolve destination relative to the original input dir
        dest_abs = os.path.abspath(os.path.join(state.input_dir, dest_rel))
        try:
            # Copy from the absolute path where the loader was created
            if os.path.exists(loader_output_abs):
                print(f"Copying loader from {loader_output_abs} to {dest_abs}...")
                shutil.copy(loader_output_abs, dest_abs)
                print(f"{GREEN}Copied loader to: {dest_abs}{RESET}")
            else:
                print(f"{RED}Cannot copy loader, source file not found: {loader_output_abs}{RESET}")
        except Exception as e:
            print(f"{RED}Failed to copy loader to {dest_abs}: {str(e)}{RESET}")

def RunCommand(state):
    # Check if there's a command to run from !exe= directive
    if state.check_cmd and state.cmd_:
        print(f"\n{YELLOW}Running command from !exe directive: {CYAN}{state.cmd_}{RESET}")
        try:
            # Run in the original CWD or the input directory?
            # Let's assume original CWD is safer unless specified otherwise.
            subprocess.run(state.cmd_, shell=True, check=True)
            print(f"{GREEN}Command executed successfully{RESET}")
        except subprocess.CalledProcessError as e:
            print(f"{RED}Failed to execute command: {str(e)}{RESET}")
            print(f"{RED}Stderr: {e.stderr}{RESET}")
        except Exception as e:
            print(f"{RED}Failed to execute command: {str(e)}{RESET}")

def run_cspect(state):
    """Launches the CSpect emulator with appropriate arguments."""
    if state.noemu:
        print(f"{YELLOW}NOEMU = TRUE, skipping emulator launch.{RESET}")
        sys.exit(-1) # Exit with error code if noemu is set

    print(f"{YELLOW}Preparing to launch CSpect...{RESET}")

    # Base CSpect command parts
    cspect_exe = os.path.join(BASE_DIR, CONFIG.get('CSPECT', 'Emu/CSpect'), 'CSpect.exe')
    if not os.path.exists(cspect_exe):
        print(f"{RED}CSpect executable not found at: {cspect_exe}{RESET}")
        print(f"{RED}Please check CSPECT path in nextbuild.config{RESET}")
        return # Don't exit script, just skip launch

    # Construct map file path (inside build dir)
    map_file_rel = os.path.join("build", state.filenamenoext + '.bas.map')
    map_file_abs = os.path.join(state.input_dir, map_file_rel)
    map_arg = f"-map={map_file_abs}"

    # Base arguments
    cspect_args = [cspect_exe, "-w3", "-16bit", "-brk", "-tv", "-vsync", "-nextrom"]
    if os.path.exists(map_file_abs):
        cspect_args.append(map_arg)
    else:
        print(f"{YELLOW}Map file not found, launching without map: {map_file_abs}{RESET}")

    # Determine launch mode: HDF or NEX
    use_hdf = bool(state.nb_params.get('dir') if state.nb_params else None) or bool(state.hdf_)

    if use_hdf:
        if not os.path.exists(IMG_FILE):
            print(f"{RED}HDF image file not found, cannot launch CSpect in HDF mode: {IMG_FILE}{RESET}")
            return
        print(f" - Launching with HDF image: {IMG_FILE}")
        cspect_args.extend([
            "-zxnext",
            f"-mmc={IMG_FILE}"
        ])
    elif not state.no_nex:
        nex_file_abs = os.path.join(state.input_dir, f"{state.filenamenoext}.nex")
        if not os.path.exists(nex_file_abs):
            print(f"{RED}NEX file not found, cannot launch CSpect in NEX mode: {nex_file_abs}{RESET}")
            return
        print(f" - Launching NEX file directly: {nex_file_abs}")
        # For direct NEX launch, CWD should ideally be the NEX file's directory
        # for relative data loading within the NEX file to work.
        # We might need to manage CWD here too, or just add the mmc path to data
        data_dir_abs = os.path.join(state.input_dir, "data")
        if os.path.isdir(data_dir_abs):
            cspect_args.extend([
                f"-mmc={IMG_FILE}"
            ])
        cspect_args.extend([
            "-zxnext",
            nex_file_abs
        ])
    else:
        print(f"{YELLOW}Neither HDF sync nor NEX file generation enabled. Cannot launch CSpect.{RESET}")
        return

    # Launch CSpect
    try:
        print(f"{CYAN}Executing: {' '.join(cspect_args)}{RESET}")
        # Use Popen to launch emulator without waiting for it
        subprocess.Popen(cspect_args)
        print(f"{GREEN}CSpect launched successfully.{RESET}")
        sys.exit(0) # Exit cleanly after launching
    except Exception as e:
        print(f"{RED}Error launching CSpect: {str(e)}{RESET}")
        sys.exit(-1) # Exit with error if launch fails

def main():
    # now scan the top 64 lines for any info on ORG/HEAP
    CheckForBasic()

    # State is initialized earlier with the absolute path
    parse_directives(state) # Pass the existing state object

    # Check for !noemu directive early
    if state.noemu:
        print(f"{YELLOW}NOEMU = TRUE, emulator launch will be skipped.{RESET}")

    # Fix: Transfer command line module flag to state
    state.module = args.modules

    # --- HDF Sync Only Mode ---
    if args.sync_hdf:
        print(f"{MAGENTA}--- HDF Sync Only Mode ---{RESET}")
        # We already ran parse_directives to get necessary state (like nb_params, hdf_)

        # Create BASIC loader if requested via !nb directive (even in sync-only mode)
        if not state.module:
            CreateBasicLoader()

        sync_to_hdf(state)
        print(f"{MAGENTA}--- HDF Sync Complete ---{RESET}")
        sys.exit(0) # Exit after syncing
    # --- End HDF Sync Only Mode ---

    if args.runmaster == 0:
        # compile with zxbasic

        ZXBCompile()

        # compiled ok, new lets generate a config to make a NEX file

        ParseNEXCfg()

        # now use nexcreator.py to creat a NEX using the config file
        # Skip NEX creation for modules
        if not state.module:
            CreateNEXFile()

        # Create BASIC loader if requested via !nb directive
        # Skip BASIC loader creation for modules
        if not state.module:
            CreateBasicLoader()

        timetaken = str(datetime.now()-start)

        print(f"{YELLOW}{BOLD}Overall build time : {timetaken[:-5]}s{RESET}")

        # copy to destination if set

        CopyToDestination(state)

        # Copy necessary files to HDF Image
        sync_to_hdf(state)

    RunCommand(state)

    # Launch emulator if needed
    #run_cspect(state)

if __name__ == "__main__":
    main()
