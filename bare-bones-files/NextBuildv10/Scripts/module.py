#!/usr/bin/env python3
"""
Part of the NextBuild project by em00k
https://github.com/em00k/NextBuildStudio

GUI frontend for NextBuildStudio. Rewritten to avoid ttk widgets so the
dark theme renders consistently on Windows and Linux.
"""

import json
import os
import platform
import re
import subprocess
import sys
from tkinter import (
    BooleanVar,
    Button,
    Canvas,
    Checkbutton,
    Entry,
    Frame,
    Label,
    Menu,
    OptionMenu,
    PhotoImage,
    StringVar,
    Tk,
    Toplevel,
    filedialog,
)

os.environ["TCL_LIBRARY"] = os.path.join(sys.exec_prefix, "tcl", "tcl8.6")
os.environ["TK_LIBRARY"] = os.path.join(sys.exec_prefix, "tcl", "tk8.6")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))
SCRIPTS_DIR = os.path.abspath(os.path.join(BASE_DIR, "Scripts"))
CONFIG_PATH = os.path.join(SCRIPTS_DIR, "nextbuild.config")
VSCODE_SETTINGS = os.path.join(BASE_DIR, "Sources", ".vscode", "settings.json")
DEFAULT_EXPLORER_EXCLUDES = [
    "**/*.bin",
    "**/*.cfg",
    "**/*.json",
    "**/.vscode",
]

if len(sys.argv) > 1:
    inputfilea = sys.argv[1]
    if not os.path.isabs(inputfilea):
        inputfilea = os.path.abspath(inputfilea)
    head_tail = os.path.split(inputfilea)
    sys.path.append(head_tail[0])
else:
    inputfilea = None
    head_tail = (os.getcwd(), "")


# ---------------------------------------------------------------------------
# Theme
# ---------------------------------------------------------------------------

class Theme:
    BG = "#1e1e1e"
    CARD = "#252525"
    HEADER = "#0d47a1"
    HEADER_SUB = "#bbdefb"
    ACCENT = "#0078d4"
    ACCENT_HOVER = "#106ebe"
    ACCENT_PRESS = "#005a9e"
    PURPLE = "#5c2d91"
    PURPLE_HOVER = "#4c2577"
    SECONDARY = "#5c5c5c"
    SECONDARY_HOVER = "#6c6c6c"
    TEXT = "#ffffff"
    BODY = "#e0e0e0"
    MUTED = "#888888"
    ENTRY_BG = "#2d2d2d"
    ENTRY_BG_FOCUS = "#333333"
    ENTRY_BORDER = "#3a3a3a"
    ENTRY_BORDER_FOCUS = "#0078d4"
    TAB_BG = "#252525"
    TAB_IDLE = "#c0c0c0"
    DISABLED = "#404040"
    SUCCESS = "#00ff00"
    FAIL = "#ff6b6b"
    BUSY = "#ffa500"
    FOOTER = "#252525"


def _enable_windows_dpi():
    if platform.system() != "Windows":
        return
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        try:
            from ctypes import windll
            windll.user32.SetProcessDPIAware()
        except Exception:
            pass


def _font_family():
    if platform.system() == "Windows":
        return "Segoe UI"
    return "DejaVu Sans"


class UIScale:
    """Scale fonts and pixel sizes from screen DPI so Windows 125/150% stays readable."""

    def __init__(self, root):
        try:
            dpi = float(root.winfo_fpixels("1i"))
        except Exception:
            dpi = 96.0
        self.factor = max(1.0, dpi / 96.0)
        self.family = _font_family()

    def px(self, n):
        return int(round(n * self.factor))

    def font(self, size, weight="normal"):
        return (self.family, max(8, int(round(size * self.factor))), weight)


# ---------------------------------------------------------------------------
# Config I/O
# ---------------------------------------------------------------------------

def read_config(config_path):
    config = {}
    if os.path.exists(config_path):
        print(f"Reading configuration from: {config_path}")
        with open(config_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    config[key.strip()] = value.strip()
    else:
        print(f"Configuration file not found: {config_path}")
    return config


def save_config(config_path, config):
    with open(config_path, "w") as f:
        f.write("# NextBuild Configuration File\n")
        f.write("# Paths to major components and tools\n\n")

        f.write("# Core directories\n")
        for key in ["CSPECT", "ZXBASIC", "TOOLS"]:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# File paths \n")
        for key in ["IMG_FILE"]:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# External tools\n")
        for key in ["HDFMONKEY"]:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# CSpect settings\n")
        for key in ["CSPECT_ARGS"]:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# Additional settings (optional)\n")
        for key in ["DEFAULT_HEAP", "DEFAULT_ORG", "DEFAULT_OPTIMIZE"]:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        if "NEXTZXOS_ENABLED" in config:
            f.write("\n# NextZXOS settings\n")
            f.write(f"NEXTZXOS_ENABLED={config['NEXTZXOS_ENABLED']}\n")
            if "NEXTZXOS_PATH" in config:
                f.write(f"NEXTZXOS_PATH={config['NEXTZXOS_PATH']}\n")


def load_vscode_settings(path=VSCODE_SETTINGS):
    if not os.path.exists(path):
        return {}
    text = open(path, "r", encoding="utf-8").read()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        text = re.sub(r",\s*([}\]])", r"\1", text)
        return json.loads(text)


def save_vscode_settings(settings, path=VSCODE_SETTINGS):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)
        f.write("\n")


