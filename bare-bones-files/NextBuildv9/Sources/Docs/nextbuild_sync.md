# NextBuild `!nb` Directive Documentation

The `!nb` directive in NextBuild allows you to automatically generate BASIC loaders for your compiled programs. This creates `.bas` files that can load and run your NEX or BIN files on the ZX Spectrum Next.

## Overview

The `!nb` directive works by:
1. Parsing the directive in your `.bas` source file header
2. Calling `nextbuild_basic.py` to generate a BASIC loader using templates
3. Optionally copying the loader to specific locations (like autoexec.bas)
4. Syncing files to the HDF image for emulator testing

## Syntax

```basic
'!nb=template_name(param1=value1,param2=value2,...)
```

### Basic Examples

```basic
'!nb=autostart
'!nb=loader
'!nb=custom(dir=/games,sync=modules)
'!nb=autostart(copy=/nextzxos/autoexec.bas,sync=all)
```

## Available Parameters

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `dir` | Target directory on HDF image | `/games`, `/demos`, `/dev` |
| `sync` | File sync mode to HDF | `all`, `nex`, `modules`, `selective` |
| `copy` | Copy loader to specific location | `/nextzxos/autoexec.bas`, `/system/loader.bas` |
| `files` | Specific files to sync (when sync=selective) | `sprites.spr,music.pt3` |
| `basic` | Custom BASIC code file to include | `custom_loader.txt` |

## Sync Modes

- **`all`** - Syncs NEX/BIN, loader, and all data directory files
- **`nex`** - Syncs only the NEX/BIN and loader files
- **`modules`** - Syncs NEX/BIN, loader, and Module*.bin files only
- **`selective`** - Syncs NEX/BIN, loader, and specified files only

## Template Types

### `autostart`
Creates a loader that automatically runs when NextZXOS boots:
- Generates `{filename}_loader.bas`
- Copies to `/nextzxos/autoexec.bas` by default
- Suitable for demos and games

### `loader` 
Creates a standard loader:
- Generates `{filename}_loader.bas`
- Doesn't auto-copy anywhere
- Suitable for manual loading

### `custom`
Allows full customization with parameters:
- Supports all parameter combinations
- Most flexible option

## VS Code Integration

Use the tasks defined in `tasks.json` to build your projects:

### Main Build Tasks

1. **Build Source** (`Ctrl+Shift+P` → "Tasks: Run Task" → "Build Source")
   - Compiles your ZX Basic file
   - Processes `!nb` directive
   - Generates NEX and loader files

2. **Build Source & Run NextZXOS**
   - Builds, syncs to HDF, and launches emulator
   - Perfect for testing with loaders

3. **Sync Files to HDF**
   - Only syncs files without rebuilding
   - Useful for quick updates

### Module-Specific Tasks

- **MODULE : Build all modules**
- **MODULE : Build single module** 
- **MODULE : Build single module & run**
- **MODULE : Build all modules & run**

### Additional Utility Tasks

- **Start CSpect** - Launch emulator with NEX file
- **Start NextZXOS** - Launch emulator with HDF image
- **Cleanup** - Remove build artifacts
- **Template** - Create new project templates
- **Edit Config** - Configure module settings

## Examples

### Example 1: Simple Autostart Game

```basic
'!nb=autostart(dir=/games)
'!org=32768

PRINT "Hello, Next!"
```

This will:
- Create `mygame_loader.bas`
- Copy it to `/nextzxos/autoexec.bas`
- Sync `mygame.nex` to `/games/mygame.nex`
- Sync all data files to `/games/data/`

### Example 2: Module Project

```basic
'!nb=loader(dir=/dev,sync=modules)
'!org=24576
'!module

PRINT "Module loaded"
```

This will:
- Create `mymodule_loader.bas` 
- Sync `mymodule.bin` to `/dev/mymodule.bin`
- Sync only Module*.bin files from data directory
- No auto-copy (manual loading)

### Example 3: Custom Loader with Selective Sync

```basic
'!nb=custom(dir=/demos,sync=selective,files=sprites.spr;music.pt3,copy=/system/demo_loader.bas)
'!org=49152

PRINT "Demo starting..."
```

This will:
- Create `demo_loader.bas`
- Copy it to `/system/demo_loader.bas`
- Sync `demo.nex` to `/demos/demo.nex`
- Sync only `sprites.spr` and `music.pt3` from data directory

### Example 4: Custom BASIC Code

Create a file `my_custom.txt` in your project directory:
```basic
100 BORDER 2
110 PAPER 0: INK 7
120 CLS
```

Then in your main `.bas` file:
```basic
'!nb=loader(basic=my_custom.txt,dir=/games)
'!org=32768

PRINT "Game with custom loader"
```

This will include your custom BASIC code in the generated loader.

## How It Works Internally

### 1. Directive Parsing
NextBuild scans the first 64 lines of your `.bas` file for directives using regex:
```python
'nb': re.compile(r"'!nb=([a-zA-Z0-9_]+)(?:\(([^)]*)\))?")
```

### 2. State Storage
The parsed directive stores:
- `state.nb_template`: Template name (e.g., "autostart")
- `state.nb_params`: Dictionary of parameters

### 3. Loader Generation
The `CreateBasicLoader()` function:
- Calls `nextbuild_basic.py` with appropriate arguments
- Handles file copying based on parameters
- Integrates with HDF sync system

### 4. HDF Synchronization
The `sync_to_hdf()` function:
- Copies NEX/BIN files to target directory
- Syncs data files based on sync mode
- Handles loader placement

## Relationship with txt2nextbasic.py

The `!nb` directive system is newer and more flexible than the older direct `txt2nextbasic.py` integration:

### Old System (GenerateLoader)
- Direct module variable setting
- Hardcoded BASIC templates
- Limited customization

### New System (!nb directive)
- Template-based generation via `nextbuild_basic.py`
- Flexible parameter system
- Custom BASIC code support
- Advanced sync options

## Troubleshooting

### Common Issues

1. **Missing nextbuild_basic.py**: Ensure the script exists in Scripts directory
2. **Invalid parameters**: Check parameter syntax and spelling
3. **File not found**: Verify custom BASIC files exist in project directory
4. **HDF sync errors**: Check HDF image and hdfmonkey tool paths in config

### Debug Tips

- Use VS Code tasks for consistent building
- Check build output for error messages
- Verify file paths are relative to project directory
- Test with simple examples first

## Best Practices

1. **Keep it simple**: Start with basic templates before using custom parameters
2. **Use sync modes appropriately**: Choose the right sync mode for your project type
3. **Organize data files**: Keep related files in the data directory
4. **Test thoroughly**: Use "Build Source & Run NextZXOS" for complete testing
5. **Comment your directives**: Add comments explaining complex parameter sets 