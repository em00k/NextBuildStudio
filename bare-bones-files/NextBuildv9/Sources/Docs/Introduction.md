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

# 🎯 <span style="color:#4ec9b0;">Introduction to NextBuild Studio</span>

### <span class="highlight">Your gateway to ZX Spectrum Next development</span>

---

Welcome to **NextBuild Studio (NBS)** — the complete development environment for creating amazing **ZX Spectrum Next** games and applications!

---

## 🚀 **What is NextBuild Studio?**

<div class="section">

NextBuild Studio is a comprehensive development environment built specifically for the **ZX Spectrum Next**. It combines:

- 🛠️ **Powerful Code Editor** with syntax highlighting and auto-completion
- 🎮 **Integrated Emulator** (CSpect) for instant testing
- 🎨 **Built-in Graphics Tools** for sprites, tiles, and fonts
- 🔧 **ZX Basic Compiler** for high-performance code generation
- 📚 **Complete Documentation** and examples

</div>

---

## 🎨 **Styling Examples**

Here are some examples of the styling elements available in our documentation:

<div class="action">
🚀 <span class="icon">Compile</span> your active program:
- Click the **<span style="color:#4caf50;">Compile</span>** button in the status bar  
- Or press **F5** on your keyboard
</div>

<div class="note">
💡 <strong>Pro tip:</strong> Use the `printf()` function for debugging your code. It's much faster than trying to figure out what's wrong by staring at assembly output!
</div>

<div class="tip">
🎯 **Getting Started:** Start with the [Hello World](../NextBuild_Examples/OTHER/HelloWorld/HelloWorld.bas) example to get familiar with the development flow.
</div>

---

## 📁 **Project Structure**

When you create a new project, you'll typically see this structure:

```
📁 MyProject/
├── 📄 MyProject-Master.bas    # Main program file
├── 📄 module1.bas             # Additional modules
├── 📁 data/                   # Game data files
├── 📁 assets/                 # Graphics and sound
└── 📁 inc/                    # Include files
```

---

## 🎮 **Your First Program**

Let's create something simple to get you started:

```basic
REM Your first NextBuild program
PRINT "Hello, ZX Spectrum Next!"
PAUSE 0
```

<div class="section">

**To run this:**
1. Save it as `hello.bas`
2. Press **F5** to compile
3. Watch it run in CSpect!

</div>

---

## 📚 **Learn More**

<div class="section">

### 📖 **Essential Reading**
- [**The Editors**](./Editors.md) - Overview of all the built-in tools
- [**Settings**](./Settings.md) - Configure your development environment
- [**Templates**](./Templates.md) - Quick-start project templates
- [**Keyboard Input**](./KeyboardInput.md) - Shortcuts and key bindings

### 🎮 **Example Projects**
- [**Hello World**](../NextBuild_Examples/OTHER/HelloWorld/HelloWorld.bas) - Your first program
- [**Sprite Demo**](../NextBuild_Examples/GRAPHICS/Sprites/SimpleSprite.bas) - Graphics basics
- [**HoleyMoley**](../NextBuild_Examples/GAMES/HoleyMoley/holeymoley.bas) - Complete game example

</div>

---

<div class="note">
🌟 <strong>Welcome to the community!</strong><br>
NextBuild Studio is made possible by an amazing community of developers, artists, and ZX Spectrum Next enthusiasts. Don't hesitate to share your projects and ask for help!

<em>Happy coding! 🚀</em>
</div>

---

## 📜 **Credits**

NextBuild Studio is built by **David Saphier** and powered by:
- **ZX Basic Compiler** by José Rodríguez (boriel)
- **CSpect Emulator** by Mike Dailly  
- **Visual Studio Code** by Microsoft

👉 **[See full credits →](./Contributions.md)**

---