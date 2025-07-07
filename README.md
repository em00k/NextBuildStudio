# NextBuildStudio
Repo for NextBuild Studio

# Overview

NextBuild Studio is a Visual Studio Code fork that adds support for ZX Next development.    

It includes the following features:

- Sprite Editor
- AYFX Editor
- ProTracker 3 Module Playback
- Block Editor
- Map Editor
- Image Viewer / Importer 
- File Icon Theme
- Creation Tools

[![Version](https://img.shields.io/visual-studio-marketplace/v/em00k.nextbuild-viewers)](https://marketplace.visualstudio.com/items?itemName=em00k.nextbuild-viewers)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/em00k.nextbuild-viewers)](https://marketplace.visualstudio.com/items?itemName=em00k.nextbuild-viewers)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/em00k.nextbuild-viewers)](https://marketplace.visualstudio.com/items?itemName=em00k.nextbuild-viewers&ssr=false#review-details)

## Features

### Palette Viewer
- View ZX Next palette files (.pal and .nxp)
- Proper support for the ZX Next's 9-bit RGB color format (3 bits per component)
- Displays colors with index information
- Compact UI optimized for palette viewing

### Sprite Editor
- View ZX Next sprite files (.spr), font files (.fnt), and tile files (.til, .nxt)
- Support for multiple ZX Next sprite formats:
  - 8-bit sprites (16×16 pixels, 256 colors)
  - 4-bit sprites (16×16 pixels, 16 colors with palette offset)
  - 8×8 font characters (256 colors)
  - 8×8 tiles (16 colors with palette offset)
- Interactive viewer with zoom, grid view, and palette loading

### Block Viewer
- View ZX Next block files (.nxb)
- View ZX Next map files (.nxm)
- Interactive display of block data
- Support for different block formats

### Image Viewer
- View ZX Next image files (.nxi)
- Support for screen layer formats (.sl2, .sll)
- Display of ZX Next image formats with proper colors

### Sprite Importer
- Import sprites from standard image formats (PNG, JPG, GIF, BMP, etc.)
- Extract multiple sprites from a single image using:
  - Manual selection for individual sprites
  - Grid-based selection for sprite sheets
  - Adjustable grid cell size for different sprite dimensions
- Preview sprites before importing
- Convert to different ZX Next sprite formats:
  - 8-bit sprites (256 colors)
  - 4-bit sprites (16 colors)
- Automatic color quantization to match ZX Next palette formats
- Load custom target palettes for precise color matching
- Extract and save palettes from source images
- Manage multiple sprite selections in a list before exporting
- Export as .spr or .til files

### File Icon Theme
- Custom file icons for ZX Next file types
- Includes icons for:
  - Palette files (.pal, .nxp)
  - Sprite files (.spr, .fnt, .til, .nxt)
  - Block files (.nxb)
  - Map files (.nxm)
  - Image files (.nxi, .sl2, .sll)
  - ProTracker 3 modules (.pt3)
  - BASIC files (.bas) 
  - NextBuild executable (.nex)
  - Binary files (.bin)
- Compatible with other icon themes (can be toggled on/off)

### ProTracker 3 Module Playback
- Support for playing .pt3 music files
- Integration with playpt3.exe (configurable path)

### Creation Tools
- Create new sprite/font files with customizable parameters
- Support for map and block editing

## AYFX Editor

- Edit AYFX files (.afb)
- Create new AYFX files (.afb)

### Palette Viewer
1. **Right-click on a .pal or .nxp file** in the Explorer and select "Open with ZX Next Palette Viewer"
2. **Double-click on a .pal or .nxp file** (the extension is set as the default editor for these files)

### Sprite Viewer
1. **Right-click on a .spr, .til, or .nxt file** in the Explorer and select "Open with ZX Next Sprite Viewer"
2. **Double-click on any supported sprite file** (the extension is set as the default editor for these files)
3. Use the view mode dropdown to switch between different sprite formats
4. Adjust the palette offset for 4-bit sprites and 8×8 tiles
5. Click on any sprite to see a detailed view
6. Use the Scale slider to adjust the sprite display size
7. Toggle grid lines with the Show grid checkbox
8. Load a custom palette file using the "Load Palette" button

### Block & Map Viewer
1. **Right-click on a .nxb or .nxm file** in the Explorer and select "Open with ZX Next Block Viewer"
2. **Double-click on a .nxb or .nxm file** (the extension is set as the default editor for these files)

### Image Viewer
1. **Right-click on a .nxi, .sl2, or .sll file** in the Explorer and select "Open with ZX Next Image Viewer"
2. **Double-click on any supported image file** (the extension is set as the default editor for these files)

### Sprite Importer
1. Run **"NextBuild: Import Sprite From Image..."** command from the Command Palette
2. Select an image file (PNG, JPG, GIF, BMP, etc.) to import from
3. Use the importer interface to:
   - Manually select sprites by dragging on the image
   - Enable grid view to see sprite sheet divisions
   - Adjust grid cell size to match your sprite dimensions
   - Set output format (.spr or .til)
   - Choose bit depth (8-bit for 256 colors or 4-bit for 16 colors)
   - Load a target palette for color matching (required for 4-bit output)
4. Use "Add Selection to List" to add each selection to the sprite list
5. Preview how sprites will look when imported
6. Click "Export Sprite Sheet" to save selected sprites
7. Optionally extract and save the color palette from the source image

### File Icons
1. Enable the NextBuild File Icons theme in VS Code:
   - Go to **Settings → File Icon Theme**
   - Select "NextBuild File Icons"
2. You can toggle between the NextBuild icons and other icon themes using the command:
   - Press `Ctrl+Shift+P` and type "NextBuild: Toggle ZX Next File Icons"

### Playing PT3 Files
1. Set the path to playpt3.exe in the extension settings
2. Right-click on a .pt3 file in the Explorer and select "Play PT3 Module with playpt3.exe"

### Creating Files
1. Use the "NextBuild: Create New Sprite/Font File..." command from the command palette

### Analyzing and Deduplicating Sprites
The extension provides tools to find and remove duplicate sprites in your sprite files:

1. **From the Sprite Editor**: 
   - Open a sprite file in the sprite viewer
   - Click the "Analyze Duplicates" button in the toolbar
   - Review the report in the output panel
   - Optionally highlight duplicates in the editor
   - Save a deduplicated version if desired

2. **From Explorer**:
   - Right-click on a sprite file (.spr, .til, .fnt, etc.)
   - Select "NextBuild: Analyze Sprite Duplicates"
   - Follow the prompts

3. **From Block/Map Editor**:
   - Open a block (.nxb) or map (.nxm) file in the block viewer
   - Make sure a sprite file is loaded
   - Click the "Analyze Duplicates" button in the toolbar
   - Review the report in the output panel
   - Choose whether to update the block/map references when saving the deduplicated sprite file

When you analyze duplicates, the extension will:
- Find exact matches as well as flipped and rotated sprites (configurable)
- Generate a detailed report with potential space savings
- Optionally save a deduplicated sprite file 
- Optionally update block/map files to reference the new sprite indices

This maintains the visual appearance of your blocks and maps while reducing sprite data size.

## ZX Next File Formats

### Palette Format
ZX Next palette files use a 9-bit RGB format (3 bits per color component). Each color entry takes 2 bytes:
- Byte 1: `RRRGGGBB`
- Byte 2: `-------B` (only the least significant bit is used)

This gives a total of 512 possible colors (8 levels per RGB component).

### Sprite Formats
The ZX Next supports multiple sprite formats:

1. **8-bit Sprites**: 16×16 pixel images using 8-bits for each pixel (256 colors). Each sprite requires 256 bytes.
2. **4-bit Sprites**: 16×16 pixel images using 4-bits for each pixel (16 colors). Each sprite requires 128 bytes.
3. **8×8 Font Characters**: Similar to sprites but in 8×8 format with 256 colors.
4. **Tiles**: 8×8 pixel images using 4-bits per pixel (16 colors).

### Map and Block Format
Maps reference a collection of blocks. Each block is an 8×8 arrangement of tiles with attribute data.

### Optimized Block Format
The optimized block format (.oxb) is a more efficient way to store blocks for ZX Next development:
- Only stores non-empty sprites within blocks, saving memory
- Preserves original block dimensions and structure
- Stores sprite positions (x,y) and sprite indices for each non-empty sprite
- Useful for games and applications where memory efficiency is important
- Traditional blocks store all sprites in a block (including empty ones)
- Optimized blocks only store the sprite data that's actually visible

#### Technical Details of .oxb Format
The binary structure of the optimized block format is as follows:

**Header (7 bytes)**:
- Bytes 0-1: Magic number "OB" (Optimized Blocks)
- Byte 2: Version (currently 1)
- Byte 3: Original block width in sprites
- Byte 4: Original block height in sprites
- Bytes 5-6: Number of blocks (little-endian)

**For each block**:
- Byte 0: Number of sprite positions in this block
- For each sprite position:
  - Byte 0: X position (offset from block origin)
  - Byte 1: Y position (offset from block origin)
  - Byte 2: Sprite index

**Size Comparison**:
- Traditional block format: Block count × (width × height) bytes
- Optimized block format: 7 + Block count × (1 + visible sprites × 3) bytes

For example, a map with 100 blocks, each 2×2 sprites, with an average of 2 non-empty sprites per block:
- Traditional format: 100 × (2 × 2) = 400 bytes
- Optimized format: 7 + 100 × (1 + 2 × 3) = 707 bytes

However, if the blocks have more empty space:
- For the same 100 blocks with an average of 1 non-empty sprite per block:
  - Traditional format: 400 bytes
  - Optimized format: 7 + 100 × (1 + 1 × 3) = 407 bytes

The optimized format becomes more efficient as the blocks contain more empty space or when the blocks are larger (like 4×4 or 8×8).

### Image Formats
- .nxi files are ZX Next image files
- .sl2 and .sll are layer files (screen layers)

## Extension Settings

This extension contributes the following settings:

* `nextbuild-viewers.playpt3Path`: Path to playpt3.exe for playing PT3 music modules
* `nextbuild-viewers.respectExistingIconTheme`: When true, will not show icon theme notification if another theme is already active

## Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the extension
4. Press F5 to launch the extension in debug mode

## License

MIT

## Author

[em00k](https://marketplace.visualstudio.com/publishers/em00k) - Creator of NextBuild tools for ZX Spectrum Next development
