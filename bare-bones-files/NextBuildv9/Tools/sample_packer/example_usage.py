#!/usr/bin/env python3
"""
Example usage of the Sample Bank Generator
"""

from samplebank import SampleBankGenerator

def example_usage():
    """Example of how to use the Sample Bank Generator"""
    
    # Example 1: Use current directory
    print("=== Example 1: Current Directory ===")
    generator = SampleBankGenerator(".")
    binary_path, address_table = generator.generate_sample_bank(
        output_binary="samples.dat",
        starting_bank=32,
        extensions=["pcm", "wav"]
    )
    
    # Example 2: Specify custom directory
    print("\n=== Example 2: Custom Directory ===")
    custom_dir = "/path/to/your/samples"  # Change this to your sample directory
    generator2 = SampleBankGenerator(custom_dir)
    
    # Just scan without creating files (useful for preview)
    generator2.scan_directory(["wav", "pcm"])
    
    if generator2.files:
        print("Files that would be processed:")
        for file_info in generator2.files:
            print(f"  - {file_info.name} ({file_info.size} bytes)")
        
        # Generate address table preview
        address_table = generator2.generate_address_table(starting_bank=64)
        print(f"\nAddress table preview:\n{address_table}")
    else:
        print("No files found in the specified directory")

if __name__ == "__main__":
    example_usage()
