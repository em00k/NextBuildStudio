#!/usr/bin/env python3
"""
Simple script to reformat ZX Basic map files.

Converts format:
    8000: .core.__START_PROGRAM

To format:
    8000 core.__START_PROGRAM:
"""

import sys
import os

def format_map_line(line):
    """Convert a single map line from 'addr: .label' to 'addr label:'"""
    line = line.strip()
    if not line:
        return line

    # Split on first colon
    if ':' not in line:
        return line

    addr, label = line.split(':', 1)

    # Clean up the label (remove leading dot if present)
    #label = label.strip()
    #if label.startswith('.'):
    #    label = label[1:]

    # Reconstruct in new format
    return f"{addr} {label}:"

def format_map_file(input_file, output_file=None):
    """Format an entire map file"""
    with open(input_file, 'r') as f:
        lines = f.readlines()

    formatted_lines = [format_map_line(line) for line in lines]

    if output_file:
        with open(output_file, 'w') as f:
            f.write('\n'.join(formatted_lines))
    else:
        # Print to stdout
        print('\n'.join(formatted_lines))

def main():
    if len(sys.argv) < 2:
        print("Usage: python map_formatter.py <input_map_file> [output_file]")
        print("If output_file is not specified, output goes to stdout")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        sys.exit(1)

    format_map_file(input_file, output_file)

if __name__ == "__main__":
    main()


