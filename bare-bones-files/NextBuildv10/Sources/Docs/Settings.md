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

# ⚙️ <span style="color:#4ec9b0;">NextBuild Studio Settings</span>

### <span class="highlight">Configure your development environment</span>

---

When **NextBuild Studio** is installed with its default configuration, the following folder is used as the **root**:

> 📁 <span class="folder">Documents/NextBuildv9</span>

---

## 📂 **Default Root Folder Structure**

<div class="section">

Each of the following folders should exist inside the root:

| Folder | Description |
|--------|-------------|
| <span class="folder">Emu</span> | Contains the **CSpect emulator** |
| <span class="folder">Python</span> | Embedded **Python 3.13** runtime used by NBS and the ZX Basic Compiler |
| <span class="folder">Scripts</span> | Build scripts like `nextlib.bas`, `nextbuild.py`, etc. |
| <span class="folder">Scripts/Data</span> | Special path `[]` is mapped here — accessible from all source code |
| <span class="folder">Sources</span> | Welcome documentation and example programs |
| <span class="folder">Tools</span> | Extra tools for working with ZX Next files |
| <span class="folder">UDGeedNext</span> | Windows sprite editor for creating/editing `.spr` files |
| <span class="folder">zxbasic</span> | The **ZX Basic Compiler** distribution |

</div>

---

## 🔧 **Changing the Root Folder**

<div class="section">

To change where NBS looks for Python, ZXBasic, and build scripts:

</div>

<div class="action">
🛠️ <span class="icon">Change Root Folder:</span>
1. Open the **Command Palette** → `Ctrl+Shift+P`
2. Type: `NextBuild: Set Root Folder For Includes`
3. Select a new folder — **it must contain**:
   - `Scripts/`
   - `Python/`
   - `zxbasic/`
</div>

<div class="note">
⚠️ **Important:** If these folders are missing, **compilation will fail**.
</div>

---

## 🛠️ **Changing the ZX Basic Compiler Path**

<div class="section">

To set a custom compiler path:

</div>

<div class="action">
🔧 <span class="icon">Custom Compiler Path:</span>
1. Press **F7** and select **Edit Config**  
   <em>or</em> click the **⚙️ Settings** button in the side bar  
2. In the config panel, locate the **ZX Basic** entry  
3. Click **Browse**, choose the new path  
4. **Save and close**
</div>

<div class="section">

**How it works:**
- NBS launches **nextbuild.py** when compiling
- It loads paths from a `nextbuild.config` file in the Scripts folder
- This config file controls all compiler settings

</div>

---

## 🎨 **Editor Configuration**

<div class="section">

### 📝 **Code Editor Settings**
- **Theme:** Dark themes optimized for ZX Basic
- **Font:** Monospace fonts recommended for assembly code
- **Tab Size:** 4 spaces (configurable)
- **Auto-save:** Enabled by default

### 🎮 **Emulator Settings**
- **CSpect Path:** Configurable emulator location
- **Command Line:** Custom CSpect parameters
- **Auto-launch:** Compile and run in one step

</div>

<div class="action">
⚙️ <span class="icon">Access Settings:</span>
- Click the **⚙️ Settings** button in the status bar
- Or press `Ctrl+,` (Ctrl+Comma)
- Search for "NextBuild" to find all NBS-specific settings
</div>

---

## 🔌 **Advanced Configuration**

<div class="section">

### 📁 **Workspace Settings**
Each project can have its own settings stored in `.vscode/settings.json`:

```json
{
  "nextbuild.rootPath": "C:\\MyCustomPath\\NextBuild",
  "nextbuild.compilerPath": "C:\\MyCustomPath\\zxbasic\\zxbc.exe",
  "nextbuild.cspectPath": "C:\\MyCustomPath\\CSpect\\CSpect.exe"
}
```

### 🧩 **Extension Settings**
- **Syntax Highlighting:** Customizable color schemes
- **Auto-completion:** Enable/disable smart suggestions
- **Error Checking:** Real-time syntax validation

</div>

---

## 🔄 **Portable Setup**

<div class="tip">
💡 **Portable Installation:** If you're using a portable setup or multiple NextBuild folders, each can have its own config. Just make sure each folder contains the required subdirectories.
</div>

<div class="section">

**Benefits of Portable Setup:**
- Multiple NextBuild versions on one system
- Easy backup and migration
- Project-specific compiler versions
- Shared development environments

</div>

---

## 🆘 **Troubleshooting**

<div class="section">

### 🚨 **Common Issues**

| Problem | Solution |
|---------|----------|
| **Compilation fails** | Check that `Scripts/`, `Python/`, and `zxbasic/` folders exist |
| **CSpect won't launch** | Verify CSpect path in settings |
| **Missing includes** | Ensure root folder is set correctly |
| **Build scripts not found** | Check that `Scripts/nextbuild.py` exists |

</div>

<div class="action">
🔍 <span class="icon">Debug Settings:</span>
- Press **F7** to open the configuration panel
- Check all paths are correct and files exist
- Look for error messages in the Output panel (`Ctrl+Shift+U`)
</div>

---

<div class="note">
🎯 **Next Steps:** Once you have your settings configured, try creating a new project using the [**Templates**](./Templates.md) to see everything working together!
</div>

---
