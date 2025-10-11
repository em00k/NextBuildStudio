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
exports.SpriteViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const buffer_1 = require("buffer");
// Import the new modules
const paletteUtils_1 = require("./paletteUtils");
const spriteDataHandler_1 = require("./spriteDataHandler");
const spriteDocument_1 = require("./spriteDocument"); // Import the new document class
const spriteDedupUtils_1 = require("./spriteDedupUtils");
// --- Helper function to generate Toolbar HTML (Extracted from old getWebviewHtml) ---
async function generateToolbarHtml(// Make async
context, // Add context to resolve URI
viewState, customPaletteName, isCustomPalette) {
    const offsetBank = Math.floor(viewState.paletteOffset / 16);
    const paletteStatusText = isCustomPalette ? `Palette: ${customPaletteName}` : 'Default palette';
    const savePaletteDisabled = !isCustomPalette;
    // Load the template file
    const templateUri = vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'toolbar.template.html');
    const templateContent = await vscode.workspace.fs.readFile(templateUri).then(buffer => buffer.toString());
    // Prepare mode options
    const modes = [
        { value: 'sprite8', text: '8-bit sprites (256 colors)' },
        { value: 'sprite4', text: '4-bit sprites (16 colors)' },
        { value: 'font8x8', text: '8x8 tiles | font (256 colors)' },
        { value: 'tile8x8', text: '8x8 tiles (16 colors)' }
    ];
    const modeOptionsHtml = modes.map(mode => `<option value="${mode.value}" ${viewState.mode === mode.value ? 'selected' : ''}>${mode.text}</option>`).join('');
    // Prepare sprite brush options
    const brushSizes = [
        { value: '1x1', text: '1x1', width: 1, height: 1 },
        { value: '1x2', text: '1x2', width: 1, height: 2 },
        { value: '2x1', text: '2x1', width: 2, height: 1 },
        { value: '2x2', text: '2x2', width: 2, height: 2 },
        { value: '1x3', text: '1x3', width: 1, height: 3 },
        { value: '3x1', text: '3x1', width: 3, height: 1 },
        { value: '2x3', text: '2x3', width: 2, height: 3 },
        { value: '3x2', text: '3x2', width: 3, height: 2 },
        { value: '3x3', text: '3x3', width: 3, height: 3 },
        { value: '2x6', text: '2x6', width: 2, height: 6 },
        { value: '2x4', text: '2x4', width: 2, height: 4 }
    ];
    const spriteBrushOptionsHtml = brushSizes.map(brush => `<option value="${brush.value}" ${viewState.spriteBrush.width === brush.width && viewState.spriteBrush.height === brush.height ? 'selected' : ''}>${brush.text}</option>`).join('');
    // Replace placeholders
    let toolbarHtml = templateContent
        .replace('{{MODE_OPTIONS}}', modeOptionsHtml)
        .replace('{{OFFSET_VALUE}}', offsetBank.toString())
        .replace('{{OFFSET_DISABLED}}', !['sprite4', 'tile8x8'].includes(viewState.mode) ? 'disabled' : '')
        .replace(/{{SCALE_VALUE}}/g, viewState.scale.toString()) // Use regex for global replace
        .replace('{{GRID_CHECKED}}', viewState.showGrid ? 'checked' : '')
        .replace('{{PALETTE_STATUS_TEXT}}', paletteStatusText)
        .replace('{{PALETTE_STATUS_TITLE}}', isCustomPalette ? customPaletteName : '')
        .replace('{{SAVE_PALETTE_DISABLED}}', savePaletteDisabled ? 'disabled' : '')
        .replace('{{MERGE_PALETTE_DISABLED}}', savePaletteDisabled ? 'disabled' : ''); // Assuming merge has same condition
    // Inject sprite brush controls - Assuming a placeholder like {{SPRITE_BRUSH_CONTROLS}} exists
    // or append it to a known section. Let's assume a general controls area or append after scale.
    // This part might need adjustment based on the actual toolbar.template.html structure.
    // For now, let's try to replace a hypothetical placeholder.
    // If not found, it won't break, but the user will need to add it to their template.
    const brushControlHtml = `
        <label for="spriteBrushSelect">Brush:</label>
        <select id="spriteBrushSelect" title="Select sprite brush size (WxH)">
            ${spriteBrushOptionsHtml}
        </select>
    `;
    if (toolbarHtml.includes('{{SPRITE_BRUSH_CONTROLS}}')) {
        toolbarHtml = toolbarHtml.replace('{{SPRITE_BRUSH_CONTROLS}}', brushControlHtml);
    }
    else {
        // Fallback: attempt to insert it after the scale control or another known element
        // This is a bit fragile. A dedicated placeholder is better.
        // For now, let's add it before the grid toggle for demonstration.
        const gridToggleMarker = '<label for="showGridCheckbox"';
        if (toolbarHtml.includes(gridToggleMarker)) {
            toolbarHtml = toolbarHtml.replace(gridToggleMarker, `${brushControlHtml}\n${gridToggleMarker}`);
        }
        else {
            // If no clear spot, append at the end of a common toolbar div
            toolbarHtml = toolbarHtml.replace('</div>', `${brushControlHtml}</div>`); // Simplistic append
        }
    }
    return toolbarHtml;
}
// --- Helper function to generate Sprites Grid HTML --- 
function generateSpritesGridHtml(spriteData, viewState, palette, defaultPalette) {
    const spritesPerRow = 16; // Or make dynamic
    const paletteToUse = palette ?? defaultPalette; // PaletteColor array
    function getDisplayColor(rawIndex, offset, mode, spriteIndex, pixelIndex) {
        let finalIndex = rawIndex;
        if (mode === 'sprite4' || mode === 'tile8x8') {
            // Multiply bank offset by 16
            finalIndex = (offset * 16) + rawIndex;
        }
        // Ensure finalIndex is within bounds
        finalIndex = Math.max(0, Math.min(255, finalIndex));
        const hexColor = paletteToUse[finalIndex]?.hex ?? '#FF00FF'; // Access .hex property, provide fallback
        // --- Log first pixel of first sprite ---
        if (spriteIndex === 0 && pixelIndex === 0) {
            console.log(`[GridDraw] Sprite 0, Pixel 0: Raw=${rawIndex}, Offset=${offset}, Mode=${mode}, FinalIdx=${finalIndex}, Hex=${hexColor}`);
        }
        // --- End Log ---
        return hexColor;
    }
    return spriteData.sprites.map((sprite, spriteIndex) => `
        <div class="sprite-box ${sprite.index === viewState.currentSprite ? 'selected' : ''}" data-index="${sprite.index}">
            <div class="sprite-container" style="grid-template-columns: repeat(${sprite.width}, 1fr);">
                ${sprite.pixels.map((color, pixelIndex) => `
                    <div class="sprite-pixel" style="background-color: ${getDisplayColor(color, viewState.paletteOffset, viewState.mode, spriteIndex, pixelIndex)};"></div>
                `).join('')}
            </div>
            <div class="sprite-index">${sprite.index}</div>
        </div>
    `).join('');
}
// --- Helper function to generate Sprite Detail HTML --- 
function generateSpriteDetailHtml(spriteData, viewState, palette, defaultPalette, webview, contextUri) {
    const currentSpriteIndex = viewState.currentSprite;
    const numSprites = spriteData.count;
    const sprite = spriteData.sprites[currentSpriteIndex];
    const width = sprite?.width ?? spriteData.width;
    const height = sprite?.height ?? spriteData.height;
    // const scale = viewState.scale; // Scale is handled by CSS variable
    const usePalette = palette || defaultPalette;
    const offset = (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') ? viewState.paletteOffset : 0;
    function getDisplayColor(rawIndex, offset, mode, pixelIndex) {
        // Apply correct logic here as well: multiply offset by 16 for 4-bit modes
        const effectiveIndex = (mode === 'sprite4' || mode === 'tile8x8')
            ? (offset * 16) + rawIndex
            : rawIndex;
        let colorHex = '#000000'; // Default error color
        // Ensure index is within bounds before accessing
        if (effectiveIndex >= 0 && effectiveIndex < usePalette.length) {
            colorHex = usePalette[effectiveIndex].hex;
        }
        else {
            // Log warning or return a specific error color? Defaulting to black for now.
            console.warn(`[DetailDraw GetColor] Calculated index ${effectiveIndex} out of bounds (0-${usePalette.length - 1}) for mode ${mode}, offset ${offset}, rawIndex ${rawIndex}. Returning black.`);
        }
        // --- Log first pixel ---
        if (pixelIndex === 0) {
            console.log(`[DetailDraw] Pixel 0: Raw=${rawIndex}, Offset=${offset}, Mode=${mode}, EffectiveIdx=${effectiveIndex}, Hex=${colorHex}`);
        }
        // --- End Log ---
        return colorHex;
    }
    // Generate the detail view grid cells
    let detailGridHtml = '';
    if (sprite) {
        // Generate pixels directly without row divs
        detailGridHtml = sprite.pixels.map((rawColorIndex, pixelIndex) => {
            const colorHex = getDisplayColor(rawColorIndex, offset, viewState.mode, pixelIndex);
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            return `<div class="detail-pixel" 
                               data-x="${x}" 
                               data-y="${y}" 
                               data-index="${pixelIndex}"
                               data-color-index="${rawColorIndex}"
                               style="background-color: ${colorHex};"></div>`;
        }).join('');
    }
    else {
        detailGridHtml = '<div class="error-message">No sprite data available for this index.</div>';
    }
    // Generate palette picker swatches
    let palettePickerHtml = '';
    const paletteSize = usePalette.length;
    // const visibleSize = appState?.palette?.visibleSize ?? 256; // Removed - Handled by JS/CSS
    for (let i = 0; i < paletteSize; i++) {
        const colorEntry = usePalette[i];
        const colorHex = colorEntry.hex;
        // const isVisible = i < visibleSize; // Removed - Handled by JS/CSS
        const rgb9 = (0, paletteUtils_1.hexToRgb9)(colorHex);
        // Extract RGB24 values from hex
        const r24 = parseInt(colorHex.substring(1, 3), 16);
        const g24 = parseInt(colorHex.substring(3, 5), 16);
        const b24 = parseInt(colorHex.substring(5, 7), 16);
        // Get RGB9 as bytes (using rgb9ToBytes function)
        const [rgb9Byte1, rgb9Byte2] = (0, paletteUtils_1.rgb9ToBytes)(rgb9.r9, rgb9.g9, rgb9.b9);
        // Removed the 'hidden' class logic
        palettePickerHtml += `<div class="color-swatch" 
                                   data-index="${i}" 
                                   data-hex="${colorHex}" 
                                   style="background-color: ${colorHex};" 
                                   title="Index: ${i}\nHex: ${colorHex}\nRGB9 bytes: (${rgb9Byte1}, ${rgb9Byte2})\nRGB9: (${rgb9.r9},${rgb9.g9},${rgb9.b9})\nRGB24: (${r24},${g24},${b24})\nPriority: ${colorEntry.priority}"
                                   draggable="true">${i}</div>`;
    }
    // Generate transform buttons
    // let transformButtonsHtml = '';
    // const transforms = [
    //     { id: 'flipH', icon: 'flip_horizontal.svg', title: 'Flip Horizontal' },
    //     { id: 'flipV', icon: 'flip_vertical.svg', title: 'Flip Vertical' },
    //     { id: 'rotateLeft', icon: 'rotate_left.svg', title: 'Rotate Left' },
    //     { id: 'rotateRight', icon: 'rotate_right.svg', title: 'Rotate Right' },
    //     { id: 'scrollL', icon: 'shift_left.svg', title: 'Shift Left' },
    //     { id: 'scrollR', icon: 'shift_right.svg', title: 'Shift Right' },
    //     { id: 'scrollU', icon: 'shift_up.svg', title: 'Shift Up' },
    //     { id: 'scrollD', icon: 'shift_down.svg', title: 'Shift Down' },
    //     { id: 'clear', icon: 'clear.svg', title: 'Clear Sprite' },
    //     { id: 'fill', icon: 'paint-bucket.svg', title: 'Fill (Toggle)' }
    // ];
    transformButtonsHtml = transforms.map(t => {
        const webviewIconUri = webview.asWebviewUri(vscode.Uri.joinPath(contextUri, 'media', 'icons', t.icon));
        return `<button class="transform-button" title="${t.title}" data-action="${t.id}">
            <img src="${webviewIconUri}" alt="${t.title}">
         </button>`; // Removed specific ID from button
    }).join('');
    // --- Restore previous structure --- 
    return `
        <h2>Sprite ${currentSpriteIndex} Detail (${numSprites} total)</h2>
        <div class="detail-area"> <!-- Outer container -->
            <div class="sprite-editor-panel"> <!-- Panel containing grid and palette -->
                <div class="editor-sprite-grid-area"> <!-- Area for grid and hover info -->
                    <div class="detail-container" style="grid-template-columns: repeat(${width}, 1fr);">
                         <!-- The actual grid pixels -->
                        ${detailGridHtml}

                    </div>

                    <!-- Hover Info Container -->
                    <div class="hover-info-container" style="width: 100%;">
                        <div id="hoverInfoContainer" style="display: flex; flex-direction: column; margin-top: 10px; padding: 8px 12px; background-color: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-editorWidget-border, transparent); border-radius: 4px; font-size: 11px; min-height: 20px; color: var(--vscode-editorWidget-foreground);">
                            <!-- Row 1 -->
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                <div id="hoverPreviewBox" style="background-color: transparent; width: 16px; height: 16px; border: 1px solid var(--vscode-inputOption-activeBorder); flex-shrink: 0;"></div>
                                <span><strong>Index:</strong> <span id="hoverRawValue">--</span></span>
                                <span><strong>Palette:</strong> <span id="hoverPaletteIndex">--</span></span>
                            </div>
                            <!-- Row 2 -->
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span>%<span id="hoverByte1">--</span>,%<span id="hoverByte2">--</span></span>
                                <span><span id="hoverHexValue">--</span></span>
                            </div>
                        </div>
                    </div>
                    <!-- Transform Controls Container -->
                    <div id="transformControls">
                         ${transformButtonsHtml} 
                    </div>
                </div>



                <div class="editor-palette-controls"> <!-- Area for selected colors and palette -->
                    <div class="palette-picker-layout"> <!-- Layout container -->
                        <div class="selected-colors-area">
                            <!-- Primary Color Display -->
                            <div class="selected-color-display" id="primaryDisplay">
                                <div class="label">L</div>
                                <div class="preview-box" id="primaryPreviewBox"></div>
                                <div class="index-value">Index: <span id="primaryColorIndex">0</span></div>
                                <div class="hex-value" id="primaryHexValue">#000000</div>
                            </div>
                            <!-- Secondary Color Display -->
                            <div class="selected-color-display" id="secondaryDisplay">
                                <div class="label">R</div>
                                <div class="preview-box" id="secondaryPreviewBox"></div>
                                <div class="index-value">Index: <span id="secondaryColorIndex">0</span></div>
                                <div class="hex-value" id="secondaryHexValue">#000000</div>
                            </div>
                            <!-- Color Picker Input & 9-bit Display -->
                            <div class="color-picker-control">
                                
                                <input type="color" id="colorPickerInput" value="#000000">
                                <!-- 9-bit Display and Priority -->
                                <div class="primary-color-details">
                                     <div class="rgb9-display">
                                        <span>R9:<span id="primaryR9Value">0</span></span>
                                        <span>G9:<span id="primaryG9Value">0</span></span>
                                        <span>B9:<span id="primaryB9Value">0</span></span>
                                    </div>
                                    <div class="priority-control">
                                        <input type="checkbox" id="primaryPriorityFlag" title="Set high priority flag for this color">
                                        <label for="primaryPriorityFlag">Priority</label>
                                    </div>
                                </div>
                            </div>
                         </div>
                        <div id="palettePicker" style="width: 90%; margin: 0 auto;">
                             ${palettePickerHtml}
                         </div>
                      </div>

                      <!-- RGB Sliders - Directly under palette picker -->
                      <div class="picker-controls" style="width: 67%; margin-left: auto; margin-top: 0px;">
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
                      
                      <!-- Palette Size Control (using select) -->
                      <div class="palette-size-control-container">
                         <div class="palette-size-control" style="margin-top: 10px; text-align: right;">
                             <label for="paletteSizeSelect" style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: 500;">Visible Colors:</label>
                             <select id="paletteSizeSelect" style="width: 30%; padding: 3px 6px;">
                                 <option value="8">First 8</option>
                                 <option value="16">First 16</option>
                                 <option value="32">First 32</option>
                                 <option value="64">First 64</option>
                                 <option value="128">First 128</option>
                                 <option value="256" selected>All 256</option>
                             </select>
                         </div>
                      </div>
                 </div>
            </div>
        </div>
        <!-- Detail Info Footer -->
        <div class="detail-info">
            Size: ${width}x${height} pixels | Palette: ${palette !== null ? 'Custom' : 'Default'} 
            ${(viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') ? '| Offset: ' + viewState.paletteOffset : ''}
        </div>
    `;
}
class SpriteViewerProvider {
    context;
    static viewType = 'nextbuild-viewers.spriteViewer';
    // Change event emitter type
    _onDidChangeCustomDocument = new vscode.EventEmitter();
    onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    // Map to store document wrappers
    documents = new Map();
    // --- Instance Properties --- 
    // Keep track of webviews per document URI
    webviews = new Map();
    // No longer need to store all this state directly on provider instance
    /*
    private customPaletteHex: string[] | null = null;
    private customPaletteName: string = '';
    private copiedSpriteInfo: { pixels: number[], width: number, height: number, type: string } | null = null;
    private currentSpriteData: SpriteFileData | null = null;
    private currentFileData: Buffer | null = null;
    private isDirty = false;
    private currentViewState: SpriteViewState | null = null;
    private currentWebviewPanel: vscode.WebviewPanel | null = null;
    private currentDocumentUri: vscode.Uri | null = null;
    */
    // Need default palette easily accessible
    defaultPalette;
    // Need to store copied sprite info globally across documents?
    copiedSpriteInfo = null;
    constructor(context) {
        this.context = context;
        this.defaultPalette = (0, paletteUtils_1.generateDefaultPalette)(); // Generate default palette with priority info
        // Log after generation
        console.log(`[SpriteProvider Constructor] Default palette initialized. First 5: ${JSON.stringify(this.defaultPalette.slice(0, 5))}`);
    }
    // --- Implement CustomEditorProvider Methods --- 
    async openCustomDocument(uri, openContext, token) {
        // console.log(`[SpriteProvider] Opening document: ${uri.fsPath}`);
        const fileData = await vscode.workspace.fs.readFile(uri);
        const state = {
            uri: uri,
            initialFileData: fileData,
            currentSpriteData: null, // Parsed in resolve
            customPaletteHex: null,
            customPaletteName: '',
            isDirty: false,
        };
        // Initial parse to populate currentSpriteData
        try {
            // Attempt initial parse as 8-bit sprite
            state.currentSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(buffer_1.Buffer.from(fileData));
        }
        catch (e) {
            // console.warn(`[SpriteProvider] Initial parse as sprite8 failed for ${uri.fsPath}. Will rely on resolve. Error:`, e);
            // Keep currentSpriteData as null, resolve will handle mode selection
        }
        const document = new spriteDocument_1.SpriteDocument(state);
        this.documents.set(uri.toString(), document); // Store the document
        return document;
    }
    async resolveCustomEditor(document, // Use SpriteDocument type
    webviewPanel, token) {
        // console.log(`[SpriteProvider] Resolving editor for: ${document.uri.fsPath}`);
        this.webviews.set(document.uri.toString(), webviewPanel); // Store panel associated with document
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview'),
                vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };
        // Use the state from the passed SpriteDocument
        const docState = document.state;
        const filePath = document.uri.fsPath;
        const fileExt = path.extname(filePath).toLowerCase();
        // --- Determine Initial Mode Based on Extension ---
        let initialMode = 'sprite8'; // Default
        if (fileExt === '.nxt' || fileExt === '.til') {
            initialMode = 'tile8x8';
        }
        else if (fileExt === '.fnt') { // Assuming .fnt is 8x8 font
            initialMode = 'font8x8';
        }
        else if (fileExt === '.spr') {
            initialMode = 'sprite8';
        } // Add other specific extensions if needed
        // console.log(`[Provider] Initial mode determined by extension (${fileExt}): ${initialMode}`);
        // --- Try to Auto-Load Associated Palette (if none loaded yet) ---
        let originalPaletteByteLength = 0; // Track original size
        if (docState.customPaletteHex === null) {
            const parsedPath = path.parse(filePath);
            const baseName = path.join(parsedPath.dir, parsedPath.name);
            const nxpPath = baseName + '.nxp';
            const palPath = baseName + '.pal';
            let paletteLoaded = false;
            try {
                const nxpUri = vscode.Uri.file(nxpPath);
                const nxpData = await vscode.workspace.fs.readFile(nxpUri);
                originalPaletteByteLength = nxpData.length; // Store original length
                docState.customPaletteHex = (0, paletteUtils_1.parsePaletteFile)(nxpData);
                docState.customPaletteName = path.basename(nxpPath);
                paletteLoaded = true;
            }
            catch (e) {
                try {
                    const palUri = vscode.Uri.file(palPath);
                    const palData = await vscode.workspace.fs.readFile(palUri);
                    originalPaletteByteLength = palData.length; // Store original length
                    docState.customPaletteHex = (0, paletteUtils_1.parsePaletteFile)(palData);
                    docState.customPaletteName = path.basename(palPath);
                    paletteLoaded = true;
                }
                catch (e2) {
                    // Neither found
                }
            }
        }
        // --- Setup Initial View State ---
        const viewState = {
            mode: initialMode, // Use determined mode
            paletteOffset: 0,
            scale: 3,
            showGrid: true,
            currentSprite: 0,
            isDirty: docState.isDirty,
            spriteBrush: { width: 1, height: 1 } // Default to 1x1
            // customPaletteName will be set later if loaded
        };
        // Ensure initial parse happens using the correct mode
        // This updates docState.currentSpriteData
        this.parseAndUpdateSpriteData(document, viewState);
        // --- Check for Palette/Data Mismatch ---
        if (docState.customPaletteHex !== null && docState.currentSpriteData && originalPaletteByteLength > 0) {
            const numColorsInOriginalPalette = originalPaletteByteLength / 2;
            let maxIndexUsed = 0;
            docState.currentSpriteData.sprites.forEach(sprite => {
                sprite.pixels.forEach(pixel => {
                    maxIndexUsed = Math.max(maxIndexUsed, pixel);
                });
            });
            if (maxIndexUsed >= numColorsInOriginalPalette) {
                vscode.window.showWarningMessage(`Sprite data uses color indices (up to ${maxIndexUsed}) beyond the range defined in the loaded custom palette '${docState.customPaletteName}' (defines ${numColorsInOriginalPalette} colors). Some pixels may render incorrectly (using black or padding).`, { modal: false } // Make it non-modal
                );
            }
        }
        // --- End Mismatch Check ---
        // Prepare the initial state for the webview, ensuring palette has correct format
        const initialPalette = docState.customPaletteHex ?? this.defaultPalette;
        const webviewInitialState = {
            spriteData: docState.currentSpriteData,
            viewState: viewState,
            palette: initialPalette, // Send the array of {hex, priority} objects
            isCustomPaletteMode: docState.customPaletteHex !== null,
            defaultPalette: this.defaultPalette // Send default in new format too
        };
        // Update the webview content using the final state
        await this.updateWebviewContent(document, webviewPanel, viewState);
        // *** Add this block: Send initial state AFTER setting HTML ***
        // Log before sending
        console.log(`[SpriteProvider Resolve] Sending 'initialize'. First 5 palette entries: ${JSON.stringify(webviewInitialState.palette?.slice(0, 5))}`);
        this.postMessageToWebview(webviewPanel, {
            command: 'initialize',
            initialState: webviewInitialState
        });
        // *** End added block ***
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            // Get the document associated with this panel
            const currentDocument = this.documents.get(document.uri.toString());
            if (!currentDocument) {
                // console.error("Message received for disposed/unknown document:", document.uri.toString());
                return;
            }
            const currentState = currentDocument.state;
            // No need to store viewState on provider, get it fresh or pass if needed
            let needsStateUpdate = false;
            let needsPaletteUpdate = false;
            let needsDataUpdate = false;
            switch (message.command) {
                case 'viewStateResponse':
                    // Store the view state for use during a reload operation
                    if (message.viewState) {
                        console.log(`[Provider] Received viewStateResponse with mode: ${message.viewState.mode}`);
                        // Store in a temporary variable or respond immediately as needed
                        // This handler is called in response to a getViewState message
                    }
                    break;
                case 'changeMode':
                case 'changePaletteOffset':
                    {
                        // Modify the existing viewState object directly
                        const previousMode = viewState.mode;
                        const previousOffset = viewState.paletteOffset;
                        let needsReparse = false;
                        let modeChanged = false;
                        if (message.command === 'changeMode' && viewState.mode !== message.mode) {
                            viewState.mode = message.mode;
                            needsReparse = true;
                            modeChanged = true;
                            // Reset offset if mode doesn't use it
                            if (!['sprite4', 'tile8x8'].includes(viewState.mode)) {
                                viewState.paletteOffset = 0;
                            }
                        }
                        if (message.command === 'changePaletteOffset') {
                            // --- FIX: Use message.offset directly, which is the calculated actual offset --- 
                            const newActualOffset = message.offset; // Use the value sent (0, 16, 32...)
                            // >>> ADD LOGGING <<< 
                            console.log(`[Provider changePaletteOffset] Received offset: ${newActualOffset}`);
                            // >>> END LOGGING <<< 
                            if (typeof newActualOffset === 'number' && newActualOffset >= 0 && newActualOffset <= 240 && newActualOffset % 16 === 0) {
                                if (viewState.paletteOffset !== newActualOffset) {
                                    viewState.paletteOffset = newActualOffset; // Store 0, 16, 32...
                                    // Only reparse if the mode actually uses the offset
                                    if (['sprite4', 'tile8x8'].includes(viewState.mode)) {
                                        // Reparsing isn't actually needed when *only* the offset changes,
                                        // as the raw pixel data remains the same.
                                        // We just need to update the view state.
                                        needsStateUpdate = true; // <<< Ensure state update is triggered
                                    }
                                }
                            }
                            else {
                                console.warn(`[Provider] Received invalid palette offset: ${message.offset}`);
                            }
                            // --- END FIX --- 
                        }
                        // Ensure isDirty reflects document state
                        viewState.isDirty = currentState.isDirty;
                        // Re-parse if mode or relevant offset actually changed
                        if (needsReparse) {
                            this.parseAndUpdateSpriteData(currentDocument, viewState);
                        }
                        // --- Apply Fix from commit 71ddb35 --- 
                        if (modeChanged) {
                            // Mode changed, regenerate the entire HTML to update root styles
                            console.log(`[Provider ChangeMode] Mode changed to ${viewState.mode}, regenerating webview content.`);
                            // Regenerate content (this now sends spriteData async, but webview needs init first)
                            await this.updateWebviewContent(currentDocument, webviewPanel, viewState);
                            // --- RE-ADD Initialize message --- 
                            // After HTML reload, webview needs re-initialization with small state.
                            const smallInitialState = {
                                // Exclude spriteData
                                palette: docState.customPaletteHex ?? this.defaultPalette,
                                isCustomPaletteMode: docState.customPaletteHex !== null,
                                viewState: viewState, // This now includes spriteBrush
                                defaultPalette: this.defaultPalette,
                                paletteName: docState.customPaletteName
                            };
                            console.log(`[Provider ChangeMode] Sending 'initialize' after HTML regeneration.`);
                            this.postMessageToWebview(webviewPanel, {
                                command: 'initialize',
                                initialState: smallInitialState // Send small state for init
                            });
                            // The webview's initializeUI will then request fullSpriteData.
                            // --- END RE-ADD ---
                        }
                        else if (needsReparse) { // Only offset changed, and it matters for the mode
                            // Send an update message containing viewState and potentially re-parsed spriteData
                            console.log(`[Provider Offset Change] Sending update message. Mode: ${viewState.mode}, Offset: ${viewState.paletteOffset}`);
                            this.postMessageToWebview(webviewPanel, {
                                command: 'update',
                                viewState: viewState,
                                spriteData: currentState.currentSpriteData
                            });
                        }
                        // --- End Fix ---
                    }
                    break;
                case 'changeScale':
                    if (viewState.scale !== message.scale) {
                        viewState.scale = message.scale;
                        needsStateUpdate = true;
                    }
                    break;
                case 'toggleGrid':
                    if (viewState.showGrid !== message.showGrid) {
                        viewState.showGrid = message.showGrid;
                        needsStateUpdate = true;
                    }
                    break;
                case 'viewSprite':
                    if (viewState.currentSprite !== message.index) {
                        viewState.currentSprite = message.index;
                        // Instead of setting needsStateUpdate = true which triggers a full update,
                        // send a lighter-weight response specifically for sprite navigation
                        this.postMessageToWebview(webviewPanel, {
                            command: 'spriteSelected',
                            currentSpriteIndex: message.index
                        });
                    }
                    break;
                case 'loadPalette':
                    try {
                        const fileUri = await vscode.window.showOpenDialog({
                            canSelectFiles: true,
                            canSelectFolders: false,
                            canSelectMany: false,
                            filters: {
                                'Palette Files': ['pal', 'nxp']
                            },
                            title: 'Select a palette file'
                        });
                        if (fileUri && fileUri[0]) {
                            const paletteData = await vscode.workspace.fs.readFile(fileUri[0]);
                            currentState.customPaletteHex = (0, paletteUtils_1.parsePaletteFile)(paletteData);
                            currentState.customPaletteName = path.basename(fileUri[0].fsPath);
                            vscode.window.showInformationMessage(`Palette loaded: ${currentState.customPaletteName}`);
                            needsPaletteUpdate = true;
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Failed to load palette file: ' + error.message);
                    }
                    break;
                case 'useDefaultPalette':
                    if (currentState.customPaletteHex !== null) {
                        currentState.customPaletteHex = null;
                        currentState.customPaletteName = '';
                        vscode.window.showInformationMessage('Switched to default palette.');
                        needsPaletteUpdate = true;
                    }
                    break;
                case 'updateSpritePixels':
                    if (currentState.currentSpriteData?.sprites && message.spriteIndex >= 0 && message.spriteIndex < currentState.currentSpriteData.sprites.length && message.pixels) {
                        const targetSprite = currentState.currentSpriteData.sprites[message.spriteIndex];
                        if (targetSprite && targetSprite.pixels.length === message.pixels.length) {
                            targetSprite.pixels = message.pixels;
                            if (!currentState.isDirty) {
                                currentState.isDirty = true;
                                viewState.isDirty = true; // Keep view state in sync
                                // Don't notify VS Code if skipVsCodeDirtyNotification is true
                                if (!message.skipVsCodeDirtyNotification) {
                                    // Notify VS Code of dirty state
                                    this._onDidChangeCustomDocument.fire({
                                        document: currentDocument,
                                        undo: () => { },
                                        redo: () => { }
                                    });
                                }
                            }
                        }
                    }
                    break;
                case 'pasteSprite':
                    if (this.copiedSpriteInfo && currentState.currentSpriteData?.sprites && message.targetIndex < currentState.currentSpriteData.sprites.length) {
                        const targetSprite = currentState.currentSpriteData.sprites[message.targetIndex];
                        const currentDataType = currentState.currentSpriteData.type;
                        if (targetSprite &&
                            this.copiedSpriteInfo.width === targetSprite.width &&
                            this.copiedSpriteInfo.height === targetSprite.height &&
                            this.copiedSpriteInfo.type === currentDataType) {
                            targetSprite.pixels = [...this.copiedSpriteInfo.pixels];
                            vscode.window.showInformationMessage(`Pasted into sprite ${message.targetIndex}.`);
                            // needsDataUpdate = true; // Don't trigger a full data refresh
                            // Send a specific message for the updated sprite
                            this.postMessageToWebview(webviewPanel, {
                                command: 'spritePasted',
                                targetIndex: message.targetIndex,
                                pixels: targetSprite.pixels // Send the new pixel data
                            });
                            if (!currentState.isDirty) {
                                currentState.isDirty = true;
                                viewState.isDirty = true;
                                // this._onDidChangeCustomDocument.fire({ document: currentDocument, undo: () => {}, redo: () => {} });
                            }
                        }
                        else {
                            let reason = "dimensions or type do not match target";
                            if (!targetSprite) {
                                reason = "target sprite data is invalid";
                            }
                            else if (this.copiedSpriteInfo.type !== currentDataType) {
                                reason = `copied type (${this.copiedSpriteInfo.type}) does not match target type (${currentDataType})`;
                            }
                            else if (this.copiedSpriteInfo.width !== targetSprite.width || this.copiedSpriteInfo.height !== targetSprite.height) {
                                reason = `copied dimensions (${this.copiedSpriteInfo.width}x${this.copiedSpriteInfo.height}) do not match target dimensions (${targetSprite.width}x${targetSprite.height})`;
                            }
                            vscode.window.showWarningMessage(`Cannot paste: ${reason}.`);
                        }
                    }
                    else if (!this.copiedSpriteInfo) {
                        vscode.window.showWarningMessage('Cannot paste: No sprite copied.');
                    }
                    else {
                        const count = document.state.currentSpriteData?.sprites?.length ?? 0;
                        vscode.window.showWarningMessage(`Cannot paste: Invalid target index. Tried index: ${message.targetIndex}, Sprites available: ${count}`);
                    }
                    break;
                case 'copySprite':
                    if (currentState.currentSpriteData?.sprites && message.sourceIndex < currentState.currentSpriteData.sprites.length) {
                        const sourceSprite = currentState.currentSpriteData.sprites[message.sourceIndex];
                        this.copiedSpriteInfo = {
                            pixels: [...sourceSprite.pixels],
                            width: sourceSprite.width,
                            height: sourceSprite.height,
                            type: currentState.currentSpriteData.type
                        };
                        vscode.window.showInformationMessage(`Sprite ${message.sourceIndex} copied.`);
                    }
                    else { /* error handling */ }
                    break;
                case 'paletteEdit':
                    if (currentState.customPaletteHex && typeof message.index === 'number' && message.newHexColor) {
                        const { index, newHexColor, priority, skipDirtyNotification } = message; // Check for additional flags
                        console.log(`[paletteEdit] Index=${index}, newHexColor=${newHexColor}, priority=${priority}, skipDirty=${skipDirtyNotification || false}`);
                        // Ensure the index is within the 256-color limit
                        if (index < 0 || index >= 256) {
                            console.warn(`[paletteEdit] Invalid color index: ${index}`);
                            break;
                        }
                        // Extend the palette if needed (if modifying beyond current length)
                        while (currentState.customPaletteHex.length <= index) {
                            currentState.customPaletteHex.push({ hex: '#000000', priority: false });
                            console.log(`[paletteEdit] Extended palette to index ${currentState.customPaletteHex.length - 1}`);
                        }
                        // Now access the color entry safely
                        const currentEntry = currentState.customPaletteHex[index];
                        console.log(`[paletteEdit] Before: hex=${currentEntry.hex}, priority=${currentEntry.priority}`);
                        let changed = false;
                        // Check if hex exists and changed
                        if (newHexColor !== undefined && currentEntry.hex !== newHexColor) {
                            currentEntry.hex = newHexColor;
                            changed = true;
                        }
                        if (priority !== undefined && currentEntry.priority !== priority) {
                            console.log(`[paletteEdit] Changing priority from ${currentEntry.priority} to ${priority}`);
                            currentEntry.priority = priority;
                            changed = true;
                        }
                        console.log(`[paletteEdit] After: hex=${currentEntry.hex}, priority=${currentEntry.priority}, changed=${changed}`);
                        if (changed && !currentState.isDirty && !skipDirtyNotification) {
                            currentState.isDirty = true;
                            viewState.isDirty = true;
                            // TODO: Fire document change event for undo/redo
                            // this._onDidChangeCustomDocument.fire({ document: currentDocument ... });
                            // Palette edits currently don't trigger full redraws, 
                            // rely on webview updating its local state. Consider if needsPaletteUpdate=true here.
                        }
                    }
                    else {
                        console.warn("Invalid paletteEdit");
                    }
                    break;
                case 'updatePaletteOrder':
                    if (currentState.customPaletteHex && message.palette) {
                        // Verify the palette array doesn't exceed 256 colors
                        if (message.palette.length > 256) {
                            console.warn(`[Provider] Palette update rejected: palette has ${message.palette.length} colors, but maximum is 256.`);
                            break;
                        }
                        // Copy the palette array, preserving its size (which might have been expanded)
                        currentState.customPaletteHex = message.palette.map((p) => ({ ...p }));
                        if (!currentState.isDirty) {
                            currentState.isDirty = true;
                            viewState.isDirty = true;
                        }
                        needsPaletteUpdate = true;
                    }
                    else {
                        console.warn("[Provider] Invalid updatePaletteOrder message:", message);
                    }
                    break;
                case 'requestPaletteMerge':
                    if (!currentState.customPaletteHex) {
                        vscode.window.showWarningMessage("Cannot merge palette: No custom palette loaded.");
                        break;
                    }
                    if (typeof message.visiblePaletteSize !== 'number' || typeof message.startIndex !== 'number') {
                        console.warn("[Provider] Invalid parameters in requestPaletteMerge message:", message);
                        break;
                    }
                    try {
                        const visibleSizeToMerge = message.visiblePaletteSize;
                        const mergeStartIndex = message.startIndex;
                        const fileUri = await vscode.window.showOpenDialog({
                            canSelectFiles: true,
                            canSelectFolders: false,
                            canSelectMany: false,
                            filters: { 'Palette Files': ['pal', 'nxp'] },
                            title: `Select Palette to Merge ${visibleSizeToMerge} Colors Starting at Index ${mergeStartIndex}`
                        });
                        if (fileUri && fileUri[0]) {
                            const loadedPaletteData = await vscode.workspace.fs.readFile(fileUri[0]);
                            const loadedPalette = (0, paletteUtils_1.parsePaletteFile)(loadedPaletteData); // Explicitly type
                            const loadedPaletteName = path.basename(fileUri[0].fsPath);
                            console.log(`[Provider] Merging ${loadedPaletteName} into ${visibleSizeToMerge} colors of ${currentState.customPaletteName}, starting at index ${mergeStartIndex}`);
                            // Create a copy to modify
                            const mergedPalette = currentState.customPaletteHex.map(pc => ({ ...pc }));
                            const mergeCount = Math.min(visibleSizeToMerge, loadedPalette.length);
                            let actualMergedCount = 0; // Track how many colors actually get merged
                            for (let i = 0; i < mergeCount; i++) {
                                // Calculate target index 
                                const targetIndex = mergeStartIndex + i;
                                // Stop if we go past the end of the 256-color palette
                                if (targetIndex >= 256) {
                                    console.warn(`[Provider] Merge stopped at index 255. Attempted to merge ${mergeCount} colors.`);
                                    break; // Exit the loop
                                }
                                // Overwrite both hex and priority
                                // mergedPalette[targetIndex] = { ...loadedPalette[i] }; // Copy the loaded color object
                                mergedPalette[targetIndex] = Object.assign({}, loadedPalette[i]);
                                actualMergedCount++; // Increment count of successfully merged colors
                            }
                            // Update the actual state
                            currentState.customPaletteHex = mergedPalette;
                            currentState.isDirty = true; // Palette merge makes it dirty
                            needsPaletteUpdate = true; // Trigger UI update
                            vscode.window.showInformationMessage(`Merged ${actualMergedCount} colors from ${loadedPaletteName}.`);
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Failed to load or merge palette file: ' + error.message);
                    }
                    break;
                case 'paletteSwap': // Handle the new swap command
                    if (currentState.customPaletteHex &&
                        typeof message.indexA === 'number' &&
                        typeof message.indexB === 'number' &&
                        message.newColorA && message.newColorB) {
                        const { indexA, indexB } = message;
                        // Assume message.newColorA/B are now PaletteColor objects
                        // OR message still sends hex, and we preserve priority? Let's assume hex for now.
                        const newHexA = message.newColorA;
                        const newHexB = message.newColorB;
                        if (indexA < 0 || indexA >= 256 || indexB < 0 || indexB >= 256) {
                            console.warn("[Provider] Invalid indices in paletteSwap message: indices must be between 0-255.");
                            break;
                        }
                        // Extend the palette if needed
                        const maxIndex = Math.max(indexA, indexB);
                        while (currentState.customPaletteHex.length <= maxIndex) {
                            currentState.customPaletteHex.push({ hex: '#000000', priority: false });
                            console.log(`[paletteSwap] Extended palette to index ${currentState.customPaletteHex.length - 1}`);
                        }
                        // Swap the *entire* PaletteColor object
                        const tempColor = currentState.customPaletteHex[indexA];
                        currentState.customPaletteHex[indexA] = currentState.customPaletteHex[indexB];
                        currentState.customPaletteHex[indexB] = tempColor;
                        // Mark dirty (already done by webview, but good practice)
                        if (!currentState.isDirty) {
                            currentState.isDirty = true;
                            viewState.isDirty = true;
                        }
                        // Note: Pixel updates are handled by separate updateSpritePixels messages
                        console.log(`[Provider] Palette swap processed for indices ${indexA} <-> ${indexB}`);
                        // No need to send a palette update back immediately, 
                        // as the webview already has the correct state.
                    }
                    else {
                        console.warn("[Provider] Invalid paletteSwap message received:", message);
                    }
                    break;
                case 'savePalette':
                    if (currentState.customPaletteHex) {
                        await this.saveCustomPalette(currentDocument);
                    }
                    else { /* warn */ }
                    break;
                case 'promptEditDefaultPalette':
                    {
                        const loadOption = "Load Palette";
                        const saveAsOption = "Save As...";
                        const choice = await vscode.window.showWarningMessage("The default palette cannot be edited directly. Would you like to load a custom palette or save the default palette to a new file first?", loadOption, saveAsOption);
                        if (choice === loadOption) {
                            // Replicate Load Palette logic
                            try {
                                const fileUri = await vscode.window.showOpenDialog({
                                    canSelectFiles: true,
                                    canSelectFolders: false,
                                    canSelectMany: false,
                                    filters: { 'Palette Files': ['pal', 'nxp'] },
                                    title: 'Select a palette file to load'
                                });
                                if (fileUri && fileUri[0]) {
                                    const paletteData = await vscode.workspace.fs.readFile(fileUri[0]);
                                    currentState.customPaletteHex = (0, paletteUtils_1.parsePaletteFile)(paletteData);
                                    currentState.customPaletteName = path.basename(fileUri[0].fsPath);
                                    vscode.window.showInformationMessage(`Palette loaded: ${currentState.customPaletteName}`);
                                    needsPaletteUpdate = true;
                                }
                            }
                            catch (error) {
                                vscode.window.showErrorMessage('Failed to load palette file: ' + error.message);
                            }
                        }
                        else if (choice === saveAsOption) {
                            // Replicate Save Palette logic, but saving the *default* palette
                            try {
                                const saveUri = await vscode.window.showSaveDialog({
                                    filters: { 'Next Palette Files': ['nxp'] }, // Prefer .nxp for saving
                                    title: 'Save Default Palette As'
                                });
                                if (saveUri) {
                                    const encodedPalette = (0, paletteUtils_1.encodePaletteFile)(this.defaultPalette); // Encode default
                                    await vscode.workspace.fs.writeFile(saveUri, encodedPalette);
                                    const newPaletteName = path.basename(saveUri.fsPath);
                                    vscode.window.showInformationMessage(`Default palette saved as: ${newPaletteName}`);
                                    // Now make this the active custom palette
                                    currentState.customPaletteHex = this.defaultPalette.map(pc => ({ ...pc })); // Deep copy
                                    currentState.customPaletteName = newPaletteName;
                                    needsPaletteUpdate = true;
                                    // Mark document dirty? Editing palette doesn't usually mark sprite dirty
                                    // but creating a custom one this way might imply a change worth saving?
                                    // Let's skip marking dirty for now.
                                }
                            }
                            catch (error) {
                                vscode.window.showErrorMessage('Failed to save default palette: ' + error.message);
                            }
                        }
                    }
                    break;
                case 'saveChanges':
                    // console.warn("'saveChanges' message received, but save should be triggered via VS Code save action.");
                    // Trigger the actual save logic for the associated document
                    if (currentDocument) {
                        // console.log(`[SpriteProvider] Received saveChanges request for ${currentDocument.uri.fsPath}`);
                        try {
                            // Create a simple cancellation token
                            const cts = new vscode.CancellationTokenSource();
                            await this.saveCustomDocument(currentDocument, cts.token);
                            // saveCustomDocument will post 'changesSaved' back to the webview on success
                        }
                        catch (error) {
                            // Error is already handled and shown by saveCustomDocument
                            console.error(`[SpriteProvider] Error during saveChanges triggered by webview:`, error);
                        }
                    }
                    else {
                        console.error("[SpriteProvider] saveChanges message received but no document found.");
                    }
                    break;
                case 'markDirty':
                    // Always update internal state
                    currentState.isDirty = true;
                    viewState.isDirty = true;
                    // Always fire the event to notify VS Code UI
                    this._onDidChangeCustomDocument.fire({
                        document: currentDocument,
                        undo: () => { },
                        redo: () => { }
                    });
                    break;
                case 'reloadData':
                    try {
                        // Read the file directly instead of using the more complex revert method
                        const fileData = await vscode.workspace.fs.readFile(document.uri);
                        currentState.initialFileData = fileData;
                        currentState.isDirty = false;
                        // Use existing mode if possible, default to sprite8
                        const currentMode = viewState?.mode || 'sprite8';
                        // Parse the data with current mode
                        // Make sure viewState is passed correctly
                        const viewStateForParse = viewState || { mode: 'sprite8', paletteOffset: 0, scale: 3, showGrid: true, currentSprite: 0, isDirty: false };
                        this.parseAndUpdateSpriteData(currentDocument, viewStateForParse);
                        // Send data update rather than recreating the entire webview
                        needsDataUpdate = true;
                        needsStateUpdate = true; // Send view state too, as currentSprite might need reset
                        // Reset current sprite index if it's out of bounds after reload
                        if (currentState.currentSpriteData && viewStateForParse.currentSprite >= currentState.currentSpriteData.count) {
                            viewStateForParse.currentSprite = Math.max(0, currentState.currentSpriteData.count - 1);
                        }
                        vscode.window.showInformationMessage("Sprite data reloaded.");
                    }
                    catch (error) {
                        console.error("[Provider] Error reloading data:", error);
                        vscode.window.showErrorMessage("Failed to reload sprite data: " + error.message);
                        // Ensure update message is NOT sent on error
                        needsDataUpdate = false;
                        needsStateUpdate = false;
                    }
                    break;
                case 'showColorOutOfBankWarning':
                    {
                        const { selectedColorIndex, paletteOffset, mode } = message;
                        const requiredOffsetBank = Math.floor(selectedColorIndex / 16);
                        vscode.window.showWarningMessage(`To use colour ${selectedColorIndex}, change palette offset to ${requiredOffsetBank}.`);
                    }
                    break;
                case 'addNewSprite':
                    // console.log(`[Provider] Received addNewSprite request.`);
                    if (currentState.currentSpriteData) {
                        const data = currentState.currentSpriteData;
                        const width = data.width;
                        const height = data.height;
                        const pixelCount = width * height;
                        const newSprite = {
                            index: data.count, // Index will be the current count
                            pixels: new Array(pixelCount).fill(0), // Fill with transparent/index 0
                            width: width,
                            height: height
                        };
                        data.sprites.push(newSprite);
                        data.count++;
                        // Mark dirty (already done by webview, but good practice)
                        if (!currentState.isDirty) {
                            currentState.isDirty = true;
                            viewState.isDirty = true;
                        }
                        ;
                        // Tell webview to mark as dirty (this makes the save button red)
                        // this.postMessageToWebview(webviewPanel, { command: 'markAsWebviewDirty' });
                        needsDataUpdate = true; // Need to send the updated sprite data
                        needsStateUpdate = true; // Also send state in case count changed view
                        vscode.window.showInformationMessage(`Added new sprite #${newSprite.index}`);
                    }
                    else {
                        vscode.window.showErrorMessage("Cannot add sprite: Sprite data not loaded.");
                    }
                    break;
                case 'insertSprite':
                    if (currentState.currentSpriteData &&
                        typeof message.insertIndex === 'number' &&
                        message.insertIndex >= 0 &&
                        message.insertIndex < currentState.currentSpriteData.count) {
                        const currentSprite = currentState.currentSpriteData.sprites[message.targetIndex];
                        const data = currentState.currentSpriteData;
                        const width = data.width;
                        const height = data.height;
                        const pixelCount = width * height;
                        const insertIndex = message.insertIndex;
                        // Create a new blank sprite
                        const newSprite = {
                            index: insertIndex, // Will be shifted below
                            pixels: new Array(pixelCount).fill(0), // Fill with transparent/index 0
                            width: width,
                            height: height
                        };
                        // Insert at the specified position
                        data.sprites.splice(insertIndex, 0, newSprite);
                        data.count++;
                        // Re-index all sprites after the insertion point
                        for (let i = insertIndex + 1; i < data.count; i++) {
                            data.sprites[i].index = i;
                        }
                        // Mark as dirty
                        if (!currentState.isDirty) {
                            currentState.isDirty = true;
                            viewState.isDirty = true;
                        }
                        currentState.currentSpriteData.sprites[insertIndex] = newSprite;
                        // Tell webview to mark as dirty
                        //                        this.postMessageToWebview(webviewPanel, { command: 'markAsWebviewDirty' });
                        needsDataUpdate = true;
                        needsStateUpdate = true;
                        vscode.window.showInformationMessage(`Inserted new sprite at position ${insertIndex}`);
                    }
                    else {
                        vscode.window.showErrorMessage("Cannot insert sprite: Invalid index or sprite data not loaded.");
                    }
                    break;
                case 'removeSprite':
                    // console.log(`[Provider] Received removeSprite request for index ${message.index}`);
                    if (currentState.currentSpriteData &&
                        typeof message.index === 'number' &&
                        message.index >= 0 &&
                        message.index < currentState.currentSpriteData.count) {
                        const removedIndex = message.index;
                        currentState.currentSpriteData.sprites.splice(removedIndex, 1);
                        currentState.currentSpriteData.count--;
                        // Re-index subsequent sprites
                        for (let i = removedIndex; i < currentState.currentSpriteData.count; i++) {
                            currentState.currentSpriteData.sprites[i].index = i;
                        }
                        // Adjust current selection if necessary
                        if (viewState.currentSprite >= currentState.currentSpriteData.count) {
                            viewState.currentSprite = Math.max(0, currentState.currentSpriteData.count - 1);
                        }
                        currentState.isDirty = true;
                        // Notify VS Code - provide basic undo/redo stubs
                        this._onDidChangeCustomDocument.fire({
                            document: currentDocument,
                            undo: () => { },
                            redo: () => { }
                        });
                        // Tell webview to mark as dirty (this makes the save button red)
                        //                       this.postMessageToWebview(webviewPanel, { command: 'markAsWebviewDirty' });
                        needsDataUpdate = true; // Need to send the updated sprite data
                        needsStateUpdate = true; // Also send state in case currentSprite changed
                        vscode.window.showInformationMessage(`Removed sprite #${removedIndex}`);
                    }
                    else {
                        console.error("Invalid index for removeSprite:", message.index, "Count:", currentState.currentSpriteData?.count);
                        vscode.window.showErrorMessage("Cannot remove sprite: Invalid index.");
                    }
                    break;
                case 'requestFullSpriteData': // <<< NEW HANDLER
                    console.log(`[Provider] Received requestFullSpriteData for ${currentDocument.uri.fsPath}`);
                    if (currentState.currentSpriteData) {
                        this.postMessageToWebview(webviewPanel, {
                            command: 'fullSpriteData',
                            spriteData: currentState.currentSpriteData
                        });
                        console.log(`[Provider] Sent fullSpriteData in response to request.`);
                    }
                    else {
                        console.error(`[Provider] Cannot send fullSpriteData, data not loaded for ${currentDocument.uri.fsPath}`);
                        // Optionally send an error back to the webview
                    }
                    break;
                case 'reorderSprites':
                    console.log(`[Provider] Received reorderSprites request: source=${message.sourceIndex}, target=${message.targetIndex}`);
                    if (currentState.currentSpriteData &&
                        typeof message.sourceIndex === 'number' &&
                        typeof message.targetIndex === 'number') {
                        const sprites = currentState.currentSpriteData.sprites;
                        const sourceIndex = message.sourceIndex;
                        let targetIndex = message.targetIndex;
                        // Validate indices
                        if (sourceIndex < 0 || sourceIndex >= sprites.length) {
                            console.error(`[Provider reorderSprites] Invalid source index: ${sourceIndex}`);
                            break;
                        }
                        // Target index can be equal to length (move to end)
                        if (targetIndex < 0 || targetIndex > sprites.length) {
                            console.error(`[Provider reorderSprites] Invalid target index: ${targetIndex}`);
                            break;
                        }
                        if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
                            console.log(`[Provider reorderSprites] No change needed (source: ${sourceIndex}, target: ${targetIndex})`);
                            break; // No actual move needed
                        }
                        // Perform the reordering
                        const [movedSprite] = sprites.splice(sourceIndex, 1);
                        // Adjust target index if source was before target
                        const effectiveTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                        sprites.splice(effectiveTargetIndex, 0, movedSprite);
                        // Re-index all sprites
                        sprites.forEach((sprite, newIdx) => {
                            sprite.index = newIdx;
                        });
                        // Update count (shouldn't change, but good practice)
                        currentState.currentSpriteData.count = sprites.length;
                        // Mark as dirty
                        if (!currentState.isDirty) {
                            currentState.isDirty = true;
                            viewState.isDirty = true; // Keep view state in sync
                            // Notify VS Code
                            this._onDidChangeCustomDocument.fire({
                                document: currentDocument,
                                undo: () => { },
                                redo: () => { }
                            });
                        }
                        // Adjust current selection if necessary
                        if (viewState.currentSprite === sourceIndex) {
                            // If the moved sprite was selected, update selection to its new index
                            viewState.currentSprite = effectiveTargetIndex;
                        }
                        else {
                            // If another sprite was selected, find its new index if it was affected
                            if (sourceIndex < viewState.currentSprite && effectiveTargetIndex >= viewState.currentSprite) {
                                viewState.currentSprite--; // Moved item from before selection to after/at selection
                            }
                            else if (sourceIndex > viewState.currentSprite && effectiveTargetIndex <= viewState.currentSprite) {
                                viewState.currentSprite++; // Moved item from after selection to before/at selection
                            }
                            // else selection index remains the same
                        }
                        // Tell webview to mark as dirty (this makes the save button red)
                        // No, the full update will handle this
                        // this.postMessageToWebview(webviewPanel, { command: 'markAsWebviewDirty' });
                        needsDataUpdate = true; // Need to send the updated sprite data
                        needsStateUpdate = true; // Also send state in case currentSprite changed
                        console.log(`[Provider] Sprites reordered. New order (indices): ${sprites.map(s => s.index).join(', ')}. Selected sprite: ${viewState.currentSprite}`);
                    }
                    else {
                        console.error("[Provider] Invalid reorderSprites message or data.");
                    }
                    break;
                case 'analyzeDuplicates':
                    // Check if we have a valid document
                    if (currentDocument) {
                        await this.analyzeDuplicates(currentDocument);
                    }
                    else {
                        vscode.window.showErrorMessage('Could not analyze duplicates: No document found.');
                    }
                    break;
                case 'showInfoMessage':
                    if (message.message) {
                        vscode.window.showInformationMessage(message.message);
                    }
                    break;
                case 'showConfirmDialog':
                    if (message.message && message.uniqueColors) {
                        // Handle palette reduction dialog
                        const result = await vscode.window.showInformationMessage(message.message, { modal: true }, 'Yes', 'No');
                        if (result === 'Yes') {
                            // User wants to reduce the palette
                            console.log(`[Provider] Reducing palette to ${message.uniqueColors.length} colors`);
                            // Create a reduced palette with only the colors used in sprites
                            if (currentState.customPaletteHex) {
                                // Create a mapping from old color indices to new color indices
                                const colorIndexMap = new Map();
                                const uniqueColors = message.uniqueColors;
                                // Build the new reduced palette
                                const reducedPalette = uniqueColors.map((colorIndex, newIndex) => {
                                    // Map old index to new index position
                                    colorIndexMap.set(colorIndex, newIndex);
                                    // Use the existing color if available, otherwise use a default
                                    if (colorIndex < currentState.customPaletteHex.length) {
                                        return currentState.customPaletteHex[colorIndex];
                                    }
                                    else {
                                        return { hex: '#000000', priority: false };
                                    }
                                });
                                // Update all sprite pixels to use the new color indices
                                if (currentState.currentSpriteData && currentState.currentSpriteData.sprites) {
                                    // Process each sprite
                                    currentState.currentSpriteData.sprites.forEach(sprite => {
                                        if (sprite && sprite.pixels) {
                                            // Update each pixel's color index
                                            for (let i = 0; i < sprite.pixels.length; i++) {
                                                const oldColorIndex = sprite.pixels[i];
                                                let actualColorIndex = oldColorIndex;
                                                // For 4-bit sprites, adjust for palette offset to get the true color index
                                                if (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') {
                                                    actualColorIndex = viewState.paletteOffset + oldColorIndex;
                                                }
                                                // Look up the new index in our mapping
                                                if (colorIndexMap.has(actualColorIndex)) {
                                                    const newColorIndex = colorIndexMap.get(actualColorIndex);
                                                    // For 4-bit sprites, we need to store values 0-15 (relative to offset)
                                                    if (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') {
                                                        // This is a bit tricky since we're compressing to only used colors
                                                        // The right approach is to set palette offset to 0 when reducing
                                                        sprite.pixels[i] = newColorIndex;
                                                        // Also update the view state offset to match our new palette
                                                        viewState.paletteOffset = 0;
                                                    }
                                                    else {
                                                        // For 8-bit sprites, just use the new index directly
                                                        sprite.pixels[i] = newColorIndex;
                                                    }
                                                }
                                                // If color isn't in the map, leave it unchanged (shouldn't happen)
                                            }
                                        }
                                    });
                                }
                                // Update the custom palette
                                currentState.customPaletteHex = reducedPalette;
                                currentState.isDirty = true;
                                viewState.isDirty = true;
                                // Send the updated palette and sprite data to the webview
                                needsPaletteUpdate = true;
                                needsDataUpdate = true;
                                needsStateUpdate = true;
                                vscode.window.showInformationMessage(`Palette reduced to ${reducedPalette.length} colors. Sprite color indices have been updated. Save to keep these changes.`);
                                // Ask if user wants to save the reduced palette
                                const saveResult = await vscode.window.showInformationMessage('Do you want to save the reduced palette?', 'Yes', 'No');
                                if (saveResult === 'Yes') {
                                    await this.saveCustomPalette(document);
                                }
                            }
                            else {
                                // Using default palette, create a new custom palette with used colors
                                // Get the default palette from colorUtils.js
                                const defaultPalette = this.getDefaultPalette();
                                // Create a mapping from old color indices to new color indices
                                const colorIndexMap = new Map();
                                const uniqueColors = message.uniqueColors;
                                // Build the new reduced palette
                                const reducedPalette = uniqueColors.map((colorIndex, newIndex) => {
                                    // Map old index to new index position
                                    colorIndexMap.set(colorIndex, newIndex);
                                    // Use the default color if available, otherwise use black
                                    if (colorIndex < defaultPalette.length) {
                                        return {
                                            hex: defaultPalette[colorIndex].hex,
                                            priority: defaultPalette[colorIndex].priority
                                        };
                                    }
                                    else {
                                        return { hex: '#000000', priority: false };
                                    }
                                });
                                // Update all sprite pixels to use the new color indices
                                if (currentState.currentSpriteData && currentState.currentSpriteData.sprites) {
                                    // Process each sprite
                                    currentState.currentSpriteData.sprites.forEach(sprite => {
                                        if (sprite && sprite.pixels) {
                                            // Update each pixel's color index
                                            for (let i = 0; i < sprite.pixels.length; i++) {
                                                const oldColorIndex = sprite.pixels[i];
                                                let actualColorIndex = oldColorIndex;
                                                // For 4-bit sprites, adjust for palette offset to get the true color index
                                                if (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') {
                                                    actualColorIndex = viewState.paletteOffset + oldColorIndex;
                                                }
                                                // Look up the new index in our mapping
                                                if (colorIndexMap.has(actualColorIndex)) {
                                                    const newColorIndex = colorIndexMap.get(actualColorIndex);
                                                    // For 4-bit sprites, we need to store values 0-15 (relative to offset)
                                                    if (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') {
                                                        // Set palette offset to 0 when reducing
                                                        sprite.pixels[i] = newColorIndex;
                                                        // Also update the view state offset to match our new palette
                                                        viewState.paletteOffset = 0;
                                                    }
                                                    else {
                                                        // For 8-bit sprites, just use the new index directly
                                                        sprite.pixels[i] = newColorIndex;
                                                    }
                                                }
                                                // If color isn't in the map, leave it unchanged (shouldn't happen)
                                            }
                                        }
                                    });
                                }
                                // Set the custom palette
                                currentState.customPaletteHex = reducedPalette;
                                currentState.customPaletteName = 'reduced_palette.nxp';
                                currentState.isDirty = true;
                                viewState.isDirty = true;
                                // Send the updated palette and sprite data to the webview
                                needsPaletteUpdate = true;
                                needsDataUpdate = true;
                                needsStateUpdate = true;
                                vscode.window.showInformationMessage(`Created custom palette with ${reducedPalette.length} colors from default palette. Sprite color indices have been updated. Save to keep these changes.`);
                                // Ask if user wants to save the new palette
                                const saveResult = await vscode.window.showInformationMessage('Do you want to save the new reduced palette?', 'Yes', 'No');
                                if (saveResult === 'Yes') {
                                    await this.saveCustomPalette(document);
                                }
                            }
                        }
                    }
                    break;
                case 'changeSpriteBrush': // New handler for sprite brush changes
                    if (message.brush && typeof message.brush.width === 'number' && typeof message.brush.height === 'number') {
                        if (viewState.spriteBrush.width !== message.brush.width || viewState.spriteBrush.height !== message.brush.height) {
                            viewState.spriteBrush = { width: message.brush.width, height: message.brush.height };
                            console.log(`[Provider] Sprite brush changed to: ${viewState.spriteBrush.width}x${viewState.spriteBrush.height}`);
                            // This primarily affects UI interactions handled by the webview.
                            // Send an update to the webview so it knows the current brush.
                            // The toolbar will be updated on next full HTML refresh if mode changes,
                            // but for immediate feedback of the brush change without full reload:
                            this.postMessageToWebview(webviewPanel, {
                                command: 'update',
                                viewState: viewState // Send the updated viewState
                            });
                            // No need to set needsStateUpdate = true if we directly post an update for viewState.
                            // However, if other logic relies on needsStateUpdate, it could be set.
                            // For now, direct post is fine.
                        }
                    }
                    else {
                        console.warn('[Provider] Invalid changeSpriteBrush message:', message);
                    }
                    break;
                default:
                    console.warn("Unknown message command received:", message.command);
            }
            // Send updates back to webview
            if (needsDataUpdate || needsStateUpdate || needsPaletteUpdate) {
                // Ensure viewState being sent reflects the latest dirty status
                if (currentState.isDirty) {
                    viewState.isDirty = true;
                }
                const updatePayload = { command: 'update' };
                if (needsStateUpdate) {
                    updatePayload.viewState = viewState;
                    // console.log(`[Provider] Sending viewState update:`, viewState); 
                }
                if (needsDataUpdate) {
                    updatePayload.spriteData = currentState.currentSpriteData;
                    // console.log(`[Provider] Sending spriteData update.`); 
                }
                if (needsPaletteUpdate) {
                    updatePayload.palette = currentState.customPaletteHex;
                    updatePayload.paletteName = currentState.customPaletteName;
                    // console.log(`[Provider] Sending palette update (structure: {hex, priority}[]).`); 
                }
                this.postMessageToWebview(webviewPanel, updatePayload);
            }
        });
        webviewPanel.onDidDispose(() => {
            // console.log("[SpriteProvider] Disposing webview for:", document.uri.toString());
            this.webviews.delete(document.uri.toString());
            // Don't delete document from this.documents here, VS Code manages document lifetime
        }, null, this.context.subscriptions);
    }
    // --- Implement Required Save/Backup/Revert Methods --- 
    async saveCustomDocument(document, cancellation) {
        // console.log(`[SpriteProvider] saveCustomDocument: ${document.uri.fsPath}`);
        const encodedData = document.documentData; // Get potentially re-encoded data
        const docState = document.state;
        try {
            await vscode.workspace.fs.writeFile(document.uri, encodedData);
            docState.isDirty = false; // Sets internal state to clean
            // Add confirmation message
            vscode.window.showInformationMessage(`Sprite file saved: ${path.basename(document.uri.fsPath)}`);
            // Find the corresponding webview and update its state if open
            const panel = this.webviews.get(document.uri.toString());
            if (panel) {
                this.postMessageToWebview(panel, { command: 'changesSaved' }); // Notify webview
            }
        }
        catch (error) {
            console.error("Error saving sprite document:", error);
            vscode.window.showErrorMessage("Failed to save sprite file: " + error.message);
            throw error; // Re-throw to indicate failure
        }
    }
    async saveCustomDocumentAs(document, destination, cancellation) {
        // console.log(`[SpriteProvider] saveCustomDocumentAs: ${document.uri.fsPath} to ${destination.fsPath}`);
        const dataToSave = document.documentData;
        const docState = document.state;
        try {
            await vscode.workspace.fs.writeFile(destination, dataToSave);
            docState.isDirty = false; // Mark original as clean after Save As?
            // VS Code handles opening the new document, we might not need to do anything here
            // Or maybe update the original webview?
            const panel = this.webviews.get(document.uri.toString());
            if (panel) {
                this.postMessageToWebview(panel, { command: 'changesSaved' });
            }
        }
        catch (error) {
            console.error("Error saving sprite document as:", error);
            vscode.window.showErrorMessage("Failed to save sprite file as: " + error.message);
            throw error; // Re-throw to indicate failure
        }
    }
    async revertCustomDocument(document, cancellation) {
        console.log(`[SpriteProvider] revertCustomDocument: ${document.uri.fsPath}`);
        try {
            // Check for cancellation before doing the heavy work
            if (cancellation.isCancellationRequested) {
                console.log("[SpriteProvider] Revert operation was cancelled");
                return;
            }
            const fileData = await vscode.workspace.fs.readFile(document.uri);
            const docState = document.state;
            docState.initialFileData = fileData; // Update initial data reference
            docState.isDirty = false;
            // Check again for cancellation before parsing data
            if (cancellation.isCancellationRequested) {
                console.log("[SpriteProvider] Revert operation was cancelled after file read");
                return;
            }
            // Create a view state with default values
            // Don't try to preserve previous values - it causes race conditions
            const defaultViewState = {
                mode: 'sprite8',
                paletteOffset: 0,
                scale: 3,
                showGrid: true,
                currentSprite: 0,
                isDirty: false,
                spriteBrush: { width: 1, height: 1 } // Reset to default
            };
            // Use try-catch block specifically for parsing
            try {
                this.parseAndUpdateSpriteData(document, defaultViewState); // Update document state
            }
            catch (parseError) {
                const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                console.error("[SpriteProvider] Error parsing sprite data during revert:", parseError);
                vscode.window.showErrorMessage(`Failed to parse sprite data: ${errorMessage}`);
                return; // Exit early on parse error
            }
            // Final cancellation check before UI update
            if (cancellation.isCancellationRequested) {
                console.log("[SpriteProvider] Revert operation was cancelled after parsing");
                return;
            }
            // Refresh the webview if it's open
            const panel = this.webviews.get(document.uri.toString());
            if (panel) {
                // Prepare the initial state for sending to the webview
                const initialState = {
                    spriteData: docState.currentSpriteData,
                    viewState: defaultViewState,
                    palette: docState.customPaletteHex ?? this.defaultPalette,
                    isCustomPaletteMode: docState.customPaletteHex !== null,
                    defaultPalette: this.defaultPalette,
                    paletteName: docState.customPaletteName
                };
                // First update the HTML content
                await this.updateWebviewContent(document, panel, defaultViewState);
                // Then send the initialize message to refresh the client state
                console.log("[SpriteProvider] Sending initialize message after revert");
                this.postMessageToWebview(panel, {
                    command: 'initialize',
                    initialState: initialState
                });
            }
            console.log("[SpriteProvider] Document reverted successfully");
            // No need to fire _onDidChangeCustomDocument here, VS Code handles revert status
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[SpriteProvider] Error reverting document:", error);
            vscode.window.showErrorMessage(`Failed to reload sprite data: ${errorMessage}`);
        }
    }
    async backupCustomDocument(document, context, cancellation) {
        // console.log(`[SpriteProvider] backupCustomDocument: ${document.uri.fsPath} to ${context.destination.fsPath}`);
        const dataToBackup = document.documentData;
        await vscode.workspace.fs.writeFile(context.destination, dataToBackup);
        return { id: context.destination.toString(), delete: async () => {
                try {
                    await vscode.workspace.fs.delete(context.destination);
                }
                catch (e) { /* ignore */ }
            } };
    }
    // --- Existing Methods Refactored --- 
    async updateWebviewContent(document, // Use document
    webviewPanel, viewState) {
        const docState = document.state;
        if (!docState.currentSpriteData) {
            // Attempt to parse if null (e.g., after revert or initial open failure)
            this.parseAndUpdateSpriteData(document, viewState);
            if (!docState.currentSpriteData) {
                webviewPanel.webview.html = this.getErrorHtml("Sprite data not parsed or invalid after attempt.");
                return;
            }
        }
        const webview = webviewPanel.webview;
        const filePath = document.uri.fsPath;
        const fileName = path.basename(filePath);
        // --- Prepare the SMALL initial state for embedding ---
        const smallInitialState = {
            // Exclude spriteData
            palette: docState.customPaletteHex ?? this.defaultPalette,
            isCustomPaletteMode: docState.customPaletteHex !== null,
            viewState: viewState, // This now includes spriteBrush
            defaultPalette: this.defaultPalette,
            paletteName: docState.customPaletteName
        };
        // --- Stringify and log the SMALL state ---
        let initialStateJson = '';
        let stringifyError = null;
        console.log("[Provider updateWebviewContent] Preparing to stringify smallInitialState...");
        try {
            initialStateJson = JSON.stringify(smallInitialState);
        }
        catch (error) {
            stringifyError = error;
            console.error("[Provider updateWebviewContent] Error during JSON.stringify:", error);
        }
        console.log(`[Provider updateWebviewContent] Finished stringify. JSON length: ${initialStateJson.length}. Error: ${stringifyError}`);
        if (stringifyError) {
            webviewPanel.webview.html = this.getErrorHtml(`Failed to serialize initial state: ${stringifyError}`);
            return;
        }
        // --- Create the script tag with the SMALL stringified state ---
        let initialStateScript = '';
        const nonce = this.getNonce(); // Generate nonce once
        try {
            const escapedJson = initialStateJson
                .replace(/</g, "\\\\u003c") // Ensure proper escaping
                .replace(/>/g, "\\\\u003e")
                .replace(/&/g, "\\\\u0026");
            initialStateScript = `<script nonce="${nonce}">window.initialData = ${escapedJson};</script>`; // <<< REMOVED \n
        }
        catch (error) {
            console.error("[SpriteProvider] Failed to escape initialState JSON:", error);
            initialStateScript = `<script nonce="${nonce}">console.error("Failed to load initial state.");</script>`;
        }
        // --- Restore HTML Generation (moved here for clarity) ---
        const htmlTemplateUri = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'spriteViewer.html');
        let htmlContent = await vscode.workspace.fs.readFile(htmlTemplateUri).then(buffer => buffer.toString());
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'spriteViewer.js'));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'spriteViewer.css'));
        const fileInfoHtml = `${fileName} - ${docState.currentSpriteData.description ?? 'N/A'}`;
        const toolbarHtml = await generateToolbarHtml(this.context, viewState, docState.customPaletteName || '', docState.customPaletteHex !== null);
        // --- Restore static HTML structure generation --- 
        // We need the container elements to exist for the JS to populate
        const spritesGridHtml = `<div class="sprites-grid ${viewState.showGrid ? 'show-sprite-borders' : ''}">
                                    <!-- Sprites rendered by JS -->
                                </div>`;
        const palettePickerHtml = `<div id="palettePicker">
                                      <!-- Palette swatches rendered by JS -->
                                   </div>`;
        // --- Inlined Transform Button Generation ---
        let transformButtonsHtml = '';
        const transforms = [
            { id: 'flipH', icon: 'flip_horizontal.svg', title: 'Flip Horizontal' },
            { id: 'flipV', icon: 'flip_vertical.svg', title: 'Flip Vertical' },
            { id: 'rotateLeft', icon: 'rotate_left.svg', title: 'Rotate Left' },
            { id: 'rotateRight', icon: 'rotate_right.svg', title: 'Rotate Right' },
            { id: 'scrollL', icon: 'shift_left.svg', title: 'Shift Left' },
            { id: 'scrollR', icon: 'shift_right.svg', title: 'Shift Right' },
            { id: 'scrollU', icon: 'shift_up.svg', title: 'Shift Up' },
            { id: 'scrollD', icon: 'shift_down.svg', title: 'Shift Down' },
            { id: 'clear', icon: 'clear.svg', title: 'Clear Sprite' },
            { id: 'fill', icon: 'paint-bucket.svg', title: 'Fill (Toggle)' }
        ];
        transformButtonsHtml = transforms.map(t => {
            const webviewIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icons', t.icon));
            return `<button class="transform-button" title="${t.title}" data-action="${t.id}">
                <img src="${webviewIconUri}" alt="${t.title}">
             </button>`;
        }).join('');
        // --- End Inlined Transform Button Generation ---
        const spriteDetailHtml = `
            <h2>Sprite <span id="detailSpriteIndex">${viewState.currentSprite}</span> Detail (<span id="detailSpriteCount">${docState.currentSpriteData.count}</span> total)</h2>
            <div class="detail-area"> 
                <div class="sprite-editor-panel">
                    <div class="editor-sprite-grid-area"> 
                        <div class="detail-container" style="grid-template-columns: repeat(${docState.currentSpriteData.width}, 1fr);">
                            <!-- Pixels rendered by JS -->
                        </div>
                       
                    </div>
                </div>
                <div 
                    <div class="editor-palette-controls"> 
                        <div class="palette-picker-layout"> 
                            <div class="selected-colors-area">
                                <div class="selected-color-display" id="primaryDisplay">
                                    <div class="label">L</div>
                                    <div class="preview-box" id="primaryPreviewBox"></div>
                                    <div class="index-value">Index: <span id="primaryColorIndex">0</span></div>
                                    <div class="hex-value" id="primaryHexValue">#000000</div>
                                </div>
                                <div class="selected-color-display" id="secondaryDisplay">
                                    <div class="label">R</div>
                                    <div class="preview-box" id="secondaryPreviewBox"></div>
                                    <div class="index-value">Index: <span id="secondaryColorIndex">0</span></div>
                                    <div class="hex-value" id="secondaryHexValue">#000000</div>
                                </div>
                                <div class="color-picker-control">
                                    <label for="colorPickerInput" style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: 500;">Edit Color:</label>
                                    <input type="color" id="colorPickerInput" value="#000000">
                                    <div class="primary-color-details">
                                         <div class="rgb9-display">
                                            <span>R9:<span id="primaryR9Value">0</span></span>
                                            <span>G9:<span id="primaryG9Value">0</span></span>
                                            <span>B9:<span id="primaryB9Value">0</span></span>
                                        </div>
                                        <div class="priority-control">
                                            <input type="checkbox" id="primaryPriorityFlag" title="Set high priority flag for this color">
                                            <label for="primaryPriorityFlag">Priority</label>
                                        </div>
                                    </div>
                                </div>
                             </div>
                            <div id="palettePicker" style="width: 90%; margin: 0 auto;">
                                 ${palettePickerHtml} <!-- Palette swatches rendered by JS -->
                             </div>
                        </div>
                        <span>
                        <div class="fill-mode-indicator">Fill Mode Active</div>
                        <div class="hover-info-container" style="width: 100%;">
                            <div id="hoverInfoContainer" style="display: flex; margin-top: 10px; padding: 8px 12px; background-color: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-editorWidget-border, transparent); border-radius: 4px; font-size: 11px; min-height: 20px; color: var(--vscode-editorWidget-foreground);">
                                <div>
                                    <div id="hoverPreviewBox" style="background-color: transparent; width: 16px; height: 16px; border: 1px solid var(--vscode-inputOption-activeBorder); flex-shrink: 0;"></div>
                                    <span><strong>Index:</strong> <span id="hoverRawValue">--</span></span>
                                    <span><strong>Palette:</strong> <span id="hoverPaletteIndex">--</span></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span>%<span id="hoverByte1">--</span>,%<span id="hoverByte2">--</span></span>
                                    <span><span id="hoverHexValue">--</span></span>
                                </div>
                            </div>
                        </div>
                        <div id="transformControls">
                             ${transformButtonsHtml} 
                        </div>
                        </span>

                          <span>
                          <div class="picker-controls" style="width: 67%; margin-left: auto; margin-top: 0px;">
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
                          </span>

                          <div class="palette-size-control-container">
                             <div class="palette-size-control" style="margin-top: 10px; text-align: right;">
                                 <label for="paletteSizeSelect" style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: 500;">Visible Colors:</label>
                                 <select id="paletteSizeSelect" style="width: 30%; padding: 3px 6px;">
                                     <option value="8">First 8</option>
                                     <option value="16">First 16</option>
                                     <option value="32">First 32</option>
                                     <option value="64">First 64</option>
                                     <option value="128">First 128</option>
                                     <option value="256" selected>All 256</option>
                                 </select>
                             </div>
                          </div>

                     </div>
                </div>
            </div>
            
            <div class="detail-info">
                 <!-- Detail Info updated by JS -->
             </div>
        `;
        const footerHtml = `<!-- Footer updated by JS -->`;
        const helpContentHtml = `
            <h3>Mouse Controls</h3>
            <div class="shortcuts">
                <div>
                    <ul>
                        <li><b>Left Click</b> on palette: Select primary color</li>
                        <li><b>Right Click</b> on palette: Select secondary color</li>
                        <li><b>CTRL + Right Click</b> on palette: Pick up color for copying</li>
                        <li><b>CTRL + Right Drag</b> from one color to another: Copy color</li>
                        <li><b>CTRL + Left Click + Drag</b> from one color to another: Swap colors and pixel data</li>
                        <li><b>Left/Right Click</b> on sprite: Draw with primary/secondary color</li>
                        <li><b>Alt + Click</b> on sprite: Pick color (eyedropper)</li>
                        <li><b>C + Click</b> on sprite: Replace all pixels of that color with primary color</li>
                        <li><b>Drag & Drop</b> palette colors: Reorder palette</li>
                    </ul>
                </div>
                <div>
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>←</kbd> / <kbd>→</kbd>: Navigate between sprites</li>
                        <li><kbd>Ctrl</kbd> + <kbd>S</kbd>: Save changes</li>
                        <li><kbd>Alt</kbd> + <kbd>Click</kbd>: Color picker (eyedropper)</li>
                        <li><kbd>C</kbd> + <kbd>Click</kbd>: Color replacement tool</li>
                        <li><kbd>F</kbd>: Toggle Fill mode</li>
                        <li><kbd>P</kbd>: Toggle priority bit for selected color</li>
                        <li><kbd>R</kbd>: Analyze and reduce palette to only colors used in sprites</li>
                        <li><kbd>+</kbd>: Insert new blank sprite at current position</li>
                        <li><kbd>Esc</kbd>: Cancel current operation</li>
                    </ul>
                </div>
            </div>
        `;
        const detailPixelSize = (docState.currentSpriteData.width === 8 && docState.currentSpriteData.height === 8) ? '30px' : '18px';
        const rootStyles = `:root { --sprite-scale: ${viewState.scale}; --sprite-width: ${docState.currentSpriteData.width ?? 16}; --sprite-height: ${docState.currentSpriteData.height ?? 16}; --detail-pixel-size: ${detailPixelSize}; }`;
        // --- End Restore HTML Generation ---
        // --- Replace placeholders in HTML ---
        htmlContent = htmlContent.replace(/\$\{webview.cspSource\}/g, webview.cspSource); // Replace CSP source placeholder
        htmlContent = htmlContent.replace(/__NONCE__/g, nonce); // Replace nonce placeholder globally
        htmlContent = htmlContent.replace('__CSS_URI__', cssUri.toString());
        htmlContent = htmlContent.replace('__SCRIPT_URI__', scriptUri.toString());
        htmlContent = htmlContent.replace('__INITIAL_STATE_SCRIPT__', initialStateScript); // Inject the script with small state
        htmlContent = htmlContent.replace('__FILE_INFO__', fileInfoHtml);
        htmlContent = htmlContent.replace('__TOOLBAR__', toolbarHtml);
        htmlContent = htmlContent.replace('__SPRITES_GRID__', spritesGridHtml);
        htmlContent = htmlContent.replace('__SPRITE_DETAIL__', spriteDetailHtml);
        htmlContent = htmlContent.replace('__HELP_CONTENT__', helpContentHtml);
        htmlContent = htmlContent.replace('__FOOTER__', footerHtml);
        htmlContent = htmlContent.replace('__ROOT_STYLES__', rootStyles);
        // --- End Replace placeholders ---
        webviewPanel.webview.html = htmlContent;
        console.log("[Provider updateWebviewContent] Webview HTML set.");
        // --- Send the FULL sprite data asynchronously ---
        console.log("[Provider updateWebviewContent] Posting 'fullSpriteData' message...");
        this.postMessageToWebview(webviewPanel, {
            command: 'fullSpriteData',
            spriteData: docState.currentSpriteData // Send the large data now
        });
        console.log("[Provider updateWebviewContent] Posted 'fullSpriteData' message.");
    }
    // *** ADD getNonce helper method if it's missing ***
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    postMessageToWebview(panel, message) {
        panel?.webview.postMessage(message);
    }
    // Add a method to get the default palette
    getDefaultPalette() {
        // Use the same algorithm as localGenerateDefaultPalette in colorUtils.js
        // Creates a full 256-color palette for the ZX Next's RGB332 (9-bit) color space
        const rgb3to8Map = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
        const palette = [];
        for (let i = 0; i < 256; i++) {
            const rrr = (i >> 5) & 0b111; // Extract the red component (3 bits)
            const ggg = (i >> 2) & 0b111; // Extract the green component (3 bits) 
            const bbb = ((i & 0x03) << 1) | ((i & 0x03) > 0 ? 1 : 0); // Extract blue (3 bits)
            // Convert 3-bit values to 8-bit RGB using the standard ZX Next mapping
            const r8 = rgb3to8Map[rrr];
            const g8 = rgb3to8Map[ggg];
            const b8 = rgb3to8Map[bbb];
            // Convert to hex
            const hex = `#${r8.toString(16).padStart(2, '0')}${g8.toString(16).padStart(2, '0')}${b8.toString(16).padStart(2, '0')}`;
            // Add to palette
            palette.push({ hex, priority: false });
        }
        return palette;
    }
    async saveCustomPalette(document) {
        const docState = document.state;
        if (!docState.customPaletteHex) {
            vscode.window.showWarningMessage("Cannot save palette: No custom palette loaded.");
            return;
        }
        try {
            // Debug logging to check priority bits
            console.log("[saveCustomPalette] Checking priority bits in first 16 colors...");
            for (let i = 0; i < 16; i++) {
                if (docState.customPaletteHex[i].priority) {
                    console.log(`[saveCustomPalette] Color ${i} has priority bit set`);
                }
            }
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'Next Palette Files': ['nxp', 'pal'] }, // Allow both
                title: 'Save Custom Palette As'
            });
            if (saveUri) {
                const encodedPalette = (0, paletteUtils_1.encodePaletteFile)(docState.customPaletteHex); // encodePaletteFile now expects PaletteColor[]
                // Log first few bytes to verify encoding
                console.log("[saveCustomPalette] First 10 entries as bytes:");
                for (let i = 0; i < 10; i++) {
                    const offset = i * 2;
                    console.log(`[saveCustomPalette] Color ${i}: ${encodedPalette[offset].toString(16).padStart(2, '0')} ${encodedPalette[offset + 1].toString(16).padStart(2, '0')} priority=${docState.customPaletteHex[i].priority}`);
                }
                await vscode.workspace.fs.writeFile(saveUri, encodedPalette);
                vscode.window.showInformationMessage(`Custom palette saved to: ${path.basename(saveUri.fsPath)}`);
                // Notify webview to mark palette as clean
                const panel = this.webviews.get(document.uri.toString());
                if (panel) {
                    this.postMessageToWebview(panel, {
                        command: 'changesSaved',
                        isPaletteChange: true
                    });
                }
            }
        }
        catch (error) {
            console.error("[saveCustomPalette] Error:", error);
            vscode.window.showErrorMessage(`Failed to save palette: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    parseAndUpdateSpriteData(document, viewState) {
        const docState = document.state;
        const fileData = buffer_1.Buffer.from(docState.initialFileData); // Parse from original bytes
        try {
            switch (viewState.mode) {
                case 'sprite8':
                    docState.currentSpriteData = (0, spriteDataHandler_1.parse8BitSprites)(fileData);
                    break;
                case 'sprite4':
                    docState.currentSpriteData = (0, spriteDataHandler_1.parse4BitSprites)(fileData, viewState.paletteOffset);
                    break; // <<< ADDED ARGUMENT
                case 'font8x8':
                    docState.currentSpriteData = (0, spriteDataHandler_1.parse8x8Font)(fileData);
                    break;
                case 'tile8x8':
                    docState.currentSpriteData = (0, spriteDataHandler_1.parse8x8Tiles)(fileData, viewState.paletteOffset);
                    break; // <<< ADDED ARGUMENT
                default: throw new Error(`Unsupported view mode: ${viewState.mode}`);
            }
            console.log(`[SpriteProvider] Parsed data for ${document.uri.fsPath} as ${viewState.mode}`);
        }
        catch (e) {
            console.error("[SpriteProvider] Error parsing sprite data:", e);
            vscode.window.showErrorMessage("Error parsing sprite data: " + e.message);
            docState.currentSpriteData = null;
            // Display error in specific webview if open
            const panel = this.webviews.get(document.uri.toString());
            if (panel) {
                panel.webview.html = this.getErrorHtml(e);
            }
        }
    }
    getErrorHtml(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                body {
                    padding: 15px;
                    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-errorForeground);
                    max-width: 600px;
                    margin: 0 auto;
                    font-size: var(--vscode-font-size);
                }
                h1 {
                    font-size: 1.1em;
                    color: var(--vscode-errorForeground);
                    border-bottom: 1px solid var(--vscode-errorForeground);
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .error {
                    color: var(--vscode-errorForeground);
                    background-color: rgba(255, 0, 0, 0.1);
                    padding: 10px;
                    border-left: 4px solid var(--vscode-errorForeground);
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family, monospace);
                    white-space: pre-wrap; /* Allow wrapping */
                    word-break: break-all; /* Break long error messages */
                }
            </style>
        </head>
        <body>
            <h1>Error Loading Sprite File</h1>
            <div class="error">${errorMessage}</div>
            <p>Please ensure the file is a valid ZX Next sprite/tile/font file and try selecting the correct view mode if applicable.</p>
        </body>
        </html>
        `;
    }
    // Add static registration method if needed
    static register(context) {
        const provider = new SpriteViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(SpriteViewerProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false,
            // supportsBackup is inferred
        });
    }
    // Add this method after the class constructor
    /**
     * Analyzes the current sprite data for duplicates and displays results
     * @param document The sprite document to analyze
     */
    async analyzeDuplicates(document) {
        const docState = document.state;
        if (!docState.currentSpriteData) {
            vscode.window.showErrorMessage('No sprite data available for analysis.');
            return;
        }
        // Ask for deduplication options
        const options = {
            ...spriteDedupUtils_1.defaultOptions
        };
        // Ask for detection options
        const detectFlippedH = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Detect horizontally flipped sprites as duplicates?'
        });
        if (detectFlippedH === undefined) {
            return; // User cancelled
        }
        options.detectFlippedHorizontal = detectFlippedH === 'Yes';
        const detectFlippedV = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Detect vertically flipped sprites as duplicates?'
        });
        if (detectFlippedV === undefined) {
            return; // User cancelled
        }
        options.detectFlippedVertical = detectFlippedV === 'Yes';
        const detectRotated = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Detect 180° rotated sprites as duplicates?'
        });
        if (detectRotated === undefined) {
            return; // User cancelled
        }
        options.detectRotated = detectRotated === 'Yes';
        // Find duplicates
        const duplicates = (0, spriteDedupUtils_1.detectDuplicates)(docState.currentSpriteData, options);
        if (duplicates.length === 0) {
            vscode.window.showInformationMessage('No duplicate sprites found.');
            return;
        }
        // Group duplicates for better reporting
        const groups = (0, spriteDedupUtils_1.groupDuplicates)(duplicates);
        // Create a simple report
        const fileName = path.basename(document.uri.fsPath);
        const totalSprites = docState.currentSpriteData.sprites.length;
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
        // Ask if user wants to visualize in the editor
        const visualize = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Highlight duplicate sprites in the editor?'
        });
        const webviewPanel = this.webviews.get(document.uri.toString());
        if (visualize === 'Yes' && webviewPanel) {
            // Send the duplicates information to the webview
            webviewPanel.webview.postMessage({
                command: 'highlightDuplicates',
                duplicates: duplicates
            });
        }
        // Ask if user wants to save a deduplicated version
        const saveDeduplicated = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Save a deduplicated version of this sprite file?'
        });
        if (saveDeduplicated === 'Yes') {
            try {
                // Create deduplicated sprite data
                const deduplicatedSpriteData = (0, spriteDedupUtils_1.removeDuplicates)(docState.currentSpriteData, duplicates);
                // Calculate savings
                const originalBuffer = document.documentData;
                const originalSize = originalBuffer.length;
                const deduplicatedBuffer = (0, spriteDataHandler_1.encodeSpriteData)(deduplicatedSpriteData);
                const newSize = deduplicatedBuffer.length;
                const bytesSaved = originalSize - newSize;
                const percentSaved = Math.round((bytesSaved / originalSize) * 100);
                // Get output filename
                const dirName = path.dirname(document.uri.fsPath);
                const baseName = path.basename(document.uri.fsPath, path.extname(document.uri.fsPath));
                const fileExt = path.extname(document.uri.fsPath);
                const defaultOutputName = `${baseName}_dedup${fileExt}`;
                const outputFilename = await vscode.window.showInputBox({
                    prompt: 'Enter filename for deduplicated sprite file',
                    value: defaultOutputName
                });
                if (!outputFilename) {
                    return; // User cancelled
                }
                // Create output URI
                const outputUri = vscode.Uri.file(path.join(dirName, outputFilename));
                // Write the file
                await vscode.workspace.fs.writeFile(outputUri, deduplicatedBuffer);
                // Report success
                vscode.window.showInformationMessage(`Deduplicated file saved successfully! Reduced from ${originalSize} bytes to ${newSize} bytes (${percentSaved}% smaller).`);
                // Update output channel with the results
                outputChannel.appendLine('');
                outputChannel.appendLine('=== Deduplication Results ===');
                outputChannel.appendLine(`Original file size: ${originalSize} bytes`);
                outputChannel.appendLine(`Deduplicated file size: ${newSize} bytes`);
                outputChannel.appendLine(`Bytes saved: ${bytesSaved} (${percentSaved}%)`);
                outputChannel.appendLine(`Saved to: ${outputFilename}`);
                // Ask if user wants to open the file
                const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
                    placeHolder: 'Open the deduplicated file?'
                });
                if (openFile === 'Yes') {
                    // Open with appropriate viewer
                    vscode.commands.executeCommand('vscode.openWith', outputUri, SpriteViewerProvider.viewType);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error creating deduplicated file: ${error.message}`);
            }
        }
    }
}
exports.SpriteViewerProvider = SpriteViewerProvider;
async function showNotification(message, options) {
    const choice = await vscode.window.showWarningMessage(message, ...options);
    return choice;
}
//# sourceMappingURL=spriteViewerProvider.js.map