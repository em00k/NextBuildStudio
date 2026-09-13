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
</style>

# 🎉 <span style="color:#4ec9b0;">Welcome To</span>
<img src="./Docs/NB-1024x169.png" alt="NextBuildStudio" width="40%">

### <span class="highlight">v10 2026.08.22</span> &nbsp;&nbsp;🔗 [zxnext.uk/nextbuildstudio](https://zxnext.uk/nextbuildstudio)

---

**NextBuild Studio (NBS)** is a complete toolchain for writing **ZX Spectrum Next**
games and applications in BASIC — editor, compiler, sprite and map editors,
emulator, and inline help, in one place.

It is built around the [**Boriel ZX Basic Compiler**](https://github.com/boriel-basic/zxbasic)
by [boriel](https://zxbasic.readthedocs.io/en/docs/), with `nextlib` on top to give
you the Next hardware: Layer 2, hardware sprites, tilemaps, DMA, the copper,
sampled sound and PT3 music.

---

## 🚀 **Start Here**

1. Open [**Crimbo.bas**](./NextBuild_Examples/GAMES/Crimbo/Crimbo.bas)
2. Press `F5` to **Compile & Run** — it builds and launches CSpect for you
3. Put the cursor on any keyword and press `F1` for its documentation

New to the app? Read [**Introduction**](./Docs/Introduction.md), then
[**The NextBuild Studio Window**](./Docs/Editor.md) to learn what the five areas
of the screen do.

---

## 📚 **Documentation**

Everything in the `Docs` folder, in the order worth reading it:

| Guide | What it covers |
|---|---|
| [Introduction](./Docs/Introduction.md) | What NBS is and how the pieces fit together |
| [The NextBuild Studio Window](./Docs/Editor.md) | The five areas of the screen, and every action button |
| [Keyboard & Controls](./Docs/KeyboardInput.md) | Shortcuts for building, running and navigating |
| [Creating a New Project](./Docs/Templates.md) | Templates, step by step |
| [The Editors](./Docs/Editors.md) | Sprite, map, block and image editors |
| [Settings](./Docs/Settings.md) | Folder structure, changing compiler versions |
| [Code Banks](./Docs/CodeBanks.md) | Breaking the 32K limit with `CODEBANK` |
| [The `!nb` Sync Directive](./Docs/nextbuild_sync.md) | Syncing files and folders into the emulator image |
| [Credits & Contributions](./Docs/Contributions.md) | Who built this, and how to support them |

Also worth your time: [**The CSpect ReadMe**](../Emu/CSpect/ReadMe.txt) — the
emulator has a great many keyboard shortcuts and debugger commands.

- Check t **FileLib** library for `FULL` control of the Next's SD, you can find it in [FileLib Examples](/NextBuild_Examples/DISKIO/FileLib/)
- Graphics Primitives for `Line`, `Boxes`, `Cirlces`, `Triangles`, `Polygons` [Primitives Examples](/NextBuild_Examples/GRAPHICS/DrawPrimitives)

---

## 🛠️ **Built-in Tools**

- 🧱 **Sprite Editor** (`.spr`, `.til`, `.fnt`, `.nxm`)
- 🗺️ **Map Editor** (`.nxm`)
- 🖼️ **Image Importer** — sprites, panels, image conversion
- 🧩 **Block Editor** — composite sprite editing
- 🔍 **Image Viewer** (`.nxi`, `.sl2`)
- 📘 **Inline Help** and ZX Basic docs — `F1`
- ✅ **Syntax Checker**, **Snippets** and **Templates**
- 🔊 **PT3 Player** — right-click a `.pt3` in the Explorer to play, `Esc` to quit *(Windows only)*
- 🎹 **AYFX Editor** — `Ctrl+Shift+P`, type `AYFX`

More in the Command Palette: `Ctrl+Shift+P`, type `NextBuild`.

---

## 🏦 **Running Out of Room?**

ZX Basic has one flat `ORG`, so all your code has to fit below `$FFFF`. When a
project outgrows that, `CODEBANK` moves whole routines into 8K memory banks:

```basic
'!codebank=30           ' CODEBANK 1 -> 8K page 30

CODEBANK 1
    SUB DrawLevel()
        ' ...
    END SUB
END CODEBANK

DrawLevel()             ' called exactly as before
```

Call sites do not change and you never page anything by hand.
👉 **[Read the Code Banks guide →](./Docs/CodeBanks.md)**

---

## 📂 **Example Projects**

- [📝 Hello World](./NextBuild_Examples/OTHER/HelloWorld/HelloWorld.bas)
- [🕹️ Simple Sprite](./NextBuild_Examples/GRAPHICS/Sprites/SimpleSprite.bas)
- [🕹️ Sprite Scaling & Rotation](./NextBuild_Examples/GRAPHICS/Sprites/ScaleRotataSprite.bas)
- [🎮 Holey Moley](./NextBuild_Examples/GAMES/HoleyMoley/holeymoley.bas) — a complete game

There are many more under [`NextBuild_Examples`](./NextBuild_Examples), sorted
into `GAMES`, `GRAPHICS`, `SOUND`, `INPUT`, `DISKIO`, `MODULES` and `OTHER`.

---

## ⚙️ **Tasks & Commands**

- [▶ Run Emulator](command:workbench.action.tasks.runTask?%5B%22Start%20Cspect%22%5D)
- [🛠️ Build File](command:workbench.action.tasks.build)
- [🔤 Keyword Help](command:nextbuild-viewers.showKeywordHelp)
- [⚙ Open Settings](command:workbench.action.openSettings)

---

## 🙏 **Credits**

NextBuild Studio has been developed over many years by **David Saphier**, and
would not exist without:

- **boriel** — https://ko-fi.com/boriel
- **D Xalior Rimron-Soutter** — https://zx.xalior.com/
- **Mike "Flash" Ware** — https://www.rustypixels.uk/
- **Mike Dailly** — https://lemmings.info/
- **Peter Helcmanovsky** — https://ped7g.itch.io/
- **Remy Sharp** — https://remysharp.com/
- **Jari Komppa** — https://solhsa.com/
- **DuefectuCorp** — http://duefectucorp.com/
- **Leslie Greenhalgh**
- **Richard Faulkner**

```Apologies if I've missed anyone — there have been loads of people who've helped over the years. Cheers to all of you!```

👉 **[Full credits and support links →](./Docs/Contributions.md)**

---

## 📝 **Notices**

- **NextBuild Studio** and its components are © 2025 **David Saphier**, unless otherwise noted.
- **Boriel Basic** is © José Rodríguez
- **CSpect** is © Mike Dailly

---
