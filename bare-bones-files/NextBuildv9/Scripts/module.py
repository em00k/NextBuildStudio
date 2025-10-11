#!/usr/bin/env python3
"""
Part of the NextBuild project by em00k
https://github.com/em00k/NextBuildStudio

Enhanced GUI frontend for NextBuildStudio with improved interface

Uses tkinter for the GUI. Configures the locations for the core components and tools.
"""

import sys
import subprocess, os, platform
import time
import glob
import shutil  # pyright: ignore[reportUnusedImport]
import os

# os.environ['TCL_LIBRARY'] = r'zxbasic/python/tcl/tcl8.6'
# os.environ['TK_LIBRARY'] = r'zxbasic/python/tcl/tk8.6'

os.environ['TCL_LIBRARY'] = os.path.join(sys.exec_prefix, 'tcl', 'tcl8.6')
os.environ['TK_LIBRARY'] = os.path.join(sys.exec_prefix, 'tcl', 'tk8.6')

from tkinter import *
from tkinter.ttk import Progressbar
from tkinter.ttk import Combobox
from tkinter.ttk import Notebook
from tkinter import ttk
import tkinter.font
from tkinter import filedialog
from tkinter import messagebox
from tkinter import scrolledtext

# Global variables
global inputfilea, BASE_DIR

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))
SCRIPTS_DIR = os.path.abspath(os.path.join(BASE_DIR, 'Scripts'))  # ZX BASIC root path
CONFIG_PATH = os.path.join(SCRIPTS_DIR, 'nextbuild.config')

# Check if a file parameter was given
if len(sys.argv) > 1:
    inputfilea = sys.argv[1]
    # If the path is absolute, use it as is
    if os.path.isabs(inputfilea):
        head_tail = os.path.split(inputfilea)
    else:
        # Relative path - normalize it
        inputfilea = os.path.abspath(inputfilea)
        head_tail = os.path.split(inputfilea)

    sys.path.append(head_tail[0])  # add to paths
else:
    inputfilea = None
    head_tail = (os.getcwd(), "")  # Default to current directory