def center(win):
    win.update_idletasks()
    width = win.winfo_width()
    height = win.winfo_height()
    frm_width = win.winfo_rootx() - win.winfo_x()
    titlebar_height = win.winfo_rooty() - win.winfo_y()
    win_width = width + 2 * frm_width
    win_height = height + titlebar_height + frm_width

    try:
        mouse_x = win.winfo_pointerx()
        mouse_y = win.winfo_pointery()
        screen_w = win.winfo_screenwidth()
        screen_h = win.winfo_screenheight()
        x = mouse_x - (win_width // 2)
        y = mouse_y - (win_height // 2)
        x = max(0, min(x, screen_w - win_width))
        y = max(0, min(y, screen_h - win_height))
    except Exception:
        x = win.winfo_screenwidth() // 2 - win_width // 2
        y = win.winfo_screenheight() // 2 - win_height // 2

    win.geometry(f"{width}x{height}+{x}+{y}")
    win.deiconify()


def _hover(widget, idle, hover):
    widget.bind("<Enter>", lambda _e: widget.configure(bg=hover))
    widget.bind("<Leave>", lambda _e: widget.configure(bg=idle))


def _version_sort_key(name):
    parts = tuple(int(p) for p in re.findall(r"\d+", name))
    return parts if parts else (0,)


def list_prefix_dirs(parent_dir, prefix):
    """Directory names in parent_dir that start with prefix (files/archives skipped)."""
    if not os.path.isdir(parent_dir):
        return []
    prefix_l = prefix.lower()
    names = []
    for name in os.listdir(parent_dir):
        if not name.lower().startswith(prefix_l):
            continue
        if os.path.isdir(os.path.join(parent_dir, name)):
            names.append(name)
    names.sort(key=_version_sort_key, reverse=True)
    return names


def zxbasic_choices():
    return [(name, name) for name in list_prefix_dirs(BASE_DIR, "zxbasic")]


def cspect_choices():
    emu = os.path.join(BASE_DIR, "Emu")
    return [(name, "Emu/" + name) for name in list_prefix_dirs(emu, "CSpect")]


# ---------------------------------------------------------------------------
# Custom widgets (tk only — ttk looks native/broken on Windows)
# ---------------------------------------------------------------------------

def make_button(parent, text, command, ui, kind="accent", width=None):
    colors = {
        "accent": (Theme.ACCENT, Theme.ACCENT_HOVER),
        "secondary": (Theme.SECONDARY, Theme.SECONDARY_HOVER),
        "purple": (Theme.PURPLE, Theme.PURPLE_HOVER),
    }
    idle, hover = colors[kind]
    btn = Button(
        parent,
        text=text,
        command=command,
        bg=idle,
        fg=Theme.TEXT,
        activebackground=hover,
        activeforeground=Theme.TEXT,
        font=ui.font(10, "bold") if kind != "secondary" else ui.font(10),
        relief="flat",
        bd=0,
        highlightthickness=0,
        cursor="hand2",
        padx=ui.px(16),
        pady=ui.px(7),
    )
    if width is not None:
        btn.configure(width=width)
    _hover(btn, idle, hover)
    return btn


def make_entry(parent, textvariable, ui):
    entry = Entry(
        parent,
        textvariable=textvariable,
        bg=Theme.ENTRY_BG,
        fg=Theme.TEXT,
        insertbackground=Theme.TEXT,
        disabledbackground=Theme.DISABLED,
        disabledforeground=Theme.MUTED,
        font=ui.font(10),
        relief="flat",
        bd=0,
        highlightthickness=1,
        highlightbackground=Theme.ENTRY_BORDER,
        highlightcolor=Theme.ENTRY_BORDER_FOCUS,
    )
    entry.bind("<FocusIn>", lambda _e: entry.configure(bg=Theme.ENTRY_BG_FOCUS))
    entry.bind("<FocusOut>", lambda _e: entry.configure(bg=Theme.ENTRY_BG))
    return entry


class Card(Frame):
    def __init__(self, parent, ui, **kwargs):
        super().__init__(parent, bg=Theme.CARD, highlightthickness=0, bd=0, **kwargs)
        pad = ui.px(14)
        self.inner = Frame(self, bg=Theme.CARD)
        self.inner.pack(fill="x", padx=pad, pady=pad)

    def title(self, text, ui):
        Label(
            self.inner,
            text=text,
            bg=Theme.CARD,
            fg=Theme.TEXT,
            font=ui.font(10, "bold"),
            anchor="w",
        ).pack(anchor="w")

    def hint(self, text, ui, italic=False):
        font = ui.font(9)
        if italic:
            font = (font[0], font[1], "italic")
        Label(
            self.inner,
            text=text,
            bg=Theme.CARD,
            fg=Theme.MUTED,
            font=font,
            anchor="w",
        ).pack(anchor="w", pady=(ui.px(2), 0))


class PathRow(Card):
    def __init__(self, parent, ui, title, variable, on_browse):
        super().__init__(parent, ui)
        self.title(title, ui)
        row = Frame(self.inner, bg=Theme.CARD)
        row.pack(fill="x", pady=(ui.px(8), 0))
        row.columnconfigure(0, weight=1)
        entry = make_entry(row, variable, ui)
        entry.grid(row=0, column=0, sticky="ew", padx=(0, ui.px(10)), ipady=ui.px(5))
        make_button(row, "Browse...", on_browse, ui, kind="secondary").grid(row=0, column=1)


class SelectPathRow(Card):
    """Path picker: click the current folder name for a dropdown, or Browse."""

    def __init__(self, parent, ui, title, variable, choices, on_browse):
        super().__init__(parent, ui)
        self.ui = ui
        self.variable = variable
        self.choices = list(choices)
        self.title(title, ui)

        row = Frame(self.inner, bg=Theme.CARD)
        row.pack(fill="x", pady=(ui.px(8), 0))
        row.columnconfigure(0, weight=1)

        self.trigger = Frame(
            row,
            bg=Theme.ENTRY_BG,
            highlightthickness=1,
            highlightbackground=Theme.ENTRY_BORDER,
            cursor="hand2",
        )
        self.trigger.grid(row=0, column=0, sticky="ew", padx=(0, ui.px(10)))

        self.name_label = Label(
            self.trigger,
            text="",
            bg=Theme.ENTRY_BG,
            fg=Theme.TEXT,
            font=ui.font(10),
            anchor="w",
            cursor="hand2",
        )
        self.name_label.pack(side="left", fill="x", expand=True, padx=ui.px(8), pady=ui.px(6))

        self.chevron = Label(
            self.trigger,
            text="▾",
            bg=Theme.ENTRY_BG,
            fg=Theme.MUTED,
            font=ui.font(10),
            cursor="hand2",
        )
        self.chevron.pack(side="right", padx=ui.px(8))

        for widget in (self.trigger, self.name_label, self.chevron):
            widget.bind("<Button-1>", self._open_menu)
            widget.bind("<Enter>", self._on_enter)
            widget.bind("<Leave>", self._on_leave)

        make_button(row, "Browse...", on_browse, ui, kind="secondary").grid(row=0, column=1)

        self.menu = Menu(
            self.trigger,
            tearoff=0,
            bg=Theme.ENTRY_BG,
            fg=Theme.TEXT,
            activebackground=Theme.ACCENT,
            activeforeground=Theme.TEXT,
            bd=0,
            font=ui.font(10),
        )
        self.variable.trace_add("write", lambda *_a: self._refresh_label())
        self._refresh_label()

    def _on_enter(self, _event=None):
        for widget in (self.trigger, self.name_label, self.chevron):
            widget.configure(bg=Theme.ENTRY_BG_FOCUS)
        self.trigger.configure(highlightbackground=Theme.ENTRY_BORDER_FOCUS)

    def _on_leave(self, _event=None):
        for widget in (self.trigger, self.name_label, self.chevron):
            widget.configure(bg=Theme.ENTRY_BG)
        self.trigger.configure(highlightbackground=Theme.ENTRY_BORDER)

    def _norm(self, value):
        return os.path.normpath(str(value).replace("\\", "/"))

    def _current_label(self):
        value = self.variable.get()
        current = self._norm(value)
        for label, val in self.choices:
            if self._norm(val) == current:
                return label
        name = os.path.basename(value.replace("\\", "/").rstrip("/"))
        return name or value

    def _refresh_label(self):
        self.name_label.configure(text=self._current_label())

    def _menu_items(self):
        items = list(self.choices)
        current = self.variable.get()
        if current and not any(self._norm(val) == self._norm(current) for _label, val in items):
            items.append((self._current_label(), current))
        return items

    def _open_menu(self, _event=None):
        self.menu.delete(0, "end")
        for label, val in self._menu_items():
            self.menu.add_radiobutton(label=label, value=val, variable=self.variable)
        self.menu.tk_popup(
            self.trigger.winfo_rootx(),
            self.trigger.winfo_rooty() + self.trigger.winfo_height(),
        )


class TabBar(Frame):
    def __init__(self, parent, ui, tabs, on_change):
        super().__init__(parent, bg=Theme.TAB_BG, highlightthickness=0)
        self.ui = ui
        self.on_change = on_change
        self.buttons = {}
        self.current = tabs[0][0]
        Frame(self, bg=Theme.ACCENT, height=ui.px(2)).pack(side="bottom", fill="x")
        row = Frame(self, bg=Theme.TAB_BG)
        row.pack(fill="x")
        for key, label in tabs:
            btn = Button(
                row,
                text=label,
                command=lambda k=key: self.select(k),
                bg=Theme.TAB_BG,
                fg=Theme.TAB_IDLE,
                activebackground=Theme.HEADER,
                activeforeground=Theme.TEXT,
                font=ui.font(10),
                relief="flat",
                bd=0,
                highlightthickness=0,
                takefocus=0,
                padx=ui.px(14),
                pady=ui.px(10),
                cursor="hand2",
            )
            btn.pack(side="left")
            self.buttons[key] = btn
        self._style_tabs(self.current)

    def _style_tabs(self, key):
        for k, btn in self.buttons.items():
            if k == key:
                btn.configure(bg=Theme.HEADER, fg=Theme.TEXT, font=self.ui.font(10, "bold"))
            else:
                btn.configure(bg=Theme.TAB_BG, fg=Theme.TAB_IDLE, font=self.ui.font(10))

    def select(self, key):
        self.current = key
        self._style_tabs(key)
        self.on_change(key)


class ActionCard(Frame):
    def __init__(self, parent, ui, x, y, width, height, button_text, kind, command, title, shortcut):
        super().__init__(parent, bg=Theme.CARD, highlightthickness=0, bd=0)
        self.place(x=x, y=y, width=width, height=height)
        pad = ui.px(15)
        btn_w = ui.px(180)
        btn_h = ui.px(40)
        self.button = make_button(self, button_text, command, ui, kind=kind)
        self.button.place(x=pad, y=(height - btn_h) // 2, width=btn_w, height=btn_h)
        text_x = pad + btn_w + ui.px(15)
        self.title_label = Label(
            self,
            text=title,
            bg=Theme.CARD,
            fg=Theme.BODY,
            font=ui.font(10, "bold"),
            anchor="w",
        )
        self.title_label.place(x=text_x, y=ui.px(14))
        self.desc_label = Label(
            self,
            text=shortcut,
            bg=Theme.CARD,
            fg=Theme.MUTED,
            font=ui.font(9),
            anchor="w",
        )
        self.desc_label.place(x=text_x, y=ui.px(36))


# ---------------------------------------------------------------------------
# Configuration window
# ---------------------------------------------------------------------------

class ConfigWindow:
    def __init__(self, parent, ui):
        self.parent = parent
        self.ui = ui
        self.config = read_config(CONFIG_PATH)
        self.pages = {}
        self.create_window()

    def create_window(self):
        ui = self.ui
        self.window = Toplevel(self.parent)
        self.window.title("NextBuild Configuration")
        self.window.configure(bg=Theme.BG)
        self.window.geometry(f"{ui.px(760)}x{ui.px(640)}")
        self.window.resizable(False, False)
        self.window.transient(self.parent)
        self.window.grab_set()
        try:
            self.window.attributes("-topmost", True)
        except Exception:
            pass
        center(self.window)

        header = Frame(self.window, bg=Theme.HEADER, height=ui.px(60))
        header.pack(fill="x")
        header.pack_propagate(False)
        Label(
            header,
            text="Configuration",
            font=ui.font(18, "bold"),
            bg=Theme.HEADER,
            fg=Theme.TEXT,
        ).pack(side="left", padx=ui.px(20), pady=ui.px(14))
        Label(
            header,
            text="Configure NextBuild paths and settings",
            font=ui.font(9),
            bg=Theme.HEADER,
            fg=Theme.HEADER_SUB,
        ).pack(side="left", padx=(0, ui.px(20)), pady=ui.px(14))

        tabs = [
            ("paths", "Paths"),
            ("cspect", "CSpect"),
            ("settings", "Settings"),
            ("nextzxos", "NextZXOS"),
            ("editor", "Editor"),
        ]
        self.tab_bar = TabBar(self.window, ui, tabs, self._show_page)
        self.tab_bar.pack(fill="x")

        self.body = Frame(self.window, bg=Theme.BG)
        self.body.pack(fill="both", expand=True)

        footer = Frame(self.window, bg=Theme.FOOTER, height=ui.px(64))
        footer.pack(fill="x", side="bottom")
        footer.pack_propagate(False)
        self.status_label = Label(
            footer,
            text="",
            bg=Theme.FOOTER,
            fg=Theme.SUCCESS,
            font=ui.font(10),
            anchor="w",
        )
        self.status_label.pack(side="left", padx=ui.px(20), pady=ui.px(20))
        make_button(footer, "Save Configuration", self.save_settings, ui, kind="accent").pack(
            side="right", padx=ui.px(16), pady=ui.px(14)
        )
        make_button(footer, "Cancel", self.window.destroy, ui, kind="secondary").pack(
            side="right", padx=(0, ui.px(8)), pady=ui.px(14)
        )

        self._build_paths()
        self._build_cspect()
        self._build_settings()
        self._build_nextzxos()
        self._build_editor()
        self._show_page("paths")
        self.window.focus_set()

    def _page(self, key):
        page = Frame(self.body, bg=Theme.BG)
        self.pages[key] = page
        return page

    def _show_page(self, key):
        if key not in self.pages:
            return
        for page in self.pages.values():
            page.pack_forget()
        self.pages[key].pack(fill="both", expand=True)

    def _section(self, parent, text, top=0):
        Label(
            parent,
            text=text,
            bg=Theme.BG,
            fg=Theme.TEXT,
            font=self.ui.font(12, "bold"),
            anchor="w",
        ).pack(anchor="w", pady=(self.ui.px(top), self.ui.px(10)))

    def _build_paths(self):
        ui = self.ui
        page = self._page("paths")

        canvas = Canvas(page, bg=Theme.BG, highlightthickness=0, bd=0)
        canvas.pack(side="left", fill="both", expand=True, padx=ui.px(20), pady=ui.px(16))
        inner = Frame(canvas, bg=Theme.BG)
        window_id = canvas.create_window((0, 0), window=inner, anchor="nw")

        def _sync_width(event):
            canvas.itemconfigure(window_id, width=event.width)

        def _sync_scroll(_event):
            canvas.configure(scrollregion=canvas.bbox("all"))

        canvas.bind("<Configure>", _sync_width)
        inner.bind("<Configure>", _sync_scroll)

        def _on_wheel(event):
            if event.num == 5 or (getattr(event, "delta", 0) < 0):
                canvas.yview_scroll(1, "units")
            else:
                canvas.yview_scroll(-1, "units")

        def _bind_wheel(_event=None):
            canvas.bind_all("<MouseWheel>", _on_wheel)
            canvas.bind_all("<Button-4>", _on_wheel)
            canvas.bind_all("<Button-5>", _on_wheel)

        def _unbind_wheel(_event=None):
            canvas.unbind_all("<MouseWheel>")
            canvas.unbind_all("<Button-4>")
            canvas.unbind_all("<Button-5>")

        canvas.bind("<Enter>", _bind_wheel)
        canvas.bind("<Leave>", _unbind_wheel)
        inner.bind("<Enter>", _bind_wheel)
        inner.bind("<Leave>", _unbind_wheel)
        self.window.bind("<Destroy>", _unbind_wheel, add="+")

        self.cspect_var = StringVar(value=self.config.get("CSPECT", "Emu/CSpect"))
        self.zxbasic_var = StringVar(value=self.config.get("ZXBASIC", "zxbasic"))
        self.tools_var = StringVar(value=self.config.get("TOOLS", "Tools"))
        self.img_file_var = StringVar(value=self.config.get("IMG_FILE", "Files/2GB.img"))
        self.hdfmonkey_var = StringVar(value=self.config.get("HDFMONKEY", "Tools/hdfmonkey.exe"))

        self._section(inner, "Core Directories")
        SelectPathRow(
            inner, ui, "CSpect Emulator", self.cspect_var, cspect_choices(),
            lambda: self.browse_directory(self.cspect_var),
        ).pack(fill="x", pady=(0, ui.px(10)))
        SelectPathRow(
            inner, ui, "ZX Basic Compiler", self.zxbasic_var, zxbasic_choices(),
            lambda: self.browse_directory(self.zxbasic_var),
        ).pack(fill="x", pady=(0, ui.px(10)))
        PathRow(inner, ui, "Tools Directory", self.tools_var,
                lambda: self.browse_directory(self.tools_var)).pack(fill="x", pady=(0, ui.px(10)))

        self._section(inner, "File Paths", top=16)
        PathRow(inner, ui, "Disk Image File", self.img_file_var,
                lambda: self.browse_file(self.img_file_var)).pack(fill="x", pady=(0, ui.px(10)))

        self._section(inner, "External Tools", top=16)
        PathRow(
            inner, ui, "HDFMonkey Executable", self.hdfmonkey_var,
            lambda: self.browse_file(self.hdfmonkey_var, [("Executable files", "*.exe"), ("All files", "*.*")]),
        ).pack(fill="x", pady=(0, ui.px(10)))

    def _build_cspect(self):
        ui = self.ui
        page = self._page("cspect")
        content = Frame(page, bg=Theme.BG)
        content.pack(fill="both", expand=True, padx=ui.px(20), pady=ui.px(16))
        self._section(content, "CSpect Emulator Settings")

        card = Card(content, ui)
        card.pack(fill="x")
        card.title("Command Line Arguments", ui)
        card.hint("Additional arguments to pass to CSpect emulator", ui)
        self.cspect_args_var = StringVar(value=self.config.get("CSPECT_ARGS", ""))
        make_entry(card.inner, self.cspect_args_var, ui).pack(fill="x", pady=(ui.px(8), 0), ipady=ui.px(5))
        card.hint("Example: -w3 -vsync -tv", ui, italic=True)

    def _build_settings(self):
        ui = self.ui
        page = self._page("settings")
        content = Frame(page, bg=Theme.BG)
        content.pack(fill="both", expand=True, padx=ui.px(20), pady=ui.px(16))
        self._section(content, "Compiler Settings")

        heap = Card(content, ui)
        heap.pack(fill="x", pady=(0, ui.px(10)))
        heap.title("Default Heap Size", ui)
        heap.hint("Memory allocated for heap (in bytes)", ui)
        self.heap_var = StringVar(value=self.config.get("DEFAULT_HEAP", "8192"))
        make_entry(heap.inner, self.heap_var, ui).pack(anchor="w", pady=(ui.px(8), 0), ipady=ui.px(5))

        org = Card(content, ui)
        org.pack(fill="x", pady=(0, ui.px(10)))
        org.title("Default ORG Address", ui)
        org.hint("Starting memory address for compiled code", ui)
        self.org_var = StringVar(value=self.config.get("DEFAULT_ORG", "32768"))
        make_entry(org.inner, self.org_var, ui).pack(anchor="w", pady=(ui.px(8), 0), ipady=ui.px(5))

        opt = Card(content, ui)
        opt.pack(fill="x")
        opt.title("Default Optimization Level", ui)
        opt.hint("Compiler optimization level (0=none, 4=maximum)", ui)
        choices = (
            "0 - No optimization",
            "1 - Basic",
            "2 - Moderate",
            "3 - Recommended",
            "4 - Maximum",
        )
        saved = self.config.get("DEFAULT_OPTIMIZE", "3")
        initial = next((c for c in choices if c.startswith(str(saved))), choices[3])
        self.optimize_var = StringVar(value=initial)
        menu = OptionMenu(opt.inner, self.optimize_var, *choices)
        menu.configure(
            bg=Theme.ENTRY_BG,
            fg=Theme.TEXT,
            activebackground=Theme.ACCENT,
            activeforeground=Theme.TEXT,
            highlightthickness=1,
            highlightbackground=Theme.ENTRY_BORDER,
            bd=0,
            relief="flat",
            font=ui.font(10),
            cursor="hand2",
        )
        menu["menu"].configure(
            bg=Theme.ENTRY_BG,
            fg=Theme.TEXT,
            activebackground=Theme.ACCENT,
            activeforeground=Theme.TEXT,
            bd=0,
            font=ui.font(10),
        )
        menu.pack(anchor="w", pady=(ui.px(8), 0))

    def _build_nextzxos(self):
        ui = self.ui
        page = self._page("nextzxos")
        content = Frame(page, bg=Theme.BG)
        content.pack(fill="both", expand=True, padx=ui.px(20), pady=ui.px(16))
        self._section(content, "NextZXOS Settings")

        enable = Card(content, ui)
        enable.pack(fill="x", pady=(0, ui.px(10)))
        self.nextzxos_enabled_var = BooleanVar(
            value=self.config.get("NEXTZXOS_ENABLED", "false").lower() == "true"
        )
        Checkbutton(
            enable.inner,
            text="Enable NextZXOS Support",
            variable=self.nextzxos_enabled_var,
            bg=Theme.CARD,
            fg=Theme.BODY,
            activebackground=Theme.CARD,
            activeforeground=Theme.TEXT,
            selectcolor=Theme.ENTRY_BG,
            highlightthickness=0,
            bd=0,
            font=ui.font(10),
            cursor="hand2",
        ).pack(anchor="w")
        enable.hint("Build programs for the NextZXOS operating system", ui)

        self.nextzxos_path_var = StringVar(value=self.config.get("NEXTZXOS_PATH", ""))
        PathRow(
            content, ui, "NextZXOS Installation Path", self.nextzxos_path_var,
            lambda: self.browse_directory(self.nextzxos_path_var),
        ).pack(fill="x")

    def _dark_check(self, parent, text, var, ui):
        Checkbutton(
            parent,
            text=text,
            variable=var,
            bg=Theme.CARD,
            fg=Theme.BODY,
            activebackground=Theme.CARD,
            activeforeground=Theme.TEXT,
            selectcolor=Theme.ENTRY_BG,
            highlightthickness=0,
            bd=0,
            font=ui.font(10),
            cursor="hand2",
            anchor="w",
        ).pack(anchor="w", pady=(ui.px(2), 0))

    def _build_editor(self):
        ui = self.ui
        page = self._page("editor")
        content = Frame(page, bg=Theme.BG)
        content.pack(fill="both", expand=True, padx=ui.px(20), pady=ui.px(16))
        self._section(content, "VS Code Explorer")

        vscode = load_vscode_settings()
        current = vscode.get("files.exclude") or {}
        if not isinstance(current, dict):
            current = {}

        patterns = list(DEFAULT_EXPLORER_EXCLUDES)
        for key in current:
            if key not in patterns:
                patterns.append(key)

        hide_on = any(current.get(p) is True for p in patterns)
        self.explorer_hide_var = BooleanVar(value=hide_on)

        master = Card(content, ui)
        master.pack(fill="x", pady=(0, ui.px(10)))
        self._dark_check(master.inner, "Hide clutter in Explorer", self.explorer_hide_var, ui)
        master.hint("Writes files.exclude in Sources/.vscode/settings.json", ui)

        files = Card(content, ui)
        files.pack(fill="x", pady=(0, ui.px(10)))
        files.title("File types and folders to hide", ui)
        files.hint("Checked items are hidden when Explorer clutter is on", ui)
        self.exclude_list = Frame(files.inner, bg=Theme.CARD)
        self.exclude_list.pack(fill="x", pady=(ui.px(8), 0))
        self.exclude_vars = {}
        for pattern in patterns:
            var = BooleanVar(value=bool(current.get(pattern, pattern in DEFAULT_EXPLORER_EXCLUDES)))
            self.exclude_vars[pattern] = var
            self._dark_check(self.exclude_list, pattern, var, ui)

        add = Frame(files.inner, bg=Theme.CARD)
        add.pack(fill="x", pady=(ui.px(10), 0))
        add.columnconfigure(0, weight=1)
        self.exclude_new_var = StringVar()
        make_entry(add, self.exclude_new_var, ui).grid(
            row=0, column=0, sticky="ew", padx=(0, ui.px(10)), ipady=ui.px(5)
        )
        make_button(add, "Add", self._add_exclude_pattern, ui, kind="secondary").grid(row=0, column=1)

    def _add_exclude_pattern(self):
        pattern = self.exclude_new_var.get().strip()
        if not pattern:
            return
        if "/" not in pattern and "*" not in pattern:
            if pattern.startswith(".") and pattern.count(".") == 1 and len(pattern) <= 5:
                pattern = "**/*" + pattern
            elif not pattern.startswith("."):
                pattern = "**/*." + pattern
            else:
                pattern = "**/" + pattern
        if pattern in self.exclude_vars:
            self.exclude_vars[pattern].set(True)
            self.exclude_new_var.set("")
            return
        var = BooleanVar(value=True)
        self.exclude_vars[pattern] = var
        self._dark_check(self.exclude_list, pattern, var, self.ui)
        self.exclude_new_var.set("")

    def _save_explorer_excludes(self):
        settings = load_vscode_settings()
        excludes = dict(settings.get("files.exclude") or {})
        if not isinstance(excludes, dict):
            excludes = {}
        managed = set(self.exclude_vars) | set(DEFAULT_EXPLORER_EXCLUDES)
        if self.explorer_hide_var.get():
            for pattern, var in self.exclude_vars.items():
                if var.get():
                    excludes[pattern] = True
                else:
                    excludes.pop(pattern, None)
        else:
            for pattern in managed:
                excludes.pop(pattern, None)
        settings["files.exclude"] = excludes
        save_vscode_settings(settings)

    def browse_directory(self, var):
        try:
            self.window.attributes("-topmost", False)
        except Exception:
            pass
        directory = filedialog.askdirectory(initialdir=os.path.join(BASE_DIR, var.get()))
        try:
            self.window.attributes("-topmost", True)
        except Exception:
            pass
        self.window.focus_force()
        if directory:
            try:
                var.set(os.path.relpath(directory, BASE_DIR))
            except ValueError:
                var.set(directory)

    def browse_file(self, var, filetypes=None):
        if filetypes is None:
            filetypes = [("All files", "*.*")]
        try:
            self.window.attributes("-topmost", False)
        except Exception:
            pass
        file_path = filedialog.askopenfilename(
            initialdir=os.path.dirname(os.path.join(BASE_DIR, var.get())),
            filetypes=filetypes,
        )
        try:
            self.window.attributes("-topmost", True)
        except Exception:
            pass
        self.window.focus_force()
        if file_path:
            try:
                var.set(os.path.relpath(file_path, BASE_DIR))
            except ValueError:
                var.set(file_path)

    def validate_settings(self):
        try:
            int(self.heap_var.get())
            int(self.org_var.get())
            int(self.optimize_var.get().split(" ")[0])
            return True
        except ValueError:
            self._set_status("Heap size, ORG and Optimization level must be valid numbers", ok=False)
            return False

    def _set_status(self, text, ok=True):
        self.status_label.configure(text=text, fg=Theme.SUCCESS if ok else Theme.FAIL)

    def save_settings(self):
        if not self.validate_settings():
            return
        opt_value = self.optimize_var.get().split(" ")[0]
        self.config["CSPECT"] = self.cspect_var.get()
        self.config["ZXBASIC"] = self.zxbasic_var.get()
        self.config["TOOLS"] = self.tools_var.get()
        self.config["IMG_FILE"] = self.img_file_var.get()
        self.config["HDFMONKEY"] = self.hdfmonkey_var.get()
        self.config["CSPECT_ARGS"] = self.cspect_args_var.get()
        self.config["DEFAULT_HEAP"] = self.heap_var.get()
        self.config["DEFAULT_ORG"] = self.org_var.get()
        self.config["DEFAULT_OPTIMIZE"] = opt_value
        self.config["NEXTZXOS_ENABLED"] = str(self.nextzxos_enabled_var.get()).lower()
        self.config["NEXTZXOS_PATH"] = self.nextzxos_path_var.get()
        try:
            save_config(CONFIG_PATH, self.config)
            self._save_explorer_excludes()
            self._set_status("Configuration saved.")
        except Exception as e:
            self._set_status(f"Failed to save configuration: {e}", ok=False)


# ---------------------------------------------------------------------------
# Main window
# ---------------------------------------------------------------------------

class Widget1:
    def __init__(self, parent):
        self.gui(parent)

    def gui(self, parent):
        if parent == 0:
            self.w1 = Tk()
            self.ui = UIScale(self.w1)
            ui = self.ui
            self.w1.configure(bg=Theme.BG)
            self.w1.geometry(f"{ui.px(650)}x{ui.px(420)}")
            self.w1.title("NextBuild Studio")
            self.w1.resizable(False, False)
        else:
            self.w1 = Frame(parent)
            self.ui = UIScale(self.w1)
            ui = self.ui
            self.w1.configure(bg=Theme.BG)
            self.w1.place(x=0, y=0, width=ui.px(650), height=ui.px(420))

        w, h = ui.px(650), ui.px(420)
        header_h = ui.px(70)
        header = Frame(self.w1, bg=Theme.HEADER, height=header_h)
        header.place(x=0, y=0, width=w, height=header_h)

        Label(
            header,
            text="NextBuild v9",
            font=ui.font(20, "bold"),
            bg=Theme.HEADER,
            fg=Theme.TEXT,
        ).place(x=ui.px(25), y=ui.px(12))

        self.status_dot = Label(header, text="●", font=ui.font(14), bg=Theme.HEADER, fg=Theme.SUCCESS)
        self.status_dot.place(x=ui.px(525), y=ui.px(16))
        self.status_label = Label(
            header, text="Ready", font=ui.font(10), bg=Theme.HEADER, fg=Theme.TEXT, anchor="w"
        )
        self.status_label.place(x=ui.px(548), y=ui.px(20))

        file_text = os.path.basename(inputfilea) if inputfilea else "No file selected"
        self.file_label = Label(
            header, text=file_text, font=ui.font(9), bg=Theme.HEADER, fg=Theme.HEADER_SUB, anchor="w"
        )
        self.file_label.place(x=ui.px(25), y=ui.px(44), width=ui.px(480))

        content = Frame(self.w1, bg=Theme.BG)
        content.place(x=0, y=header_h, width=w, height=h - header_h)

        card_h = ui.px(70)
        gap = ui.px(10)
        y = ui.px(20)
        card_w = ui.px(610)

        self.card1 = ActionCard(
            content, ui, ui.px(20), y, card_w, card_h,
            "Build & Launch", "accent", self.BuildModule,
            "Build module and launch in CSpect", "Keyboard: [F5] or [Return]",
        )
        self.buttonlaunch = self.card1.button
        self.label1_title = self.card1.title_label
        self.label1_desc = self.card1.desc_label
        self.buttonlaunch.focus_set()

        y += card_h + gap
        self.card2 = ActionCard(
            content, ui, ui.px(20), y, card_w, card_h,
            "Build All Modules", "accent", self.BuildAll,
            "Build all modules and run main Nex", "Keyboard: [F6]",
        )
        self.buttonall = self.card2.button
        self.label3_title = self.card2.title_label
        self.label3_desc = self.card2.desc_label

        y += card_h + gap
        self.card3 = ActionCard(
            content, ui, ui.px(20), y, card_w, card_h,
            "Build for NextZXOS", "accent", self.BuildForNextZXOS,
            "Build and prepare for NextZXOS", "Keyboard: [F7]",
        )
        self.buttonzxos = self.card3.button
        self.label4_title = self.card3.title_label
        self.label4_desc = self.card3.desc_label

        y += card_h + gap
        self.card4 = ActionCard(
            content, ui, ui.px(20), y, card_w, card_h,
            "Configuration", "purple", self.EditConfig,
            "Edit NextBuild configuration", "Keyboard: [E]",
        )
        self.buttonconfig = self.card4.button
        self.label5_title = self.card4.title_label
        self.label5_desc = self.card4.desc_label

        self.label1 = self.label1_title
        self.label3 = self.label3_title
        self.label4 = self.label4_title
        self.label5 = self.label5_title

        if inputfilea is None:
            for btn in (self.buttonlaunch, self.buttonall, self.buttonzxos):
                btn.configure(state="disabled", bg=Theme.DISABLED, cursor="arrow")
                btn.unbind("<Enter>")
                btn.unbind("<Leave>")
            for title, desc in (
                (self.label1_title, self.label1_desc),
                (self.label3_title, self.label3_desc),
                (self.label4_title, self.label4_desc),
            ):
                title.configure(text="No file selected")
                desc.configure(text="Please configure settings first")
            self.status_label.configure(text="No File", fg=Theme.FAIL)
            self.status_dot.configure(fg=Theme.FAIL)

    def execute_script(self, script_name, args=None):
        script_path = os.path.join(BASE_DIR, "Scripts", script_name)
        if not os.path.exists(script_path):
            print(f"Script not found: {script_path}")
            self.status_label.configure(text="Not Found")
            self.status_dot.configure(fg=Theme.FAIL)
            return 1

        cmd = [sys.executable, script_path]
        if args:
            cmd.extend(args)

        try:
            print(f"Executing: {' '.join(cmd)}")
            self.status_label.configure(text="Building...")
            self.status_dot.configure(fg=Theme.BUSY)
            self.w1.update()

            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            stdout, stderr = process.communicate()
            if stdout:
                print(stdout)
            if stderr:
                print(f"Error: {stderr}")

            if process.returncode == 0:
                self.status_label.configure(text="Success")
                self.status_dot.configure(fg=Theme.SUCCESS)
            else:
                self.status_label.configure(text="Failed")
                self.status_dot.configure(fg=Theme.FAIL)
            return process.returncode
        except Exception as e:
            print(f"Error executing script: {str(e)}")
            self.status_label.configure(text="Error")
            self.status_dot.configure(fg=Theme.FAIL)
            return 1

    def BuildModule(self):
        print("BuildModule")
        if not inputfilea:
            print("No input file selected")
            self.status_label.configure(text="No File")
            self.status_dot.configure(fg=Theme.FAIL)
            return
        print(inputfilea)
        self.execute_script("nextbuild.py", ["-s", "-b", inputfilea])

    def BuildAll(self):
        print("BuildAll")
        if not inputfilea:
            print("No input file selected")
            self.status_label.configure(text="No File")
            self.status_dot.configure(fg=Theme.FAIL)
            return
        result1 = self.execute_script("nextbuild.py", ["-m", "-b", inputfilea])
        if result1 != 0:
            print("Error building modules")
            return
        result2 = self.execute_script("build.py", ["-e", "-b", inputfilea])
        if result2 != 0:
            print("Error executing modules")

    def BuildForNextZXOS(self):
        print("BuildForNextZXOS")
        if not inputfilea:
            print("No input file selected")
            self.status_label.configure(text="No File")
            self.status_dot.configure(fg=Theme.FAIL)
            return
        result = self.execute_script("nextbuild.py", ["-s", "-b", inputfilea])
        if result != 0:
            print("Error building for NextZXOS")

    def EditConfig(self):
        print("EditConfig")
        ConfigWindow(self.w1, self.ui)

    def setup_environment(self):
        config = read_config(CONFIG_PATH)
        zxbasic_path = config.get("ZXBASIC", "zxbasic")
        if "zxbasic\\zxbasic" in zxbasic_path:
            zxbasic_path = "zxbasic"
        zxbasic_dir = os.path.abspath(os.path.join(BASE_DIR, zxbasic_path))
        if platform.system() == "Windows":
            python_path = os.path.join(zxbasic_dir, "python", "python.exe")
        else:
            python_path = os.path.join(zxbasic_dir, "python", "python3")
        if not os.path.exists(python_path):
            print(f"Python interpreter not found at: {python_path}")
            python_path = sys.executable
        return config, python_path


def Quit(e):
    a.w1.destroy()


if __name__ == "__main__":
    _enable_windows_dpi()
    a = Widget1(0)
    center(a.w1)
    a.w1.bind("<Escape>", Quit)
    a.w1.bind("<F5>", lambda e: a.BuildModule())
    a.w1.bind("<Return>", lambda e: a.BuildModule())
    a.w1.bind("<F6>", lambda e: a.BuildAll())
    a.w1.bind("<F7>", lambda e: a.BuildForNextZXOS())
    a.w1.bind("<e>", lambda e: a.EditConfig())
    try:
        a.w1.iconphoto(False, PhotoImage(file=os.path.join(BASE_DIR, "Scripts", "imgs", "nextbuild.png")))
    except Exception:
        pass
    a.buttonlaunch.focus_set()
    a.w1.mainloop()
