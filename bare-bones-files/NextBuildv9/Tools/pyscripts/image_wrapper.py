#!/usr/bin/env python3
"""
CSpect Next 2GB Image Download & Extract Wrapper
Downloads the CSpect Next 2GB HDF image from zxnext.uk and extracts it to ./img/
"""

import os
import shutil
import zipfile
import tempfile
from pathlib import Path
import sys
import urllib.request
import urllib.error

# Terminal colors
RESET = '\033[0m'
BOLD = '\033[1m'
RED = '\033[31m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
BLUE = '\033[34m'
MAGENTA = '\033[35m'
CYAN = '\033[36m'

import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='CSpect Next 2GB Image Download & Extract Wrapper')
parser.add_argument('target_dir', nargs='?', default='./img/',
                    help='Target directory for the image file (default: ./img/)')
parser.add_argument('--force', '-f', action='store_true',
                    help='Force download even if image already exists')
parser.add_argument('--quiet', '-q', action='store_true',
                    help='Quiet mode: exit gracefully if image already exists without prompting')

class CSpectImageWrapper:
    def __init__(self, target_dir="./img/", force=False, quiet=False):
        self.target_dir = Path(target_dir).resolve()
        self.image_url = "https://zxnext.uk/hosted/index_files/hdfimages/cspect-next-2gb.zip"
        self.target_filename = "cspect-next-2gb.img"
        self.force = force
        self.quiet = quiet
        
    def download_file(self, url, local_filename):
        """Download a file from URL with progress indication"""
        print(f"{CYAN}Downloading from: {url}{RESET}")
        print(f"{CYAN}Saving to: {local_filename}{RESET}")
        
        try:
            # Open URL and get response
            with urllib.request.urlopen(url) as response:
                # Get file size for progress indication
                total_size = int(response.headers.get('content-length', 0))
                
                with open(local_filename, 'wb') as f:
                    downloaded = 0
                    chunk_size = 8192
                    
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            print(f"\r{YELLOW}Progress: {progress:.1f}% ({downloaded:,}/{total_size:,} bytes){RESET}", end='')
            
            print(f"\n{GREEN}✓ Download completed successfully{RESET}")
            return True
            
        except urllib.error.URLError as e:
            print(f"{RED}✗ Download failed: {e}{RESET}")
            return False
        except urllib.error.HTTPError as e:
            print(f"{RED}✗ HTTP error {e.code}: {e.reason}{RESET}")
            return False
        except Exception as e:
            print(f"{RED}✗ Error during download: {e}{RESET}")
            return False
    
    def extract_zip(self, zip_file_path):
        """Extract the zip file to target directory"""
        print(f"{CYAN}Extracting {zip_file_path.name}...{RESET}")
        
        try:
            # Create target directory
            self.target_dir.mkdir(parents=True, exist_ok=True)
            
            with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                # List contents first
                file_list = zip_ref.namelist()
                print(f"{CYAN}Archive contains {len(file_list)} file(s):{RESET}")
                
                for file_name in file_list:
                    print(f"  - {file_name}")
                
                # Extract all files
                zip_ref.extractall(self.target_dir)
                
                # Check if we got the expected .img file (could be in subdirectories)
                img_files = list(self.target_dir.rglob("*.img"))
                if img_files:
                    # Use the first .img file found
                    source_img = img_files[0]
                    target_path = self.target_dir / self.target_filename
                    
                    print(f"{CYAN}Found image file: {source_img}{RESET}")
                    print(f"{CYAN}Moving to: {target_path}{RESET}")
                    
                    # Move/copy the file to the target location
                    if source_img != target_path:
                        shutil.copy2(source_img, target_path)
                        print(f"{GREEN}✓ Copied image file to target location{RESET}")
                    
                    # Show file info
                    file_size = target_path.stat().st_size
                    print(f"{GREEN}✓ Image file ready: {target_path}{RESET}")
                    print(f"{CYAN}File size: {file_size:,} bytes ({file_size / (1024*1024*1024):.2f} GB){RESET}")
                    
                    # Clean up extracted subdirectories if they exist
                    for item in self.target_dir.iterdir():
                        if item.is_dir() and item.name != "." and item.name != "..":
                            print(f"{CYAN}Cleaning up extracted directory: {item.name}{RESET}")
                            shutil.rmtree(item)
                    
                    return True
                else:
                    print(f"{RED}✗ No .img file found in archive{RESET}")
                    print(f"{CYAN}Available files:{RESET}")
                    for item in self.target_dir.rglob("*"):
                        if item.is_file():
                            size = item.stat().st_size
                            print(f"  {item.relative_to(self.target_dir)} ({size:,} bytes)")
                    return False
            
        except zipfile.BadZipFile:
            print(f"{RED}✗ Invalid zip file{RESET}")
            return False
        except Exception as e:
            print(f"{RED}✗ Error extracting: {e}{RESET}")
            return False
    
    def cleanup_temp_file(self, temp_file_path):
        """Clean up temporary download file"""
        try:
            if temp_file_path.exists():
                temp_file_path.unlink()
                print(f"{GREEN}✓ Cleaned up temporary file{RESET}")
        except Exception as e:
            print(f"{YELLOW}⚠ Couldn't remove temp file: {e}{RESET}")
    
    def run(self):
        """Run the complete download and extract process"""
        print(f"{BOLD}CSpect Next 2GB Image Download & Extract Wrapper{RESET}")
        print(f"{BOLD}=" * 60)
        print(f"{CYAN}Target directory: {self.target_dir}{RESET}")
        print(f"{CYAN}Target filename: {self.target_filename}{RESET}")
        print()
        
        # Check if file already exists
        target_file = self.target_dir / self.target_filename
        if target_file.exists() and not self.force:
            file_size = target_file.stat().st_size
            print(f"{YELLOW}⚠ File already exists: {target_file}{RESET}")
            print(f"{CYAN}Size: {file_size:,} bytes ({file_size / (1024*1024*1024):.2f} GB){RESET}")
            
            if self.quiet:
                print(f"{GREEN}✓ Using existing file (quiet mode){RESET}")
                return True
            
            response = input(f"{MAGENTA}Download again? (y/n): {RESET}").lower().strip()
            if response != 'y':
                print(f"{GREEN}✓ Using existing file{RESET}")
                return True
        
        # Create temporary file for download
        temp_file_path = None
        try:
            # Use the system temp directory
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            temp_file_path = Path(temp_file.name)
            temp_file.close()
            
            # Step 1: Download the file
            if not self.download_file(self.image_url, temp_file_path):
                return False
            
            # Step 2: Extract the zip file
            if not self.extract_zip(temp_file_path):
                return False
            
            # Step 3: Cleanup
            self.cleanup_temp_file(temp_file_path)
            
            print(f"{GREEN}\n✓ CSpect Next 2GB image download and extraction completed successfully!{RESET}")
            print(f"{CYAN}Image is now available at: {self.target_dir / self.target_filename}{RESET}")
            
            return True
            
        except Exception as e:
            print(f"{RED}✗ Unexpected error: {e}{RESET}")
            return False
        finally:
            # Ensure cleanup even on error
            if temp_file_path and temp_file_path.exists():
                self.cleanup_temp_file(temp_file_path)

def main():
    # Parse command line arguments
    args = parser.parse_args()

    print(f"{YELLOW}NextBuild Studio CSpect Next 2GB Image Wrapper - em00k 07.10.2025 - v1.1{RESET}")

    print(f"{GREEN}✓ Using built-in Python libraries (no external dependencies required){RESET}")
    print()

    # Run the wrapper
    wrapper = CSpectImageWrapper(target_dir=args.target_dir, force=args.force, quiet=args.quiet)
    return wrapper.run()

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1) 