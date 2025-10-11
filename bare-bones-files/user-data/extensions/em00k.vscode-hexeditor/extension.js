const vscode = require('vscode');

/**
 * HexDocument manages the state and operations of a binary file being edited.
 */
class HexDocument {
    constructor(uri, initialContent) {
        this._uri = uri;
        this._fileData = initialContent;
        this._originalContent = initialContent; // For revert operations
        this._isDirty = false;
        this._pendingEdits = false;
        this._saveDebounceTimeout = null;
        
        // Set up event emitters
        this._onDidDispose = new vscode.EventEmitter();
        this.onDidDispose = this._onDidDispose.event;
        
        this._onDidChangeContent = new vscode.EventEmitter();
        this.onDidChangeContent = this._onDidChangeContent.event;
    }

    // Properties
    get uri() { return this._uri; }
    get fileData() { return this._fileData; }
    get isDirty() { return this._isDirty; }

    // Methods
    dispose() {
        this._onDidDispose.fire();
        this._onDidDispose.dispose();
        this._onDidChangeContent.dispose();
        if (this._saveDebounceTimeout) {
            clearTimeout(this._saveDebounceTimeout);
        }
    }

    /**
     * Edit a single byte in the document (Overwrite mode)
     * @param {number} offset - The offset of the byte to edit
     * @param {number} value - The new value for the byte (0-255)
     * @param {boolean} debounce - Whether to debounce the dirty state (default: true)
     */
    edit(offset, value, debounce = true) {
        if (offset >= 0 && offset < this._fileData.length) {
            // Only create a new Uint8Array if the value is actually different
            // to prevent unnecessary object creation and dirty marking if overwriting with same value.
            if (this._fileData[offset] !== value) {
                const newData = new Uint8Array(this._fileData);
                newData[offset] = value;
                this._fileData = newData;
                this._markDirty(debounce);
            }
        }
    }

    /**
     * Insert bytes into the document
     * @param {number} offset - The offset at which to insert bytes
     * @param {Uint8Array} bytesToInsert - The bytes to insert
     */
    insertBytes(offset, bytesToInsert) {
        if (offset < 0 || offset > this._fileData.length) {
            console.warn(`Attempted to insert bytes at invalid offset: ${offset}, length ${this._fileData.length}`);
            return;
        }
        if (!bytesToInsert || bytesToInsert.length === 0) {
            return; // Nothing to insert
        }

        const newLength = this._fileData.length + bytesToInsert.length;
        const newData = new Uint8Array(newLength);

        newData.set(this._fileData.subarray(0, offset), 0);
        newData.set(bytesToInsert, offset);
        newData.set(this._fileData.subarray(offset), offset + bytesToInsert.length);

        this._fileData = newData;
        this._markDirty(false); // Insertions should mark dirty immediately
    }

    /**
     * Delete bytes from the document
     * @param {number} offset - The offset from which to delete bytes
     * @param {number} count - The number of bytes to delete
     */
    deleteBytes(offset, count) {
        if (offset < 0 || offset >= this._fileData.length || count <= 0) {
            console.warn(`Attempted to delete bytes with invalid parameters: offset ${offset}, count ${count}, length ${this._fileData.length}`);
            return;
        }
        const endOffset = offset + count;
        if (endOffset > this._fileData.length) {
            count = this._fileData.length - offset; // Adjust count if it goes out of bounds
        }

        const newLength = this._fileData.length - count;
        const newData = new Uint8Array(newLength);

        newData.set(this._fileData.subarray(0, offset), 0);
        newData.set(this._fileData.subarray(offset + count), offset);
        
        this._fileData = newData;
        this._markDirty(false); // Deletions should mark dirty immediately
    }

    /**
     * Helper to mark document as dirty and manage events/timeouts
     * @param {boolean} debounce
     */
    _markDirty(debounce) {
        this._pendingEdits = true;
        if (debounce) {
            if (this._saveDebounceTimeout) {
                clearTimeout(this._saveDebounceTimeout);
            }
            this._saveDebounceTimeout = setTimeout(() => {
                if (this._pendingEdits) {
                    this._isDirty = true;
                    this._pendingEdits = false;
                    this._onDidChangeContent.fire({});
                }
            }, 1000);
        } else {
            this._isDirty = true;
            this._pendingEdits = false;
            if (this._saveDebounceTimeout) { // Clear debounce if an immediate change occurs
                clearTimeout(this._saveDebounceTimeout);
                this._saveDebounceTimeout = null;
            }
            this._onDidChangeContent.fire({});
        }
    }

