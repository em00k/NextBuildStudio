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
exports.PaletteViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const paletteUtils_1 = require("./paletteUtils");
const paletteManipulation_1 = require("./paletteManipulation");
const paletteOperationsUI_1 = require("./paletteOperationsUI");
const imageColorExtractor_1 = require("./imageColorExtractor");
class PaletteDocument {
    _state;
    paletteHistory;
    // Add our custom dirty flag - we'll control this instead of VS Code's built-in flag
    _customIsDirty = false;
    constructor(state) {
        this._state = state;
        this.paletteHistory = new paletteManipulation_1.PaletteHistory(state.palette);
    }
    get uri() { return this._state.uri; }
    get state() { return this._state; }
    // Add getters and setters for our custom dirty state
    get customIsDirty() { return this._customIsDirty; }
    set customIsDirty(value) { this._customIsDirty = value; }
    dispose() {
        console.log("Disposing palette document:", this.uri.toString());
    }
}
// --- End document state and class ---
// --- Update provider to implement CustomEditorProvider<PaletteDocument> ---
class PaletteViewerProvider {
    context;
    static viewType = 'nextbuild-viewers.paletteViewer';
    // --- Add Event Emitter ---
    _onDidChangeCustomDocument = new vscode.EventEmitter();
    onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    // --- Keep track of documents ---
    documents = new Map();
    constructor(context) {
        this.context = context;
    }
    // --- Update openCustomDocument --- 
    async openCustomDocument(uri, openContext, token) {
        // Check if we already have this document
        const documentKey = uri.toString();
        if (this.documents.has(documentKey)) {
            console.log(`[PaletteProvider] Retrieved existing document for ${documentKey}`);
            return this.documents.get(documentKey);
        }
        try {
            console.log(`[PaletteProvider] Opening document: ${uri.fsPath}`);
            // Load the document
            const data = await this._loadDocumentData(uri);
            // Create a new document state
            const state = {
                uri,
                palette: data.palette,
                isDirty: false,
                originalData: data.rawData
            };
            // Create a new document
            const document = new PaletteDocument(state);
            // Store reference to provider (for operations)
            document._provider = this;
            // Initialize palette history
            document.paletteHistory = new paletteManipulation_1.PaletteHistory(state.palette);
            // Add the document to the map
            this.documents.set(documentKey, document);
            return document;
        }
        catch (error) {
            console.error(`[PaletteProvider] Error opening document: ${uri.fsPath}`, error);
            throw error;
        }
    }
    // --- Update resolveCustomEditor --- 
    async resolveCustomEditor(document, webviewPanel, token) {
        try {
            console.log(`[PaletteProvider] Resolving custom editor for ${document.uri}`);
            // Set up the webview
            webviewPanel.webview.options = {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                    vscode.Uri.joinPath(this.context.extensionUri, 'src/webview')
                ]
            };
            // Get the palette data
            const palette = document.state.palette;
            // Create the HTML content
            webviewPanel.webview.html = await this.getHtmlForWebview(webviewPanel.webview, palette, document.uri.fsPath);
            // --- Refactored Message Handling --- 
            webviewPanel.webview.onDidReceiveMessage(message => {
                console.log("[PaletteProvider] Received message:", message.command);
                switch (message.command) {
                    case 'paletteEdit':
                        this._handlePaletteEdit(document, message, webviewPanel);
                        break;
                    case 'saveChanges':
                        this._handleSaveChanges(document, webviewPanel);
                        break;
                    case 'updatePaletteOrder':
                        this._handleUpdatePaletteOrder(document, message, webviewPanel);
                        break;
                    case 'updateFullPalette':
                        this._handleUpdateFullPalette(document, message, webviewPanel);
                        break;
                    case 'loadSecondaryPalette':
                        this._handleLoadSecondaryPalette(webviewPanel);
                        break;
                    case 'showError':
                        this._handleShowError(message);
                        break;
                    case 'copyToClipboard': // Kept for potential future use, though webview handles it now
                        this._handleCopyToClipboard(message);
                        break;
                    case 'readClipboard': // Renamed from readFromClipboard for clarity
                        this._handleReadClipboard(webviewPanel);
                        break;
                    case 'updatePriorityBit':
                        this._handleUpdatePriorityBit(document, webviewPanel, message);
                        break;
                    case 'showInfo':
                        this._handleShowInfo(message);
                        break;
                    case 'importPalette':
                        this._handleImportPalette(document, webviewPanel);
                        break;
                    case 'paletteSwap':
                        this._handlePaletteSwap(document, message, webviewPanel);
                        break;
                    // New handlers for palette operations
                    case 'resetToDefaultPalette':
                        this._handleResetToDefaultPalette(document, webviewPanel);
                        break;
                    // Direct handler for confirm reset message
                    case 'requestConfirmResetPalette':
                        this._handleRequestConfirmResetPalette(document, webviewPanel);
                        break;
                    // Other palette operation commands
                    case 'sortPalette':
                    case 'generateGradient':
                    case 'generateHarmonies':
                    case 'reducePalette':
                    case 'undoPaletteOperation':
                    case 'redoPaletteOperation':
                    case 'updatePriorityVisualization':
                        (0, paletteOperationsUI_1.handlePaletteOperationMessage)(message, document, webviewPanel, document.paletteHistory);
                        break;
                    default:
                        console.warn(`[PaletteProvider] Received unknown message command: ${message.command}`);
                }
            });
            // --- End Message Handling ---
        }
        catch (error) {
            webviewPanel.webview.html = await this.getErrorHtml(error);
        }
        webviewPanel.onDidDispose(() => {
            console.log(`[PaletteProvider] Webview disposed for ${document.uri.toString()}. Removing from map.`);
            this.documents.delete(document.uri.toString());
            console.log(`[PaletteProvider] Map size after disposal: ${this.documents.size}`);
        });
        // Utility function to notify webview of dirty state - currently disabled to avoid triggering autosave
        this._notifyDirtyState(document, webviewPanel);
    }
    // --- Private Message Handling Methods ---
    _handlePaletteEdit(document, message, webviewPanel) {
        const { index, newHexColor } = message;
        console.log(`[PaletteProvider] Edit: Index ${index}, Color ${newHexColor}`);
        if (index >= 0 && index < document.state.palette.length && typeof newHexColor === 'string') {
            const currentEntry = document.state.palette[index];
            if (currentEntry.hex !== newHexColor) {
                // Store the old color for undo
                const oldColor = { ...currentEntry };
                // Update the color
                currentEntry.hex = newHexColor;
                // Add to history
                document.paletteHistory.addOperation({
                    type: 'colorEdit',
                    index,
                    oldColor,
                    newColor: { ...currentEntry }
                });
                // Mark as dirty using custom flag and update UI
                this._updateCustomDirtyState(document, webviewPanel, true);
                console.log(`[PaletteProvider] Document marked dirty (custom flag).`);
            }
        }
        else {
            console.warn(`[PaletteProvider] Invalid index/color received for edit:`, message);
        }
    }
    async _handleSaveChanges(document, webviewPanel) {
        console.log("[PaletteProvider] Save requested.");
        try {
            // Only set VS Code's dirty state at save time, not during edits
            if (document.customIsDirty) {
                // Temporarily mark VS Code's state as dirty so the save will work
                document.state.isDirty = true;
                this._onDidChangeCustomDocument.fire({
                    document,
                    undo: () => this._undoOperation(document, webviewPanel),
                    redo: () => this._redoOperation(document, webviewPanel)
                });
            }
            await this._performSave(document);
            // After successful save, clear both flags
            document.customIsDirty = false;
            document.state.isDirty = false;
            // Update UI to show saved state (safe to do at explicit save time)
            webviewPanel.webview.postMessage({
                command: 'updateDirtyState',
                isDirty: false
            });
            vscode.window.showInformationMessage("Palette file saved successfully.");
        }
        catch (error) {
            console.error("[PaletteProvider] Error saving palette:", error);
            vscode.window.showErrorMessage(`Failed to save palette: ${error?.message || 'Unknown error'}`);
        }
    }
    // Called when document is explicitly marked dirty by user action
    _updateCustomDirtyState(document, webviewPanel, isDirty) {
        document.customIsDirty = isDirty;
        // Update UI with dirty state (save button appearance)
        webviewPanel.webview.postMessage({
            command: 'updateSaveButtonAppearance', // New command that only updates button appearance 
            isDirty: isDirty
        });
        console.log(`[PaletteProvider] Document custom dirty state: ${isDirty} (UI updated, no VS Code notification)`);
    }
    _handleUpdatePaletteOrder(document, message, webviewPanel) {
        if (message.palette && Array.isArray(message.palette) && message.palette.length === document.state.palette.length) {
            console.log("[PaletteProvider] Updating palette order.");
            // Store old palette for undo
            const oldPalette = [...document.state.palette.map(color => ({ ...color }))];
            // Update with new palette
            const newPalette = message.palette.map((p) => ({ ...p })); // Deep copy
            document.state.palette = newPalette;
            // Add to history
            document.paletteHistory.addOperation({
                type: 'reorder',
                oldPalette,
                newPalette: [...newPalette]
            });
            // Mark as dirty using custom flag and update UI
            this._updateCustomDirtyState(document, webviewPanel, true);
        }
        else {
            console.warn("[PaletteProvider] Invalid updatePaletteOrder message.");
        }
    }
    _handleUpdateFullPalette(document, message, webviewPanel) {
        if (message.palette && Array.isArray(message.palette) && message.palette.length === document.state.palette.length) {
            console.log("[PaletteProvider] Updating full palette (e.g., after merge or priority reset).");
            // Store old palette for undo
            const oldPalette = [...document.state.palette.map(color => ({ ...color }))];
            // Update with new palette
            const newPalette = message.palette.map((p) => ({ ...p })); // Deep copy
            document.state.palette = newPalette;
            // Add to history
            document.paletteHistory.addOperation({
                type: 'fullUpdate',
                oldPalette,
                newPalette: [...newPalette]
            });
            // Mark as dirty using custom flag and update UI
            this._updateCustomDirtyState(document, webviewPanel, true);
        }
        else {
            console.warn("[PaletteProvider] Received invalid updateFullPalette message.");
        }
    }
    async _handleLoadSecondaryPalette(webviewPanel) {
        console.log("[PaletteProvider] Load secondary palette requested.");
        try {
            const fileUris = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: { 'Palette Files': ['pal', 'nxp'] },
                title: 'Select Secondary Palette File (16 colors recommended)'
            });
            if (fileUris && fileUris[0]) {
                const paletteData = await vscode.workspace.fs.readFile(fileUris[0]);
                const secondaryPalette = (0, paletteUtils_1.parsePaletteFile)(paletteData);
                const secondaryPaletteName = path.basename(fileUris[0].fsPath);
                console.log(`[PaletteProvider] Sending secondary palette (${secondaryPaletteName}) data to webview.`);
                webviewPanel.webview.postMessage({
                    command: 'loadSecondaryPaletteData',
                    palette: secondaryPalette.slice(0, 16), // Send only first 16
                    name: secondaryPaletteName
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to load secondary palette file: ' + error?.message);
        }
    }
    _handleShowError(message) {
        if (message.message && typeof message.message === 'string') {
            vscode.window.showErrorMessage(message.message);
        }
    }
    // Kept for potential future use, but webview handles copy directly now
    async _handleCopyToClipboard(message) {
        if (typeof message.text === 'string') {
            console.log(`[PaletteProvider] Copying to clipboard (Provider): "${message.text}"`);
            await vscode.env.clipboard.writeText(message.text);
        }
        else {
            console.warn("[PaletteProvider] Invalid copyToClipboard message.");
        }
    }
    async _handleReadClipboard(webviewPanel) {
        console.log(`[PaletteProvider] Reading clipboard for webview.`);
        const clipboardText = await vscode.env.clipboard.readText();
        webviewPanel.webview.postMessage({
            command: 'clipboardReadResult',
            text: clipboardText
        });
    }
    _handleUpdatePriorityBit(document, webviewPanel, message) {
        console.log("[PaletteProvider] Update priority bit requested.");
        if (message.index >= 0 && message.index < document.state.palette.length && message.priority !== undefined) {
            const index = message.index;
            const newPriority = !!message.priority; // Convert to boolean
            if (document.state.palette[index].priority !== newPriority) {
                // Store old color for undo
                const oldColor = { ...document.state.palette[index] };
                // Update priority
                document.state.palette[index].priority = newPriority;
                // Add to history
                document.paletteHistory.addOperation({
                    type: 'priorityChange',
                    index,
                    oldColor,
                    newColor: { ...document.state.palette[index] }
                });
                // Mark as dirty using custom flag and update UI
                this._updateCustomDirtyState(document, webviewPanel, true);
                console.log(`[PaletteProvider] Updated priority bit for index ${index} to ${newPriority}`);
            }
        }
        else {
            console.warn("[PaletteProvider] Received invalid updatePriorityBit message.");
        }
    }
    _handlePaletteSwap(document, message, webviewPanel) {
        console.log("[PaletteProvider] Palette swap requested.");
        // Validate message parameters
        if (message.indexA === undefined || message.indexB === undefined ||
            !message.newColorA || !message.newColorB ||
            message.indexA === message.indexB) {
            console.warn("[PaletteProvider] Received invalid paletteSwap message:", message);
            return;
        }
        const indexA = message.indexA;
        const indexB = message.indexB;
        // Validate index ranges
        if (indexA < 0 || indexA >= document.state.palette.length ||
            indexB < 0 || indexB >= document.state.palette.length) {
            console.warn(`[PaletteProvider] Invalid indices for palette swap: ${indexA}, ${indexB}`);
            return;
        }
        // Store old colors for undo
        const oldColorA = { ...document.state.palette[indexA] };
        const oldColorB = { ...document.state.palette[indexB] };
        // Swap the colors in the document palette
        document.state.palette[indexA] = {
            hex: message.newColorA.hex,
            priority: message.newColorA.priority !== undefined ? message.newColorA.priority : oldColorA.priority
        };
        document.state.palette[indexB] = {
            hex: message.newColorB.hex,
            priority: message.newColorB.priority !== undefined ? message.newColorB.priority : oldColorB.priority
        };
        // Add to history
        document.paletteHistory.addOperation({
            type: 'swap',
            indexA,
            indexB,
            oldColorA,
            oldColorB,
            newColorA: { ...document.state.palette[indexA] },
            newColorB: { ...document.state.palette[indexB] }
        });
        // Mark as dirty using custom flag and update UI
        this._updateCustomDirtyState(document, webviewPanel, true);
        console.log(`[PaletteProvider] Swapped colors at indices ${indexA} and ${indexB}`);
    }
    _handleShowInfo(message) {
        if (message.message && typeof message.message === 'string') {
            vscode.window.showInformationMessage(message.message);
        }
    }
    async _handleImportPalette(document, webviewPanel) {
        console.log("[PaletteProvider] Import palette requested.");
        try {
            const fileUris = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: { 'Palette Files': ['pal', 'act', 'gpl', 'txt', 'bin', 'nxp'], 'Images': ['png', 'jpg', 'jpeg', 'bmp', 'gif'], 'All Files': ['*'] },
                title: 'Select Palette File or Image to Import'
            });
            if (fileUris && fileUris[0]) {
                const fileData = await vscode.workspace.fs.readFile(fileUris[0]);
                const fileName = path.basename(fileUris[0].fsPath);
                const fileExt = path.extname(fileUris[0].fsPath).toLowerCase();
                // Check if it's an image file
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'];
                if (imageExtensions.includes(fileExt)) {
                    await this._handleExtractColorsFromImage(document, webviewPanel, fileData, fileName);
                    return;
                }
                // Detect format based on extension and size
                let importedPalette = [];
                let importType = 'unknown';
                let isNativeFormat = false;
                // ZX Next native palette format (512 bytes, 256 colors × 2 bytes)
                if (fileData.length === 512 || fileExt === '.nxp') {
                    importedPalette = (0, paletteUtils_1.parsePaletteFile)(fileData);
                    importType = 'zxnext';
                    isNativeFormat = true;
                }
                // Standard RGB palette (768 bytes) - common in many graphics applications
                else if (fileData.length === 768) {
                    importedPalette = this._importRgbPalette(fileData);
                    importType = 'rgb';
                }
                // Adobe Color Table (.act) - 772 bytes (768 + 4 byte header)
                else if (fileData.length === 772 && (fileExt === '.act' || fileExt === '.pal')) {
                    importedPalette = this._importAdobeColorTable(fileData);
                    importType = 'act';
                }
                // GIMP Palette (.gpl) - text-based format
                else if (fileExt === '.gpl') {
                    importedPalette = this._importGimpPalette(fileData);
                    importType = 'gpl';
                }
                // Handle other formats or show error
                else {
                    throw new Error(`Unrecognized palette format: ${fileName} (${fileData.length} bytes)`);
                }
                console.log(`[PaletteProvider] Imported ${importedPalette.length} colors from ${fileName} (${importType} format)`);
                // Send palette to webview for preview before applying
                webviewPanel.webview.postMessage({
                    command: 'previewImportedPalette',
                    palette: importedPalette,
                    fileName: fileName,
                    importType: importType,
                    isNativeFormat: isNativeFormat
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to import palette: ${error?.message || 'Unknown error'}`);
        }
    }
    async _handleExtractColorsFromImage(document, webviewPanel, imageData, fileName) {
        try {
            // Show progress notification
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Extracting colors from image...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                // Extract colours from the image
                const extractedPalette = await (0, imageColorExtractor_1.extractColorsFromImage)(imageData);
                progress.report({ increment: 100, message: "Done!" });
                console.log(`[PaletteProvider] Extracted ${extractedPalette.length} colors from image ${fileName}`);
                // Send palette to webview for preview before applying
                webviewPanel.webview.postMessage({
                    command: 'previewImportedPalette',
                    palette: extractedPalette,
                    fileName: fileName,
                    importType: 'image',
                    isNativeFormat: false
                });
                return extractedPalette;
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to extract colours from image: ${error?.message || 'Unknown error'}`);
        }
    }
    // Convert standard RGB palette (768 bytes) to PaletteColor array
    _importRgbPalette(fileData) {
        if (fileData.length !== 768) {
            throw new Error('Invalid RGB palette file size. Expected 768 bytes.');
        }
        const palette = [];
        // Process 256 colors, each with R,G,B bytes
        for (let i = 0; i < 256; i++) {
            const r8 = fileData[i * 3];
            const g8 = fileData[i * 3 + 1];
            const b8 = fileData[i * 3 + 2];
            // Convert 8-bit RGB to ZX Next 9-bit format
            const r9 = Math.round((r8 / 255) * 7);
            const g9 = Math.round((g8 / 255) * 7);
            const b9 = Math.round((b8 / 255) * 7);
            // Convert to hex using the utility function
            const hex = (0, paletteUtils_1.rgb9ToHex)(r9, g9, b9);
            palette.push({ hex, priority: false });
        }
        return palette;
    }
    // Convert Adobe Color Table (.act) to PaletteColor array
    _importAdobeColorTable(fileData) {
        // ACT files are 768 bytes of RGB values + 4 bytes of header
        // (number of colors, start index, unused)
        if (fileData.length !== 772 && fileData.length !== 768) {
            throw new Error('Invalid Adobe Color Table size. Expected 772 or 768 bytes.');
        }
        const dataView = new DataView(fileData.buffer);
        let numColors = 256;
        // If 772 bytes, check if the color count is specified in the header
        if (fileData.length === 772) {
            const headerColorCount = dataView.getUint16(768, false); // big-endian
            if (headerColorCount > 0) {
                numColors = headerColorCount;
            }
        }
        const palette = [];
        // Process colors
        for (let i = 0; i < numColors; i++) {
            const r8 = fileData[i * 3];
            const g8 = fileData[i * 3 + 1];
            const b8 = fileData[i * 3 + 2];
            // Convert to ZX Next format
            const r9 = Math.round((r8 / 255) * 7);
            const g9 = Math.round((g8 / 255) * 7);
            const b9 = Math.round((b8 / 255) * 7);
            const hex = (0, paletteUtils_1.rgb9ToHex)(r9, g9, b9);
            palette.push({ hex, priority: false });
        }
        // Pad with black to 256 colors if needed
        while (palette.length < 256) {
            palette.push({ hex: '#000000', priority: false });
        }
        return palette;
    }
    // Convert GIMP Palette (.gpl) to PaletteColor array
    _importGimpPalette(fileData) {
        const text = new TextDecoder().decode(fileData);
        const lines = text.split(/\r?\n/);
        const palette = [];
        if (!lines[0].includes('GIMP Palette')) {
            throw new Error('Invalid GIMP palette file. Missing header.');
        }
        for (const line of lines) {
            // Skip comments, header, empty lines
            if (line.trim() === '' || line.startsWith('#') || line.startsWith('GIMP')) {
                continue;
            }
            // Parse RGB values - format is typically: "R G B Name"
            const match = line.match(/^(\d+)\s+(\d+)\s+(\d+)/);
            if (match) {
                const r8 = parseInt(match[1], 10);
                const g8 = parseInt(match[2], 10);
                const b8 = parseInt(match[3], 10);
                // Convert to ZX Next format
                const r9 = Math.round((r8 / 255) * 7);
                const g9 = Math.round((g8 / 255) * 7);
                const b9 = Math.round((b8 / 255) * 7);
                const hex = (0, paletteUtils_1.rgb9ToHex)(r9, g9, b9);
                palette.push({ hex, priority: false });
                // Stop at 256 colors
                if (palette.length >= 256) {
                    break;
                }
            }
        }
        // Pad with black to 256 colors if needed
        while (palette.length < 256) {
            palette.push({ hex: '#000000', priority: false });
        }
        return palette;
    }
    // --- HTML generation methods ---
    async getHtmlForWebview(webview, palette, filePath) {
        try {
            console.log("[PaletteProvider] Starting HTML generation");
            const fileName = path.basename(filePath);
            const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'paletteWebview.css'));
            const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'paletteWebview.js'));
            const colorUtilsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'colorUtils.js'));
            const nonce = this.getNonce();
            // Load the HTML template
            const htmlTemplateUri = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'paletteWebview.html');
            console.log(`[PaletteProvider] Loading HTML template from: ${htmlTemplateUri.fsPath}`);
            let htmlContent = await vscode.workspace.fs.readFile(htmlTemplateUri).then(buffer => buffer.toString());
            console.log(`[PaletteProvider] HTML template loaded, length: ${htmlContent.length}`);
            // Generate content for placeholders
            const initialPaletteJson = JSON.stringify(palette);
            console.log(`[PaletteProvider] Generated palette JSON, length: ${initialPaletteJson.length}`);
            console.log(`[PaletteProvider] Generating color boxes for ${palette.length} colors`);
            // Create a more robust color box generation with proper class names and attributes
            const colorBoxes = palette.map((colorEntry, index) => {
                const rgb9 = (0, paletteUtils_1.hexToRgb9)(colorEntry.hex);
                const [byte1, byte2] = (0, paletteUtils_1.rgb9ToBytes)(rgb9.r9, rgb9.g9, rgb9.b9);
                return `
                <div class="color-box" 
                     data-index="${index}" 
                     data-hex="${colorEntry.hex}"
                     data-priority="${colorEntry.priority ? 'true' : 'false'}" 
                     data-byte1="${byte1.toString(16).toUpperCase().padStart(2, '0')}"
                     data-byte2="${byte2.toString(16).toUpperCase().padStart(2, '0')}"
                     style="background-color: ${colorEntry.hex}" 
                     title="Index: ${index}
                    Hex: ${colorEntry.hex}
                    RGB9: (${rgb9.r9},${rgb9.g9},${rgb9.b9})
                    Priority: ${colorEntry.priority}
                    Bytes: %${byte1.toString(16).toUpperCase().padStart(2, '0')},%${byte2.toString(16).toUpperCase().padStart(2, '0')}"
                        draggable="true">
                    <span class="color-index">${index}</span>
                </div>`;
            }).join('');
            // Generate HTML for toolbar
            const toolbarHtml = `
            <div class="toolbar">
                <div class="file-info" style="width: 100%;">${fileName}</div>
                <div class="toolbar-actions">
                    <button id="undoButton" title="Undo last operation" disabled>Undo</button>
                    <button id="redoButton" title="Redo last operation" disabled>Redo</button>
                    <button id="defaultPaletteButton" title="Reset to default palette">Default Palette</button>                    
                    <button id="importPaletteButton" title="Import palette from other formats">Import...</button>
                    <button id="importImageButton" title="Extract colours from an image">Import from Image...</button>
                    <button id="sortPaletteButton">Sort Palette</button>
                    <button id="generateGradientButton">Generate Gradient</button>
                    <button id="generateHarmoniesButton">Generate Harmonies</button>
                    <button id="reducePaletteButton">Reduce Palette</button>
                </div>
            </div>`;
            // Generate HTML for editor panel
            const editorPanelHtml = this._getEditorPanelHtml();
            // Generate HTML for hover info
            const hoverInfoHtml = this._getHoverInfoHtml();
            // Generate HTML for merge tool
            const mergeToolHtml = this._getMergeToolHtml();
            // Generate HTML for info section
            const infoSectionHtml = `
            <div>Total colours: ${palette.length}</div>
            <div>Format: ZX Next 9-bit RGB (3 bits per component)</div>`;
            // Generate HTML for import dialog
            const importDialogHtml = `
            <div class="import-dialog-content">
                <h2>Import Palette</h2>
                <div id="importInfo" class="import-info">
                    Select Import... to choose a palette file to import.
                </div>
                <div id="importPreview" class="import-preview" style="display: none;">
                    <!-- Preview will be populated by JS -->
                </div>
                <div class="import-options">
                    <div class="import-option-row">
                        <label for="importOffset">Import at offset:</label>
                        <input type="number" id="importOffset" min="0" max="240" step="16" value="0">
                    </div>
                    <div class="import-option-row">
                        <label for="importCount">Number of colours:</label>
                        <input type="number" id="importCount" min="1" max="256" value="16">
                    </div>
                </div>
                <div class="import-dialog-buttons">
                    <button id="cancelImportButton">Cancel</button>
                    <button id="startImportButton">Select File...</button>
                    <button id="confirmImportButton" style="display: none;">Apply Import</button>
                </div>
            </div>`;
            // Generate HTML for color operation dialogs
            const colorOperationDialogsHtml = `
            <div id="sortPaletteDialog" class="operation-dialog">
                <div class="operation-dialog-content">
                    <h2>Sort Palette</h2>
                    <div class="operation-form">
                        <div class="operation-form-row">
                            <label for="sortMode">Sort By:</label>
                            <select id="sortMode">
                                <option value="hue">Hue</option>
                                <option value="saturation">Saturation</option>
                                <option value="brightness">Brightness</option>
                                <option value="similarity">Similarity to Selected</option>
                            </select>
                        </div>
                        <div class="operation-form-row" id="referenceColorRow" style="display: none;">
                            <label for="referenceColorPreview">Reference Color:</label>
                            <div id="referenceColorPreview" class="color-preview" style="width: 30px; height: 30px;"></div>
                            <span id="referenceColorIndex">None selected</span>
                        </div>
                    </div>
                    <div class="operation-dialog-buttons">
                        <button id="cancelSortButton">Cancel</button>
                        <button id="confirmSortButton">Apply Sort</button>
                    </div>
                </div>
            </div>

            <div id="gradientDialog" class="operation-dialog">
                <div class="operation-dialog-content">
                    <h2>Generate Colour Gradient</h2>
                    <div class="operation-form">
                        <div class="operation-form-row">
                            <label>Start Colour:</label>
                            <div id="gradientStartColor" class="color-preview" style="width: 30px; height: 30px;"></div>
                            <span id="gradientStartColorIndex">None selected</span>
                        </div>
                        <div class="operation-form-row">
                            <label>End Colour:</label>
                            <div id="gradientEndColor" class="color-preview" style="width: 30px; height: 30px;"></div>
                            <span id="gradientEndColorIndex">None selected</span>
                        </div>
                        <div class="operation-form-row">
                            <label for="gradientSteps">Steps:</label>
                            <input type="number" id="gradientSteps" min="2" max="256" value="8">
                        </div>
                        <div class="operation-form-row">
                            <label for="gradientTargetIndex">Target Index:</label>
                            <input type="number" id="gradientTargetIndex" min="0" max="255" value="0">
                        </div>
                    </div>
                    <div class="color-preview-grid" id="gradientPreview">
                        <!-- Will be populated by JS -->
                    </div>
                    <div class="operation-dialog-buttons">
                        <button id="cancelGradientButton">Cancel</button>
                        <button id="confirmGradientButton">Apply Gradient</button>
                    </div>
                </div>
            </div>

            <div id="harmoniesDialog" class="operation-dialog">
                <div class="operation-dialog-content">
                    <h2>Generate Color Harmonies</h2>
                    <div class="operation-form">
                        <div class="operation-form-row">
                            <label>Base Color:</label>
                            <div id="harmonyBaseColor" class="color-preview" style="width: 30px; height: 30px;"></div>
                            <span id="harmonyBaseColorIndex">None selected</span>
                        </div>
                        <div class="operation-form-row">
                            <label for="harmonyMode">Harmony Type:</label>
                            <select id="harmonyMode">
                                <option value="complementary">Complementary</option>
                                <option value="analogous">Analogous</option>
                                <option value="triadic">Triadic</option>
                                <option value="tetradic">Tetradic</option>
                                <option value="monochromatic">Monochromatic</option>
                            </select>
                        </div>
                        <div class="operation-form-row">
                            <label for="harmonyTargetIndex">Target Index:</label>
                            <input type="number" id="harmonyTargetIndex" min="0" max="255" value="0">
                        </div>
                    </div>
                    <div class="color-preview-grid" id="harmonyPreview">
                        <!-- Will be populated by JS -->
                    </div>
                    <div class="operation-dialog-buttons">
                        <button id="cancelHarmonyButton">Cancel</button>
                        <button id="confirmHarmonyButton">Apply Harmonies</button>
                    </div>
                </div>
            </div>

            <div id="reducePaletteDialog" class="operation-dialog">
                <div class="operation-dialog-content">
                    <h2>Reduce Palette Colors</h2>
                    <div class="operation-form">
                        <div class="operation-form-row">
                            <label for="reduceStartIndex">Start Index:</label>
                            <input type="number" id="reduceStartIndex" min="0" max="255" value="0">
                        </div>
                        <div class="operation-form-row">
                            <label for="reduceEndIndex">End Index:</label>
                            <input type="number" id="reduceEndIndex" min="0" max="255" value="15">
                        </div>
                        <div class="operation-form-row">
                            <label for="reduceTargetCount">Target Count:</label>
                            <input type="number" id="reduceTargetCount" min="1" max="256" value="8">
                        </div>
                    </div>
                    <div class="operation-dialog-buttons">
                        <button id="cancelReduceButton">Cancel</button>
                        <button id="confirmReduceButton">Apply Reduction</button>
                    </div>
                </div>
            </div>`;
            // Replace placeholders in the HTML template
            htmlContent = htmlContent.replace(/\$\{webview.cspSource\}/g, webview.cspSource);
            htmlContent = htmlContent.replace(/__NONCE__/g, nonce);
            htmlContent = htmlContent.replace('__CSS_URI__', cssUri.toString());
            htmlContent = htmlContent.replace('__SCRIPT_URI__', scriptUri.toString());
            htmlContent = htmlContent.replace('__IMAGE_URI__', colorUtilsUri.toString());
            htmlContent = htmlContent.replace('__COLOR_UTILS_URI__', colorUtilsUri.toString());
            htmlContent = htmlContent.replace('__FILE_INFO__', fileName);
            htmlContent = htmlContent.replace('__TOOLBAR__', toolbarHtml);
            // htmlContent = htmlContent.replace('__ADVANCED_OPERATIONS__', advancedOperationsHtml);
            htmlContent = htmlContent.replace('__PALETTE_GRID__', `<div class="palette-container">${colorBoxes}</div>`);
            htmlContent = htmlContent.replace('__EDITOR_PANEL__', editorPanelHtml);
            htmlContent = htmlContent.replace('__HOVER_INFO__', hoverInfoHtml);
            htmlContent = htmlContent.replace('__MERGE_TOOL__', mergeToolHtml);
            htmlContent = htmlContent.replace('__INFO_SECTION__', infoSectionHtml);
            htmlContent = htmlContent.replace('__IMPORT_DIALOG__', importDialogHtml);
            htmlContent = htmlContent.replace('__COLOR_OPERATION_DIALOGS__', colorOperationDialogsHtml);
            htmlContent = htmlContent.replace('__INITIAL_PALETTE__', initialPaletteJson);
            htmlContent = htmlContent.replace('__INITIAL_STATE_SCRIPT__', `
                // Debug information
                document.addEventListener('DOMContentLoaded', () => {
                    console.log("[Palette HTML] DOM loaded with " + document.querySelectorAll('.color-box').length + " color boxes");
                    
                    // Check if palette container exists
                    const container = document.querySelector('.palette-container');
                    if (!container) {
                        console.error('[Palette HTML] Palette container not found!');
                    } else {
                        console.log('[Palette HTML] Palette container found with ' + container.children.length + ' children');
                    }
                });
            `);
            // Add debugging to check if placeholders are still present in the HTML
            const missingPlaceholders = [
                '__PALETTE_GRID__',
                '__MERGE_TOOL__',
                '__INFO_SECTION__'
            ].filter(placeholder => htmlContent.includes(placeholder));
            if (missingPlaceholders.length > 0) {
                console.warn(`[PaletteProvider] Some placeholders were not replaced: ${missingPlaceholders.join(', ')}`);
            }
            return htmlContent;
        }
        catch (error) {
            console.error("[PaletteProvider] Error generating HTML:", error);
            return this.getErrorHtml(error);
        }
    }
    async getErrorHtml(error) {
        try {
            // Load the error HTML template
            const errorHtmlUri = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'paletteWebview.error.html');
            let errorHtml = await vscode.workspace.fs.readFile(errorHtmlUri).then(buffer => buffer.toString());
            // Replace the error message placeholder
            errorHtml = errorHtml.replace('__ERROR_MESSAGE__', error.toString());
            return errorHtml;
        }
        catch (templateError) {
            // Fallback to inline HTML if template loading fails
            console.error("[PaletteProvider] Error loading error template:", templateError);
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
                <h1>Error Loading Palette File</h1>
                <div class="error">
                    <p>${error.toString()}</p>
                </div>
                <p>Make sure the file is a valid ZX Next palette (.pal or .nxp) file.</p>
            </body>
            </html>
            `;
        }
    }
    // Add helper method to generate nonce
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    // --- Required CustomEditorProvider Methods ---
    async saveCustomDocument(document, cancellation) {
        console.log(`Saving palette document: ${document.uri.fsPath}`);
        await this._performSave(document);
    }
    async saveCustomDocumentAs(document, destination, cancellation) {
        console.log(`Saving palette document as: ${document.uri.fsPath} to ${destination.fsPath}`);
        await this._performSave(document, destination);
    }
    async revertCustomDocument(document, cancellation) {
        console.log(`Reverting palette document: ${document.uri.fsPath}`);
        const originalData = document.state.originalData;
        if (originalData) {
            document.state.palette = (0, paletteUtils_1.parsePaletteFile)(originalData); // Re-parse with PaletteColor
            document.state.isDirty = false;
            // Refresh the webview if it's open
            await this.refreshWebview(document);
        }
        else {
            console.error("[PaletteProvider] Cannot revert: Original data not found.");
            throw new Error("Cannot revert: Original data not available.");
        }
    }
    async backupCustomDocument(document, context, cancellation) {
        console.log(`Backing up palette document: ${document.uri.fsPath} to ${context.destination.toString()}`);
        const backupData = (0, paletteUtils_1.encodePaletteFile)(document.state.palette); // Encode current state
        await vscode.workspace.fs.writeFile(context.destination, backupData);
        return {
            id: context.destination.toString(),
            delete: async () => {
                try {
                    await vscode.workspace.fs.delete(context.destination);
                }
                catch (e) { /* ignore */ }
            }
        };
    }
    // Helper to refresh webview content (add this)
    async refreshWebview(document) {
        const uriString = document.uri.toString();
        // Need a way to find the active panel for this document
        // This is tricky as the provider doesn't store panels directly per document
        // Option 1: Iterate vscode.window.tabGroups (complex)
        // Option 2: Assume only one panel open for this provider (simpler but less robust)
        // Option 3: Store panel in the document state (might have lifecycle issues)
        // For now, let's log a warning - proper refresh needs panel mapping.
        console.warn(`[PaletteProvider] refreshWebview called for ${uriString}, but finding the specific webview panel is not implemented yet.`);
        // Ideal (if panel was stored or found):
        /*
        if (panel) {
            panel.webview.postMessage({
                command: 'updatePalette',
                palette: document.state.palette
            });
        }
        */
    }
    // *** NEW *** Add _performSave internal helper
    async _performSave(document, destination) {
        const targetUri = destination || document.uri;
        console.log(`Saving palette document: ${targetUri.fsPath}`);
        const docState = document.state;
        // Use the updated encodePaletteFile which handles PaletteColor[]
        const encodedData = (0, paletteUtils_1.encodePaletteFile)(docState.palette);
        await vscode.workspace.fs.writeFile(targetUri, encodedData);
        // Clear both dirty flags
        docState.isDirty = false;
        document.customIsDirty = false;
        console.log(`[PaletteProvider] Document saved successfully to ${targetUri.fsPath}.`);
    }
    // Add undo and redo operation handlers
    _undoOperation(document, webviewPanel) {
        console.log("[PaletteProvider] Undoing operation");
        const operation = document.paletteHistory.undo();
        if (operation) {
            this._applyHistoryOperation(document, operation, true, webviewPanel);
            // Notify webview to update UI
            const panels = webviewPanel ? [webviewPanel] : this._findWebviewPanelsForDocument(document);
            panels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'paletteOperationResult',
                    operation: 'undo',
                    palette: document.state.palette,
                    canUndo: document.paletteHistory.canUndo(),
                    canRedo: document.paletteHistory.canRedo()
                });
            });
        }
    }
    _redoOperation(document, webviewPanel) {
        console.log("[PaletteProvider] Redoing operation");
        const operation = document.paletteHistory.redo();
        if (operation) {
            this._applyHistoryOperation(document, operation, false, webviewPanel);
            // Notify webview to update UI
            const panels = webviewPanel ? [webviewPanel] : this._findWebviewPanelsForDocument(document);
            panels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'paletteOperationResult',
                    operation: 'redo',
                    palette: document.state.palette,
                    canUndo: document.paletteHistory.canUndo(),
                    canRedo: document.paletteHistory.canRedo()
                });
            });
        }
    }
    _applyHistoryOperation(document, operation, isUndo, webviewPanel) {
        switch (operation.type) {
            case 'colorEdit':
                document.state.palette[operation.index] = isUndo
                    ? { ...operation.oldColor }
                    : { ...operation.newColor };
                break;
            case 'priorityChange':
                document.state.palette[operation.index] = isUndo
                    ? { ...operation.oldColor }
                    : { ...operation.newColor };
                break;
            case 'reorder':
            case 'fullUpdate':
                document.state.palette = isUndo
                    ? [...operation.oldPalette]
                    : [...operation.newPalette];
                break;
            case 'swap':
                if (isUndo) {
                    document.state.palette[operation.indexA] = { ...operation.oldColorA };
                    document.state.palette[operation.indexB] = { ...operation.oldColorB };
                }
                else {
                    document.state.palette[operation.indexA] = { ...operation.newColorA };
                    document.state.palette[operation.indexB] = { ...operation.newColorB };
                }
                break;
            default:
                console.warn(`[PaletteProvider] Unknown operation type: ${operation.type}`);
                break;
        }
        // Mark document as dirty using custom flag
        document.customIsDirty = true;
        // Update UI if webviewPanel is provided
        if (webviewPanel) {
            this._updateCustomDirtyState(document, webviewPanel, true);
        }
    }
    // Helper to find panels for a given document
    _findWebviewPanelsForDocument(document) {
        // This is a simple approach - in a real extension, you might use a more robust panel tracking system
        const panels = [];
        try {
            // Check all visible panels
            vscode.window.tabGroups.all.forEach(group => {
                group.tabs.forEach(tab => {
                    // @ts-ignore: id property might exist on Tab
                    const tabId = tab.id;
                    const input = tab.input;
                    // Unfortunately there's no direct way to get the WebviewPanel from a Tab
                    // This is a rough approximation
                    if (input && typeof input === 'object' && 'uri' in input) {
                        const uri = input.uri;
                        if (uri && uri.toString() === document.uri.toString()) {
                            // Try to find the panel by checking active webviews
                            const activeEditors = vscode.window.visibleTextEditors;
                            activeEditors.forEach(editor => {
                                if (editor.document.uri.toString() === document.uri.toString()) {
                                    // This is a bit of a hack, but it's the best we can do with the API
                                    const viewColumn = editor.viewColumn;
                                    if (viewColumn !== undefined) {
                                        // Create temporary panel to hold messages (better than nothing)
                                        const tempPanel = this._getTempPanelForDocument(document, viewColumn);
                                        if (tempPanel) {
                                            panels.push(tempPanel);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }
        catch (error) {
            console.warn('[PaletteProvider] Error finding panels:', error);
        }
        return panels;
    }
    // Temporary hack to get a panel reference for sending messages
    _tempPanels = new Map();
    _getTempPanelForDocument(document, viewColumn) {
        const key = document.uri.toString() + viewColumn.toString();
        let panel = this._tempPanels.get(key);
        if (!panel) {
            // Try to find existing panel
            vscode.window.tabGroups.all.forEach(group => {
                group.tabs.forEach(tab => {
                    if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
                        const uri = tab.input.uri;
                        if (uri && uri.toString() === document.uri.toString()) {
                            // This is the panel we want, but we can't get a direct reference
                            // We'll have to send messages through our existing channels
                        }
                    }
                });
            });
        }
        return panel;
    }
    // Helper methods for generating HTML components
    _getEditorPanelHtml() {
        return `
        <div id="editorPanel" class="editor-panel">
            <h4>Edit Colour <span id="pickerColorIndex"></span></h4>
            <div class="picker-controls">
                <div class="slider-group">
                    <label for="sliderR">R:</label>
                    <input type="range" id="sliderR" min="0" max="7" step="1" value="0">
                    <span class="slider-value" id="valueR">0</span>
                </div>
                <div class="slider-group">
                    <label for="sliderG">G:</label>
                    <input type="range" id="sliderG" min="0" max="7" step="1" value="0">
                    <span class="slider-value" id="valueG">0</span>
                </div>
                <div class="slider-group">
                    <label for="sliderB">B:</label>
                    <input type="range" id="sliderB" min="0" max="7" step="1" value="0">
                    <span class="slider-value" id="valueB">0</span>
                </div>
            </div>
            <div class="picker-preview">
                <div id="previewBox" class="preview-box"></div>
                <span id="previewHex">#000000</span>
            </div>
            <div class="byte-inputs">
                <div class="byte-group">
                    <label for="byte1Input">Byte 1 (RRRGGGBB):</label>
                    <input type="text" id="byte1Input" class="byte-input" maxlength="2" size="4">
                </div>
                <div class="byte-group">
                    <label for="byte2Input">Byte 2 (-------B):</label>
                    <input type="text" id="byte2Input" class="byte-input" maxlength="2" size="4">
                </div>
            </div>
            <div class="control-group" style="margin-top: 10px;">
                <label for="colorPickerInput" style="width: auto; margin-right: 5px;">Pick:</label>
                <input type="color" id="colorPickerInput" value="#000000">
            </div>
            <div class="control-group" style="margin-top: 10px; display: flex; align-items: center;">
                <label for="priorityBitToggle" style="margin-right: 10px;">Priority Bit:</label>
                <input type="checkbox" id="priorityBitToggle">
                <button id="resetPriorityButton" style="margin-left: 5px; padding: 2px 5px; font-size: 0.8em;">Reset All</button>
            </div>
            <button id="saveChangesButton" disabled>Save Changes</button> 
        </div>
        `;
    }
    _getHoverInfoHtml() {
        return `
        <div id="paletteHoverInfo" class="hover-info-container" style="display: flex;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <div id="hoverPreviewBox" style="background-color: transparent;"></div>
                <span><strong>Index:</strong> <span id="hoverPaletteIndex">--</span></span>
                <span><strong>Hex:</strong> <span id="hoverHexValue">--</span></span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <span><strong>RGB9:</strong> (<span id="hoverR9Value">-</span>,<span id="hoverG9Value">-</span>,<span id="hoverB9Value">-</span>)</span>
                <span><strong>Priority:</strong> <span id="hoverPriorityValue">false</span></span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span><strong>Bytes:</strong> %<span id="hoverByte1">--</span>,%<span id="hoverByte2">--</span></span>
            </div>
        </div>
        `;
    }
    _getMergeToolHtml() {
        return `
        <h4>Palette Merge Tool</h4>
        <div class="secondary-controls">
            <button id="loadSecondaryPaletteButton">Load Palette to Merge...</button>
            <div id="secondaryPaletteInfo" style="font-size: 0.9em; margin-top: 5px; display: none;">
                Loaded: <span id="secondaryPaletteName"></span>
            </div>

            
            <label for="mergeOffsetInput">Target Offset:</label>
            <input type="number" id="mergeOffsetInput" min="0" max="240" step="16" value="0" style="width: 50px;">
            <label for="mergeCountInput">Count:</label>
            <input type="number" id="mergeCountInput" min="1" max="16" value="16" style="width: 40px;">
            <button id="mergeButton" disabled>Merge -> Main</button>
                </div>
        <div id="secondary-palette-container" style="margin-top: 10px;">
            <!-- Secondary palette grid will be rendered here by JS -->
        </div>

        `;
    }
    // Handler for resetting to default palette
    async _handleResetToDefaultPalette(document, webviewPanel) {
        // This method might now be redundant if all resets go through confirmation,
        // or it can be kept for direct programmatic resets.
        // For now, let it also call the common perform reset logic.
        console.log("[PaletteProvider] Direct reset to default palette called (potentially bypassing UI confirmation).");
        await this._performPaletteReset(document, webviewPanel);
        vscode.window.showInformationMessage("Palette has been reset to default.");
    }
    // New handler for user confirmation
    async _handleRequestConfirmResetPalette(document, webviewPanel) {
        console.log("[PaletteProvider] Showing VS Code confirmation dialog for palette reset.");
        const decision = await vscode.window.showWarningMessage('Reset to default palette? This will replace all current colors and updates history.', "No", // The "cancel" option
        "Yes" // The "confirm" option
        );
        console.log(`[PaletteProvider] User response to palette reset confirmation: "${decision}"`);
        if (decision === "Yes") { // Check if the user clicked "Yes"
            console.log("[PaletteProvider] User confirmed reset with 'Yes'. Proceeding.");
            await this._performPaletteReset(document, webviewPanel);
            vscode.window.showInformationMessage("Palette has been reset to default.");
        }
        else {
            // This block will execute if the user clicks "No" or closes the dialog (decision will be undefined)
            console.log("[PaletteProvider] User cancelled reset ('No' or dismissed dialog).");
        }
    }
    // Refactored core reset logic
    async _performPaletteReset(document, webviewPanel) {
        console.log("[PaletteProvider] Performing palette reset action.");
        const defaultPalette = (0, paletteUtils_1.generateDefaultPalette)();
        const oldPalette = [...document.state.palette.map(color => ({ ...color }))];
        document.state.palette = defaultPalette;
        document.paletteHistory.addOperation({
            type: 'fullUpdate', oldPalette, newPalette: [...defaultPalette]
        });
        // Mark as dirty using custom flag and update UI
        this._updateCustomDirtyState(document, webviewPanel, true);
        // Send update to webview WITHOUT the isDirty flag to avoid triggering autosave
        webviewPanel.webview.postMessage({
            command: 'updateFullPalette',
            palette: defaultPalette
        });
        // Notifications are handled by the calling method (_handleRequestConfirmResetPalette or _handleResetToDefaultPalette)
        // This ensures all user notifications are handled through VS Code's notification system
    }
    // Helper method to load document data
    async _loadDocumentData(uri) {
        console.log(`[PaletteProvider] Loading data from: ${uri.fsPath}`);
        try {
            const fileData = await vscode.workspace.fs.readFile(uri);
            // Check if file is too large
            if (fileData.length > 1512) {
                console.warn(`[PaletteProvider] File size ${fileData.length} bytes exceeds 512 byte limit`);
                vscode.window.showErrorMessage('File is too large. Please use Import button for files over 512 bytes.');
                //                throw new Error('File is too large. Please use Import button for files over 512 bytes.');
                // Start of attempt to force input 
                const data = await this._loadDocumentData(uri);
                // Create a new document state
                const state = {
                    uri,
                    palette: data.palette,
                    isDirty: false,
                    originalData: data.rawData
                };
                //
            }
            const palette = (0, paletteUtils_1.parsePaletteFile)(fileData); // Returns PaletteColor[]
            return {
                palette,
                rawData: fileData
            };
        }
        catch (error) {
            console.error(`[PaletteProvider] Error loading document data: ${uri.fsPath}`, error);
            throw error;
        }
    }
    // Utility function to notify webview of dirty state - currently disabled to avoid triggering autosave
    _notifyDirtyState(document, webviewPanel) {
        // Intentionally not sending updateDirtyState messages to the webview
        // to prevent triggering autosave behavior
        // Original code:
        // webviewPanel.webview.postMessage({ 
        //     command: 'updateDirtyState', 
        //     isDirty: document.customIsDirty 
        // });
        console.log(`[PaletteProvider] Document dirty state: ${document.customIsDirty} (not notifying webview)`);
    }
}
exports.PaletteViewerProvider = PaletteViewerProvider;
//# sourceMappingURL=paletteViewerProvider.js.map