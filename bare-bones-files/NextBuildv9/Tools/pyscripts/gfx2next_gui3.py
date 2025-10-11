#!/usr/bin/env python3
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import subprocess, os, sys, json, time, struct, platform
import glob # Need this for scanning directory
import tempfile

# Try different ways to import PIL
try:
    from PIL import Image, ImageTk, ImageOps
except ImportError:
    print("PIL (Pillow) is required. Please install it with 'pip install pillow'", file=sys.stderr)
    sys.exit(1)

# Try to import TkinterDnD2 for drag & drop
try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    DRAG_DROP_SUPPORTED = True
except ImportError:
    DRAG_DROP_SUPPORTED = False
    print("TkinterDnD2 not found. Drag and drop will be disabled.", file=sys.stderr)
    print("Install with 'pip install tkinterdnd2' to enable drag and drop support.", file=sys.stderr)

class Gfx2NextGUI:
    def __init__(self, root):
        global DRAG_DROP_SUPPORTED
        
        self.root = root
        self.root.title("gfx2next GUI")
        self.root.geometry("1000x800")
        self.root.minsize(800, 600)

        # --- Initialize Internal State ---
        self.source_file = ""
        self.dest_file = ""
        self.preview_image = None
        self.source_preview_image = None
        self.original_source_image = None
        self._original_source_image_unmodified = None # Store the true original source
        self.original_preview_image = None
        self.zoomed_source_image = None
        self.zoomed_preview_image = None
        self.settings_file = "gfx2next_settings.json"
        self.theme = tk.StringVar(value="dark")  # Default to dark theme
        self.console_output = None
        self.source_zoom_level = 1.0 # Added for mouse wheel zoom
        self.preview_zoom_level = 1.0 # Added for mouse wheel zoom
        self.gfx2next_path_var = tk.StringVar(value="gfx2next") # Path/name for gfx2next
        self.profile_name_var = tk.StringVar() # Current settings profile name
        self.profile_dir = "gfx2next_profiles" # Directory to store profiles
        self.tooltip_window = None # For palette tooltips
        self.widgets = {} # Dictionary to hold widgets like canvases
        # Selection variables
        self.selection_start_x = 0
        self.selection_start_y = 0
        self.selection_rect_id = None
        self.source_is_cropped = False # Track if source has been modified
        self.temp_source_file = None # Temporary file path for cropped image
        # Variables for Block and Map options
        self.block_size_var = tk.StringVar()
        self.block_options = {}
        self.map_options = {}
        self.custom_args_var = tk.StringVar() # For custom arguments

        # --- Setup: Ensure profile directory exists ---
        os.makedirs(self.profile_dir, exist_ok=True)

        # --- Configure Root Layout ---
        root.grid_rowconfigure(2, weight=1) # Give Options/Preview row weight
        root.grid_columnconfigure(0, weight=3)
        root.grid_columnconfigure(1, weight=2)
        root.grid_rowconfigure(3, weight=0) # Console row no longer expands

        # --- Create UI Frames ---
        # (Frame creation unchanged...)
        # File selection frame (row 0)
        file_frame = ttk.LabelFrame(root, text="Files")
        file_frame.grid(row=0, column=0, columnspan=2, sticky="ew", padx=10, pady=10)
        file_frame.columnconfigure(1, weight=1)

        # Action Buttons Frame (Row 1)
        top_button_frame = ttk.Frame(root)
        top_button_frame.grid(row=1, column=0, columnspan=2, sticky="ew", padx=10, pady=(5, 5))

        # Options notebook frame (Row 2, Column 0)
        option_frame = ttk.LabelFrame(root, text="Options")
        option_frame.grid(row=2, column=0, sticky="nsew", padx=10, pady=5) # MOVED TO ROW 2
        option_frame.grid_rowconfigure(0, weight=1)
        option_frame.grid_columnconfigure(0, weight=1)

        # Preview panel container (Row 2, Column 1)
        preview_container = ttk.LabelFrame(root, text="Preview")
        preview_container.grid(row=2, column=1, sticky="nsew", padx=10, pady=5) # MOVED TO ROW 2
        preview_container.grid_columnconfigure(0, weight=1)
        preview_container.grid_columnconfigure(1, weight=0) # Palette fixed width
        preview_container.grid_rowconfigure(0, weight=1) # Source preview row
        preview_container.grid_rowconfigure(1, weight=1) # Converted preview row

        # Source preview frame (now inside preview_container column 0)
        source_preview = ttk.LabelFrame(preview_container, text="Source Image")
        source_preview.grid(row=0, column=0, sticky="nsew", padx=(5,0), pady=5) # Span internal row 0
        source_preview.grid_rowconfigure(0, weight=1) # Canvas row expands
        source_preview.grid_rowconfigure(1, weight=0) # Zoom controls fixed
        source_preview.grid_columnconfigure(0, weight=1)

        # Converted preview frame (now inside preview_container column 0)
        conv_preview = ttk.LabelFrame(preview_container, text="Converted Preview")
        conv_preview.grid(row=1, column=0, sticky="nsew", padx=(5,0), pady=5) # Span internal row 1
        conv_preview.grid_rowconfigure(0, weight=1) # Canvas row expands
        conv_preview.grid_rowconfigure(1, weight=0) # Zoom controls fixed
        conv_preview.grid_columnconfigure(0, weight=1)

        # Palette Frames/Canvases (inside preview_container column 1)
        self.source_palette_canvas = tk.Canvas(preview_container, width=235, height=235, borderwidth=1, relief="sunken")
        self.source_palette_canvas.grid(row=0, column=1, sticky="ns", padx=(2, 5), pady=5)
        self.preview_palette_canvas = tk.Canvas(preview_container, width=235, height=235, borderwidth=1, relief="sunken")
        self.preview_palette_canvas.grid(row=1, column=1, sticky="ns", padx=(2, 5), pady=5)

        # Console frame (Row 3)
        self.console_frame = ttk.LabelFrame(root, text="Console Output")
        self.console_frame.grid(row=3, column=0, columnspan=2, sticky="nsew", padx=10, pady=5) # MOVED TO ROW 3
        self.console_frame.grid_rowconfigure(0, weight=1)
        self.console_frame.grid_columnconfigure(0, weight=1)

        # --- Create UI Widgets --- 
        # (Ensure all widgets created before bindings/setup calls)

        # File Frame Widgets
        ttk.Label(file_frame, text="Source File:").grid(row=0, column=0, sticky="w", padx=5)
        self.source_entry = ttk.Entry(file_frame) # <<<< CREATE source_entry FIRST
        self.source_entry.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Button(file_frame, text="Browse...", command=self.browse_source).grid(row=0, column=2, padx=5)
        ttk.Label(file_frame, text="Destination File:").grid(row=1, column=0, sticky="w", padx=5)
        self.dest_entry = ttk.Entry(file_frame)
        self.dest_entry.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Button(file_frame, text="Browse...", command=self.browse_dest).grid(row=1, column=2, padx=5)
        ttk.Label(file_frame, text="Theme:").grid(row=0, column=3, sticky="w", padx=5)
        self.theme_menu = ttk.OptionMenu(file_frame, self.theme, self.theme.get(), "light", "dark", command=self.apply_theme)
        self.theme_menu.grid(row=0, column=4, padx=5)

        # Options Frame Widgets (Notebook)
        notebook = ttk.Notebook(option_frame)
        notebook.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self._build_notebook_tabs(notebook) # Populate notebook tabs

        # Source Preview Widgets
        self.widgets['source_canvas'] = tk.Canvas(source_preview, bg="white") # Store in dict
        self.widgets['source_canvas'].grid(row=0, column=0, sticky="nsew")
        source_zoom_frame = ttk.Frame(source_preview)
        source_zoom_frame.grid(row=1, column=0, sticky="ew")
        self.source_zoom_level_label = ttk.Label(source_zoom_frame, text="100%")
        self.source_zoom_level_label.pack(side=tk.RIGHT, padx=5)
        # Add Apply/Reload buttons for source selection
        source_button_frame = ttk.Frame(source_preview)
        source_button_frame.grid(row=2, column=0, sticky="ew", pady=(5,0))
        self.apply_selection_button = ttk.Button(source_button_frame, text="Apply Selection", command=self.apply_selection, state=tk.DISABLED)
        self.apply_selection_button.pack(side=tk.LEFT, padx=5)
        self.reload_preview_button = ttk.Button(source_button_frame, text="Reload Original Image", command=self.reload_original_preview, state=tk.DISABLED)
        self.reload_preview_button.pack(side=tk.LEFT, padx=5)

        # Converted Preview Widgets
        self.widgets['preview_canvas'] = tk.Canvas(conv_preview, bg="black") # Store in dict
        self.widgets['preview_canvas'].grid(row=0, column=0, sticky="nsew")
        conv_zoom_frame = ttk.Frame(conv_preview)
        conv_zoom_frame.grid(row=1, column=0, sticky="ew")
        self.preview_zoom_level_label = ttk.Label(conv_zoom_frame, text="100%")
        self.preview_zoom_level_label.pack(side=tk.RIGHT, padx=5)

        # Console Widget
        self.console_output = scrolledtext.ScrolledText(self.console_frame, wrap=tk.WORD, height=6)
        self.console_output.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self.console_output.configure(state="disabled")

        # Action Button Widgets
        style = ttk.Style()
        style.configure("Big.TButton", font=(None, 14, "bold"))
        self.convert_button = ttk.Button(top_button_frame, text="CONVERT!", style="Big.TButton", command=self.convert)
        self.convert_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.preview_button = ttk.Button(top_button_frame, text="Generate Preview", command=self.generate_preview)
        self.preview_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.save_button = ttk.Button(top_button_frame, text="Save Settings", command=self.save_settings)
        self.save_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.load_button = ttk.Button(top_button_frame, text="Load Settings", command=self.load_settings)
        self.load_button.pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Label(top_button_frame, text="Profile:").pack(side=tk.LEFT, padx=(10, 2), pady=5)
        self.profile_combo = ttk.Combobox(top_button_frame, textvariable=self.profile_name_var, width=20)
        self.profile_combo.pack(side=tk.LEFT, padx=(0, 5), pady=5)
        self.profile_combo.bind("<<ComboboxSelected>>", lambda event: self.load_settings())
        self.explore_button = ttk.Button(top_button_frame, text="Explore", command=self.explore_destination)
        self.explore_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.exit_button = ttk.Button(top_button_frame, text="Exit", command=root.destroy)
        self.exit_button.pack(side=tk.LEFT, padx=5, pady=5)

        # Status Bar
        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(root, textvariable=self.status_var, relief="sunken", anchor="w").grid(row=4, column=0, columnspan=2, sticky="ew")

        # --- Setup Drag & Drop (Now that source_entry exists) ---
        if DRAG_DROP_SUPPORTED:
            try:
                self.setup_drag_drop()
            except Exception as e:
                DRAG_DROP_SUPPORTED = False

        # --- Bind Events (Now that canvases exist) ---
        # Bind palette tooltip events
        self.source_palette_canvas.bind("<Motion>", self.show_palette_tooltip)
        self.source_palette_canvas.bind("<Leave>", self.hide_palette_tooltip)
        self.preview_palette_canvas.bind("<Motion>", self.show_palette_tooltip)
        self.preview_palette_canvas.bind("<Leave>", self.hide_palette_tooltip)

        # Bind panning events
        self.widgets['source_canvas'].bind("<ButtonPress-1>", self.on_canvas_press)
        self.widgets['source_canvas'].bind("<B1-Motion>", self.on_canvas_drag)
        self.widgets['source_canvas'].bind("<ButtonRelease-1>", self.on_canvas_release)
        self.widgets['preview_canvas'].bind("<ButtonPress-1>", self.on_canvas_press)
        self.widgets['preview_canvas'].bind("<B1-Motion>", self.on_canvas_drag)
        self.widgets['preview_canvas'].bind("<ButtonRelease-1>", self.on_canvas_release)
        # Add Enter/Leave bindings for crosshair cursor on source
        self.widgets['source_canvas'].bind("<Enter>", lambda e: e.widget.config(cursor="crosshair"))
        self.widgets['source_canvas'].bind("<Leave>", lambda e: e.widget.config(cursor=""))

        # Bind mouse wheel zoom events
        self.widgets['source_canvas'].bind("<MouseWheel>", self.on_mouse_wheel)
        self.widgets['source_canvas'].bind("<Button-4>", self.on_mouse_wheel) # Linux scroll up
        self.widgets['source_canvas'].bind("<Button-5>", self.on_mouse_wheel) # Linux scroll down
        self.widgets['preview_canvas'].bind("<MouseWheel>", self.on_mouse_wheel)
        self.widgets['preview_canvas'].bind("<Button-4>", self.on_mouse_wheel) # Linux scroll up
        self.widgets['preview_canvas'].bind("<Button-5>", self.on_mouse_wheel) # Linux scroll down
        # Bind selection events (right mouse button on source canvas)
        self.widgets['source_canvas'].bind("<ButtonPress-3>", self.on_selection_start)
        self.widgets['source_canvas'].bind("<B3-Motion>", self.on_selection_drag)
        self.widgets['source_canvas'].bind("<ButtonRelease-3>", self.on_selection_end)

        # --- Final Setup ---
        # 1. Populate profile list
        self.update_profile_list()
        # 2. Attempt to load the selected profile
        self.load_settings()
        # 3. Apply theme
        self.apply_theme(self.theme.get())
        # 4. Display initial source image
        if self.source_file and os.path.exists(self.source_file):
             self.display_source_image(self.source_file, self.widgets['source_canvas'])

    def _build_notebook_tabs(self, notebook):
        # Output Format tab
        format_frame = ttk.Frame(notebook)
        notebook.add(format_frame, text="Output Format")
        self.format_var = tk.StringVar(value="bitmap")
        formats = [
            ("Next Bitmap Mode (.nxi)", "bitmap"),
            ("Next Font Format (.spr)", "font"),
            ("Spectrum Screen Format (.scr)", "screen"),
            ("Next Sprite Mode (.spr)", "sprites"),
            ("Next Tile Mode (.nxt)", "tiles")
        ]
        for i, (text, val) in enumerate(formats):
            ttk.Radiobutton(format_frame, text=text, value=val, variable=self.format_var).grid(
                row=i, column=0, sticky="w", padx=10, pady=2
            )
        bmp_frame = ttk.LabelFrame(format_frame, text="Bitmap Options")
        bmp_frame.grid(row=0, column=1, rowspan=4, sticky="nsew", padx=10, pady=5)
        self.bitmap_y = tk.BooleanVar(value=False)
        ttk.Checkbutton(bmp_frame, text="Y order first", variable=self.bitmap_y).pack(anchor="w", padx=5, pady=2)
        ttk.Label(bmp_frame, text="Bitmap Size:").pack(anchor="w", padx=5, pady=2)
        self.bitmap_size = ttk.Entry(bmp_frame, width=10)
        self.bitmap_size.pack(anchor="w", padx=5, pady=2)
        ttk.Label(bmp_frame, text="Format: WxH (e.g. 16x16)").pack(anchor="w", padx=5)

        # Tiles tab
        tile_frame = ttk.Frame(notebook)
        notebook.add(tile_frame, text="Tiles")
        ttk.Label(tile_frame, text="Tile Size:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.tile_size = ttk.Entry(tile_frame, width=10)
        self.tile_size.grid(row=0, column=1, sticky="w", padx=5, pady=5)
        ttk.Label(tile_frame, text="Tile Offset:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.tile_offset = ttk.Entry(tile_frame, width=10)
        self.tile_offset.grid(row=1, column=1, sticky="w", padx=5, pady=5)
        self.tile_options = {
            "tile_norepeat": tk.BooleanVar(value=False),
            "tile_nomirror": tk.BooleanVar(value=False),
            "tile_norotate": tk.BooleanVar(value=False),
            "tile_y": tk.BooleanVar(value=False),
            "tile_ldws": tk.BooleanVar(value=False),
            "tile_offset_auto": tk.BooleanVar(value=False),
            "tile_none": tk.BooleanVar(value=False),
            "tile_planar4": tk.BooleanVar(value=False)
        }
        for i, (opt, var) in enumerate(self.tile_options.items()):
            row = 2 + i // 2
            col = (i % 2) * 2
            ttk.Checkbutton(tile_frame, text=opt.replace("_", "-"), variable=var).grid(
                row=row, column=col, columnspan=2, sticky="w", padx=5, pady=2
            )

        # --- Block Options --- 
        block_frame = ttk.LabelFrame(tile_frame, text="Block Options")
        block_frame.grid(row=6, column=0, columnspan=4, sticky="ew", padx=5, pady=10)
        ttk.Label(block_frame, text="Block Size (XxY or n):").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.block_size_entry = ttk.Entry(block_frame, width=10, textvariable=self.block_size_var)
        self.block_size_entry.grid(row=0, column=1, sticky="w", padx=5, pady=2)
        self.block_options["block_norepeat"] = tk.BooleanVar(value=False)
        self.block_options["block_16bit"] = tk.BooleanVar(value=False)
        ttk.Checkbutton(block_frame, text="-block-norepeat", variable=self.block_options["block_norepeat"]).grid(
            row=1, column=0, sticky="w", padx=5, pady=2
        )
        ttk.Checkbutton(block_frame, text="-block-16bit", variable=self.block_options["block_16bit"]).grid(
            row=1, column=1, sticky="w", padx=5, pady=2
        )
        
        # --- Map Options ---
        map_frame = ttk.LabelFrame(tile_frame, text="Map Options")
        map_frame.grid(row=7, column=0, columnspan=4, sticky="ew", padx=5, pady=5)
        self.map_options["map_none"] = tk.BooleanVar(value=False)
        self.map_options["map_16bit"] = tk.BooleanVar(value=False)
        ttk.Checkbutton(map_frame, text="-map-none", variable=self.map_options["map_none"]).grid(
            row=0, column=0, sticky="w", padx=5, pady=2
        )
        ttk.Checkbutton(map_frame, text="-map-16bit", variable=self.map_options["map_16bit"]).grid(
            row=0, column=1, sticky="w", padx=5, pady=2
        )

        # Colors tab
        color_frame = ttk.Frame(notebook)
        notebook.add(color_frame, text="Colors")
        ttk.Label(color_frame, text="Color Mode:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.color_mode = tk.StringVar(value="default")
        color_modes = [
            ("8-bit (256 colours) - Default", "default"),
            ("4-bit (16 colours)", "colors-4bit"),
            ("1-bit (2 colours)", "colors-1bit")
        ]
        for i, (txt, val) in enumerate(color_modes):
            ttk.Radiobutton(color_frame, text=txt, value=val, variable=self.color_mode).grid(
                row=i+1, column=0, sticky="w", padx=20, pady=2
            )
        ttk.Label(color_frame, text="Colour Calculation:").grid(row=0, column=1, sticky="w", padx=5, pady=5)
        self.color_calc = tk.StringVar(value="color-distance")
        color_calcs = [
            ("Shortest Distance (Default)", "color-distance"),
            ("Round Down", "color-floor"),
            ("Round Up", "color-ceil"),
            ("Round to Nearest", "color-round")
        ]
        for i, (txt, val) in enumerate(color_calcs):
            ttk.Radiobutton(color_frame, text=txt, value=val, variable=self.color_calc).grid(
                row=i+1, column=1, sticky="w", padx=20, pady=2
            )
        palette_frame = ttk.LabelFrame(color_frame, text="Palette File")
        palette_frame.grid(row=5, column=0, columnspan=2, sticky="ew", padx=5, pady=10)
        ttk.Label(palette_frame, text="Palette File:").grid(row=0, column=0, sticky="w", padx=5)
        self.pal_file_entry = ttk.Entry(palette_frame, width=30)
        self.pal_file_entry.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Button(palette_frame, text="Browse...", command=self.browse_palette).grid(row=0, column=2, padx=5)
        self.pal_options = {
            "pal_embed": tk.BooleanVar(value=False),
            "pal_ext": tk.BooleanVar(value=True),
            "pal_min": tk.BooleanVar(value=False),
            "pal_full": tk.BooleanVar(value=False),
            "pal_std": tk.BooleanVar(value=False),
            "pal_none": tk.BooleanVar(value=False),
            "pal_rgb332": tk.BooleanVar(value=False),
            "pal_bgr222": tk.BooleanVar(value=False),
            "pal_zx": tk.BooleanVar(value=False)
        }
        for i, (opt, var) in enumerate(self.pal_options.items()):
            row = 1 + i // 3
            col = i % 3
            ttk.Checkbutton(palette_frame, text=opt.replace("_", "-"), variable=var).grid(
                row=row, column=col, sticky="w", padx=5, pady=2
            )
        palette_frame.columnconfigure(1, weight=1)

        # Compression tab
        compression_frame = ttk.Frame(notebook)
        notebook.add(compression_frame, text="Compression")
        ttk.Label(compression_frame, text="ZX0 Compression Options:").grid(row=0, column=0, columnspan=3, sticky="w", padx=5, pady=5)
        self.compression_options = {
            "zx0": tk.BooleanVar(value=False),
            "zx0_screen": tk.BooleanVar(value=False),
            "zx0_bitmap": tk.BooleanVar(value=False),
            "zx0_sprites": tk.BooleanVar(value=False),
            "zx0_tiles": tk.BooleanVar(value=False),
            "zx0_blocks": tk.BooleanVar(value=False),
            "zx0_map": tk.BooleanVar(value=False),
            "zx0_palette": tk.BooleanVar(value=False),
            "zx0_back": tk.BooleanVar(value=False),
            "zx0_quick": tk.BooleanVar(value=False)
        }
        for idx, (opt, var) in enumerate(self.compression_options.items()):
            row = 1 + idx // 3
            col = idx % 3
            ttk.Checkbutton(compression_frame, text=opt.replace("_", "-"), variable=var).grid(
                row=row, column=col, sticky="w", padx=5, pady=2
            )

        # Settings tab
        settings_frame = ttk.Frame(notebook)
        notebook.add(settings_frame, text="Settings")
        settings_frame.columnconfigure(1, weight=1)

        ttk.Label(settings_frame, text="gfx2next Executable:").grid(row=0, column=0, sticky="w", padx=5, pady=10)
        self.gfx2next_entry = ttk.Entry(settings_frame, textvariable=self.gfx2next_path_var)
        self.gfx2next_entry.grid(row=0, column=1, sticky="ew", padx=5, pady=10)
        ttk.Button(settings_frame, text="Browse...", command=self.browse_gfx2next).grid(row=0, column=2, padx=5, pady=10)
        ttk.Label(settings_frame, text="(Leave as 'gfx2next' or empty to use system PATH)").grid(row=1, column=0, columnspan=3, sticky="w", padx=5)

        # Custom Arguments
        ttk.Label(settings_frame, text="Custom Arguments:").grid(row=2, column=0, sticky="w", padx=5, pady=10)
        self.custom_args_entry = ttk.Entry(settings_frame, textvariable=self.custom_args_var)
        self.custom_args_entry.grid(row=2, column=1, columnspan=2, sticky="ew", padx=5, pady=10)
        ttk.Label(settings_frame, text="(Additional flags, space-separated)").grid(row=3, column=0, columnspan=3, sticky="w", padx=5)

    def browse_source(self):
        filename = filedialog.askopenfilename(filetypes=[("Image files", "*.bmp;*.png"), ("All files", "*.*")])
        if filename:
            self.source_file = filename
            self.source_entry.delete(0, tk.END)
            self.source_entry.insert(0, filename)
            if filename.lower().endswith('.bmp'):
                bit_depth = self.check_bmp_bit_depth(filename)
                if bit_depth not in [4, 8]:
                    messagebox.showwarning("BMP Format Warning",
                                           f"The selected BMP file has a bit depth of {bit_depth}.\n"
                                           "For best results, use 4-bit or 8-bit BMP files.")
            self.display_source_image(filename, self.widgets['source_canvas'])
            # Auto-generate destination
            base = os.path.splitext(filename)[0]
            ext_map = {"bitmap": ".nxi", "font": ".spr", "sprites": ".spr", "screen": ".scr", "tiles": ".nxt"}
            self.dest_entry.delete(0, tk.END)
            self.dest_entry.insert(0, base + ext_map.get(self.format_var.get(), ""))

    def browse_dest(self):
        filename = filedialog.asksaveasfilename(filetypes=[("Next Bitmap", "*.nxi"), ("Next Sprite", "*.spr"), ("Spectrum Screen", "*.scr"), ("Next Tile", "*.nxt"), ("All files", "*.*")])
        if filename:
            self.dest_file = filename
            self.dest_entry.delete(0, tk.END)
            self.dest_entry.insert(0, filename)

    def browse_palette(self):
        filename = filedialog.askopenfilename(filetypes=[("Palette files", "*.nxp"), ("All files", "*.*")])
        if filename:
            self.pal_file_entry.delete(0, tk.END)
            self.pal_file_entry.insert(0, filename)

    def check_bmp_bit_depth(self, bmp_file):
        try:
            with open(bmp_file, 'rb') as f:
                f.seek(14)
                header_size = struct.unpack('<I', f.read(4))[0]
                if header_size >= 40:
                    f.seek(14 + 14)
                    bit_depth = struct.unpack('<H', f.read(2))[0]
                    return bit_depth
        except Exception as e:
            self.log_output(f"Error checking BMP bit depth: {e}")
        return 'unknown'

    def display_source_image(self, image_path, target_canvas):
        if not target_canvas or not isinstance(target_canvas, tk.Canvas):
             err_msg = "CRITICAL: display_source_image called with invalid target_canvas!"
             self.log_output(err_msg)
             messagebox.showerror("Critical Error", f"{err_msg}\nPlease report this bug.")
             return 
        try:
            target_canvas.delete("all")
            img = Image.open(image_path)
            self.original_source_image = img # Store original
            self.source_zoom_level = 1.0 # Reset zoom level
            self.redraw_zoomed_image(target_canvas, self.original_source_image, self.source_zoom_level)
            # Store the true original for reloading after selection
            self._original_source_image_unmodified = img.copy()
            # Enable the reload button
            self.reload_preview_button.config(state=tk.NORMAL)
            self.draw_palette_grid(self.source_palette_canvas, self.original_source_image) # Draw palette
        except Exception as e:
            self.log_output(f"Error displaying source image: {e}")
            messagebox.showerror("Error", f"Error displaying source image: {e}")

    def build_command(self, preview=False):
        if not self.source_file:
            messagebox.showerror("Error", "Select a source file first.")
            return None
            
        # If source image is cropped, create a temporary file
        source_to_use = self.source_file
        if self.source_is_cropped and self.original_source_image:
            try:
                # Create temporary file with same extension as original
                ext = os.path.splitext(self.source_file)[1].lower()
                # Default to PNG if no extension or unsupported
                if ext not in ['.png', '.bmp']:
                    ext = '.png'

                # Create a temp file with appropriate extension
                fd, temp_path = tempfile.mkstemp(suffix=ext)
                os.close(fd)  # Close the file descriptor

                # Save the current source image to temp file
                self.log_output(f"Saving cropped image to temporary file: {temp_path}")
                self.original_source_image.save(temp_path)
                
                # Store temp path and use for conversion
                self.temp_source_file = temp_path
                source_to_use = temp_path
            except Exception as e:
                self.log_output(f"Error creating temporary file for cropped image: {e}")
                # Fall back to original source file
                source_to_use = self.source_file
        
        cmd = ["gfx2next"]
        
        # Only add format parameter for non-tile formats (since tiles are inferred from options)
        if self.format_var.get() != "tiles":
            cmd.append(f"-{self.format_var.get()}")
            
        if self.format_var.get() == "bitmap" and self.bitmap_y.get(): cmd.append("-bitmap-y")
        if self.format_var.get() == "bitmap" and self.bitmap_size.get(): cmd.append(f"-bitmap-size={self.bitmap_size.get()}")
        if self.tile_size.get(): cmd.append(f"-tile-size={self.tile_size.get()}")
        if self.tile_offset.get(): cmd.append(f"-tile-offset={self.tile_offset.get()}")
        for opt,var in self.tile_options.items():
            if var.get(): cmd.append(f"-{opt.replace('_','-')}")

        # Add Block options
        if self.block_size_var.get(): cmd.append(f"-block-size={self.block_size_var.get()}")
        for opt, var in self.block_options.items():
            if var.get(): cmd.append(f"-{opt.replace('_','-')}")
            
        # Add Map options
        for opt, var in self.map_options.items():
            if var.get(): cmd.append(f"-{opt.replace('_','-')}")

        if self.color_mode.get() != "default": cmd.append(f"-{self.color_mode.get()}")
        if self.color_calc.get() != "color-distance": cmd.append(f"-{self.color_calc.get()}")
        if self.pal_file_entry.get(): cmd.append(f"-pal-file={self.pal_file_entry.get()}")
        for opt,var in self.pal_options.items():
            if var.get(): cmd.append(f"-{opt.replace('_','-')}")
        for opt,var in self.compression_options.items():
            if var.get(): cmd.append(f"-{opt.replace('_','-')}")

        # Add Custom arguments
        custom_args_str = self.custom_args_var.get().strip()
        if custom_args_str:
            # Simple split, won't handle args with spaces well
            cmd.extend(custom_args_str.split())
            
        if preview: cmd.append("-preview")
        # Add source file *after* all options
        cmd.append(source_to_use)
        # Add destination file if destination is set (regardless of preview flag)
        if self.dest_entry.get(): 
            cmd.append(self.dest_entry.get())
        return cmd

    def log_output(self, text):
        if not self.console_output:
            return
        self.console_output.configure(state="normal")
        self.console_output.insert(tk.END, text + "\n")
        self.console_output.see(tk.END)
        self.console_output.configure(state="disabled")
        self.root.update()

    def clear_console(self):
        self.console_output.configure(state="normal")
        self.console_output.delete(1.0, tk.END)
        self.console_output.configure(state="disabled")

    def generate_preview(self):
        self.save_settings() # Save current state to selected profile
        cmd=self.build_command(preview=True)
        if not cmd: return
        self.clear_console(); self.log_output("Running: "+" ".join(cmd)); self.root.update()
        result=subprocess.run(cmd,capture_output=True,text=True)
        if result.stdout: self.log_output(result.stdout)
        if result.stderr: self.log_output(result.stderr)
        self._cleanup_temp_file() # Clean up any temporary file
        if result.returncode != 0:
            messagebox.showerror("Error", "Preview failed")
            return
        time.sleep(0.5) # Give file system a moment

        # --- Find Preview and Palette Files ---
        if not self.source_file:
            self.log_output("Cannot find preview/palette without a source file.")
            return

        # Determine base filename: Use destination if available, else source
        dest_path_str = self.dest_entry.get()
        if dest_path_str:
             base_filename = os.path.basename(dest_path_str)
             base = os.path.splitext(base_filename)[0]
             dest_dir = os.path.dirname(dest_path_str)
             if not dest_dir: # Destination is just filename, use CWD
                  dest_dir = os.getcwd()
             elif not os.path.isdir(dest_dir):
                  self.log_output(f"Warning: Destination directory '{dest_dir}' does not exist. Cannot find preview/palette.")
                  # Clear preview canvas and palette display
                  if 'preview_canvas' in self.widgets: self.widgets['preview_canvas'].delete("all")
                  if self.preview_palette_canvas: self.preview_palette_canvas.delete("all") ; self.preview_palette_canvas.palette_map = {}
                  return
        else: # No destination specified, use source filename and CWD
             base_filename = os.path.basename(self.source_file)
             base = os.path.splitext(base_filename)[0]
             dest_dir = os.getcwd() # Output preview/nxp to CWD when dest is empty
             self.log_output("DEBUG: Destination empty, using source base name and CWD for preview/palette lookup.")

        preview_file = None
        palette_file = None
        loaded_palette = None
        num_loaded_colors = 0

        # Construct expected filenames (using determined base and dest_dir)
        potential_preview_suffix = "_preview.png" 
        potential_tileset_preview_suffix = "_tileset_preview.png" # Tileset mode specific
        potential_nxp_suffix = ".nxp"

        potential_preview_path = os.path.join(dest_dir, base + potential_preview_suffix)
        potential_tileset_preview_path = os.path.join(dest_dir, base + potential_tileset_preview_suffix)
        potential_nxp_path = os.path.join(dest_dir, base + potential_nxp_suffix)

        # Check for preview file (try generic first, then tileset specific)
        if os.path.exists(potential_preview_path):
            preview_file = potential_preview_path
        elif os.path.exists(potential_tileset_preview_path):
             preview_file = potential_tileset_preview_path
             self.log_output(f"Note: Found '{base + potential_tileset_preview_suffix}', using as preview.")
        else:
            self.log_output(f"Preview file ('{base + potential_preview_suffix}' or '{base + potential_tileset_preview_suffix}') not found in {dest_dir}.")

        # Load Palette File if found in destination dir
        if os.path.exists(potential_nxp_path):
            palette_file = potential_nxp_path
            self.log_output(f"Found palette file: {palette_file}")
            loaded_palette, num_loaded_colors = self.load_nxp_palette(palette_file)
        else:
            self.log_output(f"No corresponding NXP file ({base + potential_nxp_suffix}) found in {dest_dir}.")

        # Display Preview Image and Palette
        if preview_file:
            self.display_preview(preview_file, self.widgets['preview_canvas'], loaded_palette, num_loaded_colors)
        elif loaded_palette: # Only NXP found (or preview couldn't be found due to bad dest_dir)
             # Clear preview canvas and just draw palette
             if 'preview_canvas' in self.widgets:
                  self.widgets['preview_canvas'].delete("all")
             self.draw_palette_grid(self.preview_palette_canvas, None, num_loaded_colors, loaded_palette)
             self.log_output("Conversion complete. Displaying resulting palette.")
        else: # Neither preview nor palette found
             # Clear both canvases
             if 'preview_canvas' in self.widgets:
                  self.widgets['preview_canvas'].delete("all")
             if self.preview_palette_canvas:
                  self.preview_palette_canvas.delete("all")
                  self.preview_palette_canvas.palette_map = {}
             self.log_output("Conversion complete. No preview or palette file found.")

    def display_preview(self, preview_file, target_canvas, loaded_palette=None, num_loaded_colors=0):
        try:
            if not target_canvas or not isinstance(target_canvas, tk.Canvas):
                err_msg = "CRITICAL: display_preview called with invalid target_canvas!"
                self.log_output(err_msg)
                messagebox.showerror("Critical Error", f"{err_msg}\nPlease report this bug.")
                return 

            target_canvas.delete("all")
            img = Image.open(preview_file)
            
            # Apply external palette if provided
            if loaded_palette and num_loaded_colors > 0:
                 try:
                      # Pad palette for putpalette (needs 768 entries)
                      padded_palette = loaded_palette[:num_loaded_colors*3]
                      padding_needed = 256 - num_loaded_colors
                      if padding_needed > 0:
                           padded_palette.extend([0, 0, 0] * padding_needed)

                      # Create a dummy palette image for quantizing
                      pal_img = Image.new('P', (1, 1))
                      pal_img.putpalette(padded_palette)

                      # Convert the loaded image to RGB (required for quantize)
                      img_rgb = img.convert('RGB') 
                      # Then quantize it using the NXP palette
                      img = img_rgb.quantize(palette=pal_img)
                      self.log_output(f"Applied loaded NXP palette ({num_loaded_colors} colors) via quantize.")

                 except Exception as e:
                      self.log_output(f"Warning: Failed to apply loaded NXP palette: {e}")

            self.original_preview_image = img # Store original (potentially re-paletted)
            self.preview_zoom_level = 1.0 # Reset zoom level
            self.redraw_zoomed_image(target_canvas, self.original_preview_image, self.preview_zoom_level)
            # Draw palette grid, passing actual number of loaded colors if applicable
            self.draw_palette_grid(self.preview_palette_canvas, self.original_preview_image, num_loaded_colors, loaded_palette)
            target_canvas.update() # Force update
        except Exception as e:
            self.log_output(f"Error displaying preview: {e}")

    def save_settings(self):
        profile_name = self.profile_name_var.get().strip()
        if not profile_name:
             # Maybe prompt user or use default? For now, use default.
             profile_name = "default"
             self.profile_name_var.set(profile_name) # Update UI if we set default

        # Basic sanitization - replace spaces, remove tricky chars? 
        # For now, assume user enters reasonable names.
        # profile_name = profile_name.replace(" ", "_") 

        save_path = os.path.join(self.profile_dir, f"{profile_name}.json")

        data={
            "format":self.format_var.get(),
            "bitmap_y":self.bitmap_y.get(),
            "bitmap_size":self.bitmap_size.get(),
            "tile_size":self.tile_size.get(),
            "tile_offset":self.tile_offset.get(),
            "color_mode":self.color_mode.get(),
            "color_calc":self.color_calc.get(),
            "pal_file":self.pal_file_entry.get(),
            "tile_options":{k:v.get() for k,v in self.tile_options.items()},
            "pal_options":{k:v.get() for k,v in self.pal_options.items()},
            "compression_options":{k:v.get() for k,v in self.compression_options.items()},
            # Add Block and Map options
            "block_size":self.block_size_var.get(),
            "block_options":{k:v.get() for k,v in self.block_options.items()},
            "map_options":{k:v.get() for k,v in self.map_options.items()},
            "last_source":self.source_file,
            "last_dest":self.dest_entry.get(),
            "theme":self.theme.get(),
            "gfx2next_path": self.gfx2next_path_var.get(),
            "custom_args": self.custom_args_var.get()
            # No need to save profile_name IN the profile file itself
        }
        try:
             os.makedirs(self.profile_dir, exist_ok=True) # Ensure dir exists just in case
             with open(save_path,'w') as f: json.dump(data,f,indent=2)
             self.log_output(f"Settings saved to profile: {profile_name}")
             self.update_profile_list() # Refresh list in case it's a new profile
        except Exception as e:
             messagebox.showerror("Save Error", f"Failed to save profile '{profile_name}':\n{e}")
             self.log_output(f"Error saving profile {profile_name}: {e}")

    def load_settings(self):
        profile_name = self.profile_name_var.get().strip()
        if not profile_name:
             # Don't load if no profile is selected (e.g., on initial startup before list populated)
             # Or maybe try loading "default"? Let's do nothing for now.
             # self.log_output("No profile selected to load.")
             return 
        
        load_path = os.path.join(self.profile_dir, f"{profile_name}.json")

        if not os.path.exists(load_path):
             # This can happen on first run or if file deleted
             # self.log_output(f"Profile not found: {profile_name}")
             # Optionally: clear fields or load defaults?
             return # Silently do nothing if profile doesn't exist
             
        try:
            self.log_output(f"Loading settings from profile: {profile_name}")
            with open(load_path) as f: data=json.load(f)

            # Apply settings from loaded data
            self.format_var.set(data.get("format","bitmap"))
            self.bitmap_y.set(data.get("bitmap_y",False))
            self.bitmap_size.delete(0,tk.END); self.bitmap_size.insert(0,data.get("bitmap_size",""))
            self.tile_size.delete(0,tk.END); self.tile_size.insert(0,data.get("tile_size",""))
            self.tile_offset.delete(0,tk.END); self.tile_offset.insert(0,data.get("tile_offset",""))
            self.color_mode.set(data.get("color_mode","default"))
            self.color_calc.set(data.get("color_calc","color-distance"))
            self.pal_file_entry.delete(0,tk.END); self.pal_file_entry.insert(0,data.get("pal_file",""))
            for k,v in data.get("tile_options",{}).items(): self.tile_options[k].set(v)
            for k,v in data.get("pal_options",{}).items(): self.pal_options[k].set(v)
            for k,v in data.get("compression_options",{}).items(): self.compression_options[k].set(v)
            # Load Block and Map options
            self.block_size_var.set(data.get("block_size", "")) # Load block size, default to empty
            for k, v in data.get("block_options", {}).items(): 
                 if k in self.block_options: self.block_options[k].set(v)
            for k, v in data.get("map_options", {}).items():
                 if k in self.map_options: self.map_options[k].set(v)

            if data.get("last_source"): self.source_file=data["last_source"]; self.source_entry.delete(0,tk.END); self.source_entry.insert(0,self.source_file)
            if data.get("last_dest"): self.dest_entry.delete(0,tk.END); self.dest_entry.insert(0,data["last_dest"])
            if data.get("theme"): self.theme.set(data["theme"]); self.apply_theme(data["theme"])
            # Load gfx2next path, default to 'gfx2next' to use PATH
            self.gfx2next_path_var.set(data.get("gfx2next_path", "gfx2next"))
            # Load custom arguments
            self.custom_args_var.set(data.get("custom_args", ""))
            # Don't load profile_name_var from file, it's already set by combobox selection

            self.log_output("Settings loaded")
            # Need to re-apply theme potentially loaded
            self.apply_theme(self.theme.get())

        except Exception as e:
            messagebox.showerror("Load Error", f"Failed to load profile '{profile_name}':\n{e}")
            self.log_output(f"Error loading profile {profile_name}: {e}")

    def convert(self):
        self.save_settings() # Save current state to selected profile
        cmd=self.build_command(preview=True) # <<< Generate preview files alongside output
        if not cmd: return
        self.clear_console(); self.log_output("Running: "+" ".join(cmd)); self.root.update()
        result=subprocess.run(cmd,capture_output=True,text=True)
        if result.stdout: self.log_output(result.stdout)
        if result.stderr: self.log_output(result.stderr)
        self._cleanup_temp_file() # Clean up any temporary file
        if result.returncode!=0:
            messagebox.showerror("Error","Conversion failed")
            return
        messagebox.showinfo("Success","Conversion completed!")
        time.sleep(0.5) # Give file system a moment

        # --- Find and Display Preview/Palette After Conversion ---
        if not self.source_file:
            self.log_output("Cannot find preview/palette without a source file.")
            # Even without source, conversion might have succeeded, so don't return
        else:
            # Determine base filename: Use destination if available, else source
            dest_path_str = self.dest_entry.get()
            if dest_path_str:
                 base_filename = os.path.basename(dest_path_str)
                 base = os.path.splitext(base_filename)[0]
                 dest_dir = os.path.dirname(dest_path_str)
                 if not dest_dir: # Destination is just filename, use CWD
                      dest_dir = os.getcwd()
                 elif not os.path.isdir(dest_dir):
                      # Log warning but don't clear canvases immediately, conversion *might* still be useful
                      self.log_output(f"Warning: Destination directory '{dest_dir}' does not exist. Cannot find preview/palette.")
                      dest_dir = None # Flag that we cannot search here
            else: # No destination specified, use source filename and CWD
                 base_filename = os.path.basename(self.source_file)
                 base = os.path.splitext(base_filename)[0]
                 dest_dir = os.getcwd() # Output preview/nxp to CWD when dest is empty
                 self.log_output("DEBUG: Destination empty, using source base name and CWD for preview/palette lookup.")

            preview_file = None
            palette_file = None
            loaded_palette = None
            num_loaded_colors = 0

            # Construct and check paths only if dest_dir is valid
            if dest_dir:
                potential_preview_suffix = "_preview.png" 
                potential_tileset_preview_suffix = "_tileset_preview.png" # Tileset mode specific
                potential_nxp_suffix = ".nxp"
                
                potential_preview_path = os.path.join(dest_dir, base + potential_preview_suffix)
                potential_tileset_preview_path = os.path.join(dest_dir, base + potential_tileset_preview_suffix)
                potential_nxp_path = os.path.join(dest_dir, base + potential_nxp_suffix)
                
                # Check for preview file (try generic first, then tileset specific)
                if os.path.exists(potential_preview_path):
                    preview_file = potential_preview_path
                elif os.path.exists(potential_tileset_preview_path):
                    preview_file = potential_tileset_preview_path
                    self.log_output(f"Note: Found '{base + potential_tileset_preview_suffix}', using as preview.")
                else:
                    self.log_output(f"Preview file ('{base + potential_preview_suffix}' or '{base + potential_tileset_preview_suffix}') not found in {dest_dir}.")

                # Load Palette File if found in destination dir
                if os.path.exists(potential_nxp_path):
                    palette_file = potential_nxp_path
                    self.log_output(f"Found palette file: {palette_file}")
                    loaded_palette, num_loaded_colors = self.load_nxp_palette(palette_file)
                else:
                    self.log_output(f"No corresponding NXP file ({base + potential_nxp_suffix}) found in {dest_dir}.")
            else: # No valid dest_dir to search
                 self.log_output("Skipping preview/palette file search due to invalid destination directory.")

            # Display Preview Image and Palette (if preview file exists)
            if preview_file:
                self.display_preview(preview_file, self.widgets['preview_canvas'], loaded_palette, num_loaded_colors)
            elif loaded_palette: # Only NXP found (or preview couldn't be found due to bad dest_dir)
                 # Clear preview canvas and just draw palette
                 if 'preview_canvas' in self.widgets:
                      self.widgets['preview_canvas'].delete("all")
                 self.draw_palette_grid(self.preview_palette_canvas, None, num_loaded_colors, loaded_palette)
                 self.log_output("Conversion complete. Displaying resulting palette.")
            else: # Neither preview nor palette found
                 # Clear both canvases
                 if 'preview_canvas' in self.widgets:
                      self.widgets['preview_canvas'].delete("all")
                 if self.preview_palette_canvas:
                      self.preview_palette_canvas.delete("all")
                      self.preview_palette_canvas.palette_map = {}
                 self.log_output("Conversion complete. No preview or palette file found.")

    def setup_drag_drop(self):
        """Setup drag and drop functionality if TkinterDnD2 is available"""
        global DRAG_DROP_SUPPORTED
        
        if not DRAG_DROP_SUPPORTED:
            return
            
        try:
            # Set up drag & drop for the source entry
            self.source_entry.drop_target_register(DND_FILES)
            self.source_entry.dnd_bind('<<Drop>>', self.drop_file)
            # Also make the source canvas droppable
            self.widgets['source_canvas'].drop_target_register(DND_FILES)
            self.widgets['source_canvas'].dnd_bind('<<Drop>>', self.drop_file)
            # Make the preview palette canvas droppable for NXP files
            if self.preview_palette_canvas: # Check if it exists
                self.preview_palette_canvas.drop_target_register(DND_FILES)
                self.preview_palette_canvas.dnd_bind('<<Drop>>', self.drop_nxp_file)
        except Exception as e:
            # If we reach here, drag and drop didn't set up correctly
            DRAG_DROP_SUPPORTED = False
        
    def drop_file(self, event):
        # Handle file drop event
        global DRAG_DROP_SUPPORTED
        
        if not DRAG_DROP_SUPPORTED:
            return
            
        try:
            file_path = event.data
            # Clean up the file path (remove {} on Windows and leading/trailing spaces)
            if file_path.startswith('{') and file_path.endswith('}'):
                file_path = file_path[1:-1]
            file_path = file_path.strip()
            
            # Process the file only if it's an image file
            if file_path.lower().endswith(('.png', '.bmp')):
                self.source_file = file_path
                self.source_entry.delete(0, tk.END)
                self.source_entry.insert(0, file_path)
                
                if file_path.lower().endswith('.bmp'):
                    bit_depth = self.check_bmp_bit_depth(file_path)
                    if bit_depth not in [4, 8]:
                        messagebox.showwarning("BMP Format Warning",
                                               f"The selected BMP file has a bit depth of {bit_depth}.\n"
                                               "For best results, use 4-bit or 8-bit BMP files.")
                                               
                self.display_source_image(file_path, self.widgets['source_canvas'])
                # Auto-generate destination
                base = os.path.splitext(file_path)[0]
                ext_map = {"bitmap": ".nxi", "font": ".spr", "sprites": ".spr", "screen": ".scr", "tiles": ".nxt"}
                self.dest_entry.delete(0, tk.END)
                self.dest_entry.insert(0, base + ext_map.get(self.format_var.get(), ""))
                return "break"  # Prevents further processing of the event
        except Exception as e:
            messagebox.showerror("Error", f"Error processing dropped file: {e}")
            return "break"

    # --- Drop Handler for Preview Palette Canvas ---
    def drop_nxp_file(self, event):
        """Handles dropping an NXP file onto the preview palette canvas."""
        global DRAG_DROP_SUPPORTED
        
        if not DRAG_DROP_SUPPORTED:
            return

        try:
            file_path = event.data
            # Clean up the file path
            if file_path.startswith('{') and file_path.endswith('}'):
                file_path = file_path[1:-1]
            file_path = file_path.strip()

            # Check if it's an NXP file
            if file_path.lower().endswith('.nxp'):
                self.log_output(f"NXP file dropped: {file_path}")
                
                # Update the Palette File entry
                self.pal_file_entry.delete(0, tk.END)
                self.pal_file_entry.insert(0, file_path)
                
                # Load and display the dropped palette
                loaded_palette, num_loaded_colors = self.load_nxp_palette(file_path)
                if loaded_palette and num_loaded_colors > 0:
                    self.draw_palette_grid(self.preview_palette_canvas, None, num_loaded_colors, loaded_palette)
                    self.log_output(f"Displayed palette from dropped file ({num_loaded_colors} colors).")
                else:
                     # Clear palette display if loading failed
                     if self.preview_palette_canvas:
                          self.preview_palette_canvas.delete("all")
                          self.preview_palette_canvas.palette_map = {}
                     self.log_output(f"Failed to load or empty palette dropped: {file_path}")
                     messagebox.showwarning("Palette Drop", f"Could not load palette from:\n{file_path}")
                return "break" # Indicate we handled the drop
            else:
                self.log_output(f"Ignoring dropped file (not .nxp): {file_path}")
                # Optionally show a message? 
                # messagebox.showinfo("Drop Info", "Please drop .nxp files onto the palette area.")
                return # Don't return "break" so other drop handlers might process it?

        except Exception as e:
            self.log_output(f"Error processing dropped NXP file: {e}")
            messagebox.showerror("NXP Drop Error", f"Error processing dropped NXP file: {e}")
            return "break"

    def get_system_colors(self):
        """Get platform-appropriate system colors"""
        if platform.system() == "Windows":
            return {
                'bg': "SystemButtonFace",
                'fg': "SystemWindowText",
                'active_bg': "SystemButtonFace",
                'active_fg': "SystemWindowText"
            }
        else:
            # For Linux/Unix systems, use standard colors that work across platforms
            return {
                'bg': "#f0f0f0",
                'fg': "black", 
                'active_bg': "#e0e0e0",
                'active_fg': "black"
            }

    def apply_theme(self, theme_name=None):
        if theme_name is None:
            theme_name = self.theme.get()
            
        style = ttk.Style()
        
        if theme_name == "dark":
            # Configure dark theme
            self.root.configure(bg="#2d2d2d")
            style.configure("TFrame", background="#2d2d2d")
            style.configure("TLabel", background="#2d2d2d", foreground="#ffffff")
            style.configure("TButton", background="#444444", foreground="#ffffff")
            
            # Fix radio buttons and checkbuttons to be more visible
            style.configure("TCheckbutton", background="#2d2d2d", foreground="#ffffff")
            style.map("TCheckbutton", 
                background=[("active", "#444444")],
                foreground=[("active", "#ffffff"), ("selected", "#ffffff"), ("!selected", "#ffffff")]
            )
            
            style.configure("TRadiobutton", background="#2d2d2d", foreground="#ffffff")
            style.map("TRadiobutton", 
                background=[("active", "#444444")],
                foreground=[("active", "#ffffff"), ("selected", "#ffffff"), ("!selected", "#ffffff")]
            )
            
            style.configure("TLabelframe", background="#2d2d2d", foreground="#ffffff")
            style.configure("TLabelframe.Label", background="#2d2d2d", foreground="#ffffff")
            
            # Make notebook tabs more readable in dark mode
            style.configure("TNotebook", background="#2d2d2d")
            style.configure("TNotebook.Tab", background="#555555", foreground="#ffffff", padding=[10, 2])
            # Configure selected tab to be clearly visible
            style.map("TNotebook.Tab", 
                background=[("selected", "#00a86b")],  # Bright green/teal color for selected tab
                foreground=[("selected", "#ffffff")]
            )
            
            # Make buttons more readable
            style.map("TButton",
                background=[("active", "#666666")],
                foreground=[("active", "#ffffff")]
            )
            
            # Big button style
            style.configure("Big.TButton", font=(None, 14, "bold"), background="#555555", foreground="#ffffff")
            style.map("Big.TButton",
                background=[("active", "#666666")],
                foreground=[("active", "#ffffff")]
            )
            
            # Canvas colors - only set if they exist
            if 'source_canvas' in self.widgets:
                self.widgets['source_canvas'].configure(bg="#444444")
            if 'preview_canvas' in self.widgets:
                self.widgets['preview_canvas'].configure(bg="#333333")
            
            # Configure console colors for dark theme (widget already created)
            if self.console_output:
                 self.console_output.configure(bg="#333333", fg="#ffffff", insertbackground="#ffffff")
            
        else:  # Light theme
            # Configure light theme (default) with cross-platform colors
            colors = self.get_system_colors()
            self.root.configure(bg=colors['bg'])
            style.configure("TFrame", background=colors['bg'])
            style.configure("TLabel", background=colors['bg'], foreground=colors['fg'])
            style.configure("TButton", background=colors['bg'], foreground=colors['fg'])
            style.configure("TCheckbutton", background=colors['bg'], foreground=colors['fg'])
            style.configure("TRadiobutton", background=colors['bg'], foreground=colors['fg'])
            style.configure("TLabelframe", background=colors['bg'], foreground=colors['fg'])
            style.configure("TLabelframe.Label", background=colors['bg'], foreground=colors['fg'])
            style.configure("TNotebook", background=colors['bg'], foreground=colors['fg'])
            style.configure("TNotebook.Tab", background=colors['bg'], foreground=colors['fg'])
            # Reset map for light theme
            style.map("TButton", background=[("active", colors['active_bg'])], foreground=[("active", colors['active_fg'])])
            style.map("Big.TButton", background=[("active", colors['active_bg'])], foreground=[("active", colors['active_fg'])])
            style.map("TCheckbutton", background=[("active", colors['active_bg'])], foreground=[("active", colors['active_fg']), ("selected", colors['fg']), ("!selected", colors['fg'])])
            style.map("TRadiobutton", background=[("active", colors['active_bg'])], foreground=[("active", colors['active_fg']), ("selected", colors['fg']), ("!selected", colors['fg'])])
            style.map("TNotebook.Tab", background=[("selected", colors['bg'])], foreground=[("selected", colors['fg'])])
            
            # Explicitly configure Big.TButton for light theme
            style.configure("Big.TButton", font=(None, 14, "bold"), background=colors['bg'], foreground=colors['fg'])
            style.map("Big.TButton",
                background=[("active", colors['active_bg'])],
                foreground=[("active", colors['active_fg'])]
            )

            # Canvas colors - only set if they exist
            if 'source_canvas' in self.widgets:
                self.widgets['source_canvas'].configure(bg="white")
            if 'preview_canvas' in self.widgets:
                self.widgets['preview_canvas'].configure(bg="black")
            
            # Configure console colors for light theme (widget already created)
            if self.console_output:
                 self.console_output.configure(bg="white", fg="black", insertbackground="black")

    def redraw_zoomed_image(self, canvas, original_image, zoom_factor):
        if original_image is None:
             canvas.delete("all")
             return
        
        try:
            w, h = original_image.size
            new_w = max(1, int(w * zoom_factor))
            new_h = max(1, int(h * zoom_factor))

            # Use NEAREST neighbor scaling
            resized_img = original_image.resize((new_w, new_h), Image.NEAREST)
            photo = ImageTk.PhotoImage(resized_img)

            # Store reference based on canvas
            if canvas == self.widgets.get('source_canvas'):
                self.source_preview_image = photo
            elif canvas == self.widgets.get('preview_canvas'):
                self.preview_image = photo
            
            # Update canvas
            canvas.delete("all")
            canvas.create_image(0, 0, anchor="nw", image=photo)
            # Make canvas scroll region match image size for panning
            canvas.config(scrollregion=(0, 0, new_w, new_h)) 
            canvas.update() # Force update

        except Exception as e:
            self.log_output(f"Error redrawing zoomed image: {e}")

    # --- Canvas Panning Methods ---
    def on_canvas_press(self, event):
        canvas = event.widget
        # Delete existing selection rectangle if starting a pan on the source canvas
        if canvas == self.widgets.get('source_canvas') and self.selection_rect_id:
            canvas.delete(self.selection_rect_id)
            self.selection_rect_id = None
            self.apply_selection_button.config(state=tk.DISABLED)
        canvas.scan_mark(event.x, event.y)
        canvas.config(cursor="fleur") # Or "hand2" or other suitable cursor

    def on_canvas_drag(self, event):
        canvas = event.widget
        canvas.scan_dragto(event.x, event.y, gain=1)

    def on_canvas_release(self, event):
        canvas = event.widget
        # Reset cursor: crosshair for source canvas (if mouse inside), default otherwise
        # The Leave binding handles resetting if the mouse leaves the canvas.
        if canvas == self.widgets.get('source_canvas'):
            # Check if mouse is still inside the canvas widget boundaries
            # Get widget relative coordinates
            rel_x = event.x
            rel_y = event.y
            widget_w, widget_h = canvas.winfo_width(), canvas.winfo_height()
            if 0 <= rel_x < widget_w and 0 <= rel_y < widget_h:
                canvas.config(cursor="crosshair")
            else:
                # If release happened outside, Leave binding should have fired,
                # but set explicitly just in case.
                canvas.config(cursor="") # Mouse left during drag/release
        else:
            canvas.config(cursor="") # Reset cursor for other canvases (preview)

    def explore_destination(self):
        dest_path = self.dest_entry.get()
        if not dest_path:
            messagebox.showwarning("Explore", "Destination file path is empty.")
            return

        dest_dir = os.path.dirname(dest_path)
        if not dest_dir:
            dest_dir = "." # Use current directory if path has no directory part
        
        if not os.path.isdir(dest_dir):
             messagebox.showerror("Explore", f"Directory does not exist: {dest_dir}")
             return

        try:
            if sys.platform == "win32":
                # Use /select to highlight the file if it exists, otherwise open dir
                if os.path.exists(dest_path):
                     subprocess.run(["explorer", "/select,", os.path.normpath(dest_path)])
                else:
                     subprocess.run(["explorer", os.path.normpath(dest_dir)])
            elif sys.platform == "darwin": # macOS
                 # Use -R to reveal file in Finder if it exists
                 if os.path.exists(dest_path):
                      subprocess.run(["open", "-R", dest_path])
                 else:
                      subprocess.run(["open", dest_dir])
            else: # Linux and other Unix-like
                subprocess.run(["xdg-open", dest_dir])
        except FileNotFoundError:
             messagebox.showerror("Explore", "Could not find file explorer command (explorer/open/xdg-open).")
        except Exception as e:
             messagebox.showerror("Explore", f"Failed to open file explorer: {e}")
             self.log_output(f"Error opening explorer: {e}")

    # --- Mouse Wheel Zoom Handler ---
    def on_mouse_wheel(self, event):
        canvas = event.widget
        zoom_change_factor = 1.1 # How much to zoom in/out per step
        min_zoom = 0.1
        max_zoom = 8.0
        
        current_zoom = 1.0
        original_image = None
        zoom_attr = None
        
        if canvas == self.widgets.get('source_canvas'):
            current_zoom = self.source_zoom_level
            original_image = self.original_source_image
            zoom_attr = 'source_zoom_level'
        elif canvas == self.widgets.get('preview_canvas'):
            current_zoom = self.preview_zoom_level
            original_image = self.original_preview_image
            zoom_attr = 'preview_zoom_level'
        else:
             return # Should not happen

        if original_image is None:
             return # No image to zoom

        # Determine zoom direction
        if event.num == 5 or event.delta < 0: # Scroll down/zoom out
            new_zoom = current_zoom / zoom_change_factor
        elif event.num == 4 or event.delta > 0: # Scroll up/zoom in
            new_zoom = current_zoom * zoom_change_factor
        else: # Should not happen?
             return 

        # Clamp zoom level
        new_zoom = max(min_zoom, min(max_zoom, new_zoom))

        # Update zoom level and redraw
        if zoom_attr:
             setattr(self, zoom_attr, new_zoom)
             self.redraw_zoomed_image(canvas, original_image, new_zoom)

    def browse_gfx2next(self):
        filetypes = []
        if sys.platform == "win32":
            filetypes = [("Executable files", "*.exe"), ("All files", "*.*")]
        else:
            # On Unix-like systems, executables often don't have extensions
            filetypes = [("All files", "*.*")]
            
        filename = filedialog.askopenfilename(title="Select gfx2next Executable", filetypes=filetypes)
        if filename:
            self.gfx2next_path_var.set(filename)

    # --- Profile Management ---
    def update_profile_list(self):
        """Scans the profile directory and updates the combobox."""
        try:
            profile_files = glob.glob(os.path.join(self.profile_dir, "*.json"))
            profile_names = sorted([os.path.splitext(os.path.basename(f))[0] for f in profile_files])
            self.profile_combo['values'] = profile_names
            if not self.profile_name_var.get() and "default" in profile_names:
                 self.profile_name_var.set("default")
            elif profile_names and not self.profile_name_var.get(): # Select first if default doesn't exist
                 self.profile_name_var.set(profile_names[0])
                 
        except Exception as e:
             self.log_output(f"Error updating profile list: {e}")

    # --- Palette Drawing ---
    def draw_palette_grid(self, target_canvas, pil_image=None, num_colors_to_draw=0, direct_palette_data=None):
        target_canvas.delete("all") # Clear previous palette
        target_canvas.palette_map = {} # Clear item mapping

        palette_data = None
        actual_num_colors = 0

        # --- Determine Palette Source --- 
        if direct_palette_data:
             # Prioritize directly provided NXP palette data
             palette_data = direct_palette_data
             # Infer number of colors from data length
             actual_num_colors = len(palette_data) // 3 
             if actual_num_colors == 0:
                 palette_data = None # Treat empty list as no palette
             # self.log_output(f"DEBUG: Using direct palette data ({actual_num_colors} colors).")
        elif pil_image and pil_image.mode == 'P':
             # Fallback: Use palette embedded in the image
             img_palette = pil_image.getpalette()
             if img_palette:
                  palette_data = img_palette
                  actual_num_colors = len(palette_data) // 3
                  if actual_num_colors == 0:
                       palette_data = None
                  # self.log_output(f"DEBUG: Using image palette ({actual_num_colors} colors).")
        
        # --- Draw Palette if Data Available ---
        if palette_data is None:
            self.log_output("No usable palette data found to draw.")
            return 

        try:
            # Determine how many swatches to actually draw (max 256)
            colors_to_display = min(actual_num_colors, 256) 
            # self.log_output(f"DEBUG: Drawing {colors_to_display} swatches.") 
            
            swatch_size = 12 # Increased swatch size
            padding = 2     # Increased padding
            offset = 5      # Margin inside canvas
            cols = 16

            for i in range(colors_to_display):
                # Check if enough data exists (safety for potentially truncated palettes)
                if (i * 3 + 2) >= len(palette_data):
                    self.log_output(f"Warning: Palette data ended unexpectedly at index {i}. Stopping draw.")
                    break 
                    
                r = palette_data[i*3]
                g = palette_data[i*3 + 1]
                b = palette_data[i*3 + 2]
                hex_color = f"#{r:02x}{g:02x}{b:02x}"

                col_idx = i % cols
                row_idx = i // cols

                x0 = offset + col_idx * (swatch_size + padding)
                y0 = offset + row_idx * (swatch_size + padding)
                x1 = x0 + swatch_size
                y1 = y0 + swatch_size

                item_id = target_canvas.create_rectangle(x0, y0, x1, y1, fill=hex_color, outline="#888", tags="palette_swatch")
                # Store color info for tooltip lookup
                target_canvas.palette_map[item_id] = {"rgb": (r, g, b), "index": i}

        except Exception as e:
            self.log_output(f"Error drawing palette: {e}")

    # --- Tooltip Display ---
    def show_palette_tooltip(self, event):
        canvas = event.widget
        if not hasattr(canvas, 'palette_map') or not canvas.palette_map:
             self.hide_palette_tooltip() # Hide if no map exists
             return

        # Find the canvas item ("swatch") under the cursor
        item_ids = canvas.find_withtag("current")
        if not item_ids:
             self.hide_palette_tooltip()
             return
        item_id = item_ids[0]

        if item_id not in canvas.palette_map:
             self.hide_palette_tooltip()
             return # Cursor is over something else (like the outline)

        color_info = canvas.palette_map[item_id]
        r, g, b = color_info["rgb"]
        index = color_info["index"]

        # Format color strings
        rgb8 = (r >> 5 << 5) | (g >> 5 << 2) | (b >> 6) # RRRGGGBB (approx)
        lsb_b = b & 1 # 0000000B
        rgb9 = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5) # R3G3B3

        tooltip_text = (
            f"Index: {index}\n"
            f"RGB: ({r},{g},{b})\n"
            f"RRRGGGBB: {rgb8:02X}h ({rgb8})\n"
            f"0000000B: {lsb_b}\n"
            f"RGB9: ${rgb9:03X} ({rgb9})"
        )

        # Create or update tooltip window
        if self.tooltip_window:
             # Update existing tooltip
             self.tooltip_window.geometry(f"+{event.x_root + 15}+{event.y_root + 10}")
             self.tooltip_label.config(text=tooltip_text)
        else:
            # Create new tooltip
            self.tooltip_window = tk.Toplevel(canvas)
            self.tooltip_window.wm_overrideredirect(True) # No borders/title bar
            self.tooltip_window.wm_geometry(f"+{event.x_root + 15}+{event.y_root + 10}")
            self.tooltip_label = tk.Label(
                self.tooltip_window,
                text=tooltip_text,
                justify=tk.LEFT,
                background="#ffffe0", # Light yellow background
                relief=tk.SOLID,
                borderwidth=1,
                font=("tahoma", "8", "normal")
            )
            self.tooltip_label.pack(ipadx=1)

    def hide_palette_tooltip(self, event=None):
        if self.tooltip_window:
            self.tooltip_window.destroy()
            self.tooltip_window = None
            self.tooltip_label = None

    # --- Load NXP Palette File ---
    def load_nxp_palette(self, nxp_filepath):
        """Loads an NXP palette file (RRRGGGBB, LSB) and returns a tuple:
           (list of [R,G,B] entries, number of colors read) or (None, 0).
           Format: 256 bytes of RRRGGGBB, 256 bytes of L (Blue LSB)
        """
        try:
            with open(nxp_filepath, 'rb') as f:
                data = f.read()
            if len(data) == 0 or len(data) % 2 != 0:
                self.log_output(f"Warning: Invalid NXP file size ({len(data)} bytes): {nxp_filepath}")
                return None, 0
            
            num_colors = len(data) // 2
            if num_colors > 256:
                 self.log_output(f"Warning: NXP file has > 256 colors ({num_colors}), truncating.")
                 num_colors = 256

            pil_palette = []
            for i in range(num_colors):
                 # CORRECTED: Read interleaved bytes
                 byte1_index = i * 2
                 byte2_index = i * 2 + 1
                 # Bounds check in case of odd file length (already checked earlier, but safer)
                 if byte2_index >= len(data):
                      self.log_output(f"Warning: Unexpected end of file reading color {i}. Skipping.")
                      continue 
                 byte1 = data[byte1_index]
                 byte2 = data[byte2_index]
                
                 # Reconstruct 8-bit R, G, B
                 r = (byte1 & 0b11100000)        # RRR -> RRR00000
                 g = (byte1 & 0b00011100) << 3  # GGG -> GGG00000
                 b = (byte1 & 0b00000011) << 6  # BB  -> BB000000
                 # LSB byte might contain other flags, only use bit 0 for blue LSB
                 b = b | (byte2 & 0b00000001)

                 pil_palette.extend([r, g, b])
            
            return pil_palette, num_colors
        except Exception as e:
            self.log_output(f"Error loading NXP palette {nxp_filepath}: {e}")
            messagebox.showerror("Palette Load Error", f"Could not load NXP palette:\n{nxp_filepath}\n{e}")
            return None, 0

    # --- Selection Methods (Right Mouse Button on Source Canvas) ---
    def on_selection_start(self, event):
        canvas = event.widget
        # Ensure this only works on the source canvas
        if canvas != self.widgets.get('source_canvas'): return

        # Delete previous rectangle if it exists
        if self.selection_rect_id:
            canvas.delete(self.selection_rect_id)
            self.selection_rect_id = None
            self.apply_selection_button.config(state=tk.DISABLED)
            
        # Convert event coordinates to canvas coordinates
        self.selection_start_x = canvas.canvasx(event.x)
        self.selection_start_y = canvas.canvasy(event.y)
        
        # Create rectangle with 0 size initially, dashed outline
        self.selection_rect_id = canvas.create_rectangle(
            self.selection_start_x, self.selection_start_y,
            self.selection_start_x, self.selection_start_y,
            outline='#FF0000', # Bright red
            width=2,          # Thicker line
            dash=(6, 3)      # More visible dashed line
        )
        # Ensure cursor remains crosshair during selection
        canvas.config(cursor="crosshair") 

    def on_selection_drag(self, event):
        canvas = event.widget
        if not self.selection_rect_id:
            return # Should not happen if started correctly
        # Ensure this only works on the source canvas
        if canvas != self.widgets.get('source_canvas'): return
        if not self.original_source_image: return # No image to select on
        zoom = self.source_zoom_level # Use source zoom
        if zoom == 0: return # Avoid division by zero

        # Convert event coordinates to canvas coordinates
        current_x = canvas.canvasx(event.x)
        current_y = canvas.canvasy(event.y)

        # Update the rectangle coordinates
        canvas.coords(self.selection_rect_id, 
                      self.selection_start_x, self.selection_start_y,
                      current_x, current_y)
        # Ensure cursor remains crosshair during selection
        canvas.config(cursor="crosshair") 

    def on_selection_end(self, event):
        canvas = event.widget
        if not self.selection_rect_id:
             return # No selection was made
        # Ensure this only works on the source canvas
        if canvas != self.widgets.get('source_canvas'): return
        if not self.original_source_image: return # No image

        # Final coordinates are now stored in the rectangle item.
        # We'll add logic here later to use these coordinates.
        # For now, just print them (scaled by zoom) for debugging.
        try:
             # Get coords in canvas space
             coords = canvas.coords(self.selection_rect_id)
            
             # Snap final coords to grid
             zoom = self.source_zoom_level # Use source zoom
             if zoom == 0: raise ValueError("Zoom level is zero")
            
             # Ensure coords returns 4 values
             if len(coords) != 4: raise ValueError("Invalid coordinates for selection rectangle")

             # Convert canvas coords to original image coords (already snapped in on_selection_end)
             x0 = int(round(coords[0] / zoom))
             y0 = int(round(coords[1] / zoom))
             x1 = int(round(coords[2] / zoom))
             y1 = int(round(coords[3] / zoom))

             # Ensure order
             orig_x0 = min(x0, x1)
             orig_y0 = min(y0, y1)
             orig_x1 = max(x0, x1)
             orig_y1 = max(y0, y1)

             # Clamp coordinates to image bounds
             img_w, img_h = self._original_source_image_unmodified.size # Use source image size
             orig_x0 = max(0, orig_x0)
             orig_y0 = max(0, orig_y0)
             orig_x1 = min(img_w, orig_x1)
             orig_y1 = min(img_h, orig_y1)

             self.log_output(f"Applying crop: {orig_x0, orig_y0, orig_x1, orig_y1}")

             # Crop the *unmodified* original image
             self.original_source_image = self._original_source_image_unmodified.crop((orig_x0, orig_y0, orig_x1, orig_y1))

             # Update the display with the cropped image
             # Keep the current zoom level for consistency
             self.redraw_zoomed_image(canvas, self.original_source_image, self.source_zoom_level)

             # Remove the selection rectangle
             canvas.delete(self.selection_rect_id)
             self.selection_rect_id = None
             self.apply_selection_button.config(state=tk.DISABLED)
             self.reload_preview_button.config(state=tk.NORMAL) # Enable source reload

        except (tk.TclError, ValueError, IndexError) as e:
            self.log_output(f"Error applying selection: {e}")
            self.apply_selection_button.config(state=tk.DISABLED)

    def apply_selection(self):
        canvas = self.widgets.get('source_canvas')
        if not canvas or not self.selection_rect_id or not self._original_source_image_unmodified:
            self.log_output("Cannot apply selection: Missing source canvas, selection, or original source image.")
            return

        try:
            coords = canvas.coords(self.selection_rect_id)
            zoom = self.source_zoom_level # Use source zoom
            if zoom == 0: raise ValueError("Zoom level is zero")
            if len(coords) != 4: raise ValueError("Invalid coordinates for selection rectangle")

            # Convert canvas coords to original image coords (already snapped in on_selection_end)
            x0 = int(round(coords[0] / zoom))
            y0 = int(round(coords[1] / zoom))
            x1 = int(round(coords[2] / zoom))
            y1 = int(round(coords[3] / zoom))

            # Ensure order
            orig_x0 = min(x0, x1)
            orig_y0 = min(y0, y1)
            orig_x1 = max(x0, x1)
            orig_y1 = max(y0, y1)

            # Clamp coordinates to image bounds
            img_w, img_h = self._original_source_image_unmodified.size # Use source image size
            orig_x0 = max(0, orig_x0)
            orig_y0 = max(0, orig_y0)
            orig_x1 = min(img_w, orig_x1)
            orig_y1 = min(img_h, orig_y1)

            # Check for valid size after clamping
            if orig_x0 >= orig_x1 or orig_y0 >= orig_y1:
                self.log_output("Error applying selection: Invalid coordinates after clamping.")
                # Clean up rectangle
                canvas.delete(self.selection_rect_id)
                self.selection_rect_id = None
                self.apply_selection_button.config(state=tk.DISABLED)
                return

            crop_box = (orig_x0, orig_y0, orig_x1, orig_y1)
            self.log_output(f"Applying crop: {crop_box}")

            # Crop the *unmodified* original image
            self.original_source_image = self._original_source_image_unmodified.crop(crop_box)
            self.source_is_cropped = True # Mark that we're using a cropped version

            # Update the display with the cropped image
            # Keep the current zoom level for consistency
            self.redraw_zoomed_image(canvas, self.original_source_image, self.source_zoom_level)

            # Remove the selection rectangle
            canvas.delete(self.selection_rect_id)
            self.selection_rect_id = None
            self.apply_selection_button.config(state=tk.DISABLED)
            self.reload_preview_button.config(state=tk.NORMAL) # Enable source reload

        except (tk.TclError, ValueError, IndexError) as e:
            self.log_output(f"Error applying selection: {e}")
            self.apply_selection_button.config(state=tk.DISABLED)

    def reload_original_preview(self):
        canvas = self.widgets.get('source_canvas')
        if not canvas or not self._original_source_image_unmodified:
            self.log_output("Cannot reload: Missing source canvas or original source image.")
            return

        # Restore the original image data
        self.original_source_image = self._original_source_image_unmodified.copy() # Restore source image
        self.source_is_cropped = False # Reset cropped flag

        # Redraw using the stored original
        self.redraw_zoomed_image(canvas, self.original_source_image, self.source_zoom_level)

        # Remove selection rectangle if it exists
        if self.selection_rect_id:
            canvas.delete(self.selection_rect_id)
            self.selection_rect_id = None
            self.apply_selection_button.config(state=tk.DISABLED)

    def _cleanup_temp_file(self):
        """Clean up any temporary file we created"""
        if self.temp_source_file and os.path.exists(self.temp_source_file):
            try:
                os.unlink(self.temp_source_file)
                self.log_output(f"Removed temporary file: {self.temp_source_file}")
            except Exception as e:
                self.log_output(f"Warning: Failed to remove temporary file {self.temp_source_file}: {e}")
            self.temp_source_file = None

if __name__ == "__main__":
    try:
        if DRAG_DROP_SUPPORTED:
            root = TkinterDnD.Tk()
        else:
            root = tk.Tk()
    except Exception as e:
        print(f"Error initializing TkinterDnD, falling back to standard Tk: {e}")
        root = tk.Tk()
        DRAG_DROP_SUPPORTED = False
    
    app = Gfx2NextGUI(root)
    # Add window close handler to clean up temp files
    root.protocol("WM_DELETE_WINDOW", lambda: [app._cleanup_temp_file(), root.destroy()])
    root.mainloop()
