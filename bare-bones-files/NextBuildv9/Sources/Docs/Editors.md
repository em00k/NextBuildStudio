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

# 🎨 <span style="color:#4ec9b0;">NextBuild Studio Editors</span>

### <span class="highlight">Built-in tools for creating amazing Next games</span>

---

NextBuild Studio comes with a comprehensive set of editors designed specifically for **ZX Spectrum Next** development:

---

## 🖼️ **Sprite Editor**

<div class="section">

**Edit sprites, tiles, and fonts with precision**

- 🎨 **Supports:** `.spr`, `.til`, `.fnt` files
- 🎯 **Features:** Pixel-perfect editing, color palette management, animation previews
- 🚀 **Launch:** Click any `.spr` file in the explorer

</div>

<div class="action">
🆕 <span class="icon">Create New Sprite:</span>
- Press `Ctrl+P` 
- Type "create new sprite"
- Select from the command palette
</div>

---

## 📥 **Sprite Importer**

<div class="section">

**Convert images into Next-compatible sprites**

- 🖼️ **Import:** PNG, JPG, GIF, BMP files
- 🎨 **Convert:** Automatic color reduction and optimization
- 💾 **Export:** `.spr` files ready for use in your games

</div>

<div class="action">
🔄 <span class="icon">Import Image:</span>
- Select an image file in explorer
- Press `Ctrl+P`
- Type "importer"
- Choose "Open In Sprite Importer"
</div>

---

## 🗺️ **Map Editor**

<div class="section">

**Design levels and backgrounds**

- 🎮 **Create:** Game levels, backgrounds, tile maps
- 🧩 **Features:** Tile placement, collision editing, layer management
- 📁 **File Type:** `.nxm` (Next Map files)

</div>

<div class="tip">
💡 **Quick Start:** The Map Editor launches automatically when you click on any `.nxm` file in the explorer.
</div>

---

## 🧱 **Block Editor**

<div class="section">

**Arrange and visualize meta-sprites**

- 🎯 **Purpose:** Combine multiple sprites into larger objects
- 🔧 **Features:** Drag-and-drop sprite arrangement, collision box editing
- 📁 **File Type:** `.nxb` (Next Block files)

</div>

<div class="action">
🎨 <span class="icon">Meta-Sprites:</span>
Perfect for creating complex game objects like characters, vehicles, or large environment pieces that require multiple sprites working together.
</div>

---

## 🎵 **AYFX Editor**

<div class="section">

**Create sound effects for your games**

- 🎹 **Interface:** Mouse and keyboard control
- 🔊 **Features:** Real-time preview, waveform editing, effect parameters
- 📁 **File Type:** `.afb` (AY FX Bank files)

</div>

<div class="action">
🎶 <span class="icon">Launch AYFX Editor:</span>
- Click any `.afb` file in explorer
- **OR** press `Ctrl+P` and choose "Open in AYFX Editor"
</div>

---

## 🎮 **Quick Access Commands**

<div class="section">

All editors can be accessed through the **Command Palette** (`Ctrl+Shift+P`):

| Command | Action |
|---------|--------|
| `NextBuild: Create New Sprite` | Start with a blank sprite |
| `NextBuild: Open Sprite Importer` | Convert images to sprites |
| `NextBuild: Open AYFX Editor` | Create sound effects |
| `NextBuild: Create New Project` | Project templates |

</div>

---

<div class="note">
🌟 <strong>Pro Tips:</strong>
- **Right-click** files in the explorer for context-specific actions
- Use **drag-and-drop** between editors when possible
- **Save often** — the editors auto-save, but it's good practice!
- Check out the [examples](../NextBuild_Examples/) to see these editors in action
</div>

---

## 📚 **Learn More**

- [**Settings**](./Settings.md) - Configure editor preferences
- [**Templates**](./Templates.md) - Quick-start projects that use these editors
- [**Keyboard Input**](./KeyboardInput.md) - Shortcuts and key bindings

---


