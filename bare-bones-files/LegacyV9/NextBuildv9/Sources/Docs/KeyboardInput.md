<style>
  .highlight {
    background-color: #222;
    color: #ffd700;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .section {
    background-color: #1a1a1a;
    border-left: 4px solid #007acc;
    padding: 10px;
    margin-bottom: 12px;
  }
  .note {
    background: #2c2c2c;
    padding: 10px;
    border-left: 4px solid #66bb6a;
    margin-top: 10px;
  }
  .tip {
    background: #2c2c2c;
    padding: 10px;
    border-left: 4px solid #66bb6a;
    margin-top: 10px;
  }
  .folder {
    color: #4ec9b0;
    font-family: monospace;
  }
  .action {
    background-color: #1a1a1a;
    border-left: 4px solid #007acc;
    padding: 8px 12px;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  .icon {
    font-weight: bold;
    color: #fdbc4b;
  }
</style>

# 🎮 <span style="color:#4ec9b0;">NextBuild Studio Keyboard & Controls</span>

### <span class="highlight">Master the shortcuts and boost your productivity</span>

---

NextBuild Studio is built upon **Visual Studio Code**, making it incredibly flexible and powerful. It comes pre-configured with convenient actions and keybindings optimized for ZX Spectrum Next development.

---

## 🚀 **Essential Actions**

<div class="action">
🚀 <span class="icon">Compile Program:</span>
- Click the **<span style="color:#4caf50;">Compile</span>** button in the status bar  
- Or press **F5** on your keyboard
- Compiles your active `.bas` file and launches CSpect
</div>

<div class="action">
🎮 <span class="icon">Run Emulator (CSpect):</span>
- Click the **<span style="color:#2196f3;">Run Emulator</span>** button  
- Or press **F7** and select **Start CSpect**
- Launches the ZX Spectrum Next emulator by Mike Dailly
</div>

<div class="action">
🪟 <span class="icon">Open in Explorer:</span>
- Click the **<span style="color:#ff9800;">Explorer</span>** button  
- Shows the active file in your OS's file browser
- Great for quick file management
</div>

<div class="action">
📘 <span class="icon">Open Help:</span>
- Click the **<span style="color:#ffeb3b;">Help</span>** button  
- Or press **F1** to open the inline help system
- Access ZX Basic documentation instantly
</div>

<div class="action">
⚙️ <span class="icon">Settings:</span>
- Click the **<span style="color:#cfd8dc;">Settings</span>** button  
- Or press `Ctrl+,` (Ctrl+Comma)
- Configure NextBuild Studio preferences
</div>

<div class="action">
🆕 <span class="icon">New Project:</span>
- Click the **<span style="color:#9c27b0;">New Project</span>** button
- Quick access to project templates
- Perfect for starting new games or demos
</div>

---

## ⌨️ **Keyboard Shortcuts**

<div class="section">

### 🎯 **Development Shortcuts**
| Key | Action |
|-----|--------|
| **F5** | Compile and run current file |
| **F6** | Build without running |
| **F7** | Open configuration menu |
| **F1** | Open help/documentation |
| **Ctrl+Shift+P** | Open Command Palette |
| **Ctrl+P** | Quick file search |
| **Ctrl+,** | Open Settings |

### 📝 **Editing Shortcuts**
| Key | Action |
|-----|--------|
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+C** | Copy |
| **Ctrl+V** | Paste |
| **Ctrl+X** | Cut |
| **Ctrl+A** | Select All |
| **Ctrl+F** | Find |
| **Ctrl+H** | Find and Replace |

### 🗂️ **File Management**
| Key | Action |
|-----|--------|
| **Ctrl+N** | New file |
| **Ctrl+O** | Open file |
| **Ctrl+S** | Save file |
| **Ctrl+Shift+S** | Save As |
| **Ctrl+W** | Close current tab |
| **Ctrl+Shift+T** | Reopen closed tab |

</div>

---

## 🎨 **Command Palette Power**

<div class="section">

The **Command Palette** (`Ctrl+Shift+P`) is your gateway to all NextBuild features:

### 🔧 **NextBuild Commands**
- `NextBuild: Create New Sprite` - Start sprite editor
- `NextBuild: Open Sprite Importer` - Convert images
- `NextBuild: Open AYFX Editor` - Create sound effects
- `NextBuild: Set Root Folder` - Configure paths
- `NextBuild: Show Keyword Help` - ZX Basic documentation

### 🎮 **Quick Actions**
- `Start CSpect` - Launch emulator
- `Build Source` - Compile current file
- `Open in Explorer` - Show file in OS
- `Edit Config` - Modify settings

</div>

<div class="tip">
💡 **Pro Tip:** Start typing in the Command Palette to find any command quickly. No need to remember exact names!
</div>

---

## 🖱️ **Mouse Controls**

<div class="section">

### 🎯 **File Explorer**
- **Single Click** - Select file
- **Double Click** - Open file
- **Right Click** - Context menu with file-specific actions

### 📝 **Code Editor**
- **Ctrl+Click** - Go to definition
- **Right Click** - Context menu with code actions
- **Mouse Wheel** - Scroll up/down
- **Ctrl+Mouse Wheel** - Zoom in/out

### 🎨 **Built-in Editors**
- **Drag & Drop** - Move sprites, tiles, map elements
- **Right Click** - Access tool-specific options
- **Scroll Wheel** - Zoom in graphic editors

</div>

---

## 🎮 **CSpect Emulator Controls**

<div class="section">

When your program is running in CSpect:

### 🕹️ **Game Controls**
- **Arrow Keys** - Direction input
- **Enter** - Start/Fire
- **Space** - Fire button
- **Shift** - Secondary fire

### 🔧 **Debug Controls**
- **F1** - Show help
- **F5** - Run/Continue
- **F8** - Step over
- **F9** - Toggle breakpoint
- **F10** - Step into
- **F11** - Step out

</div>

<div class="action">
📖 <span class="icon">CSpect Documentation:</span>
Check out the [**CSpect ReadMe**](../../Emu/CSpect/ReadMe.txt) for complete emulator controls and debugging commands!
</div>

---

## 🎯 **Productivity Tips**

<div class="section">

### ⚡ **Speed Up Your Workflow**
- **Use snippets** - Type common code patterns and press Tab
- **Multi-cursor editing** - Hold Ctrl and click to edit multiple lines
- **Quick fixes** - Press `Ctrl+.` on errors for suggestions
- **Go to line** - Press `Ctrl+G` to jump to specific lines

### 🧩 **Code Navigation**
- **Go to definition** - `Ctrl+Click` on functions/variables
- **Find all references** - `Shift+F12` to see where code is used
- **Breadcrumbs** - See your location in the code structure
- **Minimap** - Get an overview of your entire file

</div>

---

<div class="note">
🌟 **Customize Your Experience!** 

Most keyboard shortcuts can be customized in Settings. Press `Ctrl+K, Ctrl+S` to open the keyboard shortcuts editor and make NextBuild Studio work exactly how you want it to!
</div>

---

## 📚 **Learn More**

- [**Settings**](./Settings.md) - Configure keyboard shortcuts and preferences
- [**Editors**](./Editors.md) - Learn about the built-in tools and their controls
- [**Templates**](./Templates.md) - Quick-start your development

---
