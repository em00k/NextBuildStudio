// Script for blockWebview.html
console.log('[Webview] Script start.'); // Log script start

// --- State Management (Initial state comes from inline script in HTML) ---
let currentViewState = initialState.viewState; // Use initialState.viewState
let currentBlockData = initialState.blockData; // Use initialState.blockData
let currentSpriteData = initialState.spriteData; // Use initialState.spriteData
// Rename and use correct initial state
let currentCustomPalette = initialState.customPalette; 

// Ensure defaultPalette is always available
if (!currentViewState.defaultPalette || currentViewState.defaultPalette.length === 0) {
    console.log('[Webview] No default palette found, generating a simple default palette');
    currentViewState.defaultPalette = [];
    // Generate a simple default palette (16 colors)
    for (let i = 0; i < 16; i++) {
        const value = Math.floor(i * 16);
        currentViewState.defaultPalette.push({
            hex: `#${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}`,
            priority: false
        });
    }
}

// No longer needed globals (they are in initialState now)
// let defaultPaletteHex = ... 
// let initialCustomPaletteHex = ...

// --- State for Editing ---
let selectedTileIndex = 0; // Start with tile 0 selected

// --- DOM Elements ---
console.log('[Webview] Getting DOM elements...'); // Log before getting elements
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const gridCheckbox = document.getElementById('showGrid');
const spriteModeSelect = document.getElementById('spriteMode');
const paletteOffsetInput = document.getElementById('paletteOffset');
const loadPaletteButton = document.getElementById('loadPalette');
const useDefaultPaletteButton = document.getElementById('useDefaultPalette');
const paletteStatus = document.getElementById('paletteStatus');
const mapWidthInput = document.getElementById('mapWidth');
const mapHeightInput = document.getElementById('mapHeight');
const updateMapDimsButton = document.getElementById('updateMapDims');
const loadingIndicator = document.getElementById('loadingIndicator');
const contentArea = document.getElementById('content-area');
const mapCanvas = document.getElementById('mapCanvas');
const saveChangesButton = document.getElementById('saveChangesButton');
console.log('[Webview] saveChangesButton element found:', !!saveChangesButton); // Log result
const loadSpriteFileButton = document.getElementById('loadSpriteFile'); // Get new button
const blockWidthInput = document.getElementById('blockWidth'); // ADD
const blockHeightInput = document.getElementById('blockHeight'); // ADD

// --- Declare canvas/context globally (though renderers will hold them) ---
let ctx = null; // For map mode
let blockListCanvas = null; // For block list mode
let blockListCtx = null; // For block list mode

// --- Get canvas/context AFTER declaring variables --- 
if (isMapMode && mapCanvas) {
    console.log('[Webview] Map mode detected, trying to get canvas context...');
    try {
        ctx = mapCanvas.getContext('2d');
        if (ctx) {
            console.log('[Webview] Map canvas context retrieved, dimensions:', mapCanvas.width, 'x', mapCanvas.height);
            console.log('[Webview] currentBlockData in map mode:', JSON.stringify(currentBlockData));
            console.log('[Webview] currentSpriteData available:', !!currentSpriteData);
            
            // Check sprite data is valid
            if (currentSpriteData) {
                console.log('[Webview] Sprite dimensions:', currentSpriteData.width, 'x', currentSpriteData.height);
                console.log('[Webview] Number of sprites:', currentSpriteData.sprites ? currentSpriteData.sprites.length : 'undefined');
            }
            
            // Initialize the map renderer
            mapRenderer.init(mapCanvas, ctx);
            console.log('[Webview] mapRenderer initialized.');
            
            // Force an initial draw
            if (currentBlockData && currentSpriteData) {
                console.log('[Webview] Performing initial map draw with scale:', currentViewState.scale);
                mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
            } else {
                console.error('[Webview] Cannot perform initial map draw: missing data', {
                    blockData: !!currentBlockData,
                    spriteData: !!currentSpriteData
                });
            }
        } else {
            console.error('[Webview] Failed to get map canvas 2D context!');
        }
    } catch (error) {
        console.error('[Webview] Error initializing map renderer:', error);
    }
} else if (!isMapMode) {
    blockListCanvas = document.getElementById('blockListCanvas');
    if (blockListCanvas) {
        blockListCtx = blockListCanvas.getContext('2d');
        if (blockListCtx) {
            blockListRenderer.init(blockListCanvas, blockListCtx); // Initialize the block list renderer
            console.log('[Webview] Block list canvas and context retrieved and blockListRenderer initialized.');
        } else {
            console.error('[Webview] Failed to get block list canvas 2D context!');
        }
    } else {
        console.error('[Webview] Block list canvas element (#blockListCanvas) not found!');
    }
} else {
     console.warn('[Webview] Canvas element not found for the current mode.');
}

console.log('[Webview] DOM elements retrieved.'); // Log after getting elements

