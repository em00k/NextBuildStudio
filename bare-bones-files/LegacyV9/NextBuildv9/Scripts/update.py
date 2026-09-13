#!/usr/bin/env python3
"""
CSpect Update Checker (c)2025 em00k, all rights reserved.
Checks if a newer version of CSpect is available and downloads it if needed.
Relies on CSpectReadme.txt to determine the current version.
Uses cspect_wrapper.py to handle the download process.

Usage:
  python update.py [--force] [--check-only]

Options:
  --force       Force download even if versions match
  --check-only  Only check versions, don't download
"""

import os
import sys
import subprocess
import re
from pathlib import Path

def get_current_version():
    """Get the version of currently installed CSpect"""
    cspect_dir = Path("Emu/CSpect/")

    if not cspect_dir.exists():
        print("No CSpect installation found")
        return None

    # Look for CSpect executable
    cspect_exe = cspect_dir / "CSpect.exe"
    if not cspect_exe.exists():
        print("CSpect.exe not found in installation directory")
        return None

    # Read version from CSpectReadme.txt (first line contains version)
    readme_file = cspect_dir / "CSpectReadme.txt"
    if readme_file.exists():
        try:
            with open(readme_file, 'r') as f:
                first_line = f.readline().strip()
                # Extract version from first line: "#CSpect v3.0.2.1 ZXSpectrum emulator by Mike Dailly"
                version_match = re.search(r'v(\d+\.\d+\.\d+\.\d+)', first_line)
                if version_match:
                    version = version_match.group(1)
                    print(f"Current version from CSpectReadme.txt: {version}")
                    return version
        except Exception as e:
            print(f"Error reading CSpectReadme.txt: {e}")

    # Fallback: try to extract version from any zip files in the directory
    zip_files = list(cspect_dir.glob("CSpect*.zip"))
    if zip_files:
        version_pattern = r'CSpect(\d+)_(\d+)_(\d+)_(\d+)\.zip'
        for zip_file in zip_files:
            match = re.search(version_pattern, zip_file.name)
            if match:
                version = '.'.join(match.groups())
                print(f"Current version from zip file: {version}")
                return version

    print("Current CSpect version: Unknown (CSpect.exe exists)")
    return "0.0.0.0"  # Fallback version

def get_latest_version():
    """Get the latest version available online using cspect_wrapper.py"""
    print("Checking latest version online...")
    # note that the paths are critical here, as itch_dl is bundled
    # which is used to grab the latest CSpect version info
    # and the scripts will likely (and hopefully) explode
    # if you try to rip them out of NBS! xx
    #
    try:
        wrapper_path = Path("Tools/pyscripts/cspect_wrapper.py")

        if not wrapper_path.exists():
            print("Error: cspect_wrapper.py not found")
            return None

        # Use the new --version-only flag
        # On Linux, prioritize bundled python/bin/python
        if os.name != 'nt':  # Linux/Unix
            python_exe = Path("python/bin/python")
            if not python_exe.exists():
                python_exe = "python"  # Fallback to system python
        else:  # Windows
            python_exe = Path("Python/python.exe")
            if not python_exe.exists():
                python_exe = Path("python/python.exe")
            if not python_exe.exists():
                python_exe = "python"  # Fallback to system python

        result = subprocess.run([
            str(python_exe), str(wrapper_path), "--version-only"
        ], capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            print("HERE")
            print("Error getting version info from cspect_wrapper")
            return None

        # Parse the output to extract version information
        output = result.stdout

        # Look for "Latest public version: x.x.x.x" in the output
        version_match = re.search(r'Latest public version: (\d+\.\d+\.\d+\.\d+)', output)

        if version_match:
            latest_version = version_match.group(1)
            print(f"Latest version online: {latest_version}")
            return latest_version

        print("Could not determine latest version from online check")
        return None

    except subprocess.TimeoutExpired:
        print("Timeout while checking online version")
        return None
    except Exception as e:
        print(f"Error checking online version: {e}")
        return None

def compare_versions(current, latest):
    """Compare two version strings (format: x.y.z.w)"""
    if not current or not latest or latest == "unknown":
        return True  # If we can't determine latest version, assume update is needed

    try:
        current_parts = [int(x) for x in current.split('.')]
        latest_parts = [int(x) for x in latest.split('.')]

        # Pad shorter version with zeros
        max_len = max(len(current_parts), len(latest_parts))
        current_parts.extend([0] * (max_len - len(current_parts)))
        latest_parts.extend([0] * (max_len - len(latest_parts)))

        return tuple(latest_parts) > tuple(current_parts)

    except ValueError:
        print("Error comparing version numbers")
        return True  # If comparison fails, assume update is needed

def download_update():
    """Download the latest CSpect version using cspect_wrapper.py"""
    print("Downloading latest CSpect version...")

    wrapper_path = Path("Tools/pyscripts/cspect_wrapper.py")

    try:
        # On Linux, prioritize bundled python/bin/python
        if os.name != 'nt':  # Linux/Unix
            python_exe = Path("python/bin/python")
            if not python_exe.exists():
                python_exe = "python"  # Fallback to system python
        else:  # Windows
            python_exe = Path("Python/python.exe")
            if not python_exe.exists():
                python_exe = Path("python/python.exe")
            if not python_exe.exists():
                python_exe = "python"  # Fallback to system python

        result = subprocess.run([
            str(python_exe), str(wrapper_path)
        ], timeout=300)  # 5 minute timeout

        if result.returncode == 0:
            print("+ CSpect update completed successfully")
            return True
        else:
            print("- CSpect update failed")
            return False

    except subprocess.TimeoutExpired:
        print("- CSpect update timed out")
        return False
    except Exception as e:
        print(f"- Error during CSpect update: {e}")
        return False

def main():
    force_download = False
    check_only = False

    print("CSpect Update Checker")
    print("=" * 30)

    # Parse arguments
    for arg in sys.argv[1:]:
        if arg in ['--help', '-h']:
            print(__doc__)
            return True
        elif arg == '--force':
            force_download = True
        elif arg == '--check-only':
            check_only = True

    # Get current version
    current_version = get_current_version()

    # Get latest version
    latest_version = get_latest_version()

    if not latest_version:
        print("! Could not check latest version online, proceeding with download")
        latest_version = "unknown"

    print(f"\nCurrent version: {current_version or 'Not installed'}")
    print(f"Latest version:  {latest_version}")

    # Compare versions
    if current_version and not force_download:
        needs_update = compare_versions(current_version, latest_version)

        if not needs_update:
            print("+ CSpect is up to date")
            return True
        else:
            print("! New version available")
    else:
        if force_download:
            print("! Forcing download")
        else:
            print("! No current installation found")
        needs_update = True

    if check_only:
        if needs_update:
            print("Update available but --check-only specified")
            return False  # Return False to indicate update is needed
        else:
            return True

    if needs_update or force_download:
        return download_update()

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