    /**
     * Save the document to its original URI
     */
    async save(cancellation) {
        console.log('Saving document:', this._uri.fsPath);
        
        // Clear any pending debounce timeout
        if (this._saveDebounceTimeout) {
            clearTimeout(this._saveDebounceTimeout);
            this._saveDebounceTimeout = null;
        }
        
        await vscode.workspace.fs.writeFile(this._uri, this._fileData);
        this._isDirty = false;
        this._pendingEdits = false;
        this._originalContent = this._fileData; // Update after successful save
    }

    /**
     * Save the document to a new URI
     */
    async saveAs(targetResource, cancellation) {
        console.log('Saving document as:', targetResource.fsPath);
        
        // Clear any pending debounce timeout
        if (this._saveDebounceTimeout) {
            clearTimeout(this._saveDebounceTimeout);
            this._saveDebounceTimeout = null;
        }
        
        await vscode.workspace.fs.writeFile(targetResource, this._fileData);
        this._uri = targetResource;
        this._isDirty = false;
        this._pendingEdits = false;
        this._originalContent = this._fileData;
    }

    /**
     * Revert the document to its original state
     */
    async revert(cancellation) {
        console.log('Reverting document to original state');
        
        // Clear any pending debounce timeout
        if (this._saveDebounceTimeout) {
            clearTimeout(this._saveDebounceTimeout);
            this._saveDebounceTimeout = null;
        }
        
        this._fileData = new Uint8Array(this._originalContent);
        this._isDirty = false;
        this._pendingEdits = false;
        this._onDidChangeContent.fire({});
    }

    /**
     * Create a backup of the document
     */
    async backup(destination, cancellation) {
        console.log('Creating backup at:', destination.fsPath);
        await vscode.workspace.fs.writeFile(destination, this._fileData);
        return {
            id: destination.toString(),
            delete: async () => {
                try {
                    await vscode.workspace.fs.delete(destination);
                } catch (e) {
                    console.error('Failed to delete backup', e);
                }
            }
        };
    }
}

/**
 * Provider for hex editor
 */
class HexEditorProvider {
    constructor(context) {
        this.context = context;
        this._documents = new Map();
        
        // Set up event emitter for document changes
        this._onDidChangeCustomDocument = new vscode.EventEmitter();
        this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    }

    /**
     * Called when a custom document is opened
     */
    async openCustomDocument(uri, openContext, token) {
        console.log(`Opening document: ${uri.fsPath}`);
        
        // Read the file content
        const fileData = await vscode.workspace.fs.readFile(uri);
        const document = new HexDocument(uri, fileData);
        
        // Listen for content changes and forward them
        const changeListener = document.onDidChangeContent(() => {
            this._onDidChangeCustomDocument.fire({
                document,
                // These are optional and would implement undo/redo
                undo: () => {/* TODO: implement if needed */},
                redo: () => {/* TODO: implement if needed */}
            });
        });
        
        // Clean up listener when document is disposed
        document.onDidDispose(() => changeListener.dispose());
        
        return document;
    }

