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

# 🧰 <span style="color:#4ec9b0;">NextBuild Studio Templates</span>

### <span class="highlight">Quick-start your Next development projects</span>

---

To make life easier, **NextBuild Studio** allows you to quickly create new project skeletons with just a few clicks. No more copy-pasting boilerplate code!

---

## 🆕 **Creating a New Project**

<div class="action">
🚀 <span class="icon">Launch Project Creator:</span>
Click the **<span class="highlight">New Project</span>** button on the **bottom status bar** to open the **Project Creator** webview.
</div>

<div class="section">

In the **Project Creator** webview, you can:

- ✏️ **Pick a Project Name**  
  This will be used as the name of the new folder

- 📂 **Choose a Location**  
  By default, this points to: <span class="folder">ROOT/Sources/</span>

- 🧱 **Select a Template**  
  Choose from simple single-file templates to modular multi-file setups

- 📃 **Review a Summary**  
  Shows a breakdown of files and folder structure that will be created

</div>

---

## 🎯 **Available Templates**

<div class="section">

### 📄 **Single File Templates**
Perfect for quick experiments and simple programs:

- **Hello World** - Basic "Hello, World!" program
- **Simple Sprite** - Basic sprite display example
- **Sound Test** - AY sound chip demonstration
- **Input Demo** - Keyboard and joystick input

### 📁 **Module-Based Templates**
For larger projects with organized code structure:

- **Game Template** - Complete game framework with modules
- **Demo Template** - For creating demos and visual effects
- **Utility Template** - Tools and system utilities

</div>

---

## ✅ **After Clicking "Create"**

<div class="section">

Once you confirm your template selection:

1. **Project Creation** - NBS creates the folder structure and files
2. **File Opening** - You'll be asked if you want to open the main file in the editor
3. **Ready to Go** - Your new project is set up and ready for development

</div>

<div class="action">
🎮 <span class="icon">Test Your Project:</span>
- Just hit **F5** to compile and run
- Watch your new project launch in CSpect!
</div>

---

## 🏗️ **Template Structure Examples**

<div class="section">

### 📄 **Single File Project**
```
📁 MySimpleProject/
├── 📄 MySimpleProject.bas    # Main program
├── 📁 data/                  # Data files
└── 📁 assets/                # Graphics and sounds
```

### 📁 **Module-Based Project**
```
📁 MyGameProject/
├── 📄 MyGameProject-Master.bas  # Main program
├── 📄 module1.bas               # Game logic module
├── 📄 module2.bas               # Graphics module
├── 📁 data/                     # Game data
├── 📁 assets/                   # Graphics and sounds
└── 📁 inc/                      # Include files
```

</div>

---

## 🎨 **Template Customization**

<div class="section">

### 🔧 **Modifying Templates**
Templates are stored in the NextBuild installation folder and can be customized:

- **Location:** <span class="folder">ROOT/Scripts/templates/</span>
- **Format:** Standard ZX Basic files with placeholder tokens
- **Tokens:** `{{PROJECT_NAME}}`, `{{DATE}}`, `{{AUTHOR}}` etc.

</div>

<div class="tip">
💡 **Pro Tip:** You can create your own templates by copying an existing one and modifying it. Great for team standardization!
</div>

---

## 🚀 **Best Practices**

<div class="section">

### 📋 **Project Organization**
- **Use descriptive names** for your projects
- **Choose module-based** templates for complex projects
- **Keep assets organized** in the `assets/` folder
- **Use the `data/` folder** for game data files

### 🎯 **Development Flow**
1. **Create** from template
2. **Customize** the main file
3. **Add modules** as needed
4. **Test frequently** with F5
5. **Iterate** and improve

</div>

---

## 📚 **Template Gallery**

<div class="action">
🎮 <span class="icon">Explore Examples:</span>
Check out the **[NextBuild Examples](../NextBuild_Examples/)** folder to see what's possible with each template type!
</div>

<div class="section">

### 🌟 **Featured Templates**
- **[HoleyMoley](../NextBuild_Examples/GAMES/HoleyMoley/)** - Complete game example
- **[Sprite Demos](../NextBuild_Examples/GRAPHICS/Sprites/)** - Graphics showcase
- **[Sound Examples](../NextBuild_Examples/SOUND/)** - Audio demonstrations

</div>

---

<div class="note">
🌟 **Get Creative!** Templates are just starting points. Don't be afraid to modify them, combine elements from different templates, or create something completely new. The NextBuild community loves seeing innovative projects!
</div>

---

## 📖 **Next Steps**

- [**Settings**](./Settings.md) - Configure your development environment
- [**Editors**](./Editors.md) - Learn about the built-in tools
- [**Keyboard Input**](./KeyboardInput.md) - Master the shortcuts

---
