#!/usr/bin/env python3
"""
Sample Bank Generator - Python conversion from PureBasic
Scans a directory for WAV/PCM files and creates a single binary file with address table.
Uses 16KB memory windows with bank management.
"""

import os
import glob
import struct
from pathlib import Path
from typing import List, NamedTuple

class FileInfo(NamedTuple):
    """Structure to hold file information"""
    name: str
    size: int

class SampleBankGenerator:
    def __init__(self, directory: str = None):
        """Initialize the sample bank generator
        
        Args:
            directory: Directory to scan for samples. If None, uses current directory.
        """
        if directory is None:
            # Default directory from original PureBasic code
            self.directory = r"C:\NextBuildv7\Sources\JumpyMoley\data"
        else:
            self.directory = directory
            
        self.files: List[FileInfo] = []
        self.max_sample_size = 16384  # 16KB max sample size
        
    def scan_directory(self, extensions: List[str] = None) -> None:
        """Scan directory for audio files
        
        Args:
            extensions: List of file extensions to scan for (default: ['pcm', 'wav'])
        """
        if extensions is None:
            extensions = ['pcm', 'wav']
            
        self.files.clear()
        
        if not os.path.exists(self.directory):
            print(f"Warning: Directory '{self.directory}' does not exist")
            return
            
        print(f"Scanning directory: {self.directory}")
        
        for ext in extensions:
            # Check both lowercase and uppercase extensions for compatibility
            for case_ext in [ext.lower(), ext.upper()]:
                pattern = os.path.join(self.directory, f"*.{case_ext}")
                for filepath in glob.glob(pattern):
                    if os.path.isfile(filepath):
                        filename = os.path.basename(filepath)
                        size = os.path.getsize(filepath)
                        
                        # Check if sample exceeds max size
                        if size > self.max_sample_size:
                            print(f"Warning: {filename} ({size} bytes) exceeds max sample size ({self.max_sample_size} bytes)")
                            continue
                            
                        self.files.append(FileInfo(filename, size))
                        print(f"Found: {filename} (Size: {size} bytes)")
        
        print(f"Total files found: {len(self.files)}")
    
    def create_binary_file(self, output_filename: str = "output.dat") -> str:
        """Create concatenated binary file from all samples
        
        Args:
            output_filename: Name of output binary file
            
        Returns:
            Path to created binary file
        """
        output_path = os.path.join(self.directory, output_filename)
        
        try:
            with open(output_path, 'wb') as output_file:
                for file_info in self.files:
                    input_path = os.path.join(self.directory, file_info.name)
                    with open(input_path, 'rb') as input_file:
                        data = input_file.read()
                        output_file.write(data)
                        print(f"Added {file_info.name} to binary file")
            
            print(f"Binary file created: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Error creating binary file: {e}")
            return ""
    
    def generate_address_table(self, starting_bank: int = 32, loop_flag: int = 0) -> str:
        """Generate address table with bank/offset information
        
        Args:
            starting_bank: Starting bank number (default: 32)
            loop_flag: Loop flag for samples (default: 0)
            
        Returns:
            Address table as formatted string
        """
        offset = 0
        bank = starting_bank
        address_table = ""
        
        for file_info in self.files:
            # Create address table entry
            # Format: $BANK00,offset,size ; filename
            address_table += f"${bank:02X}00,{offset},{file_info.size} ; {file_info.name}\n"
            
            # Update offset
            offset += file_info.size
            
            # Handle bank wrapping at 16KB boundary
            if offset > 16384:
                offset = offset % 16384
                bank += 2
        
        return address_table
    
    def generate_sample_bank(self, output_binary: str = "output.dat", 
                           starting_bank: int = 32, loop_flag: int = 0,
                           extensions: List[str] = None) -> tuple:
        """Complete sample bank generation process
        
        Args:
            output_binary: Name of output binary file
            starting_bank: Starting bank number
            loop_flag: Loop flag for samples
            extensions: File extensions to scan for
            
        Returns:
            Tuple of (binary_file_path, address_table_string)
        """
        print("=== Sample Bank Generator ===")
        
        # Scan directory for files
        self.scan_directory(extensions)
        
        if not self.files:
            print("No files found to process")
            return "", ""
        
        # Create binary file
        binary_path = self.create_binary_file(output_binary)
        
        # Generate address table
        address_table = self.generate_address_table(starting_bank, loop_flag)
        
        print("\n=== Address Table ===")
        print(address_table)
        
        # Save address table to file
        table_path = os.path.join(self.directory, "address_table.txt")
        try:
            with open(table_path, 'w') as f:
                f.write(address_table)
            print(f"Address table saved to: {table_path}")
        except Exception as e:
            print(f"Error saving address table: {e}")
        
        return binary_path, address_table

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Sample Bank Generator")
    parser.add_argument("-d", "--directory", 
                       help="Directory to scan for samples")
    parser.add_argument("-o", "--output", default="output.dat",
                       help="Output binary filename (default: output.dat)")
    parser.add_argument("-b", "--bank", type=int, default=32,
                       help="Starting bank number (default: 32)")
    parser.add_argument("-l", "--loop", type=int, default=0,
                       help="Loop flag (default: 0)")
    parser.add_argument("-e", "--extensions", nargs="+", default=["pcm", "wav"],
                       help="File extensions to scan (default: pcm wav)")
    
    args = parser.parse_args()
    
    # Create generator
    generator = SampleBankGenerator(args.directory)
    
    # Generate sample bank
    binary_path, address_table = generator.generate_sample_bank(
        output_binary=args.output,
        starting_bank=args.bank,
        loop_flag=args.loop,
        extensions=args.extensions
    )
    
    if binary_path:
        print(f"\n=== Generation Complete ===")
        print(f"Binary file: {binary_path}")
        print(f"Total samples: {len(generator.files)}")
        
        # Calculate total size
        total_size = sum(f.size for f in generator.files)
        print(f"Total size: {total_size} bytes")
        print(f"Banks used: {(total_size // 16384) + 1}")

if __name__ == "__main__":
    main()
