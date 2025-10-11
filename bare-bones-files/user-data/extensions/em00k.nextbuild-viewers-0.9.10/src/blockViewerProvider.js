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
exports.BlockViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const buffer_1 = require("buffer");
// Remove direct import of SpriteViewerProvider if only used for parsing before
// import { SpriteViewerProvider } from './spriteViewerProvider'; 
// Import our new and existing utilities
// import { parsePaletteFile, getColorFromPalette, generateDefaultPalette } from './paletteUtils';
const paletteUtils_1 = require("./paletteUtils");
const spriteDataHandler_1 = require("./spriteDataHandler");
// Import the new webview generator
const blockWebview_1 = require("./blockWebview");
const blockDocument_1 = require("./blockDocument");
const spriteDedupUtils_1 = require("./spriteDedupUtils");
// --- Provider implements CustomEditorProvider<BlockDocument> --- 
class BlockViewerProvider {
    context;
    static viewType = 'nextbuild-viewers.blockViewer';
    // --- Event Emitter for Document Changes (Re-add) --- 
    _onDidChangeCustomDocument = new vscode.EventEmitter();
    onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    // Map to store data for opened documents (maps URI string to the wrapper class)
    documents = new Map(); // Use BlockDocument
    // --- Instance Properties --- 
    _panel;
    _document;
    _viewState; // Declare _viewState property
    _documentData; // Store the state associated with the current panel/document
    defaultPalette; // Use new type and name
    constructor(context) {
        this.context = context;
        this.defaultPalette = (0, paletteUtils_1.generateDefaultPalette)(); // Call new function
    }
    // --- Required CustomEditorProvider Methods --- 
    // --- openCustomDocument (Restore logic) --- 
    async openCustomDocument(uri, openContext, token) {
        console.log(`Opening document: ${uri.fsPath}`);
        const fileData = await vscode.workspace.fs.readFile(uri);
        const isMap = uri.fsPath.toLowerCase().endsWith('.nxm');
        // Default width, calculate height based on file size
        const defaultWidth = 32;
        let calculatedHeight = 0;
        if (isMap && fileData.length > 0) {
            calculatedHeight = Math.ceil(fileData.length / defaultWidth);
            // Ensure minimum height of 1? Or let it be 0 if file is empty?
            calculatedHeight = Math.max(1, calculatedHeight);
            console.log(`Calculated initial height for map: ${calculatedHeight} based on size ${fileData.length}`);
        }
        else if (isMap) {
            calculatedHeight = 1; // Default height for empty map file
        }
        const docState = {
            uri: uri,
            isMapFile: isMap,
            blockDataBytes: fileData, // Store raw bytes
            spriteFilePath: '',
            spriteDataBytes: null,
            isDirty: false,
            // Set initial dimensions using default width and calculated height
            mapWidth: isMap ? defaultWidth : undefined,
            mapHeight: isMap ? calculatedHeight : undefined,
            mapIndices: isMap ? [] : undefined, // Initialize empty, will be parsed in resolve
            spriteData: null,
            spriteFileName: '',
            defaultPalette: this.defaultPalette, // Use new property name
            customPalette: null, // Use new property name
            customPaletteName: ''
        };
        const document = new blockDocument_1.BlockDocument(docState);
        this.documents.set(uri.toString(), document);
        return document;
    }
    // --- resolveCustomEditor (Adjust signature and logic) --- 
    async resolveCustomEditor(document, // Correct document type
    webviewPanel, token) {
        // Store panel and document references on the instance
        this._panel = webviewPanel;
        this._document = document;
        this._documentData = document.state; // Store state locally for easier access
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        // Use the state from the passed BlockDocument
        const docState = document.state;
        try {
            const blockDataBuffer = buffer_1.Buffer.from(docState.blockDataBytes);
            // --- Find Sprite File --- 
            // Only search if we don't already have sprite data (e.g., from a previous load)
            if (!docState.spriteFilePath || !docState.spriteDataBytes) {
                const parsedPath = path.parse(document.uri.fsPath);
                const baseFilePath = path.join(parsedPath.dir, parsedPath.name);
                let foundSprite = false;
                console.log(`[Provider] Searching for sprite file based on: ${baseFilePath}`);
                for (const ext of ['.nxt', '.spr', '.til']) {
                    const testPath = baseFilePath + ext;
                    try {
                        const stats = await vscode.workspace.fs.stat(vscode.Uri.file(testPath));
                        if (stats.type === vscode.FileType.File) {
                            docState.spriteFilePath = testPath;
                            docState.spriteDataBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(testPath));
                            console.log(`[Provider] Found associated sprite file: ${docState.spriteFilePath}`);
                            foundSprite = true;
                            break;
                        }
                    }
                    catch (accessError) {
                        if (accessError.code !== 'FileNotFound') {
                            console.warn(`[Provider] Failed to access potential sprite file ${testPath}: ${accessError.message}`);
                        }
                    }
                }
                if (!foundSprite) {
                    // ** Don't throw error - Proceed without sprite data **
                    console.warn(`[Provider] No associated sprite file (.nxt, .spr, .til) found for base name: ${baseFilePath}. Proceeding without sprites.`);
                    // Ensure state reflects missing data
                    docState.spriteFilePath = '';
                    docState.spriteDataBytes = null;
                }
            }
            // --- Parse Sprite Data (Initial) ---
            let initialSpriteData = null;
            let initialSpriteMode = 'tile8x8'; // Default mode even for placeholders
            let spriteDataBuffer = null;
            if (docState.spriteDataBytes) {
                spriteDataBuffer = buffer_1.Buffer.from(docState.spriteDataBytes);
                const ext = path.extname(docState.spriteFilePath).toLowerCase();
                try {
                    if (ext === '.til') {
                        initialSpriteMode = 'tile8x8';
                        initialSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteDataBuffer, 0);
                    }
                    else if (ext === '.nxt') {
                        initialSpriteMode = 'sprite4';
                        initialSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(spriteDataBuffer, 0);
                    }
                    else if (ext === '.spr') {
                        initialSpriteMode = 'sprite8';
                        initialSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(spriteDataBuffer);
                    }
                    // Add other types like .fon if needed
                    else { // Fallback for unknown but found file? Default to 8x8 tiles.
                        console.warn(`[Provider] Unknown sprite file extension '${ext}'. Attempting to parse as 8x8 tiles.`);
                        initialSpriteMode = 'tile8x8';
                        initialSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteDataBuffer, 0);
                    }
                    console.log(`[Provider] Successfully parsed sprite file ${docState.spriteFilePath} with initial mode ${initialSpriteMode}`);
                }
                catch (parseError) {
                    console.error(`[Provider] Failed to parse sprite file ${docState.spriteFilePath}:`, parseError);
                    vscode.window.showErrorMessage(`Failed to parse sprite data from ${docState.spriteFilePath}. Error: ${parseError.message}. Displaying placeholders.`);
                    // Ensure we fall back to null sprite data on parse error
                    initialSpriteData = null;
                    docState.spriteDataBytes = null; // Clear invalid bytes
                    docState.spriteFilePath = ''; // Clear invalid path
                }
            }
            else {
                console.log("[Provider] No sprite data loaded, will display placeholders.");
            }
            // If initialSpriteData is still null here, it means either no file was found, or parsing failed.
            // --- Prepare Initial View State (Logic restored) --- 
            let initialBlockDataView;
            if (docState.isMapFile) {
                // Perform an initial parse using the DEFAULT dimensions stored in state
                // This might be visually incorrect initially, but user can fix it.
                console.log(`Performing initial map parse using defaults: ${docState.mapWidth}x${docState.mapHeight}`);
                initialBlockDataView = this.parseBlockFile(docState.blockDataBytes, // Use original raw bytes
                document.uri.fsPath, docState.mapWidth, // Pass the default width
                docState.mapHeight // Pass the default height
                );
                // Update state indices with this initial parse result
                docState.mapIndices = initialBlockDataView.indices;
            }
            else {
                // For non-map files, parse normally
                initialBlockDataView = this.parseBlockFile(blockDataBuffer, document.uri.fsPath);
            }
            // Initial view state should include the document's current dirty status
            // Initialize the instance _viewState property here
            this._viewState = {
                scale: 2,
                showGrid: true,
                paletteOffset: 0,
                blockWidth: 1,
                blockHeight: 1,
                blockData: initialBlockDataView,
                spriteMode: initialSpriteMode,
                mapWidth: docState.mapWidth ?? 32,
                mapHeight: docState.mapHeight ?? 1,
                customPaletteName: docState.customPaletteName,
                isDirty: docState.isDirty,
                hasSpriteData: !!initialSpriteData
            };
            docState.spriteMode = initialSpriteMode;
            docState.spriteData = initialSpriteData;
            docState.spriteFileName = docState.spriteFilePath ? path.basename(docState.spriteFilePath) : '';
            // --- Set initial HTML content (Logic restored) ---
            webviewPanel.webview.html = (0, blockWebview_1.getWebviewHtml)(webviewPanel.webview, this.context, initialBlockDataView, initialSpriteData, // <-- Can be null!
            path.basename(document.uri.fsPath), initialSpriteData ? path.basename(docState.spriteFilePath) : "(None)", // Display filename or None
            this._viewState, // Use the instance property
            docState.customPalette, // Use new property name
            docState.customPaletteName, this.defaultPalette);
            // Register webview panel disposal handler
            webviewPanel.onDidDispose(() => {
                console.log(`[BlockViewerProvider] Webview panel disposed for ${document.uri.fsPath}`);
                // Clear the panel reference when disposed to prevent accessing a disposed webview
                if (this._panel === webviewPanel) {
                    this._panel = undefined;
                }
            }, null, this.context.subscriptions);
            // --- Handle Messages from Webview (Restored logic) --- 
            webviewPanel.webview.onDidReceiveMessage(async (message) => {
                // Use the instance _viewState if available
                const currentViewState = this._viewState;
                if (!currentViewState) {
                    console.error("Cannot process message: view state not initialized.");
                    return;
                }
                const currentDocState = document.state;
                if (!currentDocState) {
                    console.error("Cannot process message: document state not found.");
                    return;
                }
                let sendUpdateMessage = false;
                let updatedState = {};
                let newlyParsedSpriteData = null;
                let updatedCustomPalette = docState.customPalette;
                let needsSpriteReparse = false;
                let forceSpriteReload = false; // We won't use the refactored method's flag
                const applyUpdates = (updates) => {
                    if (this._viewState && this._documentData) {
                        // Update viewState first
                        Object.assign(this._viewState, updates);
                        // Propagate relevant state changes back to the document state
                        // Ensure isDirty is boolean
                        this._documentData.isDirty = this._viewState.isDirty ?? false;
                        // TODO: Correctly handle palette updates from the webview if needed.
                        // This part was causing errors, comment out for now.
                        /*
                        if (this._documentData.customPalette && updates.palette) {
                            this._documentData.customPalette = updates.palette;
                        }
                        */
                        // Update map dimensions if they exist in the update
                        if (updates.mapWidth !== undefined)
                            this._documentData.mapWidth = updates.mapWidth;
                        if (updates.mapHeight !== undefined)
                            this._documentData.mapHeight = updates.mapHeight;
                        if (updates.spriteMode !== undefined)
                            this._documentData.spriteMode = updates.spriteMode;
                    }
                };
                switch (message.command) {
                    case 'requestInitialData':
                        console.log("Webview requested initial data.");
                        let currentSpriteData = null;
                        if (currentDocState.spriteDataBytes) {
                            const spriteMode = currentViewState.spriteMode;
                            let paletteOffset = currentViewState.paletteOffset;
                            try {
                                const spriteBuf = buffer_1.Buffer.from(currentDocState.spriteDataBytes);
                                if (spriteMode === 'tile8x8') {
                                    currentSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteBuf, paletteOffset);
                                }
                                else if (spriteMode === 'sprite4') {
                                    currentSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(spriteBuf, paletteOffset);
                                }
                                else {
                                    currentSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(spriteBuf);
                                }
                            }
                            catch (e) {
                                console.error("Error re-parsing sprite data for initial request:", e);
                            }
                        }
                        // Pass Buffer 
                        const currentBlockDataView = currentDocState.isMapFile ?
                            { width: currentDocState.mapWidth, height: currentDocState.mapHeight, indices: currentDocState.mapIndices, isMapFile: true } :
                            this.parseBlockFile(buffer_1.Buffer.from(currentDocState.blockDataBytes), document.uri.fsPath);
                        if (currentSpriteData) {
                            webviewPanel.webview.postMessage({
                                command: 'update',
                                blockData: currentBlockDataView,
                                spriteData: currentSpriteData,
                                viewState: currentViewState // Send the full current view state
                            });
                        }
                        else {
                            console.error("Could not send initial data - sprite data missing?");
                        }
                        break;
                    case 'changeScale':
                    case 'toggleGrid':
                    case 'changePaletteOffset':
                    case 'changeSpriteMode':
                    case 'changeBlockWidth':
                    case 'changeBlockHeight':
                    case 'changeMapDimensions':
                        // Handle these state changes together
                        if (this._viewState && this._document) {
                            const updates = {};
                            let needsBlockReparse = false;
                            let needsSpriteReparse = false;
                            let spriteModeChanged = false;
                            switch (message.command) {
                                case 'changeScale':
                                    updates.scale = message.scale;
                                    break;
                                case 'toggleGrid':
                                    updates.showGrid = message.showGrid;
                                    break;
                                case 'changePaletteOffset':
                                    updates.paletteOffset = message.offset;
                                    if (['sprite4', 'tile8x8', 'font8x8'].includes(this._viewState.spriteMode)) {
                                        needsSpriteReparse = true;
                                    }
                                    break;
                                case 'changeBlockWidth':
                                    updates.blockWidth = message.width;
                                    break;
                                case 'changeBlockHeight':
                                    updates.blockHeight = message.height;
                                    break;
                                case 'changeSpriteMode':
                                    updates.spriteMode = message.mode;
                                    needsSpriteReparse = true;
                                    spriteModeChanged = true;
                                    if (!['sprite4', 'tile8x8', 'font8x8'].includes(message.mode)) {
                                        updates.paletteOffset = 0; // Reset offset
                                    }
                                    break;
                                case 'changeMapDimensions':
                                    this.updateMapDimensions(this._document, message.width, message.height, message.reshape);
                                    updates.mapWidth = this._document.state.mapWidth;
                                    updates.mapHeight = this._document.state.mapHeight;
                                    needsBlockReparse = true;
                                    break;
                            } // End INNER switch
                            // Apply updates to the central view state
                            Object.assign(this._viewState, updates);
                            // Also update the corresponding fields in the document state 
                            if (updates.spriteMode)
                                this._document.state.spriteMode = updates.spriteMode;
                            // Note: isDirty is handled by specific edit messages now
                            // --- Handle Reparsing --- 
                            // ... (existing reparse logic using needsSpriteReparse/needsBlockReparse) ...
                            let newSpriteData = this._document.state.spriteData;
                            let newBlockData = null; // Use correct type
                            if (needsSpriteReparse && this._document.state.spriteDataBytes) {
                                // ... (code to reparse sprite based on this._viewState.spriteMode/offset)
                                this._postMessage({ command: 'processingStarted', message: 'Changing sprite mode...' });
                                const spriteBuffer = buffer_1.Buffer.from(this._document.state.spriteDataBytes);
                                const currentOffset = this._viewState.paletteOffset ?? 0;
                                const currentMode = this._viewState.spriteMode;
                                try {
                                    if (currentMode === 'sprite8') {
                                        newSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(spriteBuffer);
                                    }
                                    else if (currentMode === 'sprite4') {
                                        newSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(spriteBuffer, currentOffset);
                                    }
                                    else if (currentMode === 'font8x8') {
                                        newSpriteData = (0, spriteDataHandler_1.parse8x8Font)(spriteBuffer);
                                    }
                                    else if (currentMode === 'tile8x8') {
                                        newSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteBuffer, currentOffset);
                                    }
                                    this._document.state.spriteData = newSpriteData;
                                }
                                catch (e) {
                                    console.error("Error re-parsing sprite data:", e);
                                    vscode.window.showErrorMessage(`Error re-parsing sprite data: ${e.message}`);
                                }
                            }
                            if (needsBlockReparse && this._document.state.isMapFile) {
                                // ... (code to reparse map based on this._viewState.mapWidth/Height)
                                const reparsedBlockData = this.parseBlockFile(this._document.state.blockDataBytes, this._document.uri.fsPath, this._viewState.mapWidth, this._viewState.mapHeight);
                                if (reparsedBlockData && reparsedBlockData.isMapFile) {
                                    this._document.state.mapIndices = reparsedBlockData.indices;
                                    this._viewState.blockData = reparsedBlockData;
                                    newBlockData = reparsedBlockData;
                                }
                                else { /* error handling */ }
                            }
                            this.updateWebview(); // Send updated state back to webview
                            if (needsSpriteReparse) {
                                this._postMessage({ command: 'processingFinished' });
                            }
                        }
                        break; // Break after handling all view state changes
                    case 'mapEditOccurred': // At the correct level now
                        if (this._document) {
                            this._document.state.isDirty = true;
                            // No visual update needed from provider, webview handles it
                            this._onDidChangeCustomDocument.fire({
                                document: this._document,
                                undo: async () => { },
                                redo: async () => { }
                            });
                        }
                        break; // Important!
                    case 'blockEditOccurred': // At the correct level now
                        if (this._document && this._document.state.blockDataBytes) {
                            const blockIndex = message.index;
                            const newSpriteIndex = message.value;
                            if (typeof blockIndex === 'number' && typeof newSpriteIndex === 'number' &&
                                blockIndex >= 0 && blockIndex < this._document.state.blockDataBytes.length) {
                                console.log(`[Provider] Received block edit: Index=${blockIndex}, New Sprite=${newSpriteIndex}`);
                                this._document.state.blockDataBytes[blockIndex] = newSpriteIndex;
                                this._document.state.isDirty = true;
                                // Update the view state's dirty flag as well
                                if (this._viewState) {
                                    this._viewState.isDirty = true;
                                }
                                this._onDidChangeCustomDocument.fire({
                                    document: this._document,
                                    undo: async () => { console.warn("Undo block edit NYI"); },
                                    redo: async () => { console.warn("Redo block edit NYI"); }
                                });
                            }
                            else {
                                console.error("[Provider] Invalid index/value for blockEditOccurred:", message);
                            }
                        }
                        // No visual update needed from provider
                        break; // Important!
                    case 'saveDocument':
                        console.log("[Provider] Received 'saveDocument' request from webview (should only be for map mode).");
                        if (!this._documentData || !this._document || !this._document.state.isMapFile) { // Check for map mode
                            console.error("[Provider] 'saveDocument' message received, but not in map mode or document state missing.");
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                            break;
                        }
                        if (!message.blockData || !message.blockData.indices) {
                            console.error("[Provider] Save request received without valid blockData.");
                            vscode.window.showErrorMessage("Save failed: Missing map data from viewer.");
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                            break;
                        }
                        webviewPanel.webview.postMessage({ command: 'processingStarted', message: 'Saving...' });
                        try {
                            console.log("[Provider] Updating docState with data from webview before save (Map Mode).");
                            currentDocState.mapIndices = message.blockData.indices;
                            // Only update width/height if they were actually sent (unlikely for save) 
                            // currentDocState.mapWidth = message.blockData.width; 
                            // currentDocState.mapHeight = message.blockData.height;
                            currentDocState.isDirty = true; // Mark dirty right before save call
                            console.log("[Provider] Calling _performSave for map...");
                            await this._performSave(this._document);
                            console.log("[Provider] _performSave completed successfully for map.");
                            // Update webview state AFTER save confirms clean state
                            if (this._viewState) {
                                this._viewState.isDirty = false;
                            }
                            this.updateWebview(); // Send clean state back
                        }
                        catch (saveError) {
                            console.error("[Provider] Error during saveDocument handler (Map Mode):", saveError);
                            vscode.window.showErrorMessage("Error saving map: " + saveError.message);
                            webviewPanel.webview.postMessage({ command: 'showError', message: "Error saving map: " + saveError.message });
                            // Don't assume it's clean if save failed
                            if (this._viewState) {
                                this._viewState.isDirty = this._document.state.isDirty;
                            } // Reflect actual state
                            this.updateWebview(); // Send potentially still dirty state
                        }
                        finally {
                            console.log("[Provider] saveDocument handler finished (Map Mode), sending processingFinished.");
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                        }
                        break;
                    case 'loadPalette':
                        webviewPanel.webview.postMessage({ command: 'processingStarted', message: 'Opening palette file...' });
                        try {
                            const paletteUri = await vscode.window.showOpenDialog({
                                canSelectFiles: true,
                                canSelectFolders: false,
                                canSelectMany: false,
                                filters: {
                                    'Palettes': ['pal', 'nxp']
                                }
                            });
                            if (paletteUri && paletteUri[0]) {
                                console.log(`Attempting to load palette: ${paletteUri[0].fsPath}`);
                                const paletteData = await vscode.workspace.fs.readFile(paletteUri[0]);
                                const newPalette = (0, paletteUtils_1.parsePaletteFile)(paletteData);
                                // Update the document state with the new palette
                                if (this._documentData) {
                                    this._documentData.customPalette = newPalette;
                                    this._documentData.customPaletteName = path.basename(paletteUri[0].fsPath);
                                    // Also update the view state directly for immediate feedback? Or rely on updateWebview?
                                    // Let's update the viewState cache too.
                                    if (this._viewState) {
                                        this._viewState.customPaletteName = this._documentData.customPaletteName;
                                    }
                                }
                                else {
                                    console.error("[loadPalette] _documentData is missing, cannot store palette state.");
                                }
                                const paletteUpdateState = {
                                    paletteOffset: 0,
                                    customPaletteName: this._documentData?.customPaletteName ?? ''
                                };
                                Object.assign(updatedState, paletteUpdateState);
                                console.log("Custom palette loaded:", paletteUri[0].fsPath);
                                // Send specific update for palette immediately
                                webviewPanel.webview.postMessage({
                                    command: 'update',
                                    // Send the updated palette name in viewState
                                    viewState: { customPaletteName: this._documentData?.customPaletteName ?? '' },
                                    // Send the actual palette hex data
                                    customPalette: this._documentData?.customPalette
                                });
                                sendUpdateMessage = false; // Prevent generic update
                            }
                            else {
                                console.log("Palette load cancelled.");
                            }
                        }
                        catch (err) {
                            console.error("Error loading palette:", err);
                            vscode.window.showErrorMessage("Error loading palette: " + err.message);
                            webviewPanel.webview.postMessage({ command: 'showError', message: "Error loading palette: " + err.message });
                        }
                        finally {
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                        }
                        break;
                    case 'useDefaultPalette':
                        webviewPanel.webview.postMessage({ command: 'processingStarted', message: 'Using default palette...' });
                        // Update the document state
                        if (this._documentData) {
                            this._documentData.customPalette = null;
                            this._documentData.customPaletteName = '';
                            // Update view state cache
                            if (this._viewState) {
                                this._viewState.customPaletteName = '';
                            }
                        }
                        else {
                            console.error("[useDefaultPalette] _documentData is missing, cannot reset palette state.");
                        }
                        const resetPaletteState = {
                            customPaletteName: '' // Directly set empty name
                        };
                        Object.assign(updatedState, resetPaletteState);
                        console.log("[Provider] Palette set to default.");
                        // Send specific update for palette immediately
                        webviewPanel.webview.postMessage({
                            command: 'update',
                            viewState: updatedState,
                            customPalette: null // Send null hex data
                        });
                        webviewPanel.webview.postMessage({ command: 'processingFinished' });
                        sendUpdateMessage = false; // Prevent generic update
                        break;
                    case 'loadSpriteFile':
                        console.log("[Provider] Received 'loadSpriteFile' request from webview.");
                        webviewPanel.webview.postMessage({ command: 'processingStarted', message: 'Opening sprite file...' });
                        let newSpriteData = null;
                        let newSpriteMode = currentViewState.spriteMode;
                        let newSpritePath = '';
                        try {
                            const spriteUri = await vscode.window.showOpenDialog({
                                canSelectFiles: true,
                                canSelectFolders: false,
                                canSelectMany: false,
                                filters: {
                                    'Sprite/Tile Files': ['nxt', 'spr', 'til']
                                }
                            });
                            if (spriteUri && spriteUri[0]) {
                                newSpritePath = spriteUri[0].fsPath;
                                console.log(`[Provider] Attempting to load sprite file: ${newSpritePath}`);
                                const spriteDataBytes = await vscode.workspace.fs.readFile(spriteUri[0]);
                                const spriteDataBuffer = buffer_1.Buffer.from(spriteDataBytes);
                                const ext = path.extname(newSpritePath).toLowerCase();
                                if (ext === '.til') {
                                    newSpriteMode = 'tile8x8';
                                    newSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteDataBuffer, currentViewState.paletteOffset);
                                }
                                else if (ext === '.nxt') {
                                    newSpriteMode = 'sprite4';
                                    newSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(spriteDataBuffer, currentViewState.paletteOffset);
                                }
                                else if (ext === '.spr') {
                                    newSpriteMode = 'sprite8';
                                    newSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(spriteDataBuffer);
                                }
                                else {
                                    console.warn(`[Provider] Unknown extension '${ext}' for manually loaded sprite file.`);
                                    newSpriteMode = 'tile8x8';
                                    newSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteDataBuffer, currentViewState.paletteOffset);
                                    if (!newSpriteData) {
                                        throw new Error("Could not parse file even as 8x8 tiles.");
                                    }
                                }
                                console.log(`[Provider] Successfully parsed ${newSpritePath} as ${newSpriteMode}`);
                                currentDocState.spriteDataBytes = spriteDataBytes;
                                currentDocState.spriteFilePath = newSpritePath;
                                currentDocState.isDirty = true;
                                applyUpdates({
                                    spriteMode: newSpriteMode,
                                    isDirty: true
                                });
                                sendUpdateMessage = true;
                            }
                            else {
                                console.log("[Provider] Sprite file selection cancelled.");
                            }
                        }
                        catch (err) {
                            console.error("[Provider] Error loading/parsing sprite file:", err);
                            vscode.window.showErrorMessage("Error loading sprite file: " + err.message);
                            webviewPanel.webview.postMessage({ command: 'showError', message: "Error loading sprite file: " + err.message });
                        }
                        finally {
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                        }
                        if (sendUpdateMessage && newSpriteData) {
                            newlyParsedSpriteData = newSpriteData;
                        }
                        break;
                    case 'reloadSpriteData':
                        this._postMessage({ command: 'processingStarted', message: 'Reloading sprites...' });
                        try {
                            if (this._documentData && this._documentData.spriteFilePath) {
                                console.log(`[Provider] Reloading sprite file: ${this._documentData.spriteFilePath}`);
                                const spriteBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(this._documentData.spriteFilePath));
                                this._documentData.spriteDataBytes = spriteBytes;
                                console.log(`[Provider] Successfully re-read ${spriteBytes.length} bytes.`);
                                // <<< NEW: Re-parse the reloaded data >>>
                                if (this._viewState && this._document) {
                                    const spriteBuffer = buffer_1.Buffer.from(spriteBytes);
                                    const currentOffset = this._viewState.paletteOffset ?? 0;
                                    const currentMode = this._viewState.spriteMode;
                                    let reloadedSpriteData = null;
                                    try {
                                        if (currentMode === 'sprite8') {
                                            reloadedSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(spriteBuffer);
                                        }
                                        else if (currentMode === 'sprite4') {
                                            reloadedSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(spriteBuffer, currentOffset);
                                        }
                                        else if (currentMode === 'font8x8') {
                                            reloadedSpriteData = (0, spriteDataHandler_1.parse8x8Font)(spriteBuffer);
                                        }
                                        else if (currentMode === 'tile8x8') {
                                            reloadedSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(spriteBuffer, currentOffset);
                                        }
                                        this._document.state.spriteData = reloadedSpriteData; // Update document state
                                        console.log(`[Provider] Successfully re-parsed reloaded sprite data as ${currentMode}.`);
                                        // Trigger webview update with the new sprite data
                                        this.updateWebview();
                                    }
                                    catch (e) {
                                        console.error("[Provider] Error re-parsing reloaded sprite data:", e);
                                        vscode.window.showErrorMessage(`Error parsing reloaded sprite data: ${e.message}`);
                                        this._postMessage({ command: 'showError', message: `Error parsing reloaded sprite: ${e.message}` });
                                    }
                                }
                                else {
                                    console.error("[Provider] Cannot re-parse sprite data: ViewState or Document missing.");
                                }
                                // <<< END NEW >>>
                            }
                            else {
                                console.warn("[Provider] Cannot reload sprite: No sprite file path stored.");
                                vscode.window.showWarningMessage("Cannot reload sprite: No associated sprite file found or loaded yet.");
                            }
                        }
                        catch (error) {
                            console.error("[Provider] Error reloading sprite file:", error);
                            vscode.window.showErrorMessage(`Error reloading sprite file: ${error.message}`);
                            this._postMessage({ command: 'showError', message: `Error reloading sprite: ${error.message}` });
                        }
                        break;
                    case 'analyzeSpritesDuplicates':
                        console.log("[DEBUG] Received analyzeSpritesDuplicates message from webview");
                        if (!docState.spriteDataBytes) {
                            console.log("[DEBUG] No sprite data found in document state");
                            vscode.window.showErrorMessage('No sprite data loaded to analyze.');
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                            break;
                        }
                        webviewPanel.webview.postMessage({ command: 'processingStarted', message: 'Analyzing sprite duplicates...' });
                        try {
                            console.log("[DEBUG] Calling analyzeSpritesDuplicates method");
                            await this.analyzeSpritesDuplicates();
                            console.log("[DEBUG] analyzeSpritesDuplicates method completed successfully");
                        }
                        catch (error) {
                            console.error("[DEBUG] Error in analyzeSpritesDuplicates:", error);
                            vscode.window.showErrorMessage(`Error analyzing sprite duplicates: ${error.message}`);
                        }
                        finally {
                            console.log("[DEBUG] Sending processingFinished message to webview");
                            webviewPanel.webview.postMessage({ command: 'processingFinished' });
                        }
                        break;
                    default:
                        console.log("Unknown message received:", message.command);
                } // End OUTER switch
                // REMOVED generic sendUpdateMessage logic - updates are sent within specific handlers now.
                // if (sendUpdateMessage) { ... }
            }); // End onDidReceiveMessage
        }
        catch (e) {
            console.error(`Error resolving custom editor for ${document.uri.fsPath}:`, e);
            webviewPanel.webview.html = this.getErrorHtml(`Error loading file: ${e.message}`);
        }
    }
    async _performSave(document) {
        console.log("[Provider] _performSave started.");
        const docState = document.state;
        console.log(`[Provider] Checking dirty state before save: isDirty = ${docState.isDirty}`);
        console.log(`[Provider] Performing save for: ${document.uri.fsPath}. isDirty: ${docState.isDirty}`);
        if (!docState.isDirty) {
            console.log("[Provider] Save skipped in _performSave, document not marked as dirty internally.");
            return;
        }
        if (docState.isMapFile && docState.mapIndices) {
            const expectedSize = (docState.mapWidth ?? 0) * (docState.mapHeight ?? 0);
            const saveData = new Uint8Array(expectedSize);
            const indicesLength = docState.mapIndices.length;
            for (let i = 0; i < expectedSize; i++) {
                saveData[i] = (i < indicesLength) ? (docState.mapIndices?.[i] ?? 0) : 0;
            }
            console.log(`[Provider] Writing ${saveData.length} bytes for map ${docState.mapWidth}x${docState.mapHeight} in _performSave...`);
            try {
                await vscode.workspace.fs.writeFile(document.uri, saveData);
                docState.isDirty = false;
                console.log("[Provider] Map document saved successfully and marked as clean in _performSave.");
            }
            catch (writeError) {
                console.error("[Provider] Error writing file in _performSave:", writeError);
                throw writeError;
            }
        }
        else if (!docState.isMapFile) {
            console.warn("[Provider] Attempted to save non-map file in _performSave, edits not supported.");
            console.log(`[Provider] Writing ${docState.blockDataBytes.length} bytes for block file (.nxb) in _performSave...`);
            try {
                await vscode.workspace.fs.writeFile(document.uri, docState.blockDataBytes); // Write the updated bytes
                docState.isDirty = false; // Mark as clean after successful save
                console.log("[Provider] Block document saved successfully and marked as clean in _performSave.");
                // Optionally, tell the webview the save is complete (so it can update the dirty state UI if needed)
                this.updateWebview(); // This will send the latest view state including isDirty=false
            }
            catch (writeError) {
                console.error("[Provider] Error writing block file in _performSave:", writeError);
                throw writeError; // Re-throw to signal save failure
            }
        }
        else {
            console.error("[Provider] Cannot save map file in _performSave: index data is missing.");
            throw new Error("Cannot save map file: index data is missing.");
        }
        console.log("[Provider] _performSave finished.");
    }
    async saveCustomDocument(document, cancellation) {
        console.log(`[BlockViewerProvider] saveCustomDocument triggered for: ${document.uri.fsPath}`);
        // Delegate to your existing save logic (e.g., _saveDocument)
        // Ensure _saveDocument handles the logic of getting bytes and writing file
        await this._performSave(document);
        // Potentially update dirty state if _saveDocument doesn't handle it
        // Example: If _saveDocument updates the document state directly
        // this._updateDirtyState(document, false); // Mark as not dirty after save
    }
    async saveCustomDocumentAs(document, destination, cancellation) {
        console.log(`[BlockViewerProvider] saveCustomDocumentAs triggered for: ${document.uri.fsPath} to ${destination.fsPath}`);
        // 1. Get the data from the document state
        const dataToSave = await document.state.blockDataBytes; // Assuming BlockDocument provides this
        // 2. Write data to the new destination
        //    (You might need a helper function similar to _saveDocument but taking destination)
        //    Example: await this._saveDocumentToUri(document, destination);
        await vscode.workspace.fs.writeFile(destination, dataToSave); // Simplistic example
        // Optional: Update internal state if needed after 'Save As'
        // e.g., maybe close the old editor and open the new one? VS Code might handle some of this.
        console.warn("saveCustomDocumentAs: Basic implementation used. Review needed for full functionality.");
        // Mark as not dirty after save as
        // this._updateDirtyState(document, false); // Careful - document might be the *old* one here
    }
    async revertCustomDocument(document, cancellation) {
        console.log(`[BlockViewerProvider] revertCustomDocument triggered for: ${document.uri.fsPath}`);
        // 1. Read the original file content
        const fileData = await vscode.workspace.fs.readFile(document.uri);
        const docState = document.state;
        console.log(`[Revert] Read ${fileData.length} bytes from disk.`);
        // 2. Update the document state with the original bytes
        docState.blockDataBytes = fileData;
        docState.isDirty = false; // Mark as clean after revert
        // 3. Re-parse the block/map data based on the original bytes and type
        const reparsedBlockData = this.parseBlockFile(docState.blockDataBytes, document.uri.fsPath, docState.mapWidth, // Use potentially stored map dimensions
        docState.mapHeight);
        // 4. Update map-specific state if necessary
        if (reparsedBlockData.isMapFile) {
            docState.isMapFile = true;
            docState.mapWidth = reparsedBlockData.width;
            docState.mapHeight = reparsedBlockData.height;
            docState.mapIndices = reparsedBlockData.indices;
        }
        else {
            docState.isMapFile = false;
            docState.mapWidth = undefined;
            docState.mapHeight = undefined;
            docState.mapIndices = undefined;
        }
        // 5. Refresh the webview to show the reverted state
        //    (Update the viewState cache before sending)
        if (this._viewState) {
            this._viewState.blockData = reparsedBlockData;
            this._viewState.mapWidth = docState.mapWidth ?? 32;
            this._viewState.mapHeight = docState.mapHeight ?? 1;
            this._viewState.isDirty = false; // Update view state dirtiness
        }
        this.updateWebview(); // Send the full update
        console.log('[Provider] Document successfully reverted and marked clean.');
        // Fire event to notify VS Code the document changed (became clean)
        this._onDidChangeCustomDocument.fire({
            document: document,
            undo: async () => { console.warn("Undo for revert not implemented."); },
            redo: async () => { console.warn("Redo for revert not implemented."); }
        });
    }
    async backupCustomDocument(document, context, cancellation) {
        console.log(`[BlockViewerProvider] backupCustomDocument triggered for: ${document.uri.fsPath} to ${context.destination.fsPath}`);
        // Use the documentData getter from BlockDocument
        const dataToBackup = document.documentData;
        await vscode.workspace.fs.writeFile(context.destination, dataToBackup);
        return {
            id: context.destination.toString(), // Use backup destination URI as ID
            delete: async () => {
                try {
                    await vscode.workspace.fs.delete(context.destination);
                    console.log(`[BlockViewerProvider] Deleted backup: ${context.destination.fsPath}`);
                }
                catch (error) {
                    console.error(`[BlockViewerProvider] Error deleting backup ${context.destination.fsPath}:`, error);
                    // Decide if you need to re-throw or handle silently
                }
            }
        };
    }
    parseBlockFile(data, filePath, mapWidth, mapHeight) {
        const isMapFile = filePath.toLowerCase().endsWith('.nxm');
        console.log(`Parsing ${isMapFile ? 'map' : 'block'} file: ${path.basename(filePath)} (${data.length} bytes)`);
        if (isMapFile) {
            const width = mapWidth || 32;
            const height = mapHeight || 24;
            const indices = [];
            const maxIndices = Math.min(width * height, data.length);
            for (let i = 0; i < maxIndices; i++) {
                indices.push(data[i]);
            }
            while (indices.length < width * height) {
                indices.push(0);
            }
            return { width, height, indices, isMapFile: true };
        }
        else {
            // NXB file: Sequence of single-byte sprite indices
            const blocks = []; // Use inline type
            // Read single bytes now
            const numBlocks = data.length; // Each byte is an entry
            for (let i = 0; i < numBlocks; i++) {
                const spriteIndex = data[i];
                // Log the first 10 entries parsed
                if (i < 10) {
                    console.log(`[ParseBlockFile NXB] Entry ${i}: SpriteIndex=${spriteIndex}`);
                }
                blocks.push({ index: i, spriteIndex: spriteIndex }); // Store only index
            }
            return { blocks, isMapFile: false };
        }
    }
    async refreshWebview(document) {
        if (!this._panel) {
            console.warn(`[RefreshWebview] No panel available for ${document.uri.toString()}`);
            return;
        }
        // Check if the panel is disposed
        try {
            if (this._panel.visible === undefined) {
                console.log(`[RefreshWebview] Webview is disposed for ${document.uri.toString()}`);
                this._panel = undefined;
                return;
            }
        }
        catch (error) {
            console.warn(`[RefreshWebview] Error checking panel state for ${document.uri.toString()}:`, error);
            this._panel = undefined;
            return;
        }
        if (this._documentData && document.uri.toString() === this._documentData.uri.toString()) {
            console.log(`Refreshing webview for ${document.uri.fsPath} by posting update message.`);
            const docState = this._documentData;
            const currentSpriteData = docState.spriteData;
            const currentBlockDataView = docState.isMapFile ?
                { width: docState.mapWidth, height: docState.mapHeight, indices: docState.mapIndices, isMapFile: true }
                : this.parseBlockFile(buffer_1.Buffer.from(docState.blockDataBytes), document.uri.fsPath);
            if (this._viewState) {
                this._viewState.blockData = currentBlockDataView;
            }
            this._postMessage({
                command: 'update',
                viewState: this._viewState,
                blockData: currentBlockDataView,
                spriteData: currentSpriteData,
                customPalette: docState.customPalette
            });
            console.log("Webview refresh message sent.");
        }
        else {
            console.warn(`[RefreshWebview] Could not refresh (post update). Document URI mismatch. Target: ${document.uri.toString()}`);
        }
    }
    getErrorHtml(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Generating error HTML for:", errorMessage);
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                 body { padding: 15px; font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-errorForeground); }
                 h1 { font-size: 1.1em; color: var(--vscode-errorForeground); border-bottom: 1px solid; padding-bottom: 5px; margin-bottom: 10px; }
                 .error { background-color: rgba(255, 0, 0, 0.1); padding: 10px; border-left: 4px solid var(--vscode-errorForeground); border-radius: 3px; font-family: var(--vscode-editor-font-family, monospace); white-space: pre-wrap; word-break: break-all; }
            </style>
        </head>
        <body>
            <h1>Error Loading Viewer</h1>
            <div class="error">${errorMessage}</div>
            <p>Please ensure the file and any required associated files (like .spr, .nxt, .til) exist and are valid.</p>
        </body>
        </html>
        `;
    }
    updateMapDimensions(document, newWidth, newHeight, reshape) {
        if (!document.state.isMapFile) {
            console.error("Attempted to resize non-map data");
            return;
        }
        const currentMap = document.state;
        const oldWidth = currentMap.mapWidth ?? 0;
        const oldHeight = currentMap.mapHeight ?? 0;
        const oldIndices = currentMap.mapIndices;
        const newIndicesCount = newWidth * newHeight;
        const newIndices = new Array(newIndicesCount).fill(0);
        console.log(`Updating map from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight} (Reshape: ${reshape})`);
        if (reshape) {
            console.log("Applying reshape (flat copy) logic.");
            const oldIndicesCount = oldIndices?.length ?? 0;
            const numToCopy = Math.min(oldIndicesCount, newIndicesCount);
            if (oldIndices) {
                for (let i = 0; i < numToCopy; i++) {
                    newIndices[i] = oldIndices[i];
                }
            }
        }
        else {
            console.log("Applying expand/shrink (coordinate copy) logic.");
            if (oldIndices) {
                for (let oldY = 0; oldY < oldHeight; oldY++) {
                    for (let oldX = 0; oldX < oldWidth; oldX++) {
                        if (oldX < newWidth && oldY < newHeight) {
                            const oldIndex = oldY * oldWidth + oldX;
                            const newIndex = oldY * newWidth + oldX;
                            if (oldIndex < oldIndices.length) {
                                newIndices[newIndex] = oldIndices[oldIndex];
                            }
                        }
                    }
                }
            }
        }
        document.state.mapIndices = newIndices;
        document.state.mapWidth = newWidth;
        document.state.mapHeight = newHeight;
        document.state.isDirty = true;
        const newMapData = {
            width: newWidth,
            height: newHeight,
            indices: newIndices,
            isMapFile: true
        };
        if (this._viewState) {
            this._viewState.mapWidth = newWidth;
            this._viewState.mapHeight = newHeight;
            this._viewState.blockData = newMapData;
        }
        else {
            console.warn("[updateMapDimensions] _viewState is not defined on provider instance.");
        }
        this.updateWebview();
        this._onDidChangeCustomDocument.fire({ document: document, undo: () => { }, redo: () => { } });
    }
    updateWebview() {
        console.log("[DEBUG] updateWebview called");
        if (!this._panel) {
            console.warn("[Provider UpdateWebview] No panel available, skipping update");
            return;
        }
        // Check if the panel is disposed
        try {
            if (this._panel.visible === undefined) {
                console.log("[Provider UpdateWebview] Webview is disposed, skipping update");
                this._panel = undefined;
                return;
            }
        }
        catch (error) {
            console.warn("[Provider UpdateWebview] Error checking panel state:", error);
            this._panel = undefined;
            return;
        }
        if (this._viewState && this._documentData) {
            const blockDataForView = this._documentData.isMapFile
                ? { width: this._documentData.mapWidth, height: this._documentData.mapHeight, indices: this._documentData.mapIndices, isMapFile: true }
                : this.parseBlockFile(this._documentData.blockDataBytes, this._documentData.uri.fsPath);
            this._viewState.blockData = blockDataForView;
            // Always include the current custom palette state in the update message
            const messagePayload = {
                command: 'update',
                viewState: this._viewState,
                spriteData: this._documentData.spriteData,
                customPalette: this._documentData.customPalette
            };
            console.log("[Provider UpdateWebview] Sending update via _postMessage");
            this._postMessage(messagePayload);
        }
    }
    _postMessage(message) {
        console.log("[DEBUG] Attempting to post message to webview:", message.command);
        if (this._panel) {
            try {
                // Check if the panel is disposed before sending messages
                // This explicit check helps avoid the disposed webview error
                if (this._panel.visible === undefined) {
                    console.log("[Provider] Webview is disposed, not sending message");
                    return;
                }
                this._panel.webview.postMessage(message);
                console.log("[DEBUG] Message successfully sent to webview:", message.command);
            }
            catch (error) {
                // If any error occurs during message posting, log it
                console.error("[Provider] Error posting message to webview:", error);
                // Clear the panel reference since it might be invalid
                this._panel = undefined;
            }
        }
        else {
            console.warn("[Provider] Attempted to post message, but panel is undefined.");
        }
    }
    /**
     * Analyzes sprite data for duplicates and updates block/map references if needed
     */
    async analyzeSpritesDuplicates() {
        console.log("[DEBUG] analyzeSpritesDuplicates method called");
        if (!this._document || !this._document.state.spriteDataBytes || !this._viewState) {
            console.log("[DEBUG] Missing document, sprite data, or view state");
            vscode.window.showErrorMessage('No sprite data available for analysis.');
            return;
        }
        const docState = this._document.state;
        const viewState = this._viewState;
        console.log("[DEBUG] Starting sprite duplicate analysis for", docState.spriteFilePath);
        try {
            // Parse the sprite data based on current mode and offset
            let spriteData = null;
            const buffer = buffer_1.Buffer.from(docState.spriteDataBytes || new Uint8Array());
            console.log("[DEBUG] Buffer created, size:", buffer.length);
            // Get sprite data based on current mode
            switch (viewState.spriteMode) {
                case 'sprite8':
                    console.log("[DEBUG] Parsing as sprite8");
                    spriteData = (0, spriteDataHandler_1.parse8BitSprites)(buffer);
                    break;
                case 'sprite4':
                    console.log("[DEBUG] Parsing as sprite4 with offset", viewState.paletteOffset);
                    spriteData = (0, spriteDataHandler_1.parse4BitSprites)(buffer, viewState.paletteOffset);
                    break;
                case 'font8x8':
                    console.log("[DEBUG] Parsing as font8x8");
                    spriteData = (0, spriteDataHandler_1.parse8x8Font)(buffer);
                    break;
                case 'tile8x8':
                    console.log("[DEBUG] Parsing as tile8x8 with offset", viewState.paletteOffset);
                    spriteData = (0, spriteDataHandler_1.parse8x8Tiles)(buffer, viewState.paletteOffset);
                    break;
                default:
                    console.log("[DEBUG] Unsupported sprite mode:", viewState.spriteMode);
                    vscode.window.showErrorMessage(`Unsupported sprite mode: ${viewState.spriteMode}`);
                    return;
            }
            if (!spriteData) {
                console.log("[DEBUG] Failed to parse sprite data");
                vscode.window.showErrorMessage('Failed to parse sprite data.');
                return;
            }
            console.log("[DEBUG] Successfully parsed sprite data, sprites:", spriteData.sprites.length);
            // Configure deduplication options
            const options = {
                ...spriteDedupUtils_1.defaultOptions
            };
            // Ask for detection options
            console.log("[DEBUG] Showing detection options dialog");
            const detectFlippedH = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: 'Detect horizontally flipped sprites as duplicates?'
            });
            if (detectFlippedH === undefined) {
                console.log("[DEBUG] User cancelled at first option");
                return; // User cancelled
            }
            options.detectFlippedHorizontal = detectFlippedH === 'Yes';
            const detectFlippedV = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: 'Detect vertically flipped sprites as duplicates?'
            });
            if (detectFlippedV === undefined) {
                console.log("[DEBUG] User cancelled at second option");
                return; // User cancelled
            }
            options.detectFlippedVertical = detectFlippedV === 'Yes';
            const detectRotated = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: 'Detect 180° rotated sprites as duplicates?'
            });
            if (detectRotated === undefined) {
                console.log("[DEBUG] User cancelled at third option");
                return; // User cancelled
            }
            options.detectRotated = detectRotated === 'Yes';
            console.log("[DEBUG] Deduplication options:", JSON.stringify(options));
            // Find duplicates
            console.log("[DEBUG] Detecting duplicates...");
            const duplicates = (0, spriteDedupUtils_1.detectDuplicates)(spriteData, options);
            console.log("[DEBUG] Found", duplicates.length, "duplicates");
            if (duplicates.length === 0) {
                vscode.window.showInformationMessage('No duplicate sprites found.');
                return;
            }
            // Group duplicates for better reporting
            const groups = (0, spriteDedupUtils_1.groupDuplicates)(duplicates);
            // Create a simple report
            const fileName = path.basename(docState.spriteFilePath);
            const totalSprites = spriteData.sprites.length;
            const uniqueSprites = totalSprites - duplicates.length;
            const savingPercentage = Math.round((duplicates.length / totalSprites) * 100);
            // Create and show output channel for the report
            const outputChannel = vscode.window.createOutputChannel('Sprite Duplication Analysis');
            outputChannel.clear();
            outputChannel.appendLine(`=== Sprite Duplication Analysis: ${fileName} ===`);
            outputChannel.appendLine('');
            outputChannel.appendLine(`Total sprites: ${totalSprites}`);
            outputChannel.appendLine(`Unique sprites: ${uniqueSprites}`);
            outputChannel.appendLine(`Duplicate sprites: ${duplicates.length} (${savingPercentage}% of total)`);
            outputChannel.appendLine('');
            outputChannel.appendLine('=== Duplicate Groups ===');
            groups.forEach((group, index) => {
                outputChannel.appendLine('');
                outputChannel.appendLine(`Group ${index + 1}:`);
                outputChannel.appendLine(`  Original: Sprite #${group.originalIndex}`);
                outputChannel.appendLine('  Duplicates:');
                group.duplicates.forEach(dupe => {
                    outputChannel.appendLine(`    Sprite #${dupe.index} (${dupe.matchType})`);
                });
            });
            // Show the report
            outputChannel.show();
            // Ask if user wants to apply deduplication with simple Yes/No
            console.log("[DEBUG] Showing deduplication confirmation dialog");
            // Use information message with buttons instead of QuickPick
            const saveAction = 'Save Deduplicated Sprite';
            const cancelAction = 'Cancel';
            const deduplicateChoice = await vscode.window.showInformationMessage(`Found ${duplicates.length} duplicate sprites. Save a deduplicated version and update block references?`, { modal: true }, saveAction, cancelAction);
            if (deduplicateChoice !== saveAction) {
                console.log("[DEBUG] User declined deduplication");
                return; // User cancelled
            }
            console.log("[DEBUG] User confirmed deduplication");
            try {
                // Create deduplicated sprite data
                console.log("[DEBUG] Creating deduplicated sprite data");
                const deduplicatedSpriteData = (0, spriteDedupUtils_1.removeDuplicates)(spriteData, duplicates);
                // Create a mapping from old indices to new indices
                console.log("[DEBUG] Creating sprite mapping");
                const spriteMapping = (0, spriteDedupUtils_1.createSpriteMapping)(spriteData.sprites.length, duplicates);
                // Calculate savings
                const originalSize = buffer.length;
                const deduplicatedBuffer = (0, spriteDataHandler_1.encodeSpriteData)(deduplicatedSpriteData);
                const newSize = deduplicatedBuffer.length;
                const bytesSaved = originalSize - newSize;
                const percentSaved = Math.round((bytesSaved / originalSize) * 100);
                // Get output filename with better default - keep original name and add _dedup
                const dirName = path.dirname(docState.spriteFilePath);
                const baseName = path.basename(docState.spriteFilePath, path.extname(docState.spriteFilePath));
                const fileExt = path.extname(docState.spriteFilePath);
                const defaultOutputName = `${baseName}_dedup${fileExt}`;
                console.log("[DEBUG] Showing save file dialog");
                // Use save dialog instead of input box
                const saveDialogOptions = {
                    defaultUri: vscode.Uri.file(path.join(dirName, defaultOutputName)),
                    filters: {
                        'Sprite Files': [fileExt.replace('.', '')]
                    },
                    title: 'Save Deduplicated Sprite File'
                };
                const outputUri = await vscode.window.showSaveDialog(saveDialogOptions);
                if (!outputUri) {
                    console.log("[DEBUG] User cancelled at save dialog");
                    return; // User cancelled
                }
                // Write the deduplicated sprite file
                console.log("[DEBUG] Writing deduplicated sprite file");
                await vscode.workspace.fs.writeFile(outputUri, deduplicatedBuffer);
                // Report success
                vscode.window.showInformationMessage(`Deduplicated file saved successfully! Reduced from ${originalSize} bytes to ${newSize} bytes (${percentSaved}% smaller).`);
                // Update output channel with the results
                outputChannel.appendLine('');
                outputChannel.appendLine('=== Deduplication Results ===');
                outputChannel.appendLine(`Original file size: ${originalSize} bytes`);
                outputChannel.appendLine(`Deduplicated file size: ${newSize} bytes`);
                outputChannel.appendLine(`Bytes saved: ${bytesSaved} (${percentSaved}%)`);
                outputChannel.appendLine(`Saved to: ${path.basename(outputUri.fsPath)}`);
                // Update current block/map file - don't ask again, just do it
                outputChannel.appendLine('');
                outputChannel.appendLine('=== Updating Block References ===');
                // Apply the sprite mapping to the current block/map file
                console.log("[DEBUG] Applying sprite mapping to block data");
                const updatedBlockData = (0, spriteDedupUtils_1.applySpriteMappingToBlockData)(docState.blockDataBytes, spriteMapping, docState.isMapFile);
                // Create backup of the current block/map file
                const blockFileName = path.basename(this._document.uri.fsPath);
                const backupName = `${path.basename(this._document.uri.fsPath, path.extname(this._document.uri.fsPath))}_backup${path.extname(this._document.uri.fsPath)}`;
                const backupUri = vscode.Uri.file(path.join(path.dirname(this._document.uri.fsPath), backupName));
                // Create backup
                console.log("[DEBUG] Creating block file backup at:", backupUri.fsPath);
                await vscode.workspace.fs.writeFile(backupUri, docState.blockDataBytes);
                // Update the document state with the new block data
                console.log("[DEBUG] Updating document state with new block data");
                this._document.state.blockDataBytes = updatedBlockData;
                // If it's a map file, also update the map indices
                if (docState.isMapFile && docState.mapIndices) {
                    console.log("[DEBUG] Updating map indices");
                    const newMapIndices = [];
                    for (let i = 0; i < updatedBlockData.length; i++) {
                        newMapIndices.push(updatedBlockData[i]);
                    }
                    this._document.state.mapIndices = newMapIndices;
                }
                // Read and load the deduplicated sprite file directly
                console.log("[DEBUG] Reading deduplicated file");
                const deduplicatedFileData = await vscode.workspace.fs.readFile(outputUri);
                // Update the document state with the new sprite data
                console.log("[DEBUG] Updating document state with new sprite data");
                this._document.state.spriteDataBytes = deduplicatedFileData;
                this._document.state.spriteFilePath = outputUri.fsPath;
                this._document.state.spriteFileName = path.basename(outputUri.fsPath);
                // Re-parse the sprite data with the current mode
                console.log("[DEBUG] Re-parsing sprite data");
                let newSpriteData = null;
                // Convert Uint8Array to Buffer
                const deduplicatedFileBuffer = buffer_1.Buffer.from(deduplicatedFileData);
                // Use the converted buffer for parsing
                switch (viewState.spriteMode) {
                    case 'sprite8':
                        newSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(deduplicatedFileBuffer);
                        break;
                    case 'sprite4':
                        newSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(deduplicatedFileBuffer, viewState.paletteOffset);
                        break;
                    case 'font8x8':
                        newSpriteData = (0, spriteDataHandler_1.parse8x8Font)(deduplicatedFileBuffer);
                        break;
                    case 'tile8x8':
                        newSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(deduplicatedFileBuffer, viewState.paletteOffset);
                        break;
                }
                if (newSpriteData) {
                    // Update the document state sprite data
                    console.log("[DEBUG] Updating sprite data in document state");
                    this._document.state.spriteData = newSpriteData;
                    // Mark the document as dirty
                    this._document.state.isDirty = true;
                    if (this._viewState) {
                        this._viewState.isDirty = true;
                    }
                    // Notify VS Code that the document changed
                    console.log("[DEBUG] Firing document change event");
                    this._onDidChangeCustomDocument.fire({
                        document: this._document,
                        undo: async () => { },
                        redo: async () => { }
                    });
                    // Update the webview with new data
                    if (this._panel && this._panel.visible) {
                        console.log("[DEBUG] Sending update to webview");
                        this._panel.webview.postMessage({
                            command: 'update',
                            spriteData: newSpriteData,
                            blockData: docState.isMapFile ?
                                { width: docState.mapWidth, height: docState.mapHeight, indices: docState.mapIndices, isMapFile: true } :
                                this.parseBlockFile(docState.blockDataBytes, this._document.uri.fsPath),
                            viewState: {
                                ...this._viewState,
                                isDirty: true
                            },
                            isDedupUpdate: true // Flag to force full update in the webview
                        });
                    }
                    else {
                        console.log("[DEBUG] Panel not available or not visible, can't send update");
                    }
                    // Notify the user
                    outputChannel.appendLine(`Updated: ${blockFileName} (backup: ${backupName})`);
                    vscode.window.showInformationMessage(`Block references updated and deduplicated sprite loaded. A backup was saved as ${backupName}.`);
                }
                else {
                    console.log("[DEBUG] Failed to parse deduplicated sprite data");
                }
            }
            catch (error) {
                console.error("[DEBUG] Error applying deduplication:", error);
                vscode.window.showErrorMessage(`Error applying deduplication: ${error.message}`);
            }
        }
        catch (error) {
            console.error("[DEBUG] Error analyzing sprite duplicates:", error);
            vscode.window.showErrorMessage(`Error analyzing sprite duplicates: ${error.message}`);
        }
        console.log("[DEBUG] analyzeSpritesDuplicates method completed");
    }
    static register(context) {
        // Instantiate the provider within the static method
        const provider = new BlockViewerProvider(context);
        // Register the provider
        return vscode.window.registerCustomEditorProvider(BlockViewerProvider.viewType, provider, // Use the instantiated provider 
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
            // supportsBackup is inferred by VS Code if backupCustomDocument is implemented
            // Do NOT add supportsBackup: true here
        });
    }
}
exports.BlockViewerProvider = BlockViewerProvider;
//# sourceMappingURL=blockViewerProvider.js.map