"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageViewerProvider = void 0;
/* eslint-disable curly */
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paletteUtils_1 = require("./paletteUtils");
class ImageViewerProvider {
    context;
    static viewType = 'nextbuild-viewers.imageViewer';
    defaultPalette = [];
    customPalette = null;
    customPaletteName = '';
    cachedImageData = null;
    currentPaletteSource = 'default';
    constructor(context) {
        this.context = context;
        // Use the default RGB332 palette from paletteUtils
        this.defaultPalette = paletteUtils_1.defaultPaletteRGB;
    }
    async openCustomDocument(uri, openContext, token) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel, token) {
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        try {
            const filePath = document.uri.fsPath;
            const fileExtension = path.extname(filePath).toLowerCase(); // Get lowercased extension
            const fileData = await fs.promises.readFile(filePath);
            this.parseImageData(fileData, fileExtension); // Initial parse (detects appended, doesn't apply)
            if (!this.cachedImageData) {
                throw new Error("Failed to parse image data initially.");
            }
            // --- Persistent Palette Loading --- 
            this.currentPaletteSource = 'default'; // Start with default
            this.customPalette = null;
            this.customPaletteName = '';
            const lastPalettePath = this.context.workspaceState.get('imageViewerPalettePath');
            // For 640x256 4-bit images, automatically use the appended/extracted palette
            const is640x256_4bit = this.cachedImageData &&
                this.cachedImageData.width === 640 &&
                this.cachedImageData.height === 256 &&
                this.cachedImageData.mode === '640x256x4';
            if (is640x256_4bit && this.cachedImageData.appendedPalette) {
                console.log('Automatically using appended/extracted palette for 640x256 4-bit image');
                this.customPalette = this.cachedImageData.appendedPalette;
                this.customPaletteName = 'Extracted';
                this.currentPaletteSource = 'appended';
            }
            else if (lastPalettePath) {
                try {
                    console.log(`Attempting to load last palette: ${lastPalettePath}`);
                    const paletteData = await fs.promises.readFile(lastPalettePath);
                    this.customPalette = this.parsePaletteFile(paletteData);
                    this.customPaletteName = path.basename(lastPalettePath);
                    this.currentPaletteSource = 'loaded'; // Set source if loaded successfully
                    vscode.window.showInformationMessage(`Restored last used palette: ${this.customPaletteName}`, 'Dismiss');
                }
                catch (error) {
                    console.warn(`Failed to restore last palette from ${lastPalettePath}:`, error);
                    // Clear the stored path if it's invalid
                    await this.context.workspaceState.update('imageViewerPalettePath', undefined);
                    // Keep source as default
                    this.currentPaletteSource = 'default';
                    this.customPalette = null;
                    this.customPaletteName = '';
                }
            }
            // If an appended palette exists and no custom one was loaded, don't automatically switch yet
            // User must click the button
            // But if a custom one *was* loaded, that takes precedence initially.
            // --- Persistent Zoom --- 
            const lastScale = this.context.workspaceState.get('imageViewerScale');
            // --- Persistent Aspect Ratio --- 
            const aspect43 = this.context.workspaceState.get('imageViewerAspect43');
            // Determine appropriate default scale based on image dimensions
            let defaultScale = 1;
            if (this.cachedImageData) {
                const { width, height } = this.cachedImageData;
                // For large images like 640x256, use a smaller default scale
                if (width >= 640 || height >= 256) {
                    defaultScale = 1; // Ensure default scale is always an integer
                }
            }
            const viewState = {
                scale: lastScale || defaultScale, // Use stored scale or calculated default
                paletteOffset: 0,
                customWidth: this.cachedImageData.width,
                customHeight: this.cachedImageData.height,
                loadedPaletteName: '', // Track name for status
                aspect43: aspect43 || false // Use stored aspect ratio preference or default to false
            };
            // Pass file extension along with other parameters
            this.updateWebviewContent(webviewPanel, document.uri.fsPath, fileExtension, viewState);
            // Handle messages from the webview
            webviewPanel.webview.onDidReceiveMessage(async (message) => {
                let needsUpdate = false;
                switch (message.command) {
                    case 'changeScale':
                        if (viewState.scale !== message.scale) {
                            viewState.scale = message.scale;
                            // --- Persistent Zoom --- 
                            // Store the new scale
                            await this.context.workspaceState.update('imageViewerScale', viewState.scale);
                            needsUpdate = true;
                        }
                        break;
                    case 'changePaletteOffset':
                        if (viewState.paletteOffset !== message.offset) {
                            viewState.paletteOffset = message.offset;
                            needsUpdate = true;
                        }
                        break;
                    case 'changeCustomDimensions':
                        viewState.customWidth = message.width;
                        viewState.customHeight = message.height;
                        // Re-parse needed if mode is custom OR if it's an NXI with non-standard/guessed dims
                        // Ensure cachedImageData exists before accessing width/height
                        const isNxiNonStandard = this.cachedImageData &&
                            fileExtension === '.nxi' &&
                            [256 * 192, 320 * 256].indexOf(this.cachedImageData.width * this.cachedImageData.height) === -1;
                        if ((this.cachedImageData && this.cachedImageData.mode === 'custom') || isNxiNonStandard) {
                            this.parseImageData(fileData, fileExtension, message.width, message.height);
                            if (!this.cachedImageData)
                                throw new Error("Reparse failed after changing dimensions");
                        }
                        else {
                            // If not custom/NXI-guessed, just update viewState, no reparse needed
                            console.log("Dimensions changed, but no reparse needed for this mode.");
                        }
                        needsUpdate = true; // Always update webview after dimension change attempt
                        break;
                    case 'loadPalette':
                        try {
                            const fileUri = await vscode.window.showOpenDialog({
                                canSelectFiles: true, canSelectFolders: false, canSelectMany: false,
                                filters: { 'Palette Files': ['pal', 'nxp'] }, title: 'Select a palette file'
                            });
                            if (fileUri && fileUri.length > 0) {
                                const paletteData = await fs.promises.readFile(fileUri[0].fsPath);
                                this.customPalette = this.parsePaletteFile(paletteData);
                                this.customPaletteName = path.basename(fileUri[0].fsPath);
                                this.currentPaletteSource = 'loaded'; // Set source
                                viewState.loadedPaletteName = this.customPaletteName;
                                // --- Persistent Palette Saving --- 
                                await this.context.workspaceState.update('imageViewerPalettePath', fileUri[0].fsPath);
                                vscode.window.showInformationMessage(`Palette loaded: ${this.customPaletteName}`);
                                needsUpdate = true;
                            }
                        }
                        catch (error) {
                            vscode.window.showErrorMessage('Failed to load palette file: ' + error);
                        }
                        break;
                    case 'applyAppendedPalette':
                        if (this.cachedImageData?.appendedPalette) {
                            this.customPalette = this.cachedImageData.appendedPalette;
                            this.customPaletteName = 'Appended';
                            this.currentPaletteSource = 'appended'; // Set source
                            viewState.loadedPaletteName = ''; // Clear loaded name
                            needsUpdate = true;
                        }
                        else {
                            vscode.window.showWarningMessage('No appended palette data found to apply.');
                        }
                        break;
                    case 'applyPrefixPalette':
                        if (this.cachedImageData?.prefixPalette) {
                            this.customPalette = this.cachedImageData.prefixPalette;
                            this.customPaletteName = 'Prefix';
                            this.currentPaletteSource = 'prefix'; // Set source
                            viewState.loadedPaletteName = ''; // Clear loaded name
                            needsUpdate = true;
                        }
                        else {
                            vscode.window.showWarningMessage('No prefix palette data found to apply.');
                        }
                        break;
                    case 'useDefaultPalette':
                        if (this.currentPaletteSource !== 'default') {
                            this.customPalette = null;
                            this.customPaletteName = '';
                            this.currentPaletteSource = 'default';
                            viewState.loadedPaletteName = '';
                            // No need to clear workspace state here, user might load it again
                            needsUpdate = true;
                        }
                        break;
                    case 'aspect43':
                        if (viewState.aspect43 !== message.checked) {
                            viewState.aspect43 = message.checked;
                            // Store the preference
                            await this.context.workspaceState.update('imageViewerAspect43', viewState.aspect43);
                            needsUpdate = true;
                        }
                        break;
                    case 'savePngImage':
                        try {
                            // Get the data URL and remove the prefix
                            const dataUrl = message.dataUrl;
                            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
                            // Create a Buffer from the base64 data
                            const imageBuffer = Buffer.from(base64Data, 'base64');
                            // Suggest a filename based on the original file
                            const originalFilePath = document.uri.fsPath;
                            const originalFileName = path.basename(originalFilePath, path.extname(originalFilePath));
                            const suggestedFilename = `${originalFileName}_exported.png`;
                            // Show save dialog
                            const saveUri = await vscode.window.showSaveDialog({
                                defaultUri: vscode.Uri.file(path.join(path.dirname(originalFilePath), suggestedFilename)),
                                filters: {
                                    'PNG Files': ['png']
                                },
                                title: `Save Image (${message.width}x${message.height})`
                            });
                            if (saveUri) {
                                // Write the file
                                await fs.promises.writeFile(saveUri.fsPath, imageBuffer);
                                vscode.window.showInformationMessage(`Image saved as ${path.basename(saveUri.fsPath)}`);
                            }
                        }
                        catch (error) {
                            console.error('Error saving PNG:', error);
                            vscode.window.showErrorMessage(`Failed to save PNG: ${error.message || error}`);
                        }
                        break;
                    // Maybe add a case 'useDefaultPalette'? For now, loading another palette overrides.
                }
                // Update webview if needed
                if (needsUpdate) {
                    this.updateWebviewContent(webviewPanel, document.uri.fsPath, fileExtension, viewState);
                }
            });
        }
        catch (error) {
            console.error("Error resolving image editor:", error);
            webviewPanel.webview.html = this.getErrorHtml(error);
        }
    }
    // --- Main Parsing Logic ---
    parseImageData(data, fileExtension, customWidth, customHeight) {
        let mode = 'custom';
        let width = 0;
        let height = 0;
        let expectedSize = 0;
        let imageData;
        let detectedAppendedPaletteData; // Store detected data separately
        let detectedPrefixPaletteData; // Store detected prefix palette data
        let guessedDimensions = false; // Flag to track if dimensions were guessed
        // Reset custom palette for new image, unless an appended one is loaded later
        this.customPalette = null;
        this.customPaletteName = '';
        // First check for palette at START of file (for 256x192x8bit NXI format)
        // This is a specific check for one of the formats mentioned in the requirements
        if (data.length === 256 * 192 + 512) { // 49152 (image) + 512 (palette)
            console.log('Potential prefix 512-byte palette detected for 256x192 8-bit format.');
            detectedPrefixPaletteData = data.slice(0, 512);
            imageData = data.slice(512);
            // Don't apply it yet - user must choose to apply it
        }
        // Then check for appended palette (512 bytes for .pal/.nxp, 256 is potentially ambiguous)
        // Let's stick to checking 512 for now as per palette files
        else if (data.length > 512) {
            const potentialPaletteOffset = data.length - 512;
            // Add a simple check to see if remaining data size matches a known image format
            // This helps avoid treating actual image data as a palette
            if ([256 * 192, 320 * 256, (640 * 256) / 2].includes(potentialPaletteOffset)) {
                console.log('Potential appended 512-byte palette detected.');
                detectedAppendedPaletteData = data.slice(potentialPaletteOffset);
                imageData = data.slice(0, potentialPaletteOffset);
                // Do not apply it yet: this.customPalette = this.parsePaletteFile(detectedAppendedPaletteData);
            }
            else {
                console.log('Data length minus 512 does not match known image size, not treating end as appended palette.');
                imageData = data;
            }
        }
        else if (data.length > 32) {
            // Check specifically for SL2 files with a 32-byte palette appended
            // 640x256 4-bit = 81920 bytes (320 bytes * 256 rows) + 32 bytes palette = 81952 bytes total
            const sl2Size = (640 * 256) / 2; // 640x256 image size in bytes (4 bits per pixel = 2 pixels per byte)
            const sl2WithPaletteSize = sl2Size + 32; // With 32-byte palette
            if (data.length === sl2WithPaletteSize) {
                console.log('Detected 640x256 4-bit image with 32-byte palette appended (16 colors, 2 bytes per color).');
                detectedAppendedPaletteData = data.slice(data.length - 32);
                imageData = data.slice(0, data.length - 32);
            }
            else {
                // For any other file size, just use the raw data
                imageData = data; // No appended palette detected
            }
        }
        else {
            imageData = data; // Data too small for any appended palette
        }
        let dataLength = imageData.length;
        // Determine mode and dimensions based on extension first
        switch (fileExtension) {
            case '.nxi':
                // Standard 8-bit formats
                if (dataLength === 256 * 192) {
                    mode = '256x192x8';
                    width = 256;
                    height = 192;
                }
                else if (dataLength === 320 * 256) {
                    mode = '320x256x8';
                    width = 320;
                    height = 256;
                }
                else {
                    // Treat as generic 8-bit and guess dimensions if size is non-standard
                    console.warn(`NXI file size ${dataLength} does not match known 8-bit dimensions. Guessing dimensions.`);
                    // If user provided custom dimensions, use those
                    if (customWidth && customHeight) {
                        width = customWidth;
                        height = customHeight;
                        mode = 'custom'; // Assume custom mode for user-specified dimensions
                        guessedDimensions = true;
                    }
                    else {
                        mode = 'custom'; // Default to custom mode for guessed dimensions
                        // Try to determine a reasonable width
                        // Standard widths to try in preference order
                        const widthsToTry = [256, 320, 128, 512, 64, 32];
                        // First check if any of the standard widths divides the data length evenly
                        let widthFound = false;
                        for (const tryWidth of widthsToTry) {
                            const tryHeight = Math.floor(dataLength / tryWidth);
                            if (tryWidth * tryHeight === dataLength && tryHeight > 0) {
                                width = tryWidth;
                                height = tryHeight;
                                widthFound = true;
                                guessedDimensions = true;
                                console.log(`Guessed NXI dimensions as ${width}x${height} (8-bit).`);
                                break;
                            }
                        }
                        // If no standard width works, try to find a reasonable square-ish aspect ratio
                        if (!widthFound) {
                            // Find a width that's close to a square aspect ratio
                            const squareSize = Math.sqrt(dataLength);
                            // Round to the nearest multiple of 8 for width (common ZX pixel boundary)
                            width = Math.round(squareSize / 8) * 8;
                            if (width === 0)
                                width = 8; // Minimum width
                            height = Math.floor(dataLength / width);
                            if (width * height !== dataLength || height <= 0) {
                                // Fallback to a simple power of 2 width
                                width = 256;
                                height = Math.floor(dataLength / width);
                                if (width * height !== dataLength || height <= 0) {
                                    // Last resort, just make it a 1D array
                                    width = dataLength;
                                    height = 1;
                                }
                            }
                            guessedDimensions = true;
                            console.log(`Guessed approximate NXI dimensions as ${width}x${height} (8-bit).`);
                        }
                    }
                }
                break;
            case '.hxi':
            case '.sl2':
                // Standard 4-bit format (640x256)
                // 4 bits per pixel = 2 pixels per byte
                // 640 pixels × 256 rows / 2 = 81920 bytes
                expectedSize = (640 * 256) / 2;
                if (dataLength === expectedSize) {
                    mode = '640x256x4';
                    width = 640;
                    height = 256;
                    console.log(`Detected standard 640x256 4-bit ${fileExtension} image (81920 bytes).`);
                    // Extract colors from the image data to create a palette if no appended palette
                    if (!detectedAppendedPaletteData) {
                        console.log('No appended palette detected for 640x256 4-bit image. Extracting colors from image data...');
                        const extractedPalette = this.extract4bitImageColors(imageData, width, height);
                        detectedAppendedPaletteData = extractedPalette;
                    }
                }
                else if (dataLength === expectedSize + 32 && !detectedAppendedPaletteData) {
                    // This case is a fallback if we somehow missed detecting the palette earlier
                    // (It should already be handled by the general palette detection code)
                    console.log(`${fileExtension} file with 32-byte palette detected during format check (81920 + 32 bytes).`);
                    detectedAppendedPaletteData = imageData.slice(imageData.length - 32);
                    imageData = imageData.slice(0, imageData.length - 32);
                    dataLength = expectedSize; // Update dataLength to reflect the image data without palette
                    mode = '640x256x4';
                    width = 640;
                    height = 256;
                }
                else {
                    // For non-standard SL2 file, try to guess dimensions
                    console.warn(`SL2 file size ${dataLength} does not match expected 4-bit dimension (640x256). Expected ${expectedSize}.`);
                    // If user provided custom dimensions, use those
                    if (customWidth && customHeight) {
                        width = customWidth;
                        height = customHeight;
                        guessedDimensions = true;
                    }
                    else {
                        // Try to find an appropriate 4-bit layout (2 pixels per byte)
                        const pixelCount = dataLength * 2; // 2 pixels per byte
                        // Try to find a width that's a multiple of 8
                        for (let tryWidth = 8; tryWidth <= 1024; tryWidth += 8) {
                            const tryHeight = pixelCount / tryWidth;
                            if (tryHeight === Math.floor(tryHeight) && tryHeight > 0) {
                                width = tryWidth;
                                height = tryHeight;
                                guessedDimensions = true;
                                console.log(`Guessed SL2 dimensions as ${width}x${height} (4-bit).`);
                                break;
                            }
                        }
                        // If no width found, default to something reasonable
                        if (width === 0 || height === 0) {
                            width = 320; // Common width
                            height = Math.floor(pixelCount / width);
                            guessedDimensions = true;
                            console.log(`Defaulting SL2 dimensions to ${width}x${height} (4-bit).`);
                        }
                    }
                    mode = 'custom';
                }
                break;
            case '.sll':
                // Custom dimensions required
                mode = 'custom';
                if (customWidth && customHeight) {
                    width = customWidth;
                    height = customHeight;
                    // Assuming 4-bit for custom .sll for now
                    // TODO: Allow choosing between 4-bit and 8-bit for .sll?
                    expectedSize = (width * height) / 2;
                    if (dataLength !== expectedSize) {
                        console.warn(`SLL file size ${dataLength} does not match custom dimensions ${width}x${height} (4-bit). Expected ${expectedSize}. Assuming 8-bit instead.`);
                        // Try 8-bit if 4-bit size doesn't match
                        expectedSize = width * height;
                        if (dataLength === expectedSize) {
                            mode = 'custom'; // Keep as custom mode
                            console.log('Adjusted SLL mode to 8-bit based on size.');
                        }
                        else {
                            console.warn(`SLL file size ${dataLength} doesn't match 8-bit dimensions ${width}x${height} either. Expected ${expectedSize}.`);
                            // Keep custom mode, but expect visual issues
                        }
                    }
                }
                else {
                    // Default to 320x256 if no dimensions provided
                    width = 320;
                    height = 256;
                    console.warn('No dimensions provided for SLL file. Using default 320x256.');
                }
                break;
            default:
                // Fallback: Try guessing based on size if extension is unknown
                if (dataLength === 256 * 192) {
                    mode = '256x192x8';
                    width = 256;
                    height = 192;
                }
                else if (dataLength === 320 * 256) {
                    mode = '320x256x8';
                    width = 320;
                    height = 256;
                }
                else if (dataLength === (640 * 256) / 2) {
                    mode = '640x256x4';
                    width = 640;
                    height = 256;
                }
                else {
                    // For unknown extensions with non-standard sizes, treat as custom
                    mode = 'custom';
                    // Try to guess if it's 4-bit or 8-bit based on size
                    // If size is even, try 4-bit first (2 pixels per byte)
                    const pixelCount = dataLength * 2;
                    let tryWidth = Math.sqrt(pixelCount);
                    if (Number.isInteger(tryWidth)) {
                        // Perfect square for 4-bit
                        width = tryWidth;
                        height = tryWidth;
                        console.log(`Guessed dimensions as ${width}x${height} (4-bit) based on square size.`);
                    }
                    else {
                        // Try 8-bit (1 pixel per byte)
                        tryWidth = Math.sqrt(dataLength);
                        if (Number.isInteger(tryWidth)) {
                            width = tryWidth;
                            height = tryWidth;
                            console.log(`Guessed dimensions as ${width}x${height} (8-bit) based on square size.`);
                        }
                        else {
                            // Default to something reasonable
                            width = 320;
                            height = Math.floor(dataLength / width);
                            if (height <= 0)
                                height = 1;
                            console.log(`Defaulted dimensions to ${width}x${height} for unknown format.`);
                        }
                    }
                    guessedDimensions = true;
                }
                break;
        }
        // For unknown mode, convert to custom mode instead of showing an error
        if (mode === 'custom') {
            console.warn("Converting unknown mode to custom mode with default dimensions for viewing");
            mode = 'custom';
            // If width/height weren't set, use defaults
            if (width === 0 || height === 0) {
                if (customWidth && customHeight) {
                    width = customWidth;
                    height = customHeight;
                }
                else {
                    // Try to make a reasonable guess based on data size
                    width = 256; // Common width
                    height = Math.ceil(dataLength / width);
                }
                guessedDimensions = true;
            }
        }
        console.log(`Parsing image: Mode=${mode}, Width=${width}, Height=${height}, DataLength=${dataLength}`);
        // Actual parsing based on determined mode
        let pixels = null;
        let formatDescription = "Unknown";
        if (mode === '256x192x8' || mode === '320x256x8') {
            if (width === 320 && height === 256) {
                // Special case for 320x256 8-bit images which use column-oriented layout
                pixels = this.parse8bit320x256(imageData);
                formatDescription = '320×256 8-bit (column-oriented)';
            }
            else {
                // Standard row-oriented 8-bit image
                pixels = this.parse8bitImage(imageData, width, height);
                // Set specific mode for 256x192
                if (width === 256 && height === 192) {
                    mode = '256x192x8';
                    formatDescription = '256×192 8-bit (standard)';
                }
                else {
                    formatDescription = `${width}×${height} 8-bit (custom)`;
                    mode = 'custom'; // Any other dimensions are custom
                }
            }
        }
        else if (mode === '640x256x4') {
            // 4-bit images (2 pixels per byte)
            pixels = this.parse4bitInterleaved(imageData, width, height);
            formatDescription = '640×256 4-bit (column-oriented)';
        }
        else {
            // Custom or unknown mode - try to parse as 8-bit by default
            pixels = this.parse8bitImage(imageData, width, height);
            formatDescription = `${width}×${height} (custom format)`;
            mode = 'custom';
        }
        // Check if parsing failed but don't fail with an error - set default pixels instead
        if (!pixels) {
            console.warn(`Failed to parse pixels for mode ${mode}. Using default empty image.`);
            // Create an empty black image of the specified dimensions
            pixels = new Uint8ClampedArray(width * height * 4);
            // Alpha channel is used for index - set to 0
            for (let i = 0; i < pixels.length; i += 4) {
                pixels[i + 3] = 0;
            }
            formatDescription = `${width}x${height}, format unknown (adjust dimensions)`;
        }
        // Store the prefix palette if detected
        this.cachedImageData = {
            width,
            height,
            pixels,
            mode: mode, // Cast necessary as we've ensured mode is not 'unknown' here
            formatDescription,
            appendedPalette: detectedAppendedPaletteData ? this.parsePaletteFile(detectedAppendedPaletteData) : null, // Store parsed appended palette if detected
            prefixPalette: detectedPrefixPaletteData ? this.parsePaletteFile(detectedPrefixPaletteData) : null, // Store parsed prefix palette if detected
            guessedDimensions // Store the flag
        };
        console.log('Finished parsing image data.', this.cachedImageData);
    }
    // --- Pixel Data Parsers ---
    parse8bitImage(data, width, height) {
        const numPixels = width * height;
        // RGBA buffer
        const pixelData = new Uint8ClampedArray(numPixels * 4);
        for (let i = 0; i < numPixels; i++) {
            if (i >= data.length)
                break; // Stop if data is shorter than expected
            const colorIndex = data[i];
            // Store index in Alpha channel for later lookup in JS
            pixelData[i * 4 + 0] = 0; // R (placeholder)
            pixelData[i * 4 + 1] = 0; // G (placeholder)
            pixelData[i * 4 + 2] = 0; // B (placeholder)
            pixelData[i * 4 + 3] = colorIndex; // Store index in Alpha
        }
        return pixelData;
    }
    // Special parser for 320x256 8-bit images which have column-oriented layout
    parse8bit320x256(data) {
        const width = 320;
        const height = 256;
        const numPixels = width * height;
        const pixelData = new Uint8ClampedArray(numPixels * 4);
        console.log(`Parsing 320x256 8-bit image with column-oriented layout`);
        console.log(`  Data length: ${data.length} bytes`);
        // For 320x256 8-bit mode in ZX Next:
        // Similar to the 4-bit format, but 1 byte per pixel instead of 2 pixels per byte
        // - Each column is 256 bytes (1 byte per row/pixel)
        // - First 256 bytes form the first column (0,0)-(0,255)
        // - Next 256 bytes form the second column (1,0)-(1,255)
        // - And so on...
        // Calculate bytes per column
        const bytesPerColumn = height; // Each column is 'height' pixels tall (256)
        const totalColumns = width; // Total number of columns (320)
        console.log(`  Bytes per column: ${bytesPerColumn}, Total columns: ${totalColumns}`);
        for (let col = 0; col < totalColumns; col++) {
            if (col * bytesPerColumn >= data.length)
                break;
            // Calculate the buffer offset for this column
            const byteOffset = col * bytesPerColumn;
            // Process each byte in this column (each byte = 1 pixel)
            for (let y = 0; y < bytesPerColumn; y++) {
                const byteIdx = byteOffset + y;
                if (byteIdx < data.length) {
                    const colorIndex = data[byteIdx];
                    // Calculate screen position (x, y)
                    const screenIdx = (y * width + col) * 4;
                    // Store the color index in the alpha channel
                    if (screenIdx + 3 < pixelData.length) {
                        pixelData[screenIdx + 0] = 0; // R (placeholder)
                        pixelData[screenIdx + 1] = 0; // G (placeholder)
                        pixelData[screenIdx + 2] = 0; // B (placeholder)
                        pixelData[screenIdx + 3] = colorIndex; // Store index in Alpha
                    }
                }
            }
        }
        console.log(`  Finished parsing 320x256 8-bit image with column-oriented layout`);
        return pixelData;
    }
    parse4bitInterleaved(data, width, height) {
        const numPixels = width * height;
        const pixelData = new Uint8ClampedArray(numPixels * 4);
        // For 640x256 (4bpp) mode in ZX Next:
        // - Data is stored in columns (Y is the lowest byte of address)
        // - Each byte contains 2 pixels (high nibble = left pixel, low nibble = right pixel)
        // - First 256 bytes form the first two columns (0,0)-(1,255)
        // - Next 256 bytes form the next two columns (2,0)-(3,255)
        // - And so on...
        console.log(`Parsing 4-bit interleaved: ${width}x${height}, column-oriented format`);
        console.log(`  Data length: ${data.length} bytes`);
        console.log(`  Expected size: ${(width * height) / 2} bytes (before palette)`);
        // Calculate bytes per column
        const bytesPerColumn = height; // Each column is 'height' pixels tall
        const totalDoubleColumns = width / 2; // Total number of double-columns (2 pixels per byte)
        console.log(`  Bytes per column: ${bytesPerColumn}, Total double columns: ${totalDoubleColumns}`);
        for (let doubleCol = 0; doubleCol < totalDoubleColumns; doubleCol++) {
            // Calculate the buffer offset for this double column
            const byteOffset = doubleCol * bytesPerColumn;
            // Calculate the starting X position for this double column
            const xStart = doubleCol * 2;
            // Process each byte in this column (each byte = 1 Y position, 2 X positions)
            for (let y = 0; y < bytesPerColumn; y++) {
                const byteIdx = byteOffset + y;
                if (byteIdx < data.length) {
                    const byteVal = data[byteIdx];
                    // Extract the two pixels from this byte
                    const leftPixel = (byteVal >> 4) & 0x0F; // High nibble
                    const rightPixel = byteVal & 0x0F; // Low nibble
                    // Calculate screen positions
                    const xLeft = xStart;
                    const xRight = xStart + 1;
                    // Place pixels in output buffer at the correct positions
                    // (x,y) coordinates to linear index: y * width + x
                    const leftIdx = (y * width + xLeft) * 4;
                    const rightIdx = (y * width + xRight) * 4;
                    // Set the color indices in the alpha channel
                    if (leftIdx + 3 < pixelData.length) {
                        pixelData[leftIdx + 3] = leftPixel;
                    }
                    if (rightIdx + 3 < pixelData.length) {
                        pixelData[rightIdx + 3] = rightPixel;
                    }
                }
            }
        }
        console.log(`  Finished parsing 4-bit image: ${width}x${height}`);
        // Fill RGB with 0 (will be set in JS based on Alpha index)
        for (let i = 0; i < pixelData.length; i += 4) {
            pixelData[i] = 0; // R
            pixelData[i + 1] = 0; // G
            pixelData[i + 2] = 0; // B
            // Alpha (pixelData[i+3]) already contains the index
        }
        return pixelData;
    }
    // --- Palette Parsing ---
    parsePaletteFile(data) {
        // Check palette size to determine format
        if (data.length === 32) {
            return this.parse32BytePalette(data);
        }
        try {
            // Use the palette utilities for consistent handling
            // This will correctly handle ZX Next's 9-bit RGB format
            const paletteColors = (0, paletteUtils_1.parsePaletteFile)(data);
            return paletteColors.map(color => color.hex);
        }
        catch (error) {
            console.error('Error parsing palette with paletteUtils:', error);
            // Fallback to the default palette if parsing fails
            vscode.window.showErrorMessage(`Failed to parse palette file: ${error}. Using default palette.`);
            return this.generateDefaultHexPalette();
        }
    }
    parse32BytePalette(data) {
        // Handle 32-byte palette format (16 colors, 2 bytes per color)
        // This is commonly used for 4-bit images like SL2
        const colors = [];
        console.log("Parsing 32-byte palette (16 colors, RRRGGGBB PxxxxxxL format).");
        // Process the 16 colors (32 bytes, 2 bytes per color)
        for (let i = 0; i < Math.min(data.length, 32); i += 2) {
            if (i + 1 < data.length) {
                const byte1 = data[i];
                const byte2 = data[i + 1];
                const value16bit = (byte1 << 8) | byte2; // Combine bytes (Big Endian)
                // Use the utility function for consistent color mapping from the 16-bit value
                try {
                    const { rgb9 } = (0, paletteUtils_1.value16BitToRgb9Priority)(value16bit);
                    const hexColor = (0, paletteUtils_1.rgb9ToHex)(rgb9.r9, rgb9.g9, rgb9.b9);
                    colors.push(hexColor);
                    // Log the first few parsed colors for verification
                    if (i < 8) { // Log first 4 colors (indices 0-3)
                        console.log(`  - Index ${i / 2}: Raw=0x${value16bit.toString(16).padStart(4, '0')}, Parsed Hex=${hexColor}`);
                    }
                }
                catch (parseError) {
                    console.error(`Error parsing color index ${i / 2} (value: 0x${value16bit.toString(16).padStart(4, '0')}):`, parseError);
                    colors.push('#FF00FF'); // Use magenta for errors
                }
            }
        }
        // For 4-bit images, we only need 16 colors (palette entries 0-15)
        // Pad if the input data was somehow less than 32 bytes but still triggered this path
        while (colors.length < 16) {
            colors.push('#000000'); // Pad missing colors to 16
        }
        // The webview expects a 256-color palette, even for 4-bit images where only the first 16
        // (or 16 starting at an offset) are used. Repeat the 16 colors to fill 256 slots.
        const fullPalette = [];
        for (let j = 0; j < 16; j++) { // Repeat the block 16 times
            for (let k = 0; k < 16; k++) { // Add each of the 16 parsed colors
                fullPalette.push(colors[k % colors.length]); // Use modulo just in case colors array isn't exactly 16
            }
        }
        return fullPalette;
    }
    generateDefaultHexPalette() {
        // Use the utility for consistent color mapping
        return this.defaultPalette.map(rgb => {
            return (0, paletteUtils_1.rgb9ToHex)(rgb[0], rgb[1], rgb[2]);
        });
    }
    // --- Webview Content ---
    updateWebviewContent(webviewPanel, filePath, fileExtension, viewState) {
        // Ensure viewState has expected values to avoid errors
        if (!viewState.scale)
            viewState.scale = 1;
        if (!viewState.paletteOffset)
            viewState.paletteOffset = 0;
        // Ensure scale is always an integer value of 1 or greater
        viewState.scale = Math.max(1, Math.round(viewState.scale));
        if (!this.cachedImageData || !this.cachedImageData.pixels) {
            console.error("No cached image data to display");
            webviewPanel.webview.html = this.getErrorHtml(new Error("Failed to parse image data"));
            return;
        }
        // If we have custom dimensions specified, store them back in our cached data
        if (viewState.customWidth && viewState.customHeight) {
            this.cachedImageData.width = viewState.customWidth;
            this.cachedImageData.height = viewState.customHeight;
        }
        // Use appropriate palette based on current source
        const palette = this.getCurrentPalette();
        // Log the palette being sent (first 8 entries)
        console.log(`[ImageViewerProvider] Sending palette to webview (first 8):`, palette.slice(0, 8));
        // Clone the cached image data to avoid references (which might cause issues later)
        const imageDataToSend = {
            pixels: this.cachedImageData.pixels,
            width: this.cachedImageData.width,
            height: this.cachedImageData.height,
            mode: this.cachedImageData.mode, // Should have been set during parsing, e.g. 640x256x4
            formatDescription: this.cachedImageData.formatDescription,
            appendedPalette: this.cachedImageData.appendedPalette,
            prefixPalette: this.cachedImageData.prefixPalette,
            guessedDimensions: this.cachedImageData.guessedDimensions
        };
        // Initial HTML
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, filePath, fileExtension, imageDataToSend, viewState);
        // Listen for when the webview is fully loaded before sending the data
        const disposable = webviewPanel.webview.onDidReceiveMessage(message => {
            if (message.command === 'webviewLoaded') {
                // First, send an initialization message with basic info
                webviewPanel.webview.postMessage({
                    command: 'initialize',
                    fileName: path.basename(filePath),
                    viewState: viewState
                });
                // Then send the full data for redraw
                webviewPanel.webview.postMessage({
                    command: 'redraw',
                    imageData: imageDataToSend,
                    palette: palette,
                    viewState: viewState,
                    paletteSource: this.currentPaletteSource
                });
                // Remove the event listener since we only need it once
                disposable.dispose();
            }
        });
        // As a fallback, also send the data immediately (in case the loaded event isn't triggered)
        setTimeout(() => {
            webviewPanel.webview.postMessage({
                command: 'redraw',
                imageData: imageDataToSend,
                palette: palette,
                viewState: viewState,
                paletteSource: this.currentPaletteSource
            });
        }, 500);
    }
    getHtmlForWebview(webview, filePath, fileExtension, imageData, viewState) {
        const fileName = path.basename(filePath);
        const nonce = Date.now().toString(); // Simple nonce for CSP
        // Get paths to external resources
        const scriptPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'imageViewer', 'imageViewer.js');
        const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'imageViewer', 'imageViewer.css');
        // Convert to webview URIs
        const scriptUri = webview.asWebviewUri(scriptPath);
        const cssUri = webview.asWebviewUri(cssPath);
        let htmlContent = '';
        try {
            // Load the HTML file content directly
            const htmlPath = path.join(this.context.extensionPath, 'src', 'webview', 'imageViewer', 'imageViewer.html');
            htmlContent = fs.readFileSync(htmlPath, 'utf8');
            // Replace the CSS link with the correct webview URI
            htmlContent = htmlContent.replace('<link rel="stylesheet" href="imageViewer.css">', `<link rel="stylesheet" href="${cssUri}">`);
        }
        catch (error) {
            console.error('Failed to load HTML template:', error);
            htmlContent = `
                <div style="text-align: center; margin-top: 20px;">
                    <h1>Error Loading Image Viewer</h1>
                    <p>Failed to load the image viewer template: ${error}</p>
                </div>
            `;
        }
        // Return the full HTML with proper CSP
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src data:;">
                <title>ZX Next Image Viewer</title>
                <script nonce="${nonce}">
                    // Set the filename as a data attribute on the body when loaded
                    window.addEventListener('DOMContentLoaded', () => {
                        document.body.dataset.fileName = "${this.encodeHtmlAttribute(fileName)}";
                    });
                </script>
            </head>
            <body data-file-name="${this.encodeHtmlAttribute(fileName)}">
                ${htmlContent}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
    getErrorHtml(error) {
        // Reuse error HTML styling
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                body {
                    padding: 20px;
                    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-errorForeground);
                }
                .error {
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-inputValidation-errorBackground);
                    padding: 10px;
                    border-left: 3px solid var(--vscode-inputValidation-errorBorder);
                    border-radius: 2px;
                }
            </style>
        </head>
        <body>
            <h1>Error Loading Image File</h1>
            <div class="error">
                <p>${error?.message || error?.toString() || 'Unknown error'}</p>
            </div>
            <p>Make sure the file is a valid ZX Next image (.nxi, .sl2, .sll) file.</p>
        </body>
        </html>
        `;
    }
    encodeHtmlAttribute(value) {
        // Basic encoding for attributes
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    getWebviewScript(nonce, viewState) {
        // No longer needed - we're using the external JS file
        return '';
    }
    // Helper method to get the current palette based on the source
    getCurrentPalette() {
        let sourceUsed = 'default'; // Track which source is used
        let paletteToReturn;
        if (this.currentPaletteSource === 'prefix' && this.cachedImageData?.prefixPalette) {
            sourceUsed = 'prefix';
            paletteToReturn = this.cachedImageData.prefixPalette;
        }
        else if (this.currentPaletteSource === 'appended' && this.cachedImageData?.appendedPalette) {
            sourceUsed = 'appended';
            paletteToReturn = this.cachedImageData.appendedPalette;
        }
        else if (this.currentPaletteSource === 'loaded' && this.customPalette) {
            sourceUsed = 'loaded';
            paletteToReturn = this.customPalette;
        }
        else {
            // Reset to default if others aren't available or source is 'default'
            if (this.currentPaletteSource !== 'default') {
                console.log(`[getCurrentPalette] Warning: Source was ${this.currentPaletteSource} but required palette was missing. Reverting to default.`);
                this.currentPaletteSource = 'default';
                this.customPalette = null;
                this.customPaletteName = '';
                // Potentially notify webview about the source change?
            }
            sourceUsed = 'default';
            paletteToReturn = this.generateDefaultHexPalette();
        }
        // Add logging here
        console.log(`[getCurrentPalette] Source: ${this.currentPaletteSource}. Using palette from: ${sourceUsed}. First 8:`, paletteToReturn.slice(0, 8));
        return paletteToReturn;
    }
    // Extract a 16-color palette from a 4-bit image
    extract4bitImageColors(data, width, height) {
        console.log('Extracting colors from 4-bit image data...');
        // For 4-bit images, we need to count color frequency
        const colorCounts = new Map();
        // For 640x256 (4bpp) mode in ZX Next:
        // - Data is stored in columns (Y is the lowest byte of address)
        // - Each byte contains 2 pixels (high nibble = left pixel, low nibble = right pixel)
        // Calculate bytes per column
        const bytesPerColumn = height; // Each column is 'height' pixels tall
        const totalDoubleColumns = width / 2; // Total number of double-columns (2 pixels per byte)
        // Count the frequency of each color index (0-15)
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            const leftPixel = (byte >> 4) & 0x0F; // High nibble
            const rightPixel = byte & 0x0F; // Low nibble
            colorCounts.set(leftPixel, (colorCounts.get(leftPixel) || 0) + 1);
            colorCounts.set(rightPixel, (colorCounts.get(rightPixel) || 0) + 1);
        }
        // Convert to array of [colorIndex, count] pairs and sort by frequency
        const sortedColors = Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
            .map(entry => entry[0]); // Keep only the color index
        console.log(`Found ${sortedColors.length} unique colors in image`);
        // Ensure we have exactly 16 colors (pad with zeros if needed)
        while (sortedColors.length < 16) {
            sortedColors.push(0); // Add black for missing colors
        }
        // Take only the top 16 colors if we have more
        const top16Colors = sortedColors.slice(0, 16);
        // Create a palette buffer (32 bytes - 16 colors × 2 bytes per color)
        const paletteBuffer = Buffer.alloc(32);
        // Map each color index to a ZX Next RGB333 color
        // We'll use the default palette's colors based on the indices
        for (let i = 0; i < 16; i++) {
            const colorIndex = top16Colors[i];
            // Get RGB values from the default palette for this index
            const rgb = this.defaultPalette[colorIndex] || [0, 0, 0];
            // Convert to ZX Next 9-bit RGB format (RRRGGGBBB)
            const r3 = rgb[0]; // Already in 0-7 range
            const g3 = rgb[1]; // Already in 0-7 range
            const b3 = rgb[2]; // Already in 0-7 range
            // Pack into 16-bit value (only 9 bits used)
            // Format: RRRGGGBBB in the lower 9 bits
            const value16bit = (r3 << 6) | (g3 << 3) | b3;
            // Store in buffer (big endian)
            paletteBuffer[i * 2] = (value16bit >> 8) & 0xFF;
            paletteBuffer[i * 2 + 1] = value16bit & 0xFF;
        }
        console.log('Created 16-color palette from image data');
        return paletteBuffer;
    }
}
exports.ImageViewerProvider = ImageViewerProvider;
//# sourceMappingURL=imageViewerProvider.js.map