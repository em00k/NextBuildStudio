#!/usr/bin/env python3
"""
Part of the NextBuild project by em00k
https://github.com/em00k/NextBuildStudio

NextBuild Config Updater
A utility to help update the nextbuild.config file and VS Code tasks.json
"""

import os
import sys
import argparse
import json
import re

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nextbuild.config')
TASKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Sources', '.vscode', 'tasks.json')

def read_config():
    """Read the current configuration file"""
    config = {}
    if os.path.exists(CONFIG_FILE):
        print(f"Reading existing configuration from: {CONFIG_FILE}")
        with open(CONFIG_FILE, 'r') as f:
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
        print(f"Configuration file not found. Will create new file.")
    return config

def write_config(config):
    """Write configuration back to file"""
    with open(CONFIG_FILE, 'w') as f:
        f.write("# NextBuild Configuration File\n")
        f.write("# Paths to major components and tools\n\n")
        
        f.write("# Core directories\n")
        f.write(f"CSPECT={config.get('CSPECT', 'Emu/CSpect')}\n")
        f.write(f"ZXBASIC={config.get('ZXBASIC', 'zxbasic')}\n")
        f.write(f"TOOLS={config.get('TOOLS', 'Tools')}\n\n")
        
        f.write("# File paths \n")
        f.write(f"IMG_FILE={config.get('IMG_FILE', 'Files/2GB.img')}\n\n")
        
        f.write("# External tools\n")
        f.write(f"HDFMONKEY={config.get('HDFMONKEY', 'Tools/hdfmonkey.exe')}\n\n")
        
        f.write("# Additional settings (optional)\n")
        f.write(f"DEFAULT_HEAP={config.get('DEFAULT_HEAP', '4768')}\n")
        f.write(f"DEFAULT_ORG={config.get('DEFAULT_ORG', '32768')}\n") 
        f.write(f"DEFAULT_OPTIMIZE={config.get('DEFAULT_OPTIMIZE', '3')}\n")
    
    print(f"Configuration saved to: {CONFIG_FILE}")

def get_path_patterns(path, use_forward_slash=False, use_backward_slash=False):
    """Get various patterns for a path for cross-platform compatibility
    
    Args:
        path (str): The base path to generate patterns for
        use_forward_slash (bool): Generate patterns with forward slashes
        use_backward_slash (bool): Generate patterns with backward slashes
        
    Returns:
        list: List of path patterns with various slash formats
    """
    path = path.rstrip('/\\')  # Remove trailing slashes
    
    patterns = []
    
    # If no specific slash format is requested, detect OS and use both on Windows
    if not use_forward_slash and not use_backward_slash:
        if os.name == 'nt':  # Windows
            use_forward_slash = True
            use_backward_slash = True
        else:
            use_forward_slash = True  # Unix-like OS - just use forward slashes
    
    if use_forward_slash:
        # Forward slash version
        patterns.append(f"{path}/")
        patterns.append(f"'{path}/'")
        patterns.append(f'"{path}/"')
    
    if use_backward_slash:
        # Backward slash version for Windows
        backward_path = path.replace('/', '\\')
        patterns.append(f"{backward_path}\\")
        patterns.append(f"'{backward_path}\\'")
        patterns.append(f'"{backward_path}\\"')
    
    return patterns

def normalize_path(path):
    """Normalize a path to use forward slashes consistently"""
    return path.replace('\\', '/')

def update_tasks_json(config, update_tasks=False, custom_paths=None):
    """Update the VS Code tasks.json file with the configured paths"""
    if not update_tasks:
        return
        
    print(f"Attempting to update tasks.json at: {TASKS_FILE}")
        
    if not os.path.exists(TASKS_FILE):
        print(f"Warning: tasks.json file not found at {TASKS_FILE}")
        return
        
    try:
        # Read the tasks.json file as text first
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            tasks_content = f.read()
            
        # Make a backup of the original file content
        backup_file = TASKS_FILE + '.bak'
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(tasks_content)
        print(f"Created backup of tasks.json at {backup_file}")
        
        # Process string replacements directly in the content
        modified = False
        
        # Extract custom path mappings
        path_mappings = {}
        if custom_paths:
            for path_pair in custom_paths:
                if ":" in path_pair:
                    old_path, new_path = path_pair.split(":", 1)
                    path_mappings[normalize_path(old_path)] = normalize_path(new_path)
                else:
                    print(f"Warning: Invalid custom path format: {path_pair}. Expected format is 'old_path:new_path'")
        
        # Add standard path mappings
        cspect_paths = [
            '../Emu/CSpect',
            './../Emu/CSpect',
            '../Emu/CSpect0205',
            './../Emu/CSpect0205'
        ]
        
        zxbasic_paths = [
            '../zxbasic',
            './../zxbasic'
        ]
        
        # Normalize paths in config
        cspect_config = normalize_path(config["CSPECT"])
        zxbasic_config = normalize_path(config["ZXBASIC"])
        
        new_cspect_path = f'../{cspect_config}'
        new_zxbasic_path = f'../{zxbasic_config}'
        
        for old_path in cspect_paths:
            path_mappings[normalize_path(old_path)] = new_cspect_path
            
        for old_path in zxbasic_paths:
            path_mappings[normalize_path(old_path)] = new_zxbasic_path
        
        # Apply all path replacements to the content
        for old_path, new_path in path_mappings.items():
            # Generate variations for cross-platform compatibility
            old_patterns = get_path_patterns(old_path)
            new_patterns = get_path_patterns(new_path)
            
            # For each old pattern, replace with the corresponding new pattern format
            for i, old_pattern in enumerate(old_patterns):
                # Check if the pattern exists in the content
                if old_pattern in tasks_content:
                    # Use the matching new pattern format (same index)
                    new_pattern = new_patterns[min(i, len(new_patterns) - 1)]
                    
                    # Replace the pattern
                    tasks_content = tasks_content.replace(old_pattern, new_pattern)
                    modified = True
                    print(f"Updated path: {old_pattern} -> {new_pattern}")
            
        if modified:
            # Write the updated tasks.json
            with open(TASKS_FILE, 'w', encoding='utf-8') as f:
                f.write(tasks_content)
            print(f"Updated tasks.json with paths from configuration")
        else:
            print(f"No changes needed in tasks.json")
            
        # --- NEW: Specifically update the CSpect -map argument path ---
        print("Checking for CSpect -map argument path update...")
        map_patterns_to_update = {
            "-map=${fileDirname}/": "-map=${fileDirname}/build/",
            "-map=${fileDirname}\\": "-map=${fileDirname}\\build\\" 
            # Add variants if needed, e.g., using ${file} or ${fileBasename}
            # "-map=${fileDirname}/${file}.map": "-map=${fileDirname}/build/${file}.map", 
            # "-map=${fileDirname}\\{file}.map": "-map=${fileDirname}\\build\\${file}.map",
            # "-map=${fileDirname}/${fileBasename}.map": "-map=${fileDirname}/build/${fileBasename}.map", 
            # "-map=${fileDirname}\\{fileBasename}.map": "-map=${fileDirname}\\build\\${fileBasename}.map"
        }
        
        map_path_modified = False
        for old_map_pattern, new_map_pattern in map_patterns_to_update.items():
            if old_map_pattern in tasks_content:
                tasks_content = tasks_content.replace(old_map_pattern, new_map_pattern)
                print(f"Updated map path: {old_map_pattern} -> {new_map_pattern}")
                map_path_modified = True
                
        if map_path_modified:
             # Write the updated tasks.json AGAIN if map path was changed
            with open(TASKS_FILE, 'w', encoding='utf-8') as f:
                f.write(tasks_content)
            print(f"Updated tasks.json with corrected CSpect map path.")
        else:
            print("No map path changes needed.")
        # --- END NEW ---
                
    except Exception as e:
        print(f"Error updating tasks.json: {str(e)}")
        import traceback
        traceback.print_exc()

