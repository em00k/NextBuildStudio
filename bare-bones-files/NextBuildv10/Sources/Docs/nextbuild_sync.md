# 💾 <span style="color:#4ec9b0;">The `!nb` Directive — Loaders & HDF Sync</span>

`'!nb=` does two jobs in one line: it generates a **NextBASIC loader** for your
compiled program, and it **syncs the build into the HDF image** so you can run
it under NextZXOS in the emulator.

---

## 🚀 **The Short Version**

```basic
'!org=32768
'!nb=autostart(dir=/games)

PRINT "Hello, Next!"
```

That builds `mygame.nex`, writes `mygame_loader.bas` beside it, copies the
loader to `/nextzxos/autoexec.bas` on the HDF image, and syncs the NEX and
everything in your project's `data` folder to `/games`.

Then use the **Start NextZXOS** action button to boot the image.

---

## 📐 **Syntax**

```basic
'!nb=template
'!nb=template(param=value,param=value,...)
```

The directive must be in the first 64 lines of your `.bas` file.

---

## 🧩 **Templates**

| Template | What the loader does |
|---|---|
| `autostart` | Loads the NEX and saves itself as `/nextzxos/autoexec.bas`, so it runs on boot |
| `loader` | Loads the NEX from the current directory. No auto-copy |
| `nex` | The same as `loader` |
| `binary` | `CLEAR`, `LOAD ... CODE`, `RANDOMIZE USR` — for `.bin` builds |
| `development` | A development loader |

---

## ⚙️ **Parameters**

| Parameter | Description | Example |
|---|---|---|
| `dir` | Target directory on the HDF image. Also switches HDF syncing on | `dir=/games` |
| `sync` | How much to sync — see below | `sync=modules` |
| `files` | Which files to sync when `sync=selective` | `files=sprites.spr,music.pt3` |
| `copy` | Where to put the loader on the HDF image | `copy=/nextzxos/autoexec.bas` |
| `basic` | A text file of extra BASIC lines to fold into the loader | `basic=my_custom.txt` |

`--address` is filled in from your `'!org=` automatically, so the `binary`
template gets the right load address without being told.

### Sync modes

| Mode | Syncs |
|---|---|
| `all` *(default)* | NEX/BIN, loader, and everything in `data` |
| `nex` | NEX/BIN and loader only — no data files |
| `modules` | NEX/BIN, loader, and `Module*.bin` from `data` |
| `selective` | NEX/BIN, loader, and just the names listed in `files` |

<div class="note">
💡 <code>sync=all</code> <strong>upgrades itself to <code>modules</code></strong>
if the project looks like a module project — the file is called
<code>master</code>, or its name starts with <code>module</code>, or there are
<code>Module*.bin</code> files in <code>data</code>. The build prints
<em>"Auto-detected module project"</em> when this happens.
</div>

---

## 📄 **The `files` List**

Names are relative to your project's `data` folder. Separate them with commas,
semicolons or pipes — all three work:

```basic
'!nb=nex(dir=/demos,sync=selective,files=sprites.spr,music.pt3,tiles.til)
'!nb=nex(dir=/demos,sync=selective,files=sprites.spr;music.pt3)
'!nb=nex(dir=/demos,sync=selective,files=sprites.spr|music.pt3)
```

A name that does not exist in `data` is skipped with a warning rather than
failing the build, so check the output if a file does not appear.

---

## 📁 **Syncing Without a Loader**

If you only want files on the HDF image and no BASIC loader, use `'!hdf=`:

```basic
'!org=32768
'!hdf=games              ' sync to /games, no loader generated
```

`'!nb=(dir=...)` takes priority over `'!hdf=` when both are present. With
neither, nothing is synced.

---

## 🧪 **Examples**

### A game that boots straight into itself

```basic
'!org=32768
'!nb=autostart(dir=/games)
```

- writes `mygame_loader.bas`
- copies it to `/nextzxos/autoexec.bas`
- syncs `mygame.nex` to `/games/`
- syncs everything in `data` to `/games/data/`

### A module project

```basic
'!org=24576
'!nb=loader(dir=/dev,sync=modules)
```

- writes `master_loader.bas` to `/dev/`
- syncs `Module*.bin` from `data`, nothing else

### Only the two files you changed

```basic
'!org=49152
'!nb=nex(dir=/demos,sync=selective,files=sprites.spr,music.pt3)
```

### Extra BASIC in the loader

Put your lines in a text file in the project folder — say `my_custom.txt`:

```basic
100 BORDER 2
110 PAPER 0: INK 7
120 CLS
```

Then point at it:

```basic
'!nb=loader(basic=my_custom.txt,dir=/games)
```

---

## 🔧 **How It Works**

1. `nextbuild.py` finds `'!nb=` in the first 64 lines and stores the template
   name and its parameters
2. `CreateBasicLoader()` maps the template name, then calls
   `nextbuild_basic.py`, which builds the BASIC text and hands it to
   `txt2nextbasic.py` to tokenise
3. The loader is written next to your source as `{filename}_loader.bas`
4. `sync_to_hdf()` copies the NEX/BIN, the loader and the data files into the
   HDF image with `hdfmonkey`

The loader goes to `copy=` if you gave one, `/nextzxos/autoexec.bas` if the
template name contains "autostart", and otherwise alongside the NEX in `dir`.

---

## 🩺 **Troubleshooting**

| Symptom | Cause |
|---|---|
| No loader appears | Template name not recognised — check the table above, and read the build output for the error |
| "HDF image file not found" | Check the image path in `nextbuild.config` |
| "hdfmonkey tool not found" | Check the tool path in `nextbuild.config` |
| Nothing syncs at all | No `dir=` in `'!nb=` and no `'!hdf=` |
| A data file is missing on the image | It is not in `data`, or it is not in the `files=` list under `sync=selective` |
| Custom BASIC ignored | The `basic=` file must be in the project folder; a missing file is reported and skipped |

---

## Links

* [Settings](Settings.md) — image and tool paths
* [Code Banks](CodeBanks.md)
* [Templates](Templates.md)
* [Keyboard & Controls](KeyboardInput.md)
