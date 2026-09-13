# NextBuild.py Documentation

**NextBuild v9.1** - ZX Spectrum Next Build System  
*By David Saphier (em00k) - 2025*

A comprehensive build system for compiling ZX Basic source files into NEX executables for the ZX Spectrum Next.

## Overview

NextBuild.py is a pre-processor and build system that:
- Compiles ZX Basic source files using the ZX Basic compiler
- Generates NEX files for the ZX Spectrum Next
- Manages HDF image synchronization
- Creates NextBASIC loader files
- Launches CSpect emulator for testing

## Command Line Parameters

### Required Parameters
- **`-b <file>`** - `.bas` file to process (required unless using `-v/--version`)

### Optional Parameters
- **`-q`** - Quiet mode (don't show splash screen)
- **`-m`** - Compile & build module files
- **`-t`** - Build a TAP file instead of NEX
- **`-l`** - Build a TAP file (same as `-t`)
- **`-s`** - Build a TAP file (same as `-t`)
- **`-D <defines>`** - Set global DEFINE (used for date #CDATE)
- **`-v, --version`** - Show version information
- **`--sync-hdf`** - Only sync build output and data to HDF image
- **`--config <path>`** - Path to nextbuild.config file

## In-File Directives

The script processes directives in the first 64 lines of `.bas` files:

### Memory & Compilation Directives
- **`'!org=<address>`** - Set origin address (hex: `$8000`, decimal: `32768`)
- **`'!heap=<size>`** - Set heap size
- **`'!opt=<level>`** - Set optimization level
- **`'!pc=<address>`** - Set program counter
- **`'!sp=<address>`** - Set stack pointer

### Build Control Directives
- **`'!module`** - Compile as module
- **`'!noemu`** - Don't launch emulator after build
- **`'!asm`** - Generate assembly file
- **`'!nosys`** - Don't include system variables
- **`'!nosp`** - Don't set stack pointer

### File & Output Directives
- **`'!bin=<filename>`** - Create binary file
- **`'!bmp=<filename>`** - Include BMP file
- **`'!hdf=<directory>`** - HDF target directory
- **`'!copy=<destination>`** - Copy file to destination
- **`'!exe=<command>`** - Execute command after build
- **`'!origin=<file>`** - Use different source file

### NextBASIC Loader Directives
- **`'!nb=<template>`** - Create NextBASIC loader
- **`'!nb=<template>(param1=value1,param2=value2)`** - Create loader with parameters

#### Available Templates
- `autostart` - Auto-starting loader
- `loader` - Standard loader
- `nex` - NEX file loader
- `binary` - Binary file loader
- `development` - Development loader

#### Loader Parameters
- `dir=<path>` - Target directory on HDF
- `sync=<mode>` - Sync mode (all, modules, nex, selective)
- `files=<list>` - Comma-separated list of files for selective sync
- `copy=<path>` - Copy loader to specific location
- `basic=<file>` - Use custom BASIC file instead of template

## Configuration File

The script reads from `nextbuild.config` (or custom path via `--config`):

### Configuration Options
- **`ZXBASIC`** - Path to ZX Basic compiler
- **`CSPECT`** - Path to CSpect emulator
- **`TOOLS`** - Path to tools directory
- **`IMG_FILE`** - HDF image file path
- **`HDFMONKEY`** - Path to hdfmonkey tool
- **`DEFAULT_HEAP`** - Default heap size
- **`DEFAULT_ORG`** - Default origin address
- **`DEFAULT_OPTIMIZE`** - Default optimization level

### Example Configuration
```
ZXBASIC=zxbasic1.18.1
CSPECT=Emu/CSpect
TOOLS=Tools
IMG_FILE=img/cspect-next-2gb.img
HDFMONKEY=Tools/hdfmonkey
DEFAULT_HEAP=1024
DEFAULT_ORG=32768
DEFAULT_OPTIMIZE=4
CSPECT_ARGS=-w3 -16bit -brk -tv -vsync -nextrom -basickeys -mouse
NEXTZXOS_ENABLED=true
NEXTZXOS_PATH=
```

## Usage Examples

### Basic Compilation
```bash
python nextbuild.py -b mygame.bas
```

### Quiet Compilation with Custom Config
```bash
python nextbuild.py -b mygame.bas -q --config /path/to/config
```

### Module Compilation
```bash
python nextbuild.py -b module.bas -m
```

### TAP File Generation
```bash
python nextbuild.py -b mygame.bas -t
```

### HDF Sync Only
```bash
python nextbuild.py -b mygame.bas --sync-hdf
```

### Version Information
```bash
python nextbuild.py --version
```

## Example .bas File with Directives

```basic
'!org=$8000
'!heap=4768
'!opt=3
'!nb=autostart(dir=/games, sync=all)
'!hdf=/games
'!bmp=title.bmp

REM Your ZX Basic code here
PRINT "Hello, ZX Spectrum Next!"
```

## Build Process

1. **Parse Directives** - Scans first 64 lines for build directives
2. **Compile** - Uses ZX Basic compiler to create binary
3. **Generate Config** - Creates NEX configuration file
4. **Create NEX** - Uses nextcreator to generate NEX file
5. **Create Loader** - Generates NextBASIC loader if requested
6. **Sync to HDF** - Copies files to HDF image
7. **Launch Emulator** - Uses launch_cspect.py to start CSpect for testing

## File Structure

```
project/
├── mygame.bas          # Source file
├── data/               # Data files
│   ├── sprites.spr
│   ├── music.pt3
│   └── tiles.bin
├── build/              # Build output
│   ├── mygame.bin
│   ├── mygame.bas.map
│   └── mygame.cfg
├── mygame.nex          # Final NEX file
└── mygame_loader.bas   # Generated loader
```

## HDF Sync Modes

- **`all`** - Sync all files from data directory
- **`modules`** - Sync only Module*.bin files
- **`nex`** - Skip data directory sync
- **`selective`** - Sync only specified files

## Error Handling

The script provides detailed error messages for:
- Missing source files
- Compilation errors
- HDF sync failures
- Missing dependencies

## Dependencies

- Python 3.x
- ZX Basic Compiler
- CSpect Emulator
- hdfmonkey tool
- nextcreator.py
- launch_cspect.py (emulator launcher)

## License

Part of the NextBuild project by em00k  
https://github.com/em00k/NextBuildStudio

---

*For more information and examples, visit the NextBuild project repository.*