// --- Drag-to-Draw State (for map mode) ---
let mapInteractionState = {
    isMouseDown: false,
    lastDraggedTileX: -1,
    lastDraggedTileY: -1
};

// --- Block List Editing State ---
let blockListInteractionState = {
    isDrawingOnBlockList: false,
    lastEditedBlockIndex: -1, // Index within the COMPOUND block grid
    lastEditedSpriteIndexInBlock: -1 // Index of sprite WITHIN the compound block
};

// --- Loading Indicator Functions ---
function showLoading(message = 'Processing...') {
    if (loadingIndicator) {
        loadingIndicator.textContent = message;
        loadingIndicator.classList.add('visible');
    } else {
        console.warn('showLoading called, but loadingIndicator element not found.');
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('visible');
    } else {
         console.warn('hideLoading called, but loadingIndicator element not found.');
    }
}

// --- Helper Functions ---
// Rewritten getColor function using correct state
function getColor(index) {
    // Use the current custom palette if available, otherwise use the default from viewState
    const palette = currentCustomPalette || currentViewState.defaultPalette;
    
    // Check if palette is missing or empty and generate a fallback palette
    if (!palette || palette.length === 0) {
        console.warn(`getColor: No palette available or palette is empty. Index: ${index}`);
        // Create a minimal fallback palette with at least 16 colors instead of just returning an error color
        const fallbackPalette = [];
        for (let i = 0; i < 16; i++) {
            // Generate a simple grayscale palette as fallback
            const value = Math.floor(i * 16);
            fallbackPalette.push({
                hex: `#${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}`,
                priority: false
            });
        }
        // Return a color from our fallback palette
        const fallbackIndex = index % fallbackPalette.length;
        return fallbackPalette[fallbackIndex].hex;
    }

    // Ensure index is within bounds
    const finalIndex = index % palette.length;
    const effectiveIndex = finalIndex >= 0 ? finalIndex : finalIndex + palette.length; // Handle negative modulo result

    // Get the PaletteColor object
    const colorEntry = palette[effectiveIndex];

    // Return the hex property, or magenta if the entry is somehow invalid
    return colorEntry?.hex || '#FF00FF';
}

// --- Update Control States based on Sprite Data --- 
function updateSpriteControlStates() {
    const hasSpriteData = !!currentSpriteData;
    if (spriteModeSelect) {spriteModeSelect.disabled = !hasSpriteData;}
    if (paletteOffsetInput) {
        // Also disable if current mode doesn't use offset
        paletteOffsetInput.disabled = !hasSpriteData || !['sprite4', 'tile8x8', 'font8x8'].includes(currentViewState.spriteMode);
    }
    // Enable/disable the analyze duplicates button
    const analyzeSpritesDuplicatesButton = document.getElementById('analyzeSpritesDuplicatesButton');
    if (analyzeSpritesDuplicatesButton) {
        analyzeSpritesDuplicatesButton.disabled = !hasSpriteData;
    }
    // Disable tile palette interaction?
    const paletteDiv = document.getElementById('tile-palette');
    if (paletteDiv) {paletteDiv.style.opacity = hasSpriteData ? '1' : '0.5';}
}

