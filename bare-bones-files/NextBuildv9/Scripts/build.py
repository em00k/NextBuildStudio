#!/usr/bin/env python3

# replaces modules.py with a simpler approach
# part of nextbuild9 by em00k 

import sys
import subprocess
import os
import glob
import shutil
import argparse
import re
import platform  # Added for system info

# --- Initialize ANSI color support for Windows ---
try:
    if platform.system() == 'Windows':
        os.system('') # This command enables VT-100 emulation in many Windows terminals
except Exception as e:
    print(f"Warning: Failed to initialize console for color: {e}")
# --- End ANSI init ---

# Add terminal color constants
RESET = '\033[0m'
BOLD = '\033[1m'
RED = '\033[31m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
BLUE = '\033[34m'
MAGENTA = '\033[35m'
CYAN = '\033[36m'

# Setting up the base directory and scripts directory based on the current script location
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))
SCRIPTS_DIR = os.path.abspath(os.path.join(BASE_DIR, 'Scripts'))

# Argument parser setup
parser = argparse.ArgumentParser(description='build.py NextBuild Module Builder')
parser.add_argument('-b', '--file', type=str, required=True, help='.bas file to process - required')
parser.add_argument('-q', '--quiet', action='store_true', help='Dont show splash')
parser.add_argument('-m', '--modules', action='store_true', help='Compile & Build module files')
parser.add_argument('-s', '--singlefile', action='store_true', help='Compile single Module')
parser.add_argument('-e', '--lastnex', action='store_true', help='Run Master NEX')

# After argument parsing setup
args = parser.parse_args()

# Assigning singlefile from the parsed arguments
singlefile = args.singlefile
lastnex = args.lastnex

# The input file and modules flag are now correctly assigned from the parsed arguments
inputfilea = args.file
modules = args.modules
directory_path = os.path.dirname(inputfilea)

def CheckForBasic():
    # was ther file a .bas?
    head_tail = os.path.split(inputfilea)

    try:
        testfname = head_tail[1].split('.')[1] # Check if there's an extension
    except IndexError:
        print(f"{RED}{BOLD}Error:{RESET} File '{head_tail[1]}' has no extension. Exiting.{RESET}")
        sys.exit(1)

    if testfname.lower() != 'bas': # Use lower() for case-insensitivity
        # checks we are compile a bas file
        print(f"{RED}{BOLD}Error:{RESET} Not a BASIC [*.bas] file! ('{head_tail[1]}'). Exiting.{RESET}")
        sys.exit(1)

    if head_tail[1].lower() == 'nextlib.bas':
        print(f"{YELLOW}{BOLD}Warning:{RESET} Looks like you're trying to compile 'nextlib.bas' directly! This is usually not intended. Exiting.{RESET}")
        sys.exit(1)


# Helper function to check if the filename matches the 'Module[number].bas' pattern with number between 0 and 255
def is_valid_module_filename(filename):
    match = re.match(r'Module(\d+)\.bas$', filename, re.IGNORECASE) # Case-insensitive match
    if match:
        number = int(match.group(1))
        return 0 <= number <= 255
    return False

