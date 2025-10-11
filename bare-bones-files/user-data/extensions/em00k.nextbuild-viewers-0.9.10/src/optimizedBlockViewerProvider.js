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
exports.OptimizedBlockViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const buffer_1 = require("buffer");
const paletteUtils_1 = require("./paletteUtils");
const optimizedBlockUtils_1 = require("./optimizedBlockUtils");
/**
 * Document class for optimized block files
 */
class OptimizedBlockDocument {
    uri;
    state;
    constructor(state) {
        this.uri = state.uri;
        this.state = state;
    }
    dispose() {
        // Nothing to dispose
    }
}
/**
 * Provider for the optimized block viewer
 */
class OptimizedBlockViewerProvider {
    context;
    static viewType = 'nextbuild-viewers.optimizedBlockViewer';
    // Event emitter for document changes
    _onDidChangeCustomDocument = new vscode.EventEmitter();
    onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    // Map to store data for opened documents
    documents = new Map();
    // Instance properties
    _panel;
    _document;
    _viewState;
    _documentData;
    defaultPalette;
    constructor(context) {
        this.context = context;
        this.defaultPalette = (0, paletteUtils_1.generateDefaultPalette)();
    }
    /**
     * Opens a custom document
     */
    async openCustomDocument(uri, openContext, token) {
        console.log(`Opening optimized block document: ${uri.fsPath}`);
        const fileData = await vscode.workspace.fs.readFile(uri);
        let optimizedBlockData = null;
        try {
            // Try to parse the file as an optimized block file
            optimizedBlockData = (0, optimizedBlockUtils_1.deserializeOptimizedBlockFile)(buffer_1.Buffer.from(fileData));
            console.log(`Parsed optimized block file with ${optimizedBlockData.blocks.length} blocks`);
        }
        catch (error) {
            console.error(`Error parsing optimized block file: ${error}`);
            vscode.window.showErrorMessage(`Failed to parse optimized block file: ${error}`);
            // Create an empty optimized block file
            optimizedBlockData = {
                blocks: [],
                originalWidth: 1,
                originalHeight: 1
            };
        }
        const docState = {
            uri: uri,
            optimizedBlockData: optimizedBlockData,
            blockDataBytes: fileData,
            spriteFilePath: '',
            spriteDataBytes: null,
            isDirty: false,
            spriteData: null,
            spriteFileName: '',
            defaultPalette: this.defaultPalette,
            customPalette: null,
            customPaletteName: ''
        };
        const document = new OptimizedBlockDocument(docState);
        this.documents.set(uri.toString(), document);
        return document;
    }
    /**
     * Resolves a custom editor
     */
    async resolveCustomEditor(document, webviewPanel, token) {
        this._panel = webviewPanel;
        this._document = document;
        this._documentData = document.state;
        // Initialize view state
        this._viewState = {
            optimizedBlockData: document.state.optimizedBlockData,
            spriteData: document.state.spriteData,
            blockWidth: document.state.optimizedBlockData?.originalWidth || 1,
            blockHeight: document.state.optimizedBlockData?.originalHeight || 1,
            spriteWidth: 16, // Default sprite width
            spriteHeight: 16, // Default sprite height
            selectedBlockIndex: 0,
            selectedBlockSpriteIndices: [],
            isDirty: document.state.isDirty,
            spriteFileName: document.state.spriteFileName,
            defaultPalette: document.state.defaultPalette,
            customPalette: document.state.customPalette,
            customPaletteName: document.state.customPaletteName
        };
        // Set up the webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };
        // Set the HTML content
        webviewPanel.webview.html = this._getHtmlForWebview(webviewPanel.webview);
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'ready':
                    // Send initial state
                    this.updateWebview();
                    break;
                case 'saveDocument':
                    // Save the document
                    this._performSave(document);
                    break;
                case 'loadSpriteFile':
                    // Load a sprite file
                    this._handleLoadSpriteFile(message);
                    break;
                case 'loadPaletteFile':
                    // Load a palette file
                    this._handleLoadPaletteFile(message);
                    break;
                case 'blockEditOccurred':
                case 'updateSpritePosition':
                    // Handle block edit
                    const blockIndex = message.blockIndex;
                    const spriteIndex = message.spriteIndex;
                    const x = message.x;
                    const y = message.y;
                    const isRemove = message.isRemove;
                    console.log(`[Provider] Block edit: block=${blockIndex}, sprite=${spriteIndex}, pos=(${x},${y}), remove=${isRemove}`);
                    if (typeof blockIndex === 'number' && blockIndex >= 0 &&
                        this._document && this._document.state.optimizedBlockData &&
                        blockIndex < this._document.state.optimizedBlockData.blocks.length) {
                        const block = this._document.state.optimizedBlockData.blocks[blockIndex];
                        if (isRemove) {
                            // Remove sprite position
                            block.spritePositions = block.spritePositions.filter(pos => !(pos.x === x && pos.y === y));
                        }
                        else if (typeof spriteIndex === 'number' &&
                            typeof x === 'number' &&
                            typeof y === 'number') {
                            // Add or update sprite position
                            const existingPos = block.spritePositions.findIndex(pos => pos.x === x && pos.y === y);
                            if (existingPos >= 0) {
                                // Update existing position
                                block.spritePositions[existingPos].spriteIndex = spriteIndex;
                            }
                            else {
                                // Add new position
                                block.spritePositions.push({
                                    x,
                                    y,
                                    spriteIndex
                                });
                            }
                        }
                        // Mark as dirty
                        this._document.state.isDirty = true;
                        // Update view
                        this.updateWebview();
                    }
                    break;
                case 'showMessage':
                    // Display a message
                    vscode.window.showInformationMessage(message.message);
                    break;
            }
        });
    }
    /**
     * Handle loading a sprite file
     */
    async _handleLoadSpriteFile(message) {
        if (!this._document || !this._viewState) {
            return;
        }
        const docState = this._document.state;
        try {
            this._panel?.webview.postMessage({ command: 'processingStarted', message: 'Opening sprite file...' });
            // Show file dialog to select sprite file
            const spriteUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Sprite/Tile Files': ['nxt', 'spr', 'til']
                }
            });
            if (!spriteUri || spriteUri.length === 0) {
                this._panel?.webview.postMessage({ command: 'processingFinished' });
                return; // User cancelled
            }
            const newSpritePath = spriteUri[0].fsPath;
            console.log(`[Provider] Attempting to load sprite file: ${newSpritePath}`);
            // Read the sprite file
            const spriteDataBytes = await vscode.workspace.fs.readFile(spriteUri[0]);
            const spriteDataBuffer = buffer_1.Buffer.from(spriteDataBytes);
            // Determine the file type by extension and parse accordingly
            const ext = path.extname(newSpritePath).toLowerCase();
            let newSpriteData = null;
            let spriteMode = '';
            // Import sprite parsing functions
            const { parse8BitSprites, parse4BitSprites, parse8x8Tiles, parse8x8Font } = require('./spriteDataHandler');
            // Always enable preserveIndices to maintain original to deduplicated mapping
            const preserveIndices = true;
            // Parse based on file extension
            if (ext === '.til') {
                spriteMode = 'tile8x8';
                newSpriteData = parse8x8Tiles(spriteDataBuffer, 0, preserveIndices);
            }
            else if (ext === '.nxt') {
                spriteMode = 'sprite4';
                newSpriteData = parse4BitSprites(spriteDataBuffer, 0, preserveIndices);
            }
            else if (ext === '.spr') {
                spriteMode = 'sprite8';
                newSpriteData = parse8BitSprites(spriteDataBuffer, preserveIndices);
            }
            else {
                console.warn(`[Provider] Unknown extension '${ext}' for manually loaded sprite file.`);
                spriteMode = 'tile8x8';
                newSpriteData = parse8x8Tiles(spriteDataBuffer, 0, preserveIndices);
                if (!newSpriteData) {
                    throw new Error("Could not parse file even as 8x8 tiles.");
                }
            }
            console.log(`[Provider] Successfully parsed ${newSpritePath} as ${spriteMode}`);
            // Log deduplication information
            if (newSpriteData.originalCount && newSpriteData.originalToDeduplicatedMap) {
                const originalCount = newSpriteData.originalCount;
                const uniqueCount = newSpriteData.sprites.length;
                const duplicateCount = originalCount - uniqueCount;
                const duplicatePercentage = (duplicateCount / originalCount * 100).toFixed(1);
                console.log(`[Provider] Original sprite count: ${originalCount}`);
                console.log(`[Provider] Unique sprite count: ${uniqueCount}`);
                console.log(`[Provider] Duplicate sprites: ${duplicateCount} (${duplicatePercentage}% of total)`);
                if (duplicateCount > 0) {
                    vscode.window.showInformationMessage(`Loaded sprite file with ${uniqueCount} unique sprites (${duplicateCount} duplicates removed).`, 'View Details').then(selection => {
                        if (selection === 'View Details') {
                            // Show more detailed information
                            const mapInfo = `Sprite sheet has been deduplicated:\n\n` +
                                `Original sprites: ${originalCount}\n` +
                                `Unique sprites: ${uniqueCount}\n` +
                                `Duplicates removed: ${duplicateCount} (${duplicatePercentage}%)\n\n` +
                                `The viewer will use the original sprite indices from the OXB file.`;
                            vscode.window.showInformationMessage(mapInfo);
                        }
                    });
                }
            }
            // Update document state
            docState.spriteDataBytes = spriteDataBytes;
            docState.spriteFilePath = newSpritePath;
            docState.spriteFileName = path.basename(newSpritePath);
            docState.spriteData = newSpriteData;
            docState.isDirty = true;
            // Update view state
            this._viewState.spriteData = newSpriteData;
            this._viewState.spriteFileName = docState.spriteFileName;
            this._viewState.isDirty = true;
            // Update the webview
            this.updateWebview();
            // Show success message
            vscode.window.showInformationMessage(`Loaded sprite file: ${path.basename(newSpritePath)}`);
        }
        catch (error) {
            console.error("[Provider] Error loading sprite file:", error);
            vscode.window.showErrorMessage(`Failed to load sprite file: ${error.message}`);
        }
        finally {
            this._panel?.webview.postMessage({ command: 'processingFinished' });
        }
    }
    /**
     * Handle loading a palette file
     */
    async _handleLoadPaletteFile(message) {
        if (!this._document || !this._viewState) {
            return;
        }
        const docState = this._document.state;
        try {
            this._panel?.webview.postMessage({ command: 'processingStarted', message: 'Opening palette file...' });
            // Show file dialog to select palette file
            const paletteUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Palette Files': ['pal', 'nxp']
                }
            });
            if (!paletteUri || paletteUri.length === 0) {
                this._panel?.webview.postMessage({ command: 'processingFinished' });
                return; // User cancelled
            }
            const palettePath = paletteUri[0].fsPath;
            console.log(`[Provider] Attempting to load palette file: ${palettePath}`);
            // Read the palette file
            const paletteDataBytes = await vscode.workspace.fs.readFile(paletteUri[0]);
            const paletteDataBuffer = buffer_1.Buffer.from(paletteDataBytes);
            // Import palette parsing function
            const { parsePaletteFile } = require('./paletteUtils');
            // Parse the palette data
            const paletteName = path.basename(palettePath);
            const parsedPalette = parsePaletteFile(paletteDataBuffer);
            if (!parsedPalette || parsedPalette.length === 0) {
                throw new Error('Failed to parse palette file or palette is empty');
            }
            console.log(`[Provider] Successfully parsed palette: ${paletteName} (${parsedPalette.length} colors)`);
            // Update document state
            docState.customPalette = parsedPalette;
            docState.customPaletteName = paletteName;
            docState.isDirty = true;
            // Update view state
            this._viewState.customPalette = parsedPalette;
            this._viewState.customPaletteName = paletteName;
            this._viewState.isDirty = true;
            // Update the webview
            this.updateWebview();
            // Show success message
            vscode.window.showInformationMessage(`Loaded palette: ${paletteName}`);
        }
        catch (error) {
            console.error("[Provider] Error loading palette file:", error);
            vscode.window.showErrorMessage(`Failed to load palette file: ${error.message}`);
        }
        finally {
            this._panel?.webview.postMessage({ command: 'processingFinished' });
        }
    }
    /**
     * Save the document
     */
    async _performSave(document) {
        console.log("[Provider] _performSave started for optimized block.");
        const docState = document.state;
        if (!docState.optimizedBlockData) {
            console.error("[Provider] Cannot save: optimized block data is missing.");
            throw new Error("Cannot save: optimized block data is missing.");
        }
        try {
            // Serialize the optimized block data
            const serializedData = require('./optimizedBlockUtils').serializeOptimizedBlockFile(docState.optimizedBlockData);
            // Write to file
            await vscode.workspace.fs.writeFile(document.uri, serializedData);
            // Mark as clean
            docState.isDirty = false;
            if (this._viewState) {
                this._viewState.isDirty = false;
            }
            // Update the webview
            this.updateWebview();
            console.log("[Provider] Optimized block document saved successfully.");
        }
        catch (error) {
            console.error("[Provider] Error saving optimized block file:", error);
            throw error;
        }
    }
    /**
     * Save custom document
     */
    async saveCustomDocument(document, cancellation) {
        console.log(`[OptimizedBlockViewerProvider] saveCustomDocument triggered for: ${document.uri.fsPath}`);
        await this._performSave(document);
    }
    /**
     * Revert custom document
     */
    async revertCustomDocument(document, cancellation) {
        console.log(`[OptimizedBlockViewerProvider] revertCustomDocument triggered for: ${document.uri.fsPath}`);
        // Read the original file content
        const fileData = await vscode.workspace.fs.readFile(document.uri);
        const docState = document.state;
        try {
            // Parse the original data
            docState.optimizedBlockData = (0, optimizedBlockUtils_1.deserializeOptimizedBlockFile)(buffer_1.Buffer.from(fileData));
            docState.blockDataBytes = fileData;
            docState.isDirty = false;
            // Update view state
            if (this._viewState) {
                this._viewState.optimizedBlockData = docState.optimizedBlockData;
                this._viewState.blockWidth = docState.optimizedBlockData.originalWidth;
                this._viewState.blockHeight = docState.optimizedBlockData.originalHeight;
                this._viewState.isDirty = false;
            }
            // Update the webview
            this.updateWebview();
            // Fire change event
            this._onDidChangeCustomDocument.fire({
                document: document,
                undo: async () => { console.warn("Undo for revert not implemented."); },
                redo: async () => { console.warn("Redo for revert not implemented."); }
            });
            console.log('[Provider] Optimized block document successfully reverted and marked clean.');
        }
        catch (error) {
            console.error(`[Provider] Error reverting optimized block document: ${error}`);
            vscode.window.showErrorMessage(`Failed to revert document: ${error}`);
        }
    }
    /**
     * Save edit custom document
     */
    async saveCustomDocumentAs(document, destination, cancellation) {
        // Implement save as logic
        // This would be similar to saveCustomDocument but with a different destination
        if (!document.state.optimizedBlockData) {
            throw new Error("Cannot save: optimized block data is missing.");
        }
        try {
            // Serialize the optimized block data
            const serializedData = require('./optimizedBlockUtils').serializeOptimizedBlockFile(document.state.optimizedBlockData);
            // Write to destination file
            await vscode.workspace.fs.writeFile(destination, serializedData);
            console.log(`[Provider] Optimized block document saved as: ${destination.fsPath}`);
        }
        catch (error) {
            console.error("[Provider] Error in saveCustomDocumentAs:", error);
            throw error;
        }
    }
    /**
     * Backup custom document
     * Required by CustomEditorProvider interface
     */
    async backupCustomDocument(document, context, cancellation) {
        // Create a backup of the current state
        const backupData = document.state.blockDataBytes;
        // Write to backup file
        await vscode.workspace.fs.writeFile(context.destination, backupData);
        return {
            id: context.destination.toString(),
            delete: async () => {
                try {
                    // Delete the backup file when no longer needed
                    await vscode.workspace.fs.delete(context.destination);
                }
                catch (e) {
                    console.error(`Failed to delete backup file: ${context.destination.toString()}`, e);
                }
            }
        };
    }
    /**
     * Update the webview with the current state
     */
    updateWebview() {
        if (!this._panel || !this._viewState) {
            return;
        }
        this._panel.webview.postMessage({
            command: 'updateState',
            state: this._viewState
        });
    }
    /**
     * Get HTML for the webview
     */
    _getHtmlForWebview(webview) {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'optimizedBlockViewer.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'optimizedBlockViewer.css'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.css'));
        // Use a nonce to only allow specific scripts to be run
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <link href="${styleUri}" rel="stylesheet" />
            <link href="${codiconsUri}" rel="stylesheet" />
            <title>Optimized Block Viewer</title>
        </head>
        <body>
            <div class="container">
                <div class="toolbar">
                    <button id="loadSpriteBtn" class="toolbarBtn">Load Sprite File</button>
                    <button id="loadPaletteBtn" class="toolbarBtn">Load Palette</button>
                    <button id="saveBtn" class="toolbarBtn">Save</button>
                    <span id="status-message" class="status"></span>
                </div>
                
                <div class="main-content">
                    <div class="block-list">
                        <h3>Blocks</h3>
                        <div id="blockList" class="list-container"></div>
                    </div>
                    
                    <div class="block-editor">
                        <h3>Block Editor</h3>
                        <div id="blockEditor" class="editor-container"></div>
                    </div>
                    
                    <div class="sprite-palette">
                        <h3>Sprites</h3>
                        <div id="spritePalette" class="palette-container"></div>
                    </div>
                </div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    /**
     * Generate a nonce string
     */
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.OptimizedBlockViewerProvider = OptimizedBlockViewerProvider;
//# sourceMappingURL=optimizedBlockViewerProvider.js.map