// --- Tile Palette Drawing --- 
// This still uses the global getColor, needs access to currentSpriteData, selectedTileIndex
function drawTilePalette() {
    const paletteDiv = document.getElementById('tile-palette');
    if (!paletteDiv) {return;} // Exit if no container

    paletteDiv.innerHTML = ''; // Clear previous palette
    updateSpriteControlStates(); // Update controls based on current data state

    if (!currentSpriteData || !currentSpriteData.sprites) {
        paletteDiv.innerHTML = '<p style="font-style: italic; color: var(--vscode-descriptionForeground);">No sprite data loaded.</p>';
        console.log("Tile palette skipped: sprite data missing.");
        return;
    }

    const tileScale = 3; // Increase scale for palette tiles (was 2)
    const tileWidth = currentSpriteData.width;
    const tileHeight = currentSpriteData.height;

    currentSpriteData.sprites.forEach((sprite, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = tileWidth * tileScale;
        canvas.height = tileHeight * tileScale;
        canvas.dataset.tileIndex = index; // Store index for click listener
        canvas.title = `Tile ${index}`;
        canvas.classList.add('palette-tile');
        if (index === selectedTileIndex) {
            canvas.classList.add('selected');
        }

        const tileCtx = canvas.getContext('2d');
        if (tileCtx) {
            tileCtx.imageSmoothingEnabled = false;
            // Draw the sprite pixels onto the small canvas
            if (sprite.pixels) {
                for (let py = 0; py < tileHeight; py++) {
                    for (let px = 0; px < tileWidth; px++) {
                        const pixelIndex = py * tileWidth + px;
                         if (pixelIndex >= sprite.pixels.length) {continue;}
                        const colorIndex = sprite.pixels[pixelIndex];
                        // Skip transparent ONLY for default palette (index 0)
                        if (colorIndex === 0 && !currentCustomPalette) {continue;}

                        // Pass currentCustomPaletteHex explicitly
                        // tileCtx.fillStyle = getColor(colorIndex, currentCustomPaletteHex);
                        tileCtx.fillStyle = getColor(colorIndex);
                        tileCtx.fillRect(px * tileScale, py * tileScale, tileScale, tileScale);
                    }
                }
            } else {
                 // Draw placeholder if pixels missing?
                 tileCtx.fillStyle = '#ddd';
                 tileCtx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        paletteDiv.appendChild(canvas);
    });

    // Add click listener to the palette container (event delegation)
    paletteDiv.removeEventListener('click', handlePaletteClick); // Remove previous listener if any
    paletteDiv.addEventListener('click', handlePaletteClick);

    console.log('Tile palette drawn.');
}

// Separate handler for palette clicks to manage listener removal
function handlePaletteClick(event) {
    if (event.target instanceof HTMLCanvasElement && event.target.classList.contains('palette-tile')) {
        const paletteDiv = document.getElementById('tile-palette');
        const previouslySelected = paletteDiv?.querySelector('.palette-tile.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        event.target.classList.add('selected');
        selectedTileIndex = parseInt(event.target.dataset.tileIndex || '0', 10);
        console.log(`Selected tile index: ${selectedTileIndex}`);
    }
}

// --- Map Editing (Now delegates to mapRenderer) ---
function handleMapClick(event) {
    if (event.button !== 0) return; // Only main button
    mapInteractionState.isMouseDown = true;
    // Call the renderer's interaction handler
    const newState = mapRenderer.handleMapInteraction(
        event, false, currentBlockData, currentSpriteData, currentViewState,
        selectedTileIndex, mapInteractionState, vscode.postMessage,
        enableSaveButton, getColor, currentCustomPalette // Pass currentCustomPalette here (or null)
    );
    mapInteractionState = newState; // Update state
    event.preventDefault();
}

function handleMapMouseMove(event) {
    if (mapInteractionState.isMouseDown) {
        const newState = mapRenderer.handleMapInteraction(
            event, true, currentBlockData, currentSpriteData, currentViewState,
            selectedTileIndex, mapInteractionState, vscode.postMessage,
            enableSaveButton, getColor, currentCustomPalette // Pass currentCustomPalette here (or null)
        );
        mapInteractionState = newState; // Update state
    }
}

function handleMapMouseUp(event) {
    if (event.button !== 0) return;
    if (mapInteractionState.isMouseDown) {
        mapInteractionState.isMouseDown = false;
        mapInteractionState.lastDraggedTileX = -1; // Reset last dragged tile
        mapInteractionState.lastDraggedTileY = -1;
    }
}

function handleMapMouseLeave() {
    if (mapInteractionState.isMouseDown) {
        mapInteractionState.lastDraggedTileX = -1;
        mapInteractionState.lastDraggedTileY = -1;
    }
}

// --- Block List Editing (Now delegates to blockListRenderer) ---
function handleBlockListMouseDown(event) {
    if (event.button !== 0) return;
    blockListInteractionState.isDrawingOnBlockList = true;
    // Reset last edited for a new drag sequence
    blockListInteractionState.lastEditedBlockIndex = -1;
    blockListInteractionState.lastEditedSpriteIndexInBlock = -1;
    const newState = blockListRenderer.handleInteraction(
        event, false, currentBlockData, currentSpriteData, currentViewState, 
        selectedTileIndex, blockListInteractionState, vscode.postMessage, 
        enableSaveButton, getColor, currentCustomPalette // Pass currentCustomPalette
    );
    blockListInteractionState = newState; // Update state
    event.preventDefault();
}

function handleBlockListMouseMove(event) {
    if (blockListInteractionState.isDrawingOnBlockList) {
        const newState = blockListRenderer.handleInteraction(
            event, true, currentBlockData, currentSpriteData, currentViewState, 
            selectedTileIndex, blockListInteractionState, vscode.postMessage, 
            enableSaveButton, getColor, currentCustomPalette // Pass currentCustomPalette
        );
        blockListInteractionState = newState; // Update state
    }
}

function handleBlockListMouseUp(event) {
    if (event.button !== 0) return;
    if (blockListInteractionState.isDrawingOnBlockList) {
        blockListInteractionState.isDrawingOnBlockList = false;
        // Don't reset lastEdited here, it's handled by the interaction function or next mousedown
    }
}

function handleBlockListMouseLeave() {
    if (blockListInteractionState.isDrawingOnBlockList) {
        // Reset last edited index to allow drawing immediately on re-entry
        blockListInteractionState.lastEditedBlockIndex = -1;
        blockListInteractionState.lastEditedSpriteIndexInBlock = -1;
    }
}

// Helper to enable save button (passed as callback)
function enableSaveButton() {
    if (saveChangesButton && saveChangesButton.disabled) {
        saveChangesButton.disabled = false;
        console.log('[Webview][enableSaveButton] Save button enabled.');
    }
}

// --- Functions removed: drawMap, drawTile, handleMapInteraction --- 
// --- Functions removed: drawBlockList, drawSingleSpriteInBlock, handleBlockInteraction --- 

// --- Initialization ---
console.log('[Webview] Initialization section start.');

// Initial render based on mode
if (isMapMode) {
    console.log('Map mode - Initial render using mapRenderer');
    if (currentBlockData && currentSpriteData) {
        mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
        drawTilePalette();
    } else {
        console.warn('[Webview Init] Missing block or sprite data for initial map draw.');
    }
    updateSpriteControlStates();
} else {
    console.log('Block list mode - Initial render using blockListRenderer');
    if (currentBlockData && currentSpriteData) {
        blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
        drawTilePalette();
    } else {
        console.warn('[Webview Init] Missing block or sprite data for initial block list draw.');
    }
    updateSpriteControlStates();
}

// --- Event Listeners --- 
console.log('[Webview] Setting up event listeners...');
initializeEventListeners(); // Call the function to set up listeners
console.log('[Webview] Event listeners setup complete.');

function initializeEventListeners() {
    if (spriteModeSelect) {
        spriteModeSelect.addEventListener('change', e => {
            console.log('Sprite Mode changed');
            const mode = e.target.value;
            if (paletteOffsetInput) {paletteOffsetInput.disabled = !['sprite4', 'tile8x8', 'font8x8'].includes(mode);}
            showLoading('Changing sprite mode...'); // Show loading
            currentViewState.spriteMode = mode; // Update local state
            vscode.postMessage({ command: 'changeSpriteMode', mode });
        });
        console.log('[Webview] Added change listener to spriteMode select.');
    } else {
        console.warn('[Webview] Could not find spriteMode select element.');
    }

    if (paletteOffsetInput) {
        paletteOffsetInput.addEventListener('change', e => {
            console.log('Palette Offset changed');
            let offset = parseInt(e.target.value, 10);
            if (isNaN(offset)) {offset = 0;}
            offset = Math.max(0, Math.min(240, offset));
            e.target.value = offset;
            if (currentViewState.paletteOffset !== offset) {
                currentViewState.paletteOffset = offset;
                if (['sprite4', 'tile8x8'].includes(currentViewState.spriteMode)) {
                     showLoading('Changing palette offset...'); // Show loading
                     vscode.postMessage({ command: 'changePaletteOffset', offset });
                } else {
                     // If not a mode affected by offset, maybe redraw locally?
                     // For now, let the extension handle potential updates/redraws if needed
                     console.log('Palette offset changed, but current sprite mode is not affected directly.');
                }
            }
        });
        console.log('[Webview] Added change listener to paletteOffset input.');
    } else { console.warn('Palette Offset input not found'); }

    if (scaleSlider && scaleValue) {
        scaleSlider.addEventListener('input', e => {
            const newScale = parseInt(e.target.value, 10);
            scaleValue.textContent = newScale + 'x';
            // Maybe update CSS variable here too for instant feedback if needed?
            // document.documentElement.style.setProperty('--sprite-scale', newScale.toString());
        });
        scaleSlider.addEventListener('change', e => {
            console.log('[Webview][scaleListener] Scale slider committed');
            const newScale = parseInt(e.target.value, 10);
            if (currentViewState.scale !== newScale) {
                currentViewState.scale = newScale;
                document.documentElement.style.setProperty('--sprite-scale', newScale.toString()); // Ensure root style updates
                // Trigger redraw using the appropriate renderer
                if (isMapMode && currentBlockData && currentSpriteData) {
                    console.log('[Webview][scaleListener] Drawing map for scale change.');
                    mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                } else if (!isMapMode && currentBlockData && currentSpriteData) {
                    console.log('[Webview][scaleListener] Calling drawBlockList for scale change.');
                    blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                }
                vscode.postMessage({ command: 'changeScale', scale: newScale });
            }
        });
        console.log('[Webview] Added scale listeners.');
    } else { console.warn('Scale slider/value not found'); }

    if (gridCheckbox) {
        gridCheckbox.addEventListener('change', e => {
            console.log('Grid checkbox changed');
            const show = e.target.checked;
            if (currentViewState.showGrid !== show) {
                currentViewState.showGrid = show;
                // Trigger redraw using the appropriate renderer
                if (isMapMode && currentBlockData && currentSpriteData) {
                    mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                } else if (!isMapMode && currentBlockData && currentSpriteData) {
                    blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                }
                vscode.postMessage({ command: 'toggleGrid', showGrid: show });
            }
        });
        console.log('[Webview] Added grid checkbox listener.');
    } else { console.warn('Grid checkbox not found'); }

    // --- Update Map Dimensions Button & Enter Key --- 
    const triggerDimensionUpdate = () => {
        const widthStr = mapWidthInput?.value || '0';
        const heightStr = mapHeightInput?.value || '0';
        console.log(`Dimension update triggered. Raw values: width=${widthStr}, height=${heightStr}`);

        const width = parseInt(widthStr, 10);
        const height = parseInt(heightStr, 10);
        console.log(`Parsed values: width=${width}, height=${height}`);

        // Use currentBlockData dimensions for comparison if available
        const currentWidth = isMapMode && currentBlockData ? currentBlockData.width : currentViewState.mapWidth;
        const currentHeight = isMapMode && currentBlockData ? currentBlockData.height : currentViewState.mapHeight;

        if (width > 0 && height > 0 &&
            (width !== currentWidth || height !== currentHeight)) { // Only trigger if changed
            console.log(`Requesting map dimension change via postMessage: ${width}x${height}`);
            showLoading('Updating map dimensions...');
            const reshapeCheckbox = document.getElementById('reshapeData');
            const reshape = reshapeCheckbox ? reshapeCheckbox.checked : false;
            vscode.postMessage({
                command: 'changeMapDimensions',
                width: width,
                height: height,
                reshape: reshape
            });
        } else if (width <= 0 || height <= 0) {
            console.error("Invalid map dimensions entered.");
             // Restore input values from authoritative source
             if (mapWidthInput) { mapWidthInput.value = String(currentWidth); }
             if (mapHeightInput) { mapHeightInput.value = String(currentHeight); }
        } else {
            console.log("Dimension update triggered, but values haven't changed.");
        }
    };

    if (updateMapDimsButton && isMapMode) {
        updateMapDimsButton.addEventListener('click', triggerDimensionUpdate);
        console.log("[Webview][initializeEventListeners] Event listener added for updateMapDimsButton click.");
    } else if (!updateMapDimsButton && isMapMode) {
        console.warn('[Webview][initializeEventListeners] Update map dimensions button element not found (in map mode)');
    }

    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
            console.log("Enter key pressed in dimension input.");
            event.preventDefault(); // Prevent potential form submission
            triggerDimensionUpdate();
        }
    };

    if (mapWidthInput && isMapMode) {
        mapWidthInput.addEventListener('keydown', handleEnterKey);
        console.log("[Webview][initializeEventListeners] Enter key listener added for mapWidthInput.");
    }
    if (mapHeightInput && isMapMode) {
        mapHeightInput.addEventListener('keydown', handleEnterKey);
        console.log("[Webview][initializeEventListeners] Enter key listener added for mapHeightInput.");
    }

    if (loadPaletteButton) {
        loadPaletteButton.addEventListener('click', () => {
            console.log('Load Palette clicked');
            vscode.postMessage({ command: 'loadPalette' });
        });
        console.log('[Webview] Added load palette listener.');
    } else { console.warn('Load Palette button not found'); }

    if (useDefaultPaletteButton) {
        useDefaultPaletteButton.addEventListener('click', () => {
            console.log('Use Default Palette clicked');
            if (currentCustomPalette !== null) {
                currentCustomPalette = null; // Optimistic update
                if (isMapMode) { mapRenderer.clearTileCache(); } // Clear cache when switching to default
                if (paletteStatus) {paletteStatus.textContent = 'Using: Default';}
                // Trigger redraw
                if (isMapMode && currentBlockData && currentSpriteData) {
                    mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                } else if (!isMapMode && currentBlockData && currentSpriteData) {
                    blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                }
                drawTilePalette(); // Also redraw palette
                vscode.postMessage({ command: 'useDefaultPalette' });
            }
        });
        console.log('[Webview] Added use default palette listener.');
    } else { console.warn('Use Default Palette button not found'); }

    // --- Save Changes Button Listener ---
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', () => {
            console.log('Save Changes button clicked.');
            if (saveChangesButton.disabled) {
                 console.warn('[Webview] Save Changes clicked, but button is disabled!');
                 return;
            }
            showLoading('Saving...');
            saveChangesButton.disabled = true;

            // Send different messages depending on mode
            if (isMapMode) {
                console.log("[Webview] Sending 'saveDocument' message (Map Mode). Data length:", currentBlockData?.indices?.length);
                vscode.postMessage({ command: 'saveDocument', blockData: currentBlockData });
            } else {
                 console.log("[Webview] Sending 'saveDocument' message (Block Mode). Data length:", currentBlockData?.blocks?.length);
                 vscode.postMessage({ command: 'saveDocument', blockData: currentBlockData });
            }
            // Hide loading? Let the extension confirm save completion?
            // Maybe hide after a short delay or wait for 'isDirty=false' update.
            // setTimeout(hideLoading, 500);
        });
        console.log('[Webview][initializeEventListeners] Save Changes listener added.');
    } else {
        console.warn('[Webview] Save Changes button element not found, listener NOT added.');
    }

    // --- Load Sprite File Button Listener ---
    if (loadSpriteFileButton) {
        loadSpriteFileButton.addEventListener('click', () => {
            console.log('Load Sprite File clicked');
            vscode.postMessage({ command: 'loadSpriteFile' });
        });
        console.log('[Webview] Added load sprite file listener.');
    } else { console.warn('Load Sprite File button not found'); }

    // --- Reload Sprite Button Listener ---
    const reloadSpriteButton = document.getElementById('reloadSpriteButton');
    if (reloadSpriteButton) {
        reloadSpriteButton.addEventListener('click', () => {
            console.log('Reload Sprite button clicked');
            if (!currentViewState.hasSpriteData) {
                console.warn('[Webview] Reload Sprite clicked, but no sprite data is loaded.');
                return;
            }
            showLoading('Reloading sprite data...');
            vscode.postMessage({ command: 'reloadSpriteFile' });
        });
        console.log('[Webview] Added reload sprite listener.');
    } else { console.warn('Reload Sprite button not found'); }

    // --- Analyze Sprites Duplicates Button Listener ---
    const analyzeSpritesDuplicatesButton = document.getElementById('analyzeSpritesDuplicatesButton');
    if (analyzeSpritesDuplicatesButton) {
        analyzeSpritesDuplicatesButton.addEventListener('click', () => {
            console.log('[Webview] Analyze Duplicates button clicked');
            if (!currentSpriteData) {
                console.warn('[Webview] Analyze Duplicates clicked, but no sprite data is loaded.');
                return;
            }
            console.log('[Webview] Sending analyzeSpritesDuplicates command to extension');
            showLoading('Analyzing sprite duplicates...');
            vscode.postMessage({ command: 'analyzeSpritesDuplicates' });
        });
        console.log('[Webview] Added analyze sprites duplicates listener.');
    } else {
        console.warn('[Webview] Analyze Sprites Duplicates button not found');
    }

    // --- Map Interaction Listeners (Delegate to handlers defined above) ---
    if (mapCanvas && isMapMode) {
        mapCanvas.addEventListener('mousedown', handleMapClick);
        mapCanvas.addEventListener('mousemove', handleMapMouseMove);
        window.addEventListener('mouseup', handleMapMouseUp); // Listen on window
        mapCanvas.addEventListener('mouseleave', handleMapMouseLeave);
        console.log("[Webview][initializeEventListeners] Map interaction listeners added.");
    } else if (isMapMode) {
        console.warn("[Webview][initializeEventListeners] Map canvas not found, interaction listeners not added.");
    }

    // --- Message Listener (from Extension Host) ---
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('[Webview] Received message:', message.command, message); // Log received message command + data

        let needsMapRedraw = false;
        let needsBlockListRedraw = false;
        let needsPaletteRedraw = false;
        let needsSpriteControlUpdate = false;
        let blockDataUpdated = false;

        switch (message.command) {
            case 'processingStarted':
                console.log('[Webview] Processing started:', message.message || 'No message');
                showLoading(message.message || 'Processing...');
                break;
            case 'processingFinished':
                console.log('[Webview] Processing finished');
                hideLoading();
                break;
            case 'update':
                hideLoading(); // Hide loading whenever an update arrives
                console.log('[Webview] Received update message with data:', {
                    hasBlockData: !!message.blockData,
                    hasSpriteData: !!message.spriteData,
                    hasViewState: !!message.viewState
                });

                // Process blockData first
                if (message.blockData) {
                    console.log("[Webview] Updating block data");
                    currentBlockData = message.blockData;
                    blockDataUpdated = true;
                    if (isMapMode) {
                         currentViewState.mapWidth = currentBlockData.width;
                         currentViewState.mapHeight = currentBlockData.height;
                         if (mapWidthInput) mapWidthInput.value = String(currentBlockData.width);
                         if (mapHeightInput) mapHeightInput.value = String(currentBlockData.height);
                         needsMapRedraw = true;
                    } else {
                         needsBlockListRedraw = true;
                    }
                }

                // Process viewState AFTER blockData
                if (message.viewState) {
                    console.log("[Webview] Processing viewState update:", message.viewState);
                    // Update relevant parts of currentViewState
                    for (const key in message.viewState) {
                        if (key === 'blockData') continue; // Handled above
                        if (Object.hasOwnProperty.call(message.viewState, key) &&
                            Object.hasOwnProperty.call(currentViewState, key)) {

                            if (currentViewState[key] !== message.viewState[key]) {
                                console.log(`  - Updating viewState.${key}: ${currentViewState[key]} -> ${message.viewState[key]}`);
                                currentViewState[key] = message.viewState[key];

                                // Check if this change necessitates a redraw
                                if (['scale', 'showGrid', 'blockWidth', 'blockHeight'].includes(key)) {
                                     if (isMapMode) needsMapRedraw = true;
                                     else needsBlockListRedraw = true;
                                }
                                if (key === 'spriteMode') {
                                     // Mode change might require full data refresh, but extension handles that.
                                     // Locally, we might need sprite control update & redraw.
                                     needsSpriteControlUpdate = true;
                                     if (isMapMode) needsMapRedraw = true;
                                     else needsBlockListRedraw = true;
                                }
                                if (key === 'paletteOffset') {
                                    needsSpriteControlUpdate = true; // Update control state
                                    // Redraw only if offset affects current mode
                                    if (['sprite4', 'tile8x8'].includes(currentViewState.spriteMode)) {
                                         if (isMapMode) needsMapRedraw = true;
                                         else needsBlockListRedraw = true;
                                    }
                                }
                                if (key === 'isDirty') {
                                    if (saveChangesButton) {
                                        saveChangesButton.disabled = !currentViewState.isDirty;
                                        console.log(`Save button disabled: ${!currentViewState.isDirty}`);
                                    }
                                }
                            }
                        }
                    }
                    // Update DOM elements based on received viewState
                    if (scaleSlider) scaleSlider.value = String(currentViewState.scale);
                    if (scaleValue) scaleValue.textContent = currentViewState.scale + 'x';
                    if (gridCheckbox) gridCheckbox.checked = currentViewState.showGrid;
                    if (paletteOffsetInput) paletteOffsetInput.value = String(currentViewState.paletteOffset);
                    if (blockWidthInput) blockWidthInput.value = String(currentViewState.blockWidth);
                    if (blockHeightInput) blockHeightInput.value = String(currentViewState.blockHeight);
                    if (spriteModeSelect) spriteModeSelect.value = currentViewState.spriteMode;
                    if (paletteStatus) {
                        const name = currentViewState.customPaletteName;
                        paletteStatus.textContent = name ? `Using: ${name}` : 'Using: Default';
                        if (name) paletteStatus.title = name;
                        else paletteStatus.removeAttribute('title');
                    }
                    // Update map dimensions if they changed via viewState (less common now)
                    if (isMapMode && mapWidthInput && mapHeightInput && currentBlockData) {
                        if (mapWidthInput.value !== String(currentBlockData.width)) mapWidthInput.value = String(currentBlockData.width);
                        if (mapHeightInput.value !== String(currentBlockData.height)) mapHeightInput.value = String(currentBlockData.height);
                    }
                }

                // If blockData wasn't sent directly, try getting it from viewState
                if (!blockDataUpdated && message.viewState && message.viewState.blockData) {
                    console.log("[Webview] Updating currentBlockData from viewState.blockData");
                    currentBlockData = message.viewState.blockData;
                    blockDataUpdated = true; // Mark as updated
                    // Ensure viewState dimensions also match this blockData if necessary
                    if (isMapMode) {
                        currentViewState.mapWidth = currentBlockData.width;
                        currentViewState.mapHeight = currentBlockData.height;
                         // Update UI inputs again to be sure
                         if (mapWidthInput) mapWidthInput.value = String(currentBlockData.width);
                         if (mapHeightInput) mapHeightInput.value = String(currentBlockData.height);
                    }
                    if (!isMapMode) {
                        // Update block mode specific view state if needed from blockData
                    }
                }

                // Process spriteData if present
                if (message.spriteData !== undefined) { // Check existence, even if null
                    console.log('[Webview] Received sprite data update in webview');
                    currentSpriteData = message.spriteData;
                    // Update hasSpriteData flag in viewState
                    currentViewState.hasSpriteData = !!currentSpriteData;
                    // Clear cache when sprite data changes
                    if (isMapMode) { mapRenderer.clearTileCache(); }
                    // Also potentially clear for block list renderer if it uses caching
                    // if (!isMapMode) { blockListRenderer.clearTileCache(); }
                    needsSpriteControlUpdate = true;
                    needsPaletteRedraw = true; // Need to redraw palette with new sprites
                    // Redraw main view as well
                    if (isMapMode) needsMapRedraw = true;
                    else needsBlockListRedraw = true;
                }

                // Process customPalette if present
                if (message.hasOwnProperty('customPalette')) {
                    console.log('[Webview] Received custom palette update in webview');
                    currentCustomPalette = message.customPalette;
                    // Clear cache when palette changes
                    if (isMapMode) { mapRenderer.clearTileCache(); } 
                    // if (!isMapMode) { blockListRenderer.clearTileCache(); }
                    needsPaletteRedraw = true;
                    // Redraw main view
                    if (isMapMode) needsMapRedraw = true;
                    else needsBlockListRedraw = true;
                }

                // Always force updates after deduplication to ensure everything is properly refreshed
                if (message.isDedupUpdate) {
                    console.log("[Webview] Forcing full refresh after deduplication");
                    needsSpriteControlUpdate = true;
                    needsPaletteRedraw = true;
                    if (isMapMode) {
                        needsMapRedraw = true;
                        // Clear any map renderer cache
                        mapRenderer.clearTileCache();
                    } else {
                        needsBlockListRedraw = true;
                        // Clear any block list renderer cache if it exists
                        // blockListRenderer.clearTileCache();
                    }
                }

                 // --- Trigger Redraws and Updates --- 
                 if (needsSpriteControlUpdate) {
                    console.log("[Webview] Updating sprite control states");
                    updateSpriteControlStates();
                 }
                 if (needsPaletteRedraw) {
                    console.log("[Webview] Redrawing tile palette");
                    drawTilePalette();
                 }

                 // Perform redraws using RAF for performance
                 if (needsMapRedraw && isMapMode) {
                    if (currentBlockData && currentSpriteData) {
                         console.log('[Webview Update] Requesting map redraw.');
                         mapRenderer.drawMap(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                    } else {
                         console.warn('[Webview Update] Skipping map redraw - missing data.');
                    }
                 } else if (needsBlockListRedraw && !isMapMode) {
                    if (currentBlockData && currentSpriteData) {
                         console.log('[Webview Update] Requesting block list redraw.');
                         blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                    } else {
                        console.warn('[Webview Update] Skipping block list redraw - missing data.');
                    }
                 }

                // --- FIX: Ensure loading indicator is hidden AFTER updates ---
                hideLoading();
                console.log('[Webview] Update complete, loading hidden.');
                break;
            default:
                 console.warn("Received unknown message command:", message.command);
                 break;
        }
    });

    // --- Add Listeners for Block Width/Height (only in block mode) --- 
    if (blockWidthInput && !isMapMode) {
        blockWidthInput.addEventListener('change', e => {
            const target = e.target; // No Type Assertion
            const newValue = parseInt(target.value, 10);
            if (!isNaN(newValue) && newValue > 0 && newValue <= 32) {
                console.log(`[Webview][blockWidth] Block width changed to: ${newValue}`);
                if (currentViewState.blockWidth !== newValue) {
                    currentViewState.blockWidth = newValue;
                    // Trigger re-render locally immediately
                    if (currentBlockData && currentSpriteData) {
                        console.log('[Webview][blockWidth] Calling drawBlockList.');
                        blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                    }
                    vscode.postMessage({ command: 'changeBlockWidth', width: newValue });
                }
            } else {
                console.warn(`[Webview][blockWidth] Invalid value entered: ${target.value}. Resetting.`);
                target.value = String(currentViewState.blockWidth);
            }
        });
        console.log('[Webview] Added change listener to blockWidth input.');
    } else if (!isMapMode) {
        console.warn('[Webview] Could not find blockWidth input element.');
    }

    if (blockHeightInput && !isMapMode) {
        blockHeightInput.addEventListener('change', e => {
            const target = e.target; // No Type Assertion
            const newValue = parseInt(target.value, 10);
            if (!isNaN(newValue) && newValue > 0 && newValue <= 32) {
                console.log(`[Webview][blockHeight] Block height changed to: ${newValue}`);
                 if (currentViewState.blockHeight !== newValue) {
                    currentViewState.blockHeight = newValue;
                    // Trigger re-render locally immediately
                    if (currentBlockData && currentSpriteData) {
                        console.log('[Webview][blockHeight] Calling drawBlockList.');
                        blockListRenderer.drawBlockList(currentBlockData, currentSpriteData, currentViewState, getColor, currentCustomPalette);
                    }
                     vscode.postMessage({ command: 'changeBlockHeight', height: newValue });
                 }
            } else {
                 console.warn(`[Webview][blockHeight] Invalid value entered: ${target.value}. Resetting.`);
                target.value = String(currentViewState.blockHeight);
            }
        });
        console.log('[Webview] Added change listener to blockHeight input.');
    } else if (!isMapMode) {
        console.warn('[Webview] Could not find blockHeight input element.');
    }

    // --- Block List Interaction Listeners (Delegate to handlers defined above) ---
    if (blockListCanvas && !isMapMode) {
        console.log('[Webview][initializeEventListeners] Adding block list interaction listeners.');
        blockListCanvas.addEventListener('mousedown', handleBlockListMouseDown);
        blockListCanvas.addEventListener('mousemove', handleBlockListMouseMove);
        window.addEventListener('mouseup', handleBlockListMouseUp); // Listen on window
        blockListCanvas.addEventListener('mouseleave', handleBlockListMouseLeave);
    } else if (!isMapMode) {
        console.warn('[Webview][initializeEventListeners] Block list canvas not found, interaction listeners not added.');
    }
}

console.log('[Webview] Script end.'); // Log script end 