# Updated function to process modules
def ProcessModules():
    print(f"{CYAN}--- Compiling Modules ---{RESET}")
    # print(f"Base Dir: {BASE_DIR}") # Maybe less verbose
    print(f"Main Source Dir: {os.path.dirname(inputfilea)}")

    head_tail = os.path.split(inputfilea)
    # This will initially get all 'Module*.bas' files
    tmp_path_pattern = os.path.join(head_tail[0], 'Module*.bas')
    all_module_files = glob.glob(tmp_path_pattern)

    # Now filter files that match the specific number range
    valid_module_files = [file for file in all_module_files if is_valid_module_filename(os.path.basename(file))]

    if not valid_module_files:
        print(f"{YELLOW}No valid 'Module[000-255].bas' files found in {head_tail[0]}.{RESET}")
        return # Don't exit, maybe just the main file needs compiling later

    #print("Valid Modules Found: ", valid_module_files) # Debugging, remove for cleaner output

    for file in valid_module_files:
        print(f"{GREEN}Processing module:{RESET} {os.path.basename(file)}")
        try:
            cmd = [sys.executable, os.path.join(SCRIPTS_DIR, 'nextbuild.py'), '-b', file, '-q', '-m']
            # Capture output to check for errors from nextbuild.py
            process = subprocess.run(cmd, capture_output=True, text=True, check=False) # Don't check=True here
            if process.returncode != 0:
                print(f"{RED}{BOLD}Error processing module {os.path.basename(file)}:{RESET}")
                if process.stdout: print(f"{RED}{process.stdout}{RESET}")
                if process.stderr: print(f"{RED}{process.stderr}{RESET}")
                sys.exit(1) # Exit if a module compilation fails
            # else: # Optional: success message per module if needed
            #     print(f"{GREEN}Successfully processed module: {os.path.basename(file)}{RESET}")
        except Exception as e:
            print(f"{RED}{BOLD}Failed to launch nextbuild.py for module {os.path.basename(file)}: {e}{RESET}")
            sys.exit(1)

    print(f"{CYAN}--- Copying compiled modules to data folder ---{RESET}")
    # Assuming the .bin files follow a similar naming convention and need similar filtering
    bin_files_pattern = os.path.join(head_tail[0], 'Module*.bin')
    all_bin_files = glob.glob(bin_files_pattern)
    # Filter based on the *original* .bas filename pattern
    valid_bin_files = [file for file in all_bin_files if is_valid_module_filename(os.path.basename(file).replace('.bin', '.bas'))]

    if not valid_bin_files:
        print(f"{YELLOW}No compiled 'Module*.bin' files found to copy.{RESET}")
        return

    data_dir = os.path.join(head_tail[0], 'data')
    os.makedirs(data_dir, exist_ok=True) # Ensure data directory exists

    for file in valid_bin_files:
        dest_path = os.path.join(data_dir, os.path.basename(file))
        try:
            print(f"Copying: {BLUE}{os.path.basename(file)}{RESET} -> {BLUE}data/{os.path.basename(file)}{RESET}")
            shutil.copy(file, dest_path)
            #delete the .bin file
            os.remove(file)
        except Exception as e:
            print(f"{RED}{BOLD}Error copying {os.path.basename(file)} to data folder: {e}{RESET}")
            # Decide if this should be fatal or just a warning

    print(f"{GREEN}Module processing finished.{RESET}")

def ProcessSingle():
    print(f"{CYAN}--- Compiling Single File ---{RESET}")
    print(f"Compiling: {BLUE}{os.path.basename(inputfilea)}{RESET}")

    head_tail = os.path.split(inputfilea)
    file = inputfilea
    
    # Check if this is a Module*.bas file
    is_module_file = is_valid_module_filename(os.path.basename(file))
    
    if is_module_file:
        print(f"Detected module file - compiling as module")
        compile_flag = '-m'  # Use module mode
    else:
        compile_flag = '-s'  # Use single file mode
    
    try:
        cmd = [sys.executable, os.path.join(SCRIPTS_DIR, 'nextbuild.py'), '-b', file, '-q', compile_flag]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')
        stdout, stderr = process.communicate()

        # Check return code first
        if process.returncode != 0:
            print(f"{RED}{BOLD}Compilation failed (Error Code: {process.returncode}):{RESET}")
            if stdout:
                print(f"{RED}{stdout.strip()}{RESET}")
            if stderr:
                print(f"{RED}{stderr.strip()}{RESET}")
            sys.exit(1)
        else:
             # Optionally print success message or specific output from nextbuild.py
             if stdout:
                 print(stdout.strip())
             print(f"{GREEN}Compilation successful: {os.path.basename(file)}{RESET}")

    except Exception as e:
        print(f"{RED}{BOLD}Failed to launch nextbuild.py for file {os.path.basename(file)}: {e}{RESET}")
        sys.exit(1)

    # If it's a module file, copy the .bin to data/ folder
    if is_module_file:
        print(f"{CYAN}--- Copying module to data folder ---{RESET}")
        
        # Construct the expected .bin filename
        base_name = os.path.splitext(os.path.basename(file))[0]
        bin_file = os.path.join(head_tail[0], base_name + '.bin')
        
        if os.path.exists(bin_file):
            data_dir = os.path.join(head_tail[0], 'data')
            os.makedirs(data_dir, exist_ok=True)
            
            dest_path = os.path.join(data_dir, os.path.basename(bin_file))
            try:
                print(f"Copying: {BLUE}{os.path.basename(bin_file)}{RESET} -> {BLUE}data/{os.path.basename(bin_file)}{RESET}")
                shutil.copy(bin_file, dest_path)
                print(f"{GREEN}Module copied to data folder successfully.{RESET}")
            except Exception as e:
                print(f"{RED}{BOLD}Error copying {os.path.basename(bin_file)} to data folder: {e}{RESET}")
        else:
            print(f"{YELLOW}Warning: Expected module .bin file not found: {bin_file}{RESET}")

    print(f"{GREEN}Single file processing finished.{RESET}")