def list_paths_in_tasks_json():
    """List all paths in tasks.json file"""
    if not os.path.exists(TASKS_FILE):
        print(f"Warning: tasks.json file not found at {TASKS_FILE}")
        return
        
    try:
        # Read the tasks.json file
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Use regex to find all path-like strings - handle both slash types
        path_regex = r'\.\.\/[a-zA-Z0-9_\-\/\\.]+'
        backslash_regex = r'\.\.\\[a-zA-Z0-9_\-\/\\.]+'
        
        matches = re.findall(path_regex, content)
        matches.extend(re.findall(backslash_regex, content))
        
        paths = set()
        for match in matches:
            # Extract the path and normalize it
            path = match.strip()
            paths.add(path)
        
        print("\nPaths found in tasks.json:")
        print("-" * 50)
        for path in sorted(paths):
            print(f"{path}")
        print("-" * 50)
        
    except Exception as e:
        print(f"Error reading tasks.json: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to update configuration"""
    parser = argparse.ArgumentParser(description='NextBuild Configuration Updater')
    parser.add_argument('--cspect', help='Path to CSpect emulator directory')
    parser.add_argument('--zxbasic', help='Path to ZX Basic directory')
    parser.add_argument('--tools', help='Path to tools directory')
    parser.add_argument('--img', help='Path to HDF image file')
    parser.add_argument('--hdfmonkey', help='Path to hdfmonkey executable')
    parser.add_argument('--heap', help='Default heap size')
    parser.add_argument('--org', help='Default org/origin address')
    parser.add_argument('--optimize', help='Default optimization level')
    parser.add_argument('--show', action='store_true', help='Show current configuration')
    parser.add_argument('--update-tasks', action='store_true', help='Update VS Code tasks.json with paths from config')
    parser.add_argument('--custom-path', action='append', help='Custom path to update in tasks.json in format "old_path:new_path"')
    parser.add_argument('--list-paths', action='store_true', help='List all known paths in tasks.json')
    
    args = parser.parse_args()
    
    # Read current config
    config = read_config()
    
    # If no arguments provided, show help
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    # List all paths in tasks.json
    if args.list_paths:
        list_paths_in_tasks_json()
        return
    
    # Show current configuration if requested
    if args.show:
        print("\nCurrent Configuration:")
        print("-" * 50)
        for key, value in sorted(config.items()):
            print(f"{key} = {value}")
        
        # If --update-tasks is specified with --show, update the tasks.json
        if args.update_tasks:
            update_tasks_json(config, True, args.custom_path)
        return
    
    # Update configuration with provided values
    if args.cspect:
        config['CSPECT'] = args.cspect
    if args.zxbasic:
        config['ZXBASIC'] = args.zxbasic
    if args.tools:
        config['TOOLS'] = args.tools
    if args.img:
        config['IMG_FILE'] = args.img
    if args.hdfmonkey:
        config['HDFMONKEY'] = args.hdfmonkey
    if args.heap:
        config['DEFAULT_HEAP'] = args.heap
    if args.org:
        config['DEFAULT_ORG'] = args.org
    if args.optimize:
        config['DEFAULT_OPTIMIZE'] = args.optimize
    
    # Write updated config back to file
    write_config(config)
    
    print("\nUpdated Configuration:")
    print("-" * 50)
    for key, value in sorted(config.items()):
        print(f"{key} = {value}")
    
    # Update tasks.json if requested
    update_tasks_json(config, args.update_tasks, args.custom_path)

if __name__ == "__main__":
    main() 