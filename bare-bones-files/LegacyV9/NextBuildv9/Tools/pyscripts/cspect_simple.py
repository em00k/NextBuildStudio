#!/usr/bin/env python3
"""
Simple CSpect Download & Extract Wrapper
Downloads CSpect using itch-dl and extracts it to the target directory.

Usage:
  python cspect_simple.py [target_directory] [--skip-check]

Options:
  --skip-check    Skip the itch-dl availability check
  target_directory Directory to extract CSpect to (default: ./Emu/CSpect/)
"""

import os
import subprocess
import shutil
import zipfile
import re
from pathlib import Path
import sys

def run_itch_dl(url, target_dir):
    """Run itch-dl to download CSpect files"""
    print("Running itch-dl to download CSpect...")
    
    # Try different ways to run itch-dl
    commands_to_try = [
     #   ["itch-dl", url],
        ["python/bin/python", "-m", "itch_dl", url]
     #   ["python/bin/pip", "-m", "itch_dl", url]
    ]
    
    for cmd in commands_to_try:
        try:
            print(f"Trying: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)
            print("✓ itch-dl completed successfully")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"  Failed: {e}")
            continue
    
    print("✗ All itch-dl commands failed")
    return False

def find_cspect_files():
    """Find the downloaded CSpect files"""
    possible_paths = [
        Path("mdf200/cspect/files"),
        Path("files"),
        Path(".")
    ]
    
    for path in possible_paths:
        if path.exists():
            cspect_files = list(path.glob("CSpect*.zip"))
            if cspect_files:
                print(f"Found CSpect files in: {path}")
                return cspect_files
    
    print("✗ No CSpect files found")
    return []

def find_latest_version(files):
    """Find the latest CSpect version from the file list"""
    if not files:
        return None
    
    # Parse version numbers from filenames
    version_pattern = r'CSpect(\d+)_(\d+)_(\d+)_(\d+)\.zip'
    versions = []
    
    for file_path in files:
        match = re.search(version_pattern, file_path.name)
        if match:
            version = tuple(int(x) for x in match.groups())
            versions.append((version, file_path))
    
    if not versions:
        print("No valid version numbers found, using first file")
        return files[0]
    
    # Get the latest version
    versions.sort(key=lambda x: x[0], reverse=True)
    latest_version, latest_file = versions[0]
    
    print(f"Latest version: {'.'.join(map(str, latest_version))} - {latest_file.name}")
    return latest_file

def extract_cspect(zip_file, target_dir):
    """Extract CSpect to the target directory"""
    print(f"Extracting {zip_file.name} to {target_dir}")
    
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(target_dir)
        
        print(f"✓ Extracted to: {target_dir}")
        return True
        
    except zipfile.BadZipFile:
        print("✗ Bad zip file - this might be a password-protected archive")
        return False
    except RuntimeError as e:
        if "password" in str(e).lower():
            print("✗ Password-protected archive detected!")
            return False
        else:
            raise
    except Exception as e:
        print(f"✗ Error extracting: {e}")
        return False

def cleanup():
    """Clean up temporary download files"""
    print("Cleaning up temporary files...")
    
    download_dirs = [Path("mdf200")]
    
    for dir_path in download_dirs:
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"✓ Removed: {dir_path}")
            except Exception as e:
                print(f"✗ Couldn't remove {dir_path}: {e}")

def main():
    target_dir = Path("./Emu/CSpect/")
    skip_check = False
    
    print("Simple CSpect Download & Extract Wrapper")
    print("=" * 50)
    
    # Parse arguments
    for arg in sys.argv[1:]:
        if arg in ['--help', '-h']:
            print(__doc__)
            return True
        elif arg in ['--skip-check']:
            skip_check = True
        elif not arg.startswith('--'):
            target_dir = Path(arg)
    
    print(f"Target directory: {target_dir.resolve()}")
    
    # Check if itch-dl is available (unless skipped)
    if not skip_check:
        print("Checking if itch-dl is available...")
        try:
            subprocess.run(["python/bin/python", "-m", "itch_dl", "--help"], 
                         check=True, capture_output=True)
            print("✓ itch-dl is available")
        except:
            try:
                subprocess.run(["itch-dl", "--help"], check=True, capture_output=True)
                print("✓ itch-dl is available")
            except:
                print("✗ itch-dl not found!")
                print("Please install it first: pip install itch-dl")
                return False
    else:
        print("Skipping itch-dl availability check")
    
    print()
    
    # Download CSpect
    if not run_itch_dl("https://mdf200.itch.io/cspect", target_dir):
        print("✗ Failed to download CSpect")
        return False
    
    # Find downloaded files
    cspect_files = find_cspect_files()
    if not cspect_files:
        print("✗ No CSpect files found after download")
        return False
    
    print(f"Found {len(cspect_files)} CSpect files")
    
    # Find latest version
    latest_file = find_latest_version(cspect_files)
    if not latest_file:
        print("✗ Couldn't determine latest version")
        return False
    
    # Extract to target directory
    if not extract_cspect(latest_file, target_dir):
        print("✗ Failed to extract CSpect")
        return False
    
    # Cleanup
    cleanup()
    
    print("\n✓ CSpect download and extraction completed successfully!")
    print(f"CSpect is now available in: {target_dir.resolve()}")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