def StartEmulator(input_file):
    """
    Starts CSpect emulator using the dedicated launch_cspect.py script.
    For modules, launches the Master.nex file instead of the module file.
    """
    print(f"{CYAN}--- Starting Emulator ---{RESET}")
    
    try:
        # Determine file paths
        head_tail = os.path.split(input_file)
        base_name = os.path.splitext(head_tail[1])[0]
        project_dir = head_tail[0]
        
        # Check if this is a module file
        is_module_file = is_valid_module_filename(os.path.basename(input_file))
        
        if is_module_file:
            # For modules, look for Master.nex instead of Module*.nex
            print(f"{YELLOW}Module detected - looking for Master.nex to launch{RESET}")
            nex_file = os.path.join(project_dir, 'Master.nex')
            map_file = os.path.join(project_dir, 'build', 'Master.bas.map')
            launch_name = "Master"
        else:
            # For regular files, use the input file name
            nex_file = os.path.join(project_dir, base_name + '.nex')
            map_file = os.path.join(project_dir, 'build', base_name + '.bas.map')
            launch_name = base_name
        
        # Build command for launch_cspect.py
        cmd = [sys.executable, os.path.join(SCRIPTS_DIR, 'launch_cspect.py')]
        
        # Determine launch mode: NEX file or HDF
        if os.path.exists(nex_file):
            print(f"{YELLOW}Found NEX file, launching in NEX mode: {nex_file}{RESET}")
            cmd.extend(['--nex', nex_file])
            
            # Add map file if available
            if os.path.exists(map_file):
                print(f"{YELLOW}Adding map file: {map_file}{RESET}")
                cmd.extend(['--map', map_file])
            else:
                print(f"{YELLOW}Map file not found (optional): {map_file}{RESET}")
        else:
            print(f"{YELLOW}NEX file not found ({launch_name}.nex), launching in HDF mode{RESET}")
            cmd.append('--hdf')
            
            # Still try to add map file if available in HDF mode
            if os.path.exists(map_file):
                print(f"{YELLOW}Adding map file: {map_file}{RESET}")
                cmd.extend(['--map', map_file])

        # Launch CSpect
        print(f"Executing: {YELLOW}{' '.join(cmd)}{RESET}")
        process = subprocess.run(cmd, capture_output=True, text=True, check=False)
        
        if process.returncode != 0:
            print(f"{RED}{BOLD}Emulator launch failed:{RESET}")
            if process.stdout: 
                print(f"{RED}{process.stdout.strip()}{RESET}")
            if process.stderr: 
                print(f"{RED}{process.stderr.strip()}{RESET}")
        else:
            if process.stdout:
                print(process.stdout.strip())
            print(f"{GREEN}Emulator launch completed successfully.{RESET}")
            
    except Exception as e:
        print(f"{RED}{BOLD}Failed to execute launch_cspect.py: {e}{RESET}")


# Remove the direct LaunchEmulator function as StartEmulator now uses nextbuild.py
# def LaunchEmulator(input_file): ... (Removed)


