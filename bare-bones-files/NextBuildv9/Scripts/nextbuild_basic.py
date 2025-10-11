#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NextBuild Basic - Middleware for txt2nextbasic.py integration with NextBuild
    
This script serves as an interface between NextBuild.py and txt2nextbasic.py,
making it easier to create BASIC loaders for ZX Spectrum Next projects.

Usage:
    Called from NextBuild.py or manually from command line
    
Features:
    - Create loaders for NEX files
    - Create loaders for binary files
    - Support for autostart
    - Templates for common loader patterns
    - Custom BASIC code support
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

# Ensure we can find txt2nextbasic.py in the same directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TXT2NEXTBASIC = os.path.join(SCRIPT_DIR, "txt2nextbasic.py")

# Loader templates
TEMPLATES = {
    "nex": [
        "#autostart",
        "10 CD \"C:\\\"",
        "20 .NEXLOAD {filename}"
    ],
    "nex_autostart": [
        "#autostart",
        "10 CD \"{custom_dir}\"",
        "20 .NEXLOAD {filename}",
        "30 SAVE \"C:\\\\nextzxos\\\\autoexec.bas\""
    ],
    "binary": [
        "#autostart",
        "10 CD \"{custom_dir}\"",
        "20 CLEAR {address}",
        "30 LOAD \"{filename}\" CODE {address}",
        "40 RANDOMIZE USR {address}",
        "50 STOP"
    ],
    "binary_autostart": [
        "#autostart",
        "10 CD \"C:\\\"",
        "20 CLEAR {address}",
        "30 LOAD \"{filename}\" CODE {address}",
        "40 RANDOMIZE USR {address}",
        "50 STOP",
        "60 SAVE \"C:\\\\nextzxos\\\\autoexec.bas\""
    ],
    "custom_dir": [
        "#autostart",
        "10 CD \"{custom_dir}\"",
        "20 .NEXLOAD {filename}"
    ],
    "development": [
        "#autostart",
        "10 ; This is a development loader",
        "20 CD \"C:\\Dev\"",
        "30 .NEXLOAD {filename}"
    ],
    "binary_custom_dir": [
        "#autostart",
        "10 CD \"{custom_dir}\"",
        "20 CLEAR {address}",
        "30 LOAD \"{filename}\" CODE {address}",
        "40 RANDOMIZE USR {address}",
        "50 STOP",
    ],
}

def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description="NextBuild BASIC Loader Generator")
    
    parser.add_argument("--template", 
                      choices=list(TEMPLATES.keys()),
                      default="nex",
                      help="Template to use for the loader")
    
    parser.add_argument("--output", "-o",
                      required=True,
                      help="Output .bas filename")
    
    parser.add_argument("--filename", "-f",
                      required=True,
                      help="Target filename to load (NEX or binary)")
    
    parser.add_argument("--address", "-a",
                      type=int, 
                      default=32768,
                      help="Start address for binary files (default: 32768)")
    
    parser.add_argument("--custom-dir", "-d",
                      help="Custom directory to CD to before loading")
    
    parser.add_argument("--custom-basic", "-c",
                      help="Custom BASIC file to use instead of template")
    
    parser.add_argument("--autostart",
                      action="store_true",
                      help="Configure loader to autostart on boot")
    
    parser.add_argument("--verbose", "-v",
                      action="store_true",
                      help="Show verbose output")
    
    return parser.parse_args()

def create_temp_basic_file(template_name, args):
    """Create a temporary BASIC file from template"""
    template = TEMPLATES[template_name]
    
    # Handle custom directory
    if args.custom_dir and template_name == "custom_dir":
        # No changes needed as the template already has the custom_dir parameter
        pass
    
    # Set up replacements dictionary
    replacements = {
        "filename": args.filename,
        "address": args.address,
    }
    
    if args.custom_dir:
        replacements["custom_dir"] = args.custom_dir
    
    # Create temporary basic file
    temp_file = Path(args.output).with_suffix(".tmp")
    with open(temp_file, "w") as f:
        for line in template:
            f.write(line.format(**replacements) + "\n")
    
    return temp_file

def main():
    args = parse_args()
    
    # Determine which template to use
    template_name = args.template
    if args.autostart:
        if "nex" in template_name and not "autostart" in template_name:
            template_name = "nex_autostart"
        elif "binary" in template_name and not "autostart" in template_name:
            template_name = "binary_autostart"
    
    # Check if custom BASIC file is provided
    if args.custom_basic:
        if not os.path.exists(args.custom_basic):
            print(f"Error: Custom BASIC file {args.custom_basic} not found")
            sys.exit(1)
        basic_file = args.custom_basic
    else:
        # Create temporary BASIC file from template
        basic_file = create_temp_basic_file(template_name, args)
    
    # Build command for txt2nextbasic.py
    cmd = [
        sys.executable,
        TXT2NEXTBASIC,
        "-i", str(basic_file),
        "-o", args.output
    ]
    
    # Add additional arguments based on template type
    if "binary" in template_name:
        cmd.extend(["-m"])  # makebin flag
    
    if args.autostart:
        cmd.extend(["-a"])  # autostart flag
    
    # Run txt2nextbasic.py
    if args.verbose:
        print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=not args.verbose, text=True)
        if result.returncode != 0:
            print(f"Error running txt2nextbasic.py: {result.stderr}")
            sys.exit(1)
    finally:
        # Clean up temporary file if we created one
        if not args.custom_basic and os.path.exists(basic_file):
            os.remove(basic_file)
    
    if args.verbose:
        print(f"Successfully created {args.output}")

if __name__ == "__main__":
    main() 