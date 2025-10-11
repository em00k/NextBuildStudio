#!/usr/bin/env python3
"""
CSpect Download & Extract Wrapper
Downloads CSpect using itch-dl, finds the latest PUBLIC version, and extracts it to the desired location
Handles Mike's versioning wisdom by avoiding password-protected beta versions
This will run with a portable python python/bin/python

Usage:
  python cspect_wrapper.py [target_directory] [options]

Options:
  --skip-itch-dl, --no-itch-dl-check, --disable-itch-dl-check
      Skip the itch-dl availability check (useful with portable Python)
  --version-only
      Only check and display the latest public version, don't download
  target_directory
      Directory to extract CSpect to (default: ./Emu/CSpect/)
"""

import os
import subprocess
import shutil
import zipfile
import re
import json
from pathlib import Path
import sys

# Terminal colors
RESET = '\033[0m'
BOLD = '\033[1m'
RED = '\033[31m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
BLUE = '\033[34m'
MAGENTA = '\033[35m'
CYAN = '\033[36m'

# Unicode symbols that work on Windows
CHECKMARK = '✓' if sys.stdout.encoding and 'utf' in sys.stdout.encoding.lower() else '+'
CROSSMARK = '✗' if sys.stdout.encoding and 'utf' in sys.stdout.encoding.lower() else '-'
WARNING = '⚠' if sys.stdout.encoding and 'utf' in sys.stdout.encoding.lower() else '!'

try:
    import requests
    from bs4 import BeautifulSoup
    HAVE_WEB_DEPS = True
except ImportError:
    HAVE_WEB_DEPS = False