def ShowInfo():
    # Use the same header format as nextbuild.py
    print(f"{GREEN}==============================================================================================={RESET}")
    print(f"NextBuild v9.0    : David Saphier / em00k - 15-May-2022     https://github.com/em00k/NextBuild")
    print(f"ZX Basic Compiler : Jose Rodriguez                          https://zxbasic.readthedocs.io/")
    print(f"Cspect Emulator   : Mike Dailly                             https://cspect.org")
    print(f"{GREEN}==============================================================================================={RESET}")

def DeleteRelatedFiles(filename):
        """
        Deletes files related to the given filename with extensions .cfg, .map, and .bin.
        Only deletes if the file is NOT a ModuleX.bas file.
        """
        base_name_full = os.path.basename(filename)
        # Check if it's a module file; if so, don't delete its related files here
        if is_valid_module_filename(base_name_full):
            # print(f"{YELLOW}Skipping deletion of related files for module: {base_name_full}{RESET}")
            return

        print(f"{CYAN}--- Cleaning up intermediate files for {base_name_full} ---{RESET}")
        # Extract the directory and base name from the provided filename
        directory = os.path.dirname(filename)
        base_name = os.path.splitext(base_name_full)[0]

        # Define the extensions to delete
        extensions = ['.cfg', '.map', '.bin', '.nex'] # Also clean up .nex for the main file

        # Iterate through the extensions and delete the corresponding files
        deleted_count = 0
        for ext in extensions:
            related_file = os.path.join(directory, base_name + ext)
            if os.path.exists(related_file):
                try:
                    os.remove(related_file)
                    print(f"Deleted: {BLUE}{base_name + ext}{RESET}")
                    deleted_count += 1
                except Exception as e:
                    print(f"{RED}{BOLD}Failed to delete file:{RESET} {related_file}. Reason: {e}")
            #else: # Less verbose, don't report non-existent files
            #    print(f"File not found: {related_file}")
        if deleted_count == 0:
            print(f"{YELLOW}No intermediate files found to delete for {base_name_full}.{RESET}")


# Main function to execute the script logic
if __name__ == '__main__':
   # print(f"Modules Flag: {modules}, Single File Flag: {singlefile}")  # Debugging line

    CheckForBasic() # Validate input file first

    if not args.quiet: # Show header unless quiet flag is set
        ShowInfo()

    operation_performed = False # Track if any main operation ran

    # Handle compilation modes (can be combined with emulator launch)
    if modules:
        print(f"{MAGENTA}Mode: Processing all valid Modules...{RESET}")
        ProcessModules()
        operation_performed = True
    elif singlefile:
        print(f"{MAGENTA}Mode: Processing Single File...{RESET}")
        ProcessSingle()
        operation_performed = True
    elif not lastnex:
        # Default behavior if no compilation flag (-m, -s) and no emulator-only (-e) is given
        print(f"{YELLOW}No primary action specified (-m, -s, -e). Defaulting to single file compile.{RESET}")
        print(f"{MAGENTA}Mode: Processing Single File (Default)...{RESET}")
        ProcessSingle()
        operation_performed = True

    # Handle emulator launch (can be standalone or after compilation)
    if lastnex:
        if operation_performed:
            print(f"{MAGENTA}Launching Emulator after compilation...{RESET}")
        else:
            print(f"{MAGENTA}Mode: Launching Emulator for last build...{RESET}")
        StartEmulator(inputfilea)
        operation_performed = True


    # Clean up intermediate files only if a compile operation happened (not just emulator launch)
    # And only clean files related to the *main* input file, not the modules.
    if singlefile or modules: # Add 'modules' if you want cleanup after ProcessModules too. Re-evaluate logic.
         # Let's refine: Only delete if NOT launching emulator (-e)
         if not lastnex:
            DeleteRelatedFiles(inputfilea)

    if not operation_performed:
         print(f"{YELLOW}No operation performed. Use -m, -s, or -e flags.{RESET}")

    print(f"\n{GREEN}{BOLD}Build process finished.{RESET}")