    /**
     * Called when a custom document is to be rendered
     */
    async resolveCustomEditor(document, webviewPanel, token) {
        // Keep track of the relationship between document and webview
        this._documents.set(document.uri.toString(), { document, webviewPanel });
        webviewPanel.onDidDispose(() => {
            this._documents.delete(document.uri.toString());
        });

        // Set up the webview
        webviewPanel.webview.options = {
            enableScripts: true
        };
        
        webviewPanel.webview.html = this._getHtmlForWebview(webviewPanel.webview, document);

        // Send initial data to the webview
        webviewPanel.webview.postMessage({
            type: 'init',
            fileData: Array.from(document.fileData),
            fileSize: document.fileData.length
        });

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case 'editByte': // This is now explicitly for overwrite
                    document.edit(message.offset, message.value);
                    
                    // For single byte updates (overwrites), send back only that byte to avoid full redraws
                    if (message.singleByteUpdate) {
                        webviewPanel.webview.postMessage({
                            type: 'update',
                            fileData: Array.from(document.fileData), // Send full data in case of race conditions or for consistency
                            fileSize: document.fileData.length,
                            singleByteUpdate: true,
                            offset: message.offset
                        });
                    }
                    break;
                
                case 'insertBytes':
                    document.insertBytes(message.offset, new Uint8Array(message.bytes));
                    // A full update will be triggered by onDidChangeContent
                    break;

                case 'deleteBytes':
                    document.deleteBytes(message.offset, message.count);
                    // A full update will be triggered by onDidChangeContent
                    break;
                    
                case 'save':
                    await this.saveCustomDocument(document, token);
                    break;
                    
                case 'saveAs':
                    const newUri = await vscode.window.showSaveDialog({
                        defaultUri: document.uri,
                        saveLabel: 'Save Hex File As'
                    });
                    if (newUri) {
                        // Store the original URI before saving as a new file
                        const originalUri = document.uri;
                        
                        // Save the document with the new URI
                        await this.saveCustomDocumentAs(document, newUri, token);
                        
                        // Close the current panel
                        webviewPanel.dispose();
                        
                        // Get the original document from our map and dispose it
                        // This ensures VS Code knows we're done with it
                        const originalDocKey = originalUri.toString();
                        if (this._documents.has(originalDocKey)) {
                            const originalDocInfo = this._documents.get(originalDocKey);
                            if (originalDocInfo && originalDocInfo.document) {
                                // Explicitly dispose the document to clean up resources
                                originalDocInfo.document.dispose();
                                // Remove from our tracking map
                                this._documents.delete(originalDocKey);
                            }
                        }
                        
                        // Add a small delay before opening the new file
                        // This gives VS Code time to fully clean up the old document
                        setTimeout(() => {
                            // Open the new file in the hex editor
                            vscode.commands.executeCommand('vscode.openWith', newUri, 'hexEditor');
                        }, 100);
                    }
                    break;
                    
                case 'reload':
                    await this.revertCustomDocument(document, token);
                    break;
                    
                case 'log':
                    // Show search results in a status bar notification
                    if (message.message.includes('matches for') || message.message.includes('No matches found')) {
                        vscode.window.setStatusBarMessage(message.message, 3000); // Show for 3 seconds
                    }
                    break;
            }
        });

        // Listen for document changes and update webview
        const changeDocumentSubscription = document.onDidChangeContent(() => {
            webviewPanel.webview.postMessage({
                type: 'update',
                fileData: Array.from(document.fileData),
                fileSize: document.fileData.length
            });
        });

        // Clean up when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    /**
     * Generate the HTML for the webview
     */
    _getHtmlForWebview(webview, document) {
        const nonce = getNonce();
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.css'));
        const fileName = document.uri.path.split('/').pop();

        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>Hex Editor</title>
            </head>
            <body>
                <div class="header">
                    <span>File: ${fileName}</span>
                    <div>
                        <div class="search-container">
                            <input type="text" id="search-input" placeholder="Search (hex: FF 00 or text)">
                            <button id="search-button">Search</button>
                        </div>
                        <button id="save-button">SAVE</button>
                        <button id="save-as-button">SAVE AS</button>
                        <button id="reload-button">RELOAD</button>
                        <button id="offset-toggle-button">HEX/DEC</button>
                    </div>
                </div>

                <div class="edit-area">
                    <label for="edit-offset-display">Current Offset:</label>
                    <span id="edit-offset-display">N/A</span>
                    <span class="secondary-edit">
                        <label for="byte-edit-input">Alt Input (Hex):</label>
                        <input type="text" id="byte-edit-input" maxlength="2" size="2">
                    </span>
                </div>

                <div id="editor-content">
                    <!-- Hex data will be rendered here by JavaScript -->
                </div>
                
                <div class="status-bar">
                    <span>Offset: <span id="current-offset">00000000</span></span>
                    <span>Length: <span id="file-length">0</span> bytes</span>
                    <span id="selection-info" style="display:none">Selected: <span id="selection-length">0</span> bytes</span>
                    <span>Edit: <span id="edit-mode-type">Hex</span></span>
                    <span>Mode: <span id="edit-mode">Overwrite</span></span>
                </div>
                
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    // CustomEditorProvider interface methods
    async saveCustomDocument(document, cancellation) {
        return document.save(cancellation);
    }

    async saveCustomDocumentAs(document, destination, cancellation) {
        return document.saveAs(destination, cancellation);
    }

    async revertCustomDocument(document, cancellation) {
        return document.revert(cancellation);
    }

    async backupCustomDocument(document, context, cancellation) {
        return document.backup(context.destination, cancellation);
    }
}

/**
 * Generate a nonce string
 */
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Activation function called when extension is activated
 */
function activate(context) {
        
    // Register hex editor provider
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            'hexEditor', // Must match viewType in package.json
            new HexEditorProvider(context),
            {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false,
            }
        )
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 