class CSpectWrapper:
    def __init__(self, target_dir="./Emu/CSpect/"):
        self.target_dir = Path(target_dir).resolve()
        self.temp_download_dir = Path("temp_cspect_download")
        self.cspect_url = "https://mdf200.itch.io/cspect"
        self.itch_config_dir = Path.home() / ".config" / "itch-dl"
        self.itch_config_file = self.itch_config_dir / "config.json"
        self.created_config = False

    def setup_itch_config(self):
        """Setup itch-dl config file if it doesn't exist"""
        print(f"{YELLOW}Setting up itch-dl configuration...{RESET}")

        # Check if config already exists
        if self.itch_config_file.exists():
            print(f"{GREEN}{CHECKMARK} itch-dl config already exists at: {self.itch_config_file}{RESET}")
            return True

        try:
            # Create the config directory
            self.itch_config_dir.mkdir(parents=True, exist_ok=True)

            # Embedded config data - no external file needed
            config_data = {
                "api_key": "nOhSrFKi7bXKPjKT6eFyDJGkX2FWQHCS2v7IGkyr",
                "user_agent": "Mozilla/5.0 (X11; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0",
                "mirror_web": False,
                "urls_only": False,
                "filter_files_platform": ["windows"],
                "parallel": 1,
                "filter_files_glob": "CSpect3*.zip",
                "verbose": True
            }

            # Write the config to itch-dl location
            with open(self.itch_config_file, 'w') as dst:
                json.dump(config_data, dst, indent=4)

            self.created_config = True
            print(f"{GREEN}{CHECKMARK} Created itch-dl config at: {self.itch_config_file}{RESET}")
            return True

        except Exception as e:
            print(f"{RED}{CROSSMARK} Error setting up itch-dl config: {e}{RESET}")
            return False

    def run_itch_dl(self):
        """Run itch-dl to download CSpect files using proper config location"""
        print(f"{BOLD}{YELLOW}Running itch-dl to download CSpect...{RESET}")

        try:
            print( f"{BOLD}{YELLOW}Current working directory: {os.getcwd()}{RESET}")

            # Set up itch-dl config in the correct location
            if os.name == 'nt':  # Windows
                itch_config_dir = Path(os.environ.get('APPDATA', '')) / "itch-dl"
            else:  # Linux/Unix
                itch_config_dir = Path.home() / ".config" / "itch-dl"

            itch_config_file = itch_config_dir / "config.json"

            # Backup existing config if it exists
            backup_config = None
            if itch_config_file.exists():
                backup_config = itch_config_file.read_text()

            try:
                # Write our config
                config_data = {
                    "api_key": "nOhSrFKi7bXKPjKT6eFyDJGkX2FWQHCS2v7IGkyr",
                    "user_agent": "Mozilla/5.0 (X11; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0",
                    "mirror_web": False,
                    "urls_only": False,
                    "filter_files_platform": ["windows"],
                    "parallel": 1,
                    "filter_files_glob": "CSpect*.zip",
                    "verbose": True
                }

                itch_config_dir.mkdir(parents=True, exist_ok=True)
                with open(itch_config_file, 'w') as f:
                    json.dump(config_data, f, indent=4)

                # Try different ways to run itch-dl
                # On Windows, prioritize Python/python.exe
                if os.name == 'nt':  # Windows
                    commands_to_try = [
                        ["Python/python.exe", "-m", "itch_dl", self.cspect_url],
                        ["python/bin/python", "-m", "itch_dl", self.cspect_url]
                    ]
                else:  # Linux/Unix
                    commands_to_try = [
                        ["python/bin/python", "-m", "itch_dl", self.cspect_url],
                        ["Python/python.exe", "-m", "itch_dl", self.cspect_url]
                    ]

                for cmd in commands_to_try:
                    try:
                        print(f"Trying: {' '.join(cmd)}")
                        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
                        print(f"{GREEN}{CHECKMARK} itch-dl completed successfully{RESET}")
                        return True
                    except subprocess.CalledProcessError as e:
                        print(f"  Failed: {e}")
                        print(f"  STDOUT: {e.stdout}")
                        print(f"  STDERR: {e.stderr}")
                        continue
                    except FileNotFoundError as e:
                        print(f"  Failed: {e}")
                        continue

                print(f"{RED}{CROSSMARK} All itch-dl commands failed{RESET}")
                return False

            finally:
                # Restore original config if we backed it up
                if backup_config is not None:
                    try:
                        with open(itch_config_file, 'w') as f:
                            f.write(backup_config)
                    except Exception as e:
                        print(f"{YELLOW}{WARNING} Could not restore original config: {e}{RESET}")
                elif itch_config_file.exists():
                    # Remove our temporary config if no backup existed
                    try:
                        itch_config_file.unlink()
                    except Exception as e:
                        print(f"{YELLOW}{WARNING} Could not remove temporary config: {e}{RESET}")

        except Exception as e:
            print(f"{RED}{CROSSMARK} Error running itch-dl: {e}{RESET}")
            return False

    def find_cspect_files(self):
        """Find the downloaded CSpect files"""
        # Look for the typical itch-dl download structure
        possible_paths = [
            Path("mdf200/cspect/files"),
            Path("files"),
            Path("downloads"),
            Path(".")
        ]

        for path in possible_paths:
            if path.exists():
                cspect_files = list(path.glob("CSpect*.zip"))
                if cspect_files:
                    print(f"{YELLOW}Found CSpect files in: {path}{RESET}")
                    return path, cspect_files

        print(f"{RED}{CROSSMARK} No CSpect files found{RESET}")
        return None, []

    def get_latest_public_version(self):
        """Get the latest public version from the CSpect page"""
        try:
            import requests
            from bs4 import BeautifulSoup

            print(f"{YELLOW}Checking latest public version from CSpect page...{RESET}")
            response = requests.get(self.cspect_url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for the specific text pattern
            public_version_text = soup.find(string=re.compile(r"The latest public build is V", re.IGNORECASE))
            if public_version_text:
                # Extract version number using regex
                version_match = re.search(r'V(\d+\.\d+\.\d+\.\d+)', public_version_text)
                if version_match:
                    version_str = version_match.group(1)
                    print(f"Latest public version from website: V{version_str}")
                    return version_str

            # Fallback: look for any mention of public version
            for element in soup.find_all(['strong', 'b', 'span', 'div', 'p']):
                text = element.get_text()
                if 'public build' in text.lower() and 'v' in text.lower():
                    version_match = re.search(r'V?(\d+\.\d+\.\d+\.\d+)', text)
                    if version_match:
                        version_str = version_match.group(1)
                        print(f"{GREEN}{CHECKMARK} Found public version: V{version_str}{RESET}")
                        return version_str

            print(f"{RED}Could not find public version info on page{RESET}")
            return None

        except Exception as e:
            print(f"{RED}Error getting public version: {e}{RESET}")
            return None

    def find_latest_version(self, files):
        """Find the latest PUBLIC CSpect version from the file list"""
        if not files:
            return None

        # Get the latest public version from the website
        public_version_str = self.get_latest_public_version()

        # Parse version numbers from filenames
        version_pattern = r'CSpect(\d+)_(\d+)_(\d+)_(\d+)\.zip'
        versions = []

        for file_path in files:
            match = re.search(version_pattern, file_path.name)
            if match:
                # Convert to tuple of integers for proper version comparison
                version = tuple(int(x) for x in match.groups())
                version_str = '.'.join(map(str, version))
                versions.append((version, version_str, file_path))

        if not versions:
            print(f"{MAGENTA}No valid version numbers found, using first file{RESET}")
            return files[0]

        # If we have the public version info, try to match it
        if public_version_str:
            print(f"{CYAN}Looking for public version: {public_version_str}{RESET}")
            for version, version_str, file_path in versions:
                if version_str == public_version_str:
                    print(f"{GREEN}{CHECKMARK} Found matching public version: {file_path.name}{RESET}")
                    return file_path

            print(f"{MAGENTA}⚠ Exact public version {public_version_str} not found in downloads{RESET}")
            print(f"{CYAN}Available versions:{RESET}")
            for version, version_str, file_path in versions:
                print(f"  - {version_str} ({file_path.name})")

        # Fallback: get the latest version but warn about password protection
        versions.sort(key=lambda x: x[0], reverse=True)
        latest_version, latest_version_str, latest_file = versions[0]

        print(f"{CYAN}Latest available version: {latest_version_str} - {latest_file.name}{RESET}")

        # Check if this might be password protected
        if public_version_str:
            try:
                public_tuple = tuple(int(x) for x in public_version_str.split('.'))
                if latest_version > public_tuple:
                    print(f"{MAGENTA}{WARNING} WARNING: This version might be password-protected (newer than public version){RESET}")
                    print(f"{MAGENTA}Consider using public version {public_version_str} instead{RESET}")

                    # Try to find the public version
                    for version, version_str, file_path in versions:
                        if version_str == public_version_str:
                            print(f"{GREEN}{CHECKMARK} Using public version: {file_path.name}{RESET}")
                            return file_path
            except:
                pass

        return latest_file

    def extract_cspect(self, zip_file):
        """Extract CSpect to the target directory"""
        print(f"{CYAN}Extracting {zip_file.name} to {self.target_dir}{RESET}")

        try:
            # Create target directory
            self.target_dir.mkdir(parents=True, exist_ok=True)

            # Try to extract the zip file
            try:
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    zip_ref.extractall(self.target_dir)
                print(f"{GREEN}{CHECKMARK} Extracted to: {self.target_dir}{RESET}")
            except zipfile.BadZipFile:
                print(f"{RED}{CROSSMARK} Bad zip file - this might be a password-protected archive{RESET}")
                print(f"{CYAN}File: {zip_file}{RESET}")
                return False
            except RuntimeError as e:
                if "password" in str(e).lower() or "bad password" in str(e).lower():
                    print(f"{RED}{CROSSMARK} Password-protected archive detected!{RESET}")
                    print(f"{MAGENTA}This version requires a password (likely a Patreon beta){RESET}")
                    print(f"{CYAN}File: {zip_file}{RESET}")
                    return False
                else:
                    raise

            # Make CSpect.exe executable on Linux/Unix systems
            cspect_exe = self.target_dir / "CSpect.exe"
            if cspect_exe.exists() and os.name != 'nt':  # Not Windows
                try:
                    import stat
                    current_permissions = cspect_exe.stat().st_mode
                    cspect_exe.chmod(current_permissions | stat.S_IEXEC | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                    print(f"{GREEN}{CHECKMARK} Made CSpect.exe executable{RESET}")
                except Exception as e:
                    print(f"{YELLOW}{WARNING} Could not make CSpect.exe executable: {e}{RESET}")

            # List the contents
            print(f"{CYAN}\nExtracted files:{RESET}")
            for item in self.target_dir.iterdir():
                if item.is_file():
                    size = item.stat().st_size
                    executable_marker = " (executable)" if item.name == "CSpect.exe" and os.access(item, os.X_OK) else ""
                    print(f"  {item.name} ({size:,} bytes){executable_marker}")
                elif item.is_dir():
                    file_count = len(list(item.rglob('*')))
                    print(f"  {item.name}/ ({file_count} items)")

            return True

        except Exception as e:
            print(f"{RED}{CROSSMARK} Error extracting: {e}{RESET}")
            return False

    def cleanup(self):
        """Clean up temporary download files and itch-dl config if we created it"""
        print(f"{MAGENTA}Cleaning up temporary files...{RESET}")

        # Remove the itch-dl download directory
        download_dirs = [
            Path("mdf200"),
            self.temp_download_dir
        ]

        for dir_path in download_dirs:
            if dir_path.exists():
                try:
                    shutil.rmtree(dir_path)
                    print(f"{GREEN}{CHECKMARK} Removed: {dir_path}{RESET}")
                except Exception as e:
                    print(f"{RED}{CROSSMARK} Couldn't remove {dir_path}: {e}{RESET}")

        # Clean up itch-dl config if we created it
        if self.created_config and self.itch_config_file.exists():
            try:
                self.itch_config_file.unlink()
                print(f"{GREEN}{CHECKMARK} Removed itch-dl config: {self.itch_config_file}{RESET}")

                # Also remove the config directory if it's empty
                if self.itch_config_dir.exists() and not any(self.itch_config_dir.iterdir()):
                    self.itch_config_dir.rmdir()
                    print(f"{GREEN}{CHECKMARK} Removed empty config directory: {self.itch_config_dir}{RESET}")

            except Exception as e:
                print(f"{RED}{CROSSMARK} Couldn't remove itch-dl config: {e}{RESET}")

    def run(self, cleanup_after=True):
        """Run the complete download and extract process"""
        print(f"{BOLD}CSpect Download & Extract Wrapper{RESET}")
        print(f"{BOLD}=" * 50)
        print(f"{CYAN}Target directory: {self.target_dir}{RESET}")
        print()

        # Step 0: Setup itch-dl config
        if not self.setup_itch_config():
            print(f"{RED}{CROSSMARK} Failed to setup itch-dl configuration{RESET}")
            return False

        # Step 1: Download using itch-dl
        if not self.run_itch_dl():
            print(f"{RED}{CROSSMARK} Failed to download CSpect{RESET}")
            return False

        # Step 2: Find downloaded files
        download_path, cspect_files = self.find_cspect_files()
        if not cspect_files:
            print(f"{RED}{CROSSMARK} No CSpect files found after download{RESET}")
            return False

        print(f"{CYAN}Found {len(cspect_files)} CSpect files:{RESET}")
        for file in cspect_files:
            print(f"  - {file.name}")
        print()

        # Step 3: Find latest version
        latest_file = self.find_latest_version(cspect_files)
        if not latest_file:
            print(f"{RED}{CROSSMARK} Couldn't determine latest version{RESET}")
            return False

        # Step 4: Extract to target directory
        if not self.extract_cspect(latest_file):
            print(f"{RED}{CROSSMARK} Failed to extract CSpect{RESET}")
            return False

        # Step 5: Cleanup
        if cleanup_after:
            self.cleanup()

        print(f"{GREEN}\n{CHECKMARK} CSpect download and extraction completed successfully!{RESET}")
        print(f"{CYAN}CSpect is now available in: {self.target_dir}{RESET}")

        # Show which version was downloaded and extracted
        if latest_file:
            # Extract version from filename
            version_match = re.search(r'CSpect(\d+)_(\d+)_(\d+)_(\d+)\.zip', latest_file.name)
            if version_match:
                version_nums = version_match.groups()
                version_str = '.'.join(version_nums)
                print(f"{GREEN}{CHECKMARK} Downloaded and extracted CSpect version: {version_str}{RESET}")
            else:
                print(f"{GREEN}{CHECKMARK} Downloaded and extracted: {latest_file.name}{RESET}")

        return True

def main():
    # Parse command line arguments
    target_dir = "./Emu/CSpect/"
    #skip_itch_dl_check = False

    print(f"{YELLOW}NextBuild Studio CSpect Download & Extract Wrapper - em00k 11.10.2025 - v1.2{RESET}")

    # Simple argument parsing
    version_only = False

    for arg in sys.argv[1:]:
        if arg in ['--help', '-h', '/?']:
            print(__doc__)
            return True
        # elif arg in ['--skip-itch-dl', '--no-itch-dl-check', '--disable-itch-dl-check']:
        #    skip_itch_dl_check = True
        elif arg == '--version-only':
            version_only = True
        elif not arg.startswith('--'):
            target_dir = arg

    # If version-only mode, just get and print the latest version
    if version_only:
        if not HAVE_WEB_DEPS:
            print(f"{RED}{CROSSMARK} Missing dependencies for version check!{RESET}")
            print(f"{CYAN}Please install: pip install requests beautifulsoup4{RESET}")
            return False

        # Create a temporary wrapper just to get version info
        temp_wrapper = CSpectWrapper()
        latest_version = temp_wrapper.get_latest_public_version()

        if latest_version:
            print(f"Latest public version: {latest_version}")
            return True
        else:
            print("Could not determine latest version")
            return False

    # Check dependencies
    if not HAVE_WEB_DEPS:
        print(f"{RED}{CROSSMARK} Missing dependencies!{RESET}")
        print(f"{CYAN}Please install: pip install requests beautifulsoup4{RESET}")
        return False

    # Check if itch-dl is available (unless skipped)
    # if not skip_itch_dl_check:
    #     print(f"{MAGENTA}Checking if itch-dl is available...{RESET}")
    #     itch_dl_available = False

    #     for cmd in [["python/bin/python", "-m", "itch-dl", "--help"], ["python.exe", "-m", "itch_dl", "--help"]]:
    #         try:
    #             subprocess.run(cmd, check=True, capture_output=True)
    #             itch_dl_available = True
    #             break
    #         except:
    #             continue

    #     if not itch_dl_available:
    #         print(f"{RED}✗ itch-dl not found!{RESET}")
    #         print("Please install it first:")
    #         print("  pip install itch-dl")
    #         print("  OR")
    #         print("  pipx install itch-dl")
    #         return False

    #     print(f"{GREEN}✓ itch-dl is available{RESET}")
    # else:
    #     print(f"{MAGENTA}Skipping itch-dl availability check (--skip-itch-dl){RESET}")
    #     print(f"{YELLOW}⚠ Warning: itch-dl will still be attempted during download{RESET}")

    # print()

    # Run the wrapper
    wrapper = CSpectWrapper(target_dir)
    return wrapper.run()

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
