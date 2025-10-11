#!/usr/bin/env python3
"""
Test script for the Sample Bank Generator
Creates some dummy PCM files and tests the conversion
"""

import os
import tempfile
import shutil
from samplebank import SampleBankGenerator

def create_dummy_pcm_files(test_dir: str, num_files: int = 3) -> None:
    """Create dummy PCM files for testing"""
    print(f"Creating {num_files} dummy PCM files in {test_dir}")
    
    for i in range(num_files):
        filename = f"sample_{i+1:02d}.pcm"
        filepath = os.path.join(test_dir, filename)
        
        # Create dummy PCM data (different sizes)
        size = 1024 * (i + 1)  # 1KB, 2KB, 3KB
        dummy_data = bytes([(i * 50 + j) % 256 for j in range(size)])
        
        with open(filepath, 'wb') as f:
            f.write(dummy_data)
        
        print(f"Created {filename} ({size} bytes)")

def test_sample_bank_generator():
    """Test the sample bank generator with dummy files"""
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"Using temporary directory: {temp_dir}")
        
        # Create dummy PCM files
        create_dummy_pcm_files(temp_dir, 5)
        
        # Test the generator
        generator = SampleBankGenerator(temp_dir)
        
        # Generate sample bank
        binary_path, address_table = generator.generate_sample_bank(
            output_binary="test_output.dat",
            starting_bank=32,
            extensions=["pcm"]
        )
        
        if binary_path:
            print(f"\n=== Test Results ===")
            print(f"Binary file created: {binary_path}")
            print(f"Binary file size: {os.path.getsize(binary_path)} bytes")
            
            # Verify the binary file contains all samples
            expected_size = sum(f.size for f in generator.files)
            actual_size = os.path.getsize(binary_path)
            
            if expected_size == actual_size:
                print("✓ Binary file size matches expected size")
            else:
                print(f"✗ Size mismatch: expected {expected_size}, got {actual_size}")
            
            print(f"\nAddress table preview:")
            print(address_table[:200] + "..." if len(address_table) > 200 else address_table)
        else:
            print("✗ Test failed - no binary file created")

if __name__ == "__main__":
    test_sample_bank_generator()