# Function to read configuration file
def read_config(config_path):
    config = {}
    if os.path.exists(config_path):
        print(f"Reading configuration from: {config_path}")
        with open(config_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                # Parse key=value pairs
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    else:
        print(f"Configuration file not found: {config_path}")
    return config

# Function to save configuration file
def save_config(config_path, config):
    with open(config_path, 'w') as f:
        f.write("# NextBuild Configuration File\n")
        f.write("# Paths to major components and tools\n\n")

        f.write("# Core directories\n")
        for key in ['CSPECT', 'ZXBASIC', 'TOOLS']:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# File paths \n")
        for key in ['IMG_FILE']:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# External tools\n")
        for key in ['HDFMONKEY']:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# CSpect settings\n")
        for key in ['CSPECT_ARGS']:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        f.write("\n# Additional settings (optional)\n")
        for key in ['DEFAULT_HEAP', 'DEFAULT_ORG', 'DEFAULT_OPTIMIZE']:
            if key in config:
                f.write(f"{key}={config[key]}\n")

        # Write NextZXOS related settings
        if 'NEXTZXOS_ENABLED' in config:
            f.write("\n# NextZXOS settings\n")
            f.write(f"NEXTZXOS_ENABLED={config['NEXTZXOS_ENABLED']}\n")
            if 'NEXTZXOS_PATH' in config:
                f.write(f"NEXTZXOS_PATH={config['NEXTZXOS_PATH']}\n")

def center(win):
    """
    centers a tkinter window on the screen where the mouse pointer is located
    :param win: the main window or Toplevel window to center
    """
    win.update_idletasks()
    width = win.winfo_width()
    frm_width = win.winfo_rootx() - win.winfo_x()
    win_width = width + 2 * frm_width
    height = win.winfo_height()
    titlebar_height = win.winfo_rooty() - win.winfo_y()
    win_height = height + titlebar_height + frm_width

    # Get mouse pointer position to determine which screen to center on
    try:
        mouse_x = win.winfo_pointerx()
        mouse_y = win.winfo_pointery()

        # Get total screen dimensions across all monitors
        total_width = win.winfo_screenwidth()
        total_height = win.winfo_screenheight()

        # Determine which monitor/screen the mouse is on
        # Assume common monitor setup: primary monitor is typically 1920x1080 or similar
        primary_monitor_width = 1920
        primary_monitor_height = 1080

        # Check if mouse is on secondary monitor (assuming horizontal layout)
        if mouse_x > primary_monitor_width:
            # Mouse is on secondary monitor - center on that monitor
            # Assume secondary monitor has same dimensions as primary
            screen_center_x = primary_monitor_width + (primary_monitor_width // 2)
            screen_center_y = primary_monitor_height // 2
        else:
            # Mouse is on primary monitor - center on primary monitor
            screen_center_x = primary_monitor_width // 2
            screen_center_y = primary_monitor_height // 2

        # Position window centered on the determined screen
        x = screen_center_x - (win_width // 2)
        y = screen_center_y - (win_height // 2)

        # Ensure the window stays within total screen bounds
        if x < 0:
            x = 0
        elif x + win_width > total_width:
            x = total_width - win_width

        if y < 0:
            y = 0
        elif y + win_height > total_height:
            y = total_height - win_height

    except:
        # Fallback to simple centering if pointer detection fails
        total_width = win.winfo_screenwidth()
        total_height = win.winfo_screenheight()
        x = total_width // 2 - win_width // 2
        y = total_height // 2 - win_height // 2

    win.geometry('{}x{}+{}+{}'.format(width, height, x, y))
    win.deiconify()

class ConfigWindow:
    def __init__(self, parent):
        self.parent = parent
        self.config = read_config(CONFIG_PATH)
        self.create_window()

    def create_window(self):
        self.window = Toplevel(self.parent)
        self.window.title("NextBuild Configuration")
        self.window.configure(bg="#2d2d2d")
        self.window.geometry("700x550")
        self.window.resizable(False, False)
        self.window.transient(self.parent)  # Set as transient to parent
        self.window.grab_set()  # Make it modal
        self.window.attributes('-topmost', True)  # Keep on top
        center(self.window)

        style = ttk.Style()
        style.configure('TLabel', background='#2d2d2d', foreground='#e0e0e0', font=("Segoe UI", 9))
        style.configure('TButton', background='#2d2d2d', foreground='#e0e0e0', font=("Segoe UI", 9))
        style.configure('TEntry', fieldbackground='#404040', foreground='#ffffff', font=("Segoe UI", 9))
        style.configure('TFrame', background='#2d2d2d')
        style.configure('TCheckbutton', background='#2d2d2d', foreground='#e0e0e0', font=("Segoe UI", 9))
        style.configure('TCombobox', fieldbackground='#404040', foreground='#ffffff', font=("Segoe UI", 9))

        notebook = ttk.Notebook(self.window)
        notebook.pack(fill=BOTH, expand=True, padx=15, pady=15)

        # Paths Tab
        paths_frame = ttk.Frame(notebook)
        notebook.add(paths_frame, text="Paths")

        # Core directories section
        ttk.Label(paths_frame, text="Core Directories:", font=("Segoe UI", 11, "bold")).grid(row=0, column=0, sticky=W, padx=10, pady=(20,10))

        row = 1
        # CSPECT
        ttk.Label(paths_frame, text="CSpect Emulator:").grid(row=row, column=0, sticky=W, padx=10)
        self.cspect_var = StringVar(value=self.config.get('CSPECT', 'Emu/CSpect'))
        cspect_entry = ttk.Entry(paths_frame, textvariable=self.cspect_var, width=40)
        cspect_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(paths_frame, text="Browse", command=lambda: self.browse_directory(self.cspect_var)).grid(row=row, column=2, padx=5)

        row += 1
        # ZXBASIC
        ttk.Label(paths_frame, text="ZX Basic:").grid(row=row, column=0, sticky=W, padx=10)
        self.zxbasic_var = StringVar(value=self.config.get('ZXBASIC', 'zxbasic'))
        zxbasic_entry = ttk.Entry(paths_frame, textvariable=self.zxbasic_var, width=40)
        zxbasic_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(paths_frame, text="Browse", command=lambda: self.browse_directory(self.zxbasic_var)).grid(row=row, column=2, padx=5)

        row += 1
        # TOOLS
        ttk.Label(paths_frame, text="Tools:").grid(row=row, column=0, sticky=W, padx=10)
        self.tools_var = StringVar(value=self.config.get('TOOLS', 'Tools'))
        tools_entry = ttk.Entry(paths_frame, textvariable=self.tools_var, width=40)
        tools_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(paths_frame, text="Browse", command=lambda: self.browse_directory(self.tools_var)).grid(row=row, column=2, padx=5)

        row += 1
        # File paths section
        ttk.Label(paths_frame, text="File Paths:", font=("Segoe UI", 11, "bold")).grid(row=row, column=0, sticky=W, padx=10, pady=(25,10))

        row += 1
        # IMG_FILE
        ttk.Label(paths_frame, text="Image File:").grid(row=row, column=0, sticky=W, padx=10)
        self.img_file_var = StringVar(value=self.config.get('IMG_FILE', 'Files/2GB.img'))
        img_file_entry = ttk.Entry(paths_frame, textvariable=self.img_file_var, width=40)
        img_file_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(paths_frame, text="Browse", command=lambda: self.browse_file(self.img_file_var)).grid(row=row, column=2, padx=5)

        row += 1
        # External tools section
        ttk.Label(paths_frame, text="External Tools:", font=("Segoe UI", 11, "bold")).grid(row=row, column=0, sticky=W, padx=10, pady=(25,10))

        row += 1
        # HDFMONKEY
        ttk.Label(paths_frame, text="HDFMonkey:").grid(row=row, column=0, sticky=W, padx=10)
        self.hdfmonkey_var = StringVar(value=self.config.get('HDFMONKEY', 'Tools/hdfmonkey.exe'))
        hdfmonkey_entry = ttk.Entry(paths_frame, textvariable=self.hdfmonkey_var, width=40)
        hdfmonkey_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(paths_frame, text="Browse", command=lambda: self.browse_file(self.hdfmonkey_var, [("Executable files", "*.exe")])).grid(row=row, column=2, padx=5)

        # CSpect Tab
        cspect_frame = ttk.Frame(notebook)
        notebook.add(cspect_frame, text="CSpect")

        # CSpect settings section
        ttk.Label(cspect_frame, text="CSpect Settings:", font=("Segoe UI", 11, "bold")).grid(row=0, column=0, sticky=W, padx=10, pady=(20,10))

        row = 1
        # CSPECT_ARGS
        ttk.Label(cspect_frame, text="Arguments:").grid(row=row, column=0, sticky=W, padx=10)
        self.cspect_args_var = StringVar(value=self.config.get('CSPECT_ARGS', ''))
        cspect_args_entry = ttk.Entry(cspect_frame, textvariable=self.cspect_args_var, width=40)
        cspect_args_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)

        # Add help text for CSpect arguments
        ttk.Label(cspect_frame, text="Example: -w3 -vsync -tv", font=("Segoe UI", 8), foreground="#888888").grid(row=row+1, column=1, sticky=W, padx=5, pady=(0,15))

        # Settings Tab
        settings_frame = ttk.Frame(notebook)
        notebook.add(settings_frame, text="Settings")

        # Compiler settings section
        ttk.Label(settings_frame, text="Compiler Settings:", font=("Segoe UI", 11, "bold")).grid(row=0, column=0, sticky=W, padx=10, pady=(20,10))

        row = 1
        # DEFAULT_HEAP
        ttk.Label(settings_frame, text="Default Heap Size:").grid(row=row, column=0, sticky=W, padx=10)
        self.heap_var = StringVar(value=self.config.get('DEFAULT_HEAP', '8192'))
        heap_entry = ttk.Entry(settings_frame, textvariable=self.heap_var, width=20)
        heap_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)

        row += 1
        # DEFAULT_ORG
        ttk.Label(settings_frame, text="Default ORG:").grid(row=row, column=0, sticky=W, padx=10)
        self.org_var = StringVar(value=self.config.get('DEFAULT_ORG', '32768'))
        org_entry = ttk.Entry(settings_frame, textvariable=self.org_var, width=20)
        org_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)

        row += 1
        # DEFAULT_OPTIMIZE
        ttk.Label(settings_frame, text="Default Optimization Level:").grid(row=row, column=0, sticky=W, padx=10)
        self.optimize_var = StringVar(value=self.config.get('DEFAULT_OPTIMIZE', '3'))
        optimize_combo = ttk.Combobox(settings_frame, textvariable=self.optimize_var, width=17, state="readonly")
        optimize_combo['values'] = ('0', '1', '2', '3', '4')
        optimize_combo.grid(row=row, column=1, sticky=W, padx=5, pady=8)

        # NextZXOS Tab
        nextzxos_frame = ttk.Frame(notebook)
        notebook.add(nextzxos_frame, text="NextZXOS")

        # NextZXOS settings
        ttk.Label(nextzxos_frame, text="NextZXOS Settings:", font=("Segoe UI", 11, "bold")).grid(row=0, column=0, sticky=W, padx=10, pady=(20,10))

        row = 1
        # NEXTZXOS_ENABLED
        self.nextzxos_enabled_var = BooleanVar(value=self.config.get('NEXTZXOS_ENABLED', 'false').lower() == 'true')
        nextzxos_check = ttk.Checkbutton(nextzxos_frame, text="Enable NextZXOS Support", variable=self.nextzxos_enabled_var)
        nextzxos_check.grid(row=row, column=0, sticky=W, padx=10, pady=8, columnspan=2)

        row += 1
        # NEXTZXOS_PATH
        ttk.Label(nextzxos_frame, text="NextZXOS Path:").grid(row=row, column=0, sticky=W, padx=10)
        self.nextzxos_path_var = StringVar(value=self.config.get('NEXTZXOS_PATH', ''))
        nextzxos_entry = ttk.Entry(nextzxos_frame, textvariable=self.nextzxos_path_var, width=40)
        nextzxos_entry.grid(row=row, column=1, sticky=W, padx=5, pady=8)
        ttk.Button(nextzxos_frame, text="Browse", command=lambda: self.browse_directory(self.nextzxos_path_var)).grid(row=row, column=2, padx=5)

        # Button frame at the bottom
        button_frame = ttk.Frame(self.window)
        button_frame.pack(fill=X, padx=15, pady=15)

        ttk.Button(button_frame, text="Save", command=self.save_settings).pack(side=RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=self.window.destroy).pack(side=RIGHT, padx=5)

        # Ensure window stays on top during file/folder browsing
        self.window.focus_set()

    def browse_directory(self, var):
        self.window.attributes('-topmost', False)  # Temporarily disable topmost
        directory = filedialog.askdirectory(initialdir=os.path.join(BASE_DIR, var.get()))
        self.window.attributes('-topmost', True)  # Re-enable topmost
        self.window.focus_force()  # Bring window back to focus

        if directory:
            # Convert to relative path if possible
            try:
                rel_path = os.path.relpath(directory, BASE_DIR)
                var.set(rel_path)
            except ValueError:
                # If relative path can't be created (different drives etc), use absolute
                var.set(directory)

    def browse_file(self, var, filetypes=None):
        if filetypes is None:
            filetypes = [("All files", "*.*")]

        self.window.attributes('-topmost', False)  # Temporarily disable topmost
        file_path = filedialog.askopenfilename(
            initialdir=os.path.dirname(os.path.join(BASE_DIR, var.get())),
            filetypes=filetypes
        )
        self.window.attributes('-topmost', True)  # Re-enable topmost
        self.window.focus_force()  # Bring window back to focus

        if file_path:
            # Convert to relative path if possible
            try:
                rel_path = os.path.relpath(file_path, BASE_DIR)
                var.set(rel_path)
            except ValueError:
                # If relative path can't be created (different drives etc), use absolute
                var.set(file_path)

    def validate_settings(self):
        """Validate the current settings before saving"""
        try:
            # Validate numeric values
            int(self.heap_var.get())
            int(self.org_var.get())
            int(self.optimize_var.get())
            return True
        except ValueError:
            messagebox.showerror("Validation Error", "Heap size, ORG and Optimization level must be valid numbers")
            return False

    def save_settings(self):
        """Save the settings to the config file"""
        if not self.validate_settings():
            return

        # Update config dictionary
        self.config['CSPECT'] = self.cspect_var.get()
        self.config['ZXBASIC'] = self.zxbasic_var.get()
        self.config['TOOLS'] = self.tools_var.get()
        self.config['IMG_FILE'] = self.img_file_var.get()
        self.config['HDFMONKEY'] = self.hdfmonkey_var.get()
        self.config['CSPECT_ARGS'] = self.cspect_args_var.get()
        self.config['DEFAULT_HEAP'] = self.heap_var.get()
        self.config['DEFAULT_ORG'] = self.org_var.get()
        self.config['DEFAULT_OPTIMIZE'] = self.optimize_var.get()
        self.config['NEXTZXOS_ENABLED'] = str(self.nextzxos_enabled_var.get()).lower()
        self.config['NEXTZXOS_PATH'] = self.nextzxos_path_var.get()

        # Save to file
        try:
            save_config(CONFIG_PATH, self.config)
            # Temporarily disable topmost attribute for the messagebox
            self.window.attributes('-topmost', False)
            # Create a temporary topmost window for the messagebox
            temp_window = Toplevel(self.window)
            temp_window.withdraw()  # Hide the window
            temp_window.attributes('-topmost', True)
            messagebox.showinfo("Success", "Configuration saved successfully")
            temp_window.destroy()  # Clean up the temporary window
            # Close the window after showing the success message
            self.window.destroy()
        except Exception as e:
            # Also disable topmost for error messages
            self.window.attributes('-topmost', False)
            # Create a temporary topmost window for the error messagebox
            temp_window = Toplevel(self.window)
            temp_window.withdraw()  # Hide the window
            temp_window.attributes('-topmost', True)
            messagebox.showerror("Error", f"Failed to save configuration: {str(e)}")
            temp_window.destroy()  # Clean up the temporary window
            # Re-enable topmost if there was an error (window stays open)
            self.window.attributes('-topmost', True)
            self.window.focus_force()

class Widget1():
    def __init__(self, parent):
        self.gui(parent)

    def gui(self, parent):
        if parent == 0:
            self.w1 = Tk()
            self.w1.configure(bg='#2d2d2d')
            self.w1.geometry('600x320')
            self.w1.title('NextBuild v9 - Enhanced GUI')
        else:
            self.w1 = Frame(parent)
            self.w1.configure(bg='#2d2d2d')
            self.w1.place(x=0, y=0, width=600, height=320)

        # Main title
        title_label = Label(self.w1, text="NextBuild v9", font=("Segoe UI", 16, "bold"),
                           bg='#2d2d2d', fg='#00aaff', cursor="arrow")
        title_label.place(x=20, y=15, width=200, height=30)

        # Status indicator
        self.status_label = Label(self.w1, text="Ready", font=("Segoe UI", 9),
                                 bg='#2d2d2d', fg='#00ff00', cursor="arrow")
        self.status_label.place(x=480, y=20, width=100, height=20)

        # Build and Launch button
        self.buttonlaunch = Button(self.w1, text="Build & Launch",
                                  bg="#007acc", fg="white",
                                  font=("Segoe UI", 10, "bold"),
                                  cursor="hand2", state="normal",
                                  relief="raised", borderwidth=2)
        self.buttonlaunch.place(x=40, y=70, width=150, height=40)
        self.buttonlaunch.focus_set()
        self.buttonlaunch['command'] = self.BuildModule

        # Build and Launch description
        self.label1 = Label(self.w1, text="Build module and launch in CSpect\n[F5] or [Return]",
                           bg='#2d2d2d', fg='#c0c0c0', font=("Segoe UI", 9),
                           cursor="arrow", justify=LEFT)
        self.label1.place(x=210, y=65, width=250, height=45)

        # Build All Modules button
        self.buttonall = Button(self.w1, text="Build All Modules",
                               bg="#28a745", fg="white",
                               font=("Segoe UI", 10, "bold"),
                               cursor="hand2", state="normal",
                               relief="raised", borderwidth=2)
        self.buttonall.place(x=40, y=125, width=150, height=40)
        self.buttonall['command'] = self.BuildAll

        # Build All description
        self.label3 = Label(self.w1, text="Build all modules and run main Nex\n[F6]",
                           bg='#2d2d2d', fg='#c0c0c0', font=("Segoe UI", 9),
                           cursor="arrow", justify=LEFT)
        self.label3.place(x=210, y=120, width=250, height=45)

        # Build for NextZXOS button
        self.buttonzxos = Button(self.w1, text="Build for NextZXOS",
                                bg="#ffc107", fg="black",
                                font=("Segoe UI", 10, "bold"),
                                cursor="hand2", state="normal",
                                relief="raised", borderwidth=2)
        self.buttonzxos.place(x=40, y=180, width=150, height=40)
        self.buttonzxos['command'] = self.BuildForNextZXOS

        # NextZXOS description
        self.label4 = Label(self.w1, text="Build and prepare for NextZXOS\n[F7]",
                           bg='#2d2d2d', fg='#c0c0c0', font=("Segoe UI", 9),
                           cursor="arrow", justify=LEFT)
        self.label4.place(x=210, y=175, width=250, height=45)

        # Configuration button
        self.buttonconfig = Button(self.w1, text="Configuration",
                                  bg="#6c757d", fg="white",
                                  font=("Segoe UI", 10, "bold"),
                                  cursor="hand2", state="normal",
                                  relief="raised", borderwidth=2)
        self.buttonconfig.place(x=40, y=235, width=150, height=40)
        self.buttonconfig['command'] = self.EditConfig

        # Configuration description
        self.label5 = Label(self.w1, text="Edit NextBuild configuration\n[E]",
                           bg='#2d2d2d', fg='#c0c0c0', font=("Segoe UI", 9),
                           cursor="arrow", justify=LEFT)
        self.label5.place(x=210, y=230, width=250, height=45)

        # Current file indicator
        file_text = f"Current file: {os.path.basename(inputfilea) if inputfilea else 'None'}"
        self.file_label = Label(self.w1, text=file_text, font=("Segoe UI", 8),
                               bg='#2d2d2d', fg='#888888', cursor="arrow")
        self.file_label.place(x=20, y=290, width=400, height=20)

        # Update button states based on whether a file is selected
        if inputfilea is None:
            self.buttonlaunch.config(state="disabled", bg="#404040")
            self.buttonall.config(state="disabled", bg="#404040")
            self.buttonzxos.config(state="disabled", bg="#404040")
            self.label1.config(text="No file selected. Configure settings first.")
            self.label3.config(text="No file selected. Configure settings first.")
            self.label4.config(text="No file selected. Configure settings first.")
            self.status_label.config(text="No file selected", fg="#ff6b6b")

    def execute_script(self, script_name, args=None):
        script_path = os.path.join(BASE_DIR, "Scripts", script_name)
        if not os.path.exists(script_path):
            print(f"Script not found: {script_path}")
            self.status_label.config(text="Script not found", fg="#ff6b6b")
            return 1

        cmd = [sys.executable, script_path]
        if args:
            cmd.extend(args)

        try:
            print(f"Executing: {' '.join(cmd)}")
            self.status_label.config(text="Building...", fg="#ffff00")
            self.w1.update()

            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            stdout, stderr = process.communicate()

            if stdout:
                print(stdout)
            if stderr:
                print(f"Error: {stderr}")

            if process.returncode == 0:
                self.status_label.config(text="Success", fg="#00ff00")
            else:
                self.status_label.config(text="Failed", fg="#ff6b6b")

            return process.returncode
        except Exception as e:
            print(f"Error executing script: {str(e)}")
            self.status_label.config(text="Error", fg="#ff6b6b")
            return 1

    def BuildModule(self):
        """Build a single module file"""
        print('BuildModule')

        # Check if input file is selected
        if not inputfilea:
            print("No input file selected")
            self.status_label.config(text="No file selected", fg="#ff6b6b")
            return

        print(inputfilea)
        # Launch build.py with -s flag and the input filename to compile single file
        result = self.execute_script("build.py", ["-s", "-b", inputfilea])

    def BuildAll(self):
        """Build all module files"""
        print("BuildAll")

        # Check if input file is selected
        if not inputfilea:
            print("No input file selected")
            self.status_label.config(text="No file selected", fg="#ff6b6b")
            return

        # Launch build.py with -m flag and the input filename to compile all modules
        result1 = self.execute_script("build.py", ["-m", "-b", inputfilea])
        if result1 != 0:
            print("Error building modules")
            return

        # Execute the modules with -e flag and the input filename
        result2 = self.execute_script("build.py", ["-e", "-b", inputfilea])
        if result2 != 0:
            print("Error executing modules")

    def BuildForNextZXOS(self):
        """Build for NextZXOS"""
        print("BuildForNextZXOS")

        # Check if input file is selected
        if not inputfilea:
            print("No input file selected")
            self.status_label.config(text="No file selected", fg="#ff6b6b")
            return

        # Launch build.py with -n flag and the input filename to compile for NextZXOS
        result = self.execute_script("build.py", ["-s", "-b", inputfilea])
        if result != 0:
            print("Error building for NextZXOS")

    def EditConfig(self):
        print('EditConfig')
        config_window = ConfigWindow(self.w1)

    def setup_environment(self):
        """Set up the environment for running ZX BASIC compiler"""
        config = read_config(CONFIG_PATH)

        # Get the zxbasic directory from config (fix double zxbasic path if needed)
        zxbasic_path = config.get('ZXBASIC', 'zxbasic')

        # Check if the path has a double "zxbasic" issue
        if "zxbasic\\zxbasic" in zxbasic_path:
            # Fix the path to use only one level
            zxbasic_path = "zxbasic"

        zxbasic_dir = os.path.abspath(os.path.join(BASE_DIR, zxbasic_path))

        # Look for the Python executable in the zxbasic directory
        if platform.system() == 'Windows':
            python_path = os.path.join(zxbasic_dir, 'python', 'python.exe')
        else:
            python_path = os.path.join(zxbasic_dir, 'python', 'python3')

        # Check if the Python executable exists
        if not os.path.exists(python_path):
            print(f"Python interpreter not found at: {python_path}")
            # Fall back to system Python
            python_path = sys.executable

        return config, python_path

def Quit(e):
    a.w1.destroy()

if __name__ == '__main__':
    a = Widget1(0)
    center(a.w1)
    a.w1.bind("<Escape>", Quit)
    a.w1.bind("<F5>", lambda e: a.BuildModule())
    a.w1.bind("<Return>", lambda e: a.BuildModule())
    a.w1.bind("<F6>", lambda e: a.BuildAll())
    a.w1.bind("<F7>", lambda e: a.BuildForNextZXOS())
    a.w1.bind("<e>", lambda e: a.EditConfig())

    try:
        a.w1.iconphoto(False, tkinter.PhotoImage(file=os.path.join(BASE_DIR, 'Scripts', 'imgs', 'nextbuild.png')))
    except:
        # Don't fail if the icon is missing
        pass

    a.buttonlaunch.focus_set()
    a.w1.mainloop()
