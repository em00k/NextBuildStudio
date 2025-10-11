/* eslint-disable curly */

// --- Imports --- 
import { flipVertical, flipHorizontal, scrollVertical, scrollHorizontal, floodFill } from '../drawingUtils';
import { hexToRgb9, rgb9ToHex, rgb9ToBytes, bytesToRgb9, rgbStringToHex } from '../paletteUtils';
import { populatePalettePicker, redrawSpriteGrid, redrawDetailView, updateSpritePixelColors } from './spriteRenderer.js';
import { setupEventListeners } from './eventHandlers.js'; // Import the setup function
// --- End Imports --- 

// --- Central Application State --- 
let appState = {
    spriteData: null, 
    viewState: null, 
    palette: {
        current: [], 
        isCustom: false, 
        default: [], // Store default palette
        visibleSize: 256,
        isDirty: false  // Add separate dirty tracking for palette
    },
    selection: {
        primaryColorIndex: 0,
        secondaryColorIndex: 0,
        editorColorIndex: -1,
    },
    editor: {
        isDirty: false,
    }
};

// --- Global Element References (REMOVED - Moved inside initializeUI) --- 
/*
let scaleSlider, scaleValue, gridCheckbox, paletteOffsetInput, spriteListContainer, 
    mainSpriteDetailContainer, palettePicker, saveButton, viewModeSelect, 
    loadPaletteButton, paletteStatusSpan, useDefaultPaletteButton, primaryColorIndexSpan,
    primaryPreviewBox, primaryHexValueSpan, secondaryColorIndexSpan, secondaryPreviewBox,
    secondaryHexValueSpan, colorPickerInput, reloadDataButton, sliderR, sliderG, sliderB,
    valueR, valueG, valueB, hoverInfoContainer, hoverPreviewBox, hoverRawValue,
    hoverPaletteIndex, hoverHexValue, paletteSizeSelect, mergePaletteButton;
*/

(function() {
    const vscode = acquireVsCodeApi();

    // --- Get DOM Elements (MOVED to initializeUI) --- 

    // --- Helper Functions defined within IIFE scope --- 
    // These will now read/write to appState

    function isDefaultPaletteActive() {
        return !appState.palette.isCustom;
    }

    function requestFullRedraw() {
        console.log("[Webview Redraw] >>> requestFullRedraw START"); // <<< ADDED LOG
        // Get fresh references inside redraw, as elements might be recreated
        const currentPalettePicker = document.getElementById('palettePicker');
        const currentSpriteListContainer = document.querySelector('.sprites-grid');
        const currentMainSpriteDetailContainer = document.querySelector('.detail-container');

        // Call rendering functions, passing appState or relevant parts
        populatePalettePicker(
            currentPalettePicker, 
            appState.palette,
            appState.selection,
            isDefaultPaletteActive(), 
            selectPrimaryColor, 
            selectSecondaryColor, 
            vscode // Pass vscode API here
        ); 
        console.log("[Webview Redraw] --- requestFullRedraw: Populated Palette Picker"); // <<< ADDED LOG
        redrawSpriteGrid(currentSpriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState); // Use appState
        console.log("[Webview Redraw] --- requestFullRedraw: Redrew Sprite Grid"); // <<< ADDED LOG
        redrawDetailView(currentMainSpriteDetailContainer, appState.spriteData, appState.viewState, appState.palette.current, isDefaultPaletteActive()); // Use appState
        console.log("[Webview Redraw] --- requestFullRedraw: Redrew Detail View"); // <<< ADDED LOG
        
        // Use refreshPrimaryColorDisplay instead of selectPrimaryColor to ensure the checkbox updates
        // even when the same color index is selected but the palette has changed
        refreshPrimaryColorDisplay();
        selectSecondaryColor(appState.selection.secondaryColorIndex);

        // --- FOUC Fix: Make content visible after drawing ---
        const mainContent = document.getElementById('mainContentContainer');
        if (mainContent && mainContent.style.visibility === 'hidden') {
            mainContent.style.visibility = 'visible';
            console.log("[Webview Redraw] --- Made mainContentContainer visible.");
        }
        // --- End FOUC Fix ---
        console.log("[Webview Redraw] >>> requestFullRedraw END"); // <<< ADDED LOG
    }
    function requestPaletteRedraw() {
         const currentPalettePicker = document.getElementById('palettePicker');
         populatePalettePicker(
             currentPalettePicker, 
             appState.palette,
             appState.selection,
             isDefaultPaletteActive(), 
             selectPrimaryColor, 
             selectSecondaryColor, 
             vscode // Pass vscode API here
         ); 
         // Update previews after redraw
         refreshPrimaryColorDisplay(); 
         selectSecondaryColor(appState.selection.secondaryColorIndex);
    }

    // Wrapper for sendColorUpdateToExtension
    function sendColorUpdateToExtension(colorIndex, hexColor, skipDirtyNotification = false) {
        if (!skipDirtyNotification) {
            markAsDirty(true); // This is a palette change only
        }
        const colorEntry = appState.palette.current[colorIndex];
        const messagePayload = {
            command: 'paletteEdit',
            index: colorIndex,
            newHexColor: colorEntry?.hex, // Send hex (safer access)
            priority: colorEntry?.priority, // Send priority (safer access)
            skipDirtyNotification: skipDirtyNotification // Add this flag to inform the provider
        };
        vscode.postMessage(messagePayload);
    }

    // Define updateColorPreviews helper
    function updateColorPreviews(colorIndex, newHexColor) {
        // Get fresh references
        const currentPalettePicker = document.getElementById('palettePicker');
        const currentSpriteListContainer = document.querySelector('.sprites-grid');
        const currentMainSpriteDetailContainer = document.querySelector('.detail-container');
        const currentPrimaryPreviewBox = document.getElementById('primaryPreviewBox');
        const currentPrimaryHexValueSpan = document.getElementById('primaryHexValue');
        const currentSecondaryPreviewBox = document.getElementById('secondaryPreviewBox');
        const currentSecondaryHexValueSpan = document.getElementById('secondaryHexValue');

         // Update palette swatch in the grid
        const swatchInGrid = currentPalettePicker?.querySelector(`.color-swatch[data-color-index="${colorIndex}"]`);
        if (swatchInGrid) swatchInGrid.style.backgroundColor = newHexColor;

        // Update L/R preview boxes if necessary
        if(colorIndex === appState.selection.primaryColorIndex) { 
            if (currentPrimaryPreviewBox) currentPrimaryPreviewBox.style.backgroundColor = newHexColor;
            if (currentPrimaryHexValueSpan) currentPrimaryHexValueSpan.textContent = newHexColor; 
        }
        if(colorIndex === appState.selection.secondaryColorIndex) { 
             if (currentSecondaryPreviewBox) currentSecondaryPreviewBox.style.backgroundColor = newHexColor;
            if (currentSecondaryHexValueSpan) currentSecondaryHexValueSpan.textContent = newHexColor; 
        }

        // Update pixels in grid/detail using the renderer function
        updateSpritePixelColors(
            currentSpriteListContainer,
            currentMainSpriteDetailContainer,
            appState.spriteData, 
            appState.viewState,  
            appState.palette.current, 
            colorIndex,
            newHexColor
        );
    }

    // Define swapPixelIndices helper
    function swapPixelIndices(indexA, indexB) {
        if (!appState.spriteData || !appState.spriteData.sprites) return []; 
        const modifiedSpriteIndices = [];
        appState.spriteData.sprites.forEach((sprite, spriteIdx) => { 
            let pixelsModified = false;
            const tempPixels = sprite.pixels.map(pixelValue => {
                if (pixelValue === indexA) { pixelsModified = true; return indexB; }
                else if (pixelValue === indexB) { pixelsModified = true; return indexA; }
                else { return pixelValue; }
            });
            if (pixelsModified) {
                sprite.pixels = tempPixels;
                modifiedSpriteIndices.push(spriteIdx);
            }
        });
        return modifiedSpriteIndices;
    }

    // Define updateEditorPanel
    function updateEditorPanel(colorIndex) {
        // Get fresh references
        const currentSliderR = document.getElementById('sliderR');
        const currentSliderG = document.getElementById('sliderG');
        const currentSliderB = document.getElementById('sliderB');
        const currentValueR = document.getElementById('valueR');
        const currentValueG = document.getElementById('valueG');
        const currentValueB = document.getElementById('valueB');
        const currentPrimaryColorHexInput = document.getElementById('primaryColorHex'); // Assuming text input exists
        const currentColorPickerInput = document.getElementById('colorPickerInput');
        const currentPriorityCheckbox = document.getElementById('primaryPriorityFlag');

        if (colorIndex < 0 || colorIndex >= appState.palette.current.length) { 
            appState.selection.editorColorIndex = -1; 
            // Optionally clear/disable editor controls
            return;
        }
        appState.selection.editorColorIndex = colorIndex;
        const colorEntry = appState.palette.current[colorIndex]; // Get PaletteColor object
        const hexColor = colorEntry.hex;
        const rgb9 = hexToRgb9(hexColor);

        if(currentSliderR) currentSliderR.value = rgb9.r9.toString();
        if(currentSliderG) currentSliderG.value = rgb9.g9.toString();
        if(currentSliderB) currentSliderB.value = rgb9.b9.toString();
        if(currentValueR) currentValueR.textContent = rgb9.r9.toString();
        if(currentValueG) currentValueG.textContent = rgb9.g9.toString();
        if(currentValueB) currentValueB.textContent = rgb9.b9.toString();
        if(currentColorPickerInput) currentColorPickerInput.value = hexColor;
        if(currentPrimaryColorHexInput) currentPrimaryColorHexInput.value = hexColor; // Update hex text input
        if(currentPriorityCheckbox) currentPriorityCheckbox.checked = colorEntry.priority; // Update priority checkbox
    }

    // Define getDisplayColorIndex helper 
    function getDisplayColorIndex(rawIndex) {
        if (!appState.viewState || !appState.palette.current) {
            return 0; // Check appState
        }
        const mode = appState.viewState.mode;
        const offset = appState.viewState.paletteOffset;
        let finalIndex = rawIndex;
        if (mode === 'sprite4' || mode === 'tile8x8') {
            finalIndex = offset + rawIndex;
        }
        if (finalIndex < 0 || finalIndex >= appState.palette.current.length) {
            console.warn(`Calculated display index ${finalIndex} out of bounds for palette length ${appState.palette.current.length}. Raw: ${rawIndex}, Offset: ${offset}`);
            return 0;
        }
        return finalIndex;
    }

    // New function: Update primary color display without changing selection
    function refreshPrimaryColorDisplay() {
        const index = appState.selection.primaryColorIndex;
        if (index < 0 || index >= appState.palette.current.length) {
            return;
        }
        
        const colorEntry = appState.palette.current[index];
        const hexColor = colorEntry.hex;
        
        // Get fresh references
        const currentPrimaryPreviewBox = document.getElementById('primaryPreviewBox');
        const currentPrimaryHexValueSpan = document.getElementById('primaryHexValue');
        const primaryR9Value = document.getElementById('primaryR9Value');
        const primaryG9Value = document.getElementById('primaryG9Value');
        const primaryB9Value = document.getElementById('primaryB9Value');
        const primaryPriorityFlag = document.getElementById('primaryPriorityFlag');

        if (currentPrimaryPreviewBox) currentPrimaryPreviewBox.style.backgroundColor = hexColor;
        if (currentPrimaryHexValueSpan) currentPrimaryHexValueSpan.textContent = hexColor;

        // Update editor panel
        updateEditorPanel(index);

        // Update 9-bit display and priority checkbox
        const rgb9 = hexToRgb9(hexColor);
        if (primaryR9Value) primaryR9Value.textContent = rgb9.r9.toString();
        if (primaryG9Value) primaryG9Value.textContent = rgb9.g9.toString();
        if (primaryB9Value) primaryB9Value.textContent = rgb9.b9.toString();
        
        // Update priority checkbox with flag to prevent event cycle
        if (primaryPriorityFlag) {
            console.log(`[refreshPrimaryColorDisplay] Updating priority checkbox for index ${index} to ${colorEntry.priority}`);
            primaryPriorityFlag._isBeingUpdatedProgrammatically = true;
            primaryPriorityFlag.checked = colorEntry.priority;
            setTimeout(() => {
                if (primaryPriorityFlag) {
                    primaryPriorityFlag._isBeingUpdatedProgrammatically = false;
                }
            }, 0);
        }
    }

    // Define markAsDirty helper with distinction between sprite and palette
    function markAsDirty(isPaletteChange = false) {
        if (isPaletteChange) {
            // Mark palette as dirty
            if (!appState.palette.isDirty) {
                appState.palette.isDirty = true;
                const savePaletteButton = document.getElementById('savePaletteButton');
                if (savePaletteButton) {
                    savePaletteButton.classList.add('save-button-dirty');
                }
                // Don't update the main save button
            }
        } else {
            // Mark sprite as dirty (original behavior)
        if (!appState.editor.isDirty) { 
            const saveButton = document.getElementById('saveButton'); // Get fresh reference
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.classList.add('save-button-dirty');
            }
            appState.editor.isDirty = true; 
            // Don't notify VSCode of dirty state - only use internal dirty tracking
            }
        }
    }

    // Define selectPrimaryColor and selectSecondaryColor
    function selectPrimaryColor(index) {
        if (index === null || index === undefined || index < 0 || index >= appState.palette.current.length) {
            console.warn(`[Webview] Invalid primary color index: ${index}`);
            return;
        }
        
        // If this is already the primary color, do nothing
        if (index === appState.selection.primaryColorIndex) {
            return;
        }
        
        appState.selection.primaryColorIndex = index;
        const colorEntry = appState.palette.current[index]; // Get the PaletteColor object
        const hexColor = colorEntry.hex;
        
        // Get fresh references
        const currentPrimaryPreviewBox = document.getElementById('primaryPreviewBox');
        const currentPrimaryColorIndexSpan = document.getElementById('primaryColorIndex');
        const currentPrimaryHexValueSpan = document.getElementById('primaryHexValue');
        const currentPalettePicker = document.getElementById('palettePicker');
        // Add references for 9-bit display and priority checkbox
        const primaryR9Value = document.getElementById('primaryR9Value');
        const primaryG9Value = document.getElementById('primaryG9Value');
        const primaryB9Value = document.getElementById('primaryB9Value');
        const primaryPriorityFlag = document.getElementById('primaryPriorityFlag');

        if (currentPrimaryPreviewBox) currentPrimaryPreviewBox.style.backgroundColor = hexColor;
        if (currentPrimaryColorIndexSpan) currentPrimaryColorIndexSpan.textContent = index;
        if (currentPrimaryHexValueSpan) currentPrimaryHexValueSpan.textContent = hexColor;
        updateEditorPanel(index); // Update sliders/picker when primary changes

        // Update palette picker selection styling
        if(currentPalettePicker) {
            // Remove previous primary selection
            currentPalettePicker.querySelectorAll('.color-swatch.primary-selected').forEach(sw => sw.classList.remove('primary-selected'));
            // Add new primary selection
            const selectedSwatch = currentPalettePicker.querySelector(`.color-swatch[data-color-index="${index}"]`);
            if (selectedSwatch) selectedSwatch.classList.add('primary-selected');
        }

        // Update 9-bit display and priority checkbox
        const rgb9 = hexToRgb9(hexColor);
        if (primaryR9Value) primaryR9Value.textContent = rgb9.r9.toString();
        if (primaryG9Value) primaryG9Value.textContent = rgb9.g9.toString();
        if (primaryB9Value) primaryB9Value.textContent = rgb9.b9.toString();
        
        // Add a preventEvent flag to the checkbox before changing its state
        if (primaryPriorityFlag) {
            // Set a flag directly on the element to indicate programmatic change
            primaryPriorityFlag._isBeingUpdatedProgrammatically = true;
            primaryPriorityFlag.checked = colorEntry.priority;
            // Clear the flag after a short delay to ensure event processing completes
            setTimeout(() => {
                if (primaryPriorityFlag) {
                    primaryPriorityFlag._isBeingUpdatedProgrammatically = false;
                }
            }, 0);
        }
    }

    function selectSecondaryColor(index) {
        if (index === null || index === undefined || index < 0 || index >= appState.palette.current.length) {
            console.warn(`[Webview] Invalid secondary color index: ${index}`);
            return;
        }
        
        // If this is already the secondary color, do nothing
        if (index === appState.selection.secondaryColorIndex) {
            return;
        }
        
        appState.selection.secondaryColorIndex = index; 
        const colorEntry = appState.palette.current[index];
        const colorHex = colorEntry ? colorEntry.hex : '#000000'; 
        
        // Get fresh references
        const currentSecondaryColorIndexSpan = document.getElementById('secondaryColorIndex');
        const currentSecondaryPreviewBox = document.getElementById('secondaryPreviewBox');
        const currentSecondaryHexValueSpan = document.getElementById('secondaryHexValue');
        const currentPalettePicker = document.getElementById('palettePicker');
        
        if (currentSecondaryColorIndexSpan) currentSecondaryColorIndexSpan.textContent = index.toString();
        if (currentSecondaryPreviewBox) currentSecondaryPreviewBox.style.backgroundColor = colorHex;
        if (currentSecondaryHexValueSpan) currentSecondaryHexValueSpan.textContent = colorHex;
        
        // Update palette picker selection styling
        if(currentPalettePicker) {
            // Remove previous secondary selection
            currentPalettePicker.querySelectorAll('.color-swatch.secondary-selected').forEach(sw => sw.classList.remove('secondary-selected'));
            // Add new secondary selection
            const selectedSwatch = currentPalettePicker.querySelector(`.color-swatch[data-color-index="${index}"]`);
            if (selectedSwatch) selectedSwatch.classList.add('secondary-selected');
        }
    }
    
    // Define handleTransformInternal here 
    function handleTransformInternal(action, sprite) {
        if (!sprite || !appState.viewState) return; 
        let newPixels = null;
        const width = sprite.width;
        const height = sprite.height;
        const spriteIndex = sprite.index; 

        try {
            switch (action) {
                case 'flipV': newPixels = flipVertical(sprite.pixels, width, height); break;
                case 'flipH': newPixels = flipHorizontal(sprite.pixels, width, height); break;
                case 'clear':
                    {
                        let valueToStore = 0;
                        const primaryIndex = appState.selection.primaryColorIndex; 
                        if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
                             const baseOffset = appState.viewState.paletteOffset;
                             if (primaryIndex >= baseOffset && primaryIndex < baseOffset + 16) {
                                 valueToStore = primaryIndex - baseOffset;
                             } else {
                                 vscode.postMessage({ command: 'showColorOutOfBankWarning', selectedColorIndex: primaryIndex, paletteOffset: baseOffset, mode: appState.viewState.mode });
                                 valueToStore = 0; 
                             }
                         } else {
                             valueToStore = primaryIndex;
                        }
                        newPixels = new Array(width * height).fill(valueToStore);
                    }
                    break;
                case 'scrollU': newPixels = scrollVertical(sprite.pixels, width, height, -1); break;
                case 'scrollD': newPixels = scrollVertical(sprite.pixels, width, height, 1); break;
                case 'scrollL': newPixels = scrollHorizontal(sprite.pixels, width, height, -1); break;
                case 'scrollR': newPixels = scrollHorizontal(sprite.pixels, width, height, 1); break;
                case 'fill':
                     console.warn("handleTransformInternal should not receive 'fill' action.");
                    return; 
                default:
                    console.warn('[Webview JS] Unknown transform action:', action);
                    return;
            }

            if (newPixels) {
                sprite.pixels = newPixels;
                markAsDirty();
                requestFullRedraw(); 
                vscode.postMessage({ 
                    command: 'updateSpritePixels', 
                    spriteIndex: spriteIndex, 
                    pixels: sprite.pixels 
                });
            }
        } catch (error) {
            console.error(`[Webview JS] Error applying transform ${action}:`, error);
            vscode.postMessage({ command: 'showError', message: `Failed to apply ${action}: ${error.message}`}); 
        }
    }
    // --- End Helper Functions ---

    // --- NEW HELPER for CSS Update ---
    function updateDetailPixelSizeCss() {
        if (appState.viewState && appState.viewState.spriteBrush && appState.spriteData && appState.spriteData.sprites && appState.spriteData.sprites.length > 0) {
            // Use the dimensions of the *currently selected* sprite for base size calculation if sprites can have variable dimensions.
            // For now, we assume appState.spriteData.width/height are the relevant base dimensions for the file.
            const baseSpriteWidth = appState.spriteData.width;
            const baseSpriteHeight = appState.spriteData.height;
            
            const brushW = appState.viewState.spriteBrush.width;
            const brushH = appState.viewState.spriteBrush.height;
            let newDetailPixelSize;

            if (brushW === 1 && brushH === 1) {
                newDetailPixelSize = (baseSpriteWidth === 8 && baseSpriteHeight === 8) ? '30px' : '18px';
            } else {
                newDetailPixelSize = (baseSpriteWidth === 8 && baseSpriteHeight === 8) ? '15px' : '10px';
            }
            // console.log(`[Webview CSS] Brush: ${brushW}x${brushH}, SpriteBase: ${baseSpriteWidth}x${baseSpriteHeight}, newDetailPixelSize: ${newDetailPixelSize}`);
            document.documentElement.style.setProperty('--detail-pixel-size', newDetailPixelSize);
        } else {
            // console.warn("[Webview CSS] Could not update detail pixel size, missing state criteria.");
        }
    }
    window.updateDetailPixelSizeCss = updateDetailPixelSizeCss; // Expose to renderer via window object

    // --- Initial UI Setup ---
    function initializeUI() {
        console.log("[Webview Init] >>> initializeUI START"); // <<< ADDED LOG
        // Get initial data passed from the extension
        const initialData = window.initialData;
        if (!initialData) {
            console.error('[Webview] Initial data not found!');
            // Display error message in the webview
            document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Failed to load initial sprite data.</div>';
            return;
        }

        // Make sure the document body is focusable
        document.body.setAttribute('tabindex', '0');

        // --- Get DOM Elements AFTER initialData is confirmed ---
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        const gridCheckbox = document.getElementById('showGrid');
        const paletteOffsetInput = document.getElementById('paletteOffset');
        const spriteListContainer = document.querySelector('.sprites-grid');
        const mainSpriteDetailContainer = document.querySelector('.detail-container');
        const palettePicker = document.getElementById('palettePicker');
        const saveButton = document.getElementById('saveButton');
        const viewModeSelect = document.getElementById('viewMode');
        const loadPaletteButton = document.getElementById('loadPalette');
        const paletteStatusSpan = document.getElementById('paletteStatus');
        const useDefaultPaletteButton = document.getElementById('useDefaultPalette');
        const primaryColorIndexSpan = document.getElementById('primaryColorIndex');
        const primaryPreviewBox = document.getElementById('primaryPreviewBox');
        const primaryHexValueSpan = document.getElementById('primaryHexValue');
        const secondaryColorIndexSpan = document.getElementById('secondaryColorIndex');
        const secondaryPreviewBox = document.getElementById('secondaryPreviewBox');
        const secondaryHexValueSpan = document.getElementById('secondaryHexValue');
        const colorPickerInput = document.getElementById('colorPickerInput');
        const reloadDataButton = document.getElementById('reloadDataButton');
        const sliderR = document.getElementById('sliderR');
        const sliderG = document.getElementById('sliderG');
        const sliderB = document.getElementById('sliderB');
        const valueR = document.getElementById('valueR');
        const valueG = document.getElementById('valueG');
        const valueB = document.getElementById('valueB');
        const hoverInfoContainer = document.getElementById('hoverInfoContainer');
        const hoverPreviewBox = document.getElementById('hoverPreviewBox');
        const hoverRawValue = document.getElementById('hoverRawValue');
        const hoverPaletteIndex = document.getElementById('hoverPaletteIndex');
        const hoverHexValue = document.getElementById('hoverHexValue');
        const hoverByte1 = document.getElementById('hoverByte1');
        const hoverByte2 = document.getElementById('hoverByte2');
        const paletteSizeSelect = document.getElementById('paletteSizeSelect');
        const mergePaletteButton = document.getElementById('mergePaletteButton');
        // Add 9-bit display refs
        const primaryR9Value = document.getElementById('primaryR9Value');
        const primaryG9Value = document.getElementById('primaryG9Value');
        const primaryB9Value = document.getElementById('primaryB9Value');
        const primaryPriorityFlag = document.getElementById('primaryPriorityFlag');
        const savePaletteButton = document.getElementById('savePaletteButton');
        const spriteBrushSelect = document.getElementById('spriteBrushSelect');

        const domElements = {
            scaleSlider, scaleValue, gridCheckbox, paletteOffsetInput, spriteListContainer,
            mainSpriteDetailContainer, palettePicker, saveButton, viewModeSelect,
            loadPaletteButton, paletteStatusSpan, useDefaultPaletteButton, primaryColorIndexSpan,
            primaryPreviewBox, primaryHexValueSpan, secondaryColorIndexSpan, secondaryPreviewBox,
            secondaryHexValueSpan, colorPickerInput, reloadDataButton, sliderR, sliderG, sliderB,
            valueR, valueG, valueB, hoverInfoContainer, hoverPreviewBox, hoverRawValue,
            hoverPaletteIndex, hoverHexValue, paletteSizeSelect, mergePaletteButton,
            // Add 9-bit refs
            primaryR9Value, primaryG9Value, primaryB9Value, primaryPriorityFlag, savePaletteButton,
            hoverByte1, hoverByte2,
            spriteBrushSelect
        };

        // Initialize central state (using smallInitialState initially)
        appState.spriteData = null; // <<< Initialize spriteData as null
        appState.viewState = initialData.viewState;
        appState.palette.isCustom = initialData.isCustomPaletteMode;
        appState.palette.current = initialData.palette; // Assuming initialData.palette is {hex, priority}[]
        appState.palette.default = initialData.defaultPalette; // Store default
        appState.selection.primaryColorIndex = 0; 
        appState.selection.secondaryColorIndex = 0; 
        appState.editor.isDirty = initialData.viewState?.isDirty ?? false;
        // Log the palette state *after* initialization
        console.log(`[Webview Init] Initialized appState.palette.current. isCustom: ${appState.palette.isCustom}. First 5 entries: ${JSON.stringify(appState.palette.current?.slice(0, 5))}`);
        console.log(`[Webview Init] Stored appState.palette.default. First 5 entries: ${JSON.stringify(appState.palette.default?.slice(0, 5))}`);

        // Update UI based on initial state
        console.log("[Webview Init] Updating UI elements from initial state..."); // <<< ADDED LOG
        if (scaleSlider) scaleSlider.value = appState.viewState.scale.toString();
        if (scaleValue) scaleValue.textContent = appState.viewState.scale + 'x';
        if (gridCheckbox) gridCheckbox.checked = appState.viewState.showGrid;
        if (paletteOffsetInput) {
            const offsetBank = Math.floor(appState.viewState.paletteOffset / 16); // Calculate bank from offset
            paletteOffsetInput.value = offsetBank.toString(); 
            paletteOffsetInput.disabled = !['sprite4', 'tile8x8'].includes(appState.viewState.mode);
        }
        if (viewModeSelect) viewModeSelect.value = appState.viewState.mode;
        if (paletteStatusSpan) {
            const paletteName = initialData.paletteName; // Get name from initial data
            paletteStatusSpan.textContent = appState.palette.isCustom ? `Palette: ${paletteName}` : 'Default palette';
            paletteStatusSpan.title = appState.palette.isCustom ? paletteName : '';
        }

        // Initialize save button states
        if (saveButton) {
            saveButton.disabled = !appState.editor.isDirty;
            saveButton.classList.toggle('save-button-dirty', appState.editor.isDirty);
        }
        
        if (savePaletteButton) { 
             savePaletteButton.disabled = !appState.palette.isCustom;
            savePaletteButton.classList.toggle('save-button-dirty', appState.palette.isDirty);
        }

        // Initialize palette size dropdown
        if (paletteSizeSelect) {
            paletteSizeSelect.value = appState.palette.visibleSize.toString();
        }

        // Define utils object to pass to event handlers
        const utils = {
            isDefaultPaletteActive: isDefaultPaletteActive,
            requestFullRedraw: requestFullRedraw,
            requestPaletteRedraw: requestPaletteRedraw,
            sendColorUpdateToExtension: sendColorUpdateToExtension,
            updateColorPreviews: updateColorPreviews,
            swapPixelIndices: swapPixelIndices,
            updateEditorPanel: updateEditorPanel,
            getDisplayColorIndex: getDisplayColorIndex,
            markAsDirty: markAsDirty,
            selectPrimaryColor: selectPrimaryColor,
            selectSecondaryColor: selectSecondaryColor,
            hexToRgb9: hexToRgb9, // Pass through palette utils
            rgb9ToHex: rgb9ToHex,
            rgbStringToHex: rgbStringToHex
        };

        // Initial UI render
        console.log("[Webview Init] Rendering palette picker..."); // <<< ADDED LOG
        populatePalettePicker(palettePicker, appState.palette, appState.selection, isDefaultPaletteActive(), selectPrimaryColor, selectSecondaryColor, vscode);
        console.log(`[Webview JS - initializeUI] After populatePalettePicker, #palettePicker has ${palettePicker?.childElementCount || 0} children.`); // Log swatch count
        console.log("[Webview Init] Rendering sprite grid..."); // <<< ADDED LOG
        redrawSpriteGrid(spriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState);
        console.log("[Webview Init] Rendering detail view..."); // <<< ADDED LOG
        redrawDetailView(mainSpriteDetailContainer, appState.spriteData, appState.viewState, appState.palette.current, isDefaultPaletteActive());

        // Select initial colors
        console.log("[Webview Init] Selecting initial colors..."); // <<< ADDED LOG
        selectPrimaryColor(0);
        selectSecondaryColor(1);

        // Set initial dirty state for save button
        if (saveButton) {
            saveButton.disabled = !appState.editor.isDirty;
            saveButton.classList.toggle('save-button-dirty', appState.editor.isDirty);
        }

        // Request full sprite data from the provider
        console.log("[Webview Init] Requesting full sprite data..."); // <<< ADDED LOG
        vscode.postMessage({ command: 'requestFullSpriteData' }); // <<< ADDED REQUEST

        // Setup all event listeners, passing necessary dependencies
        console.log("[Webview Init] Calling setupEventListeners...");
        setupEventListeners(appState, domElements, utils, vscode);
        
        // Force focus on the document to ensure keyboard events work right away
        setTimeout(() => {
            console.log("[Webview Init] Setting focus to make keyboard navigation work");
            document.body.focus();
            
            // Make sure all containers are also focusable
            const mainContainer = document.getElementById('mainContentContainer');
            if (mainContainer) {
                mainContainer.setAttribute('tabindex', '0');
                mainContainer.focus();
            }
            
            // Also make the sprite detail container focusable
            const detailContainer = document.querySelector('.detail-container');
            if (detailContainer) {
                detailContainer.setAttribute('tabindex', '0');
            }
            
            // Log key event status
            console.log("[Webview Init] Keyboard handlers ready. Press arrow keys to navigate.");
        }, 300);

        console.log("[Webview Init] >>> initializeUI END"); // <<< ADDED LOG
    }
    // --- End Initial UI Setup ---

    // --- Message Handling from Extension --- 
    window.addEventListener('message', async e => {
        const message = e.data;
        
        // Handle messages from extension
        switch (message.command) {
            case 'initialize': 
                console.log('[Webview JS] Received initialize');
                // Initialize application state with data from extension
                if (message.initialState) {
                    // Note: initialState now EXCLUDES spriteData
                    appState.viewState = message.initialState.viewState;
                    appState.palette.current = message.initialState.palette;
                    appState.palette.isCustom = message.initialState.isCustomPaletteMode;
                    appState.palette.default = message.initialState.defaultPalette;
                    appState.editor.isDirty = message.initialState.viewState.isDirty; 
                    // Now initialize the UI with the loaded state (spriteData is still null)
                    initializeUI(); 
                } else {
                    // Handle case where initial state might be missing
                    console.error('[Webview JS] Received initialize message but initialState is missing!');
                    document.body.innerHTML = '<div class="error-message">Error: Missing initial state from extension.</div>';
                }
                break;
            case 'fullSpriteData': // <<< NEW HANDLER
                console.log('[Webview JS] Received fullSpriteData');
                if (message.spriteData) {
                    appState.spriteData = message.spriteData;
                    console.log(`[Webview JS] Stored full sprite data (${appState.spriteData.count} sprites).`);
                    // --- FIX: Ensure viewState exists before redrawing ---
                    if (appState.viewState) {
                        console.log("[Webview JS] viewState exists, triggering redraw.");
                        updateDetailPixelSizeCss(); // Call after spriteData is available
                        requestFullRedraw(); // Redraw UI now that we have sprite data AND viewState
                    } else {
                        console.warn("[Webview JS] Received fullSpriteData but viewState is still null. Redraw deferred.");
                        // Redraw will happen naturally when initializeUI completes if it hasn't already.
                    }
                    // --- END FIX ---
                } else {
                    console.error('[Webview JS] Received fullSpriteData message but spriteData is missing!');
                    // Optionally display an error in the UI
                }
                break;
            case 'getViewState':
                console.log('[Webview JS] Responding to getViewState request');
                // Send the current view state back to the extension
                if (appState.viewState) {
                    vscode.postMessage({
                        command: 'viewStateResponse',
                        viewState: {
                            mode: appState.viewState.mode,
                            paletteOffset: appState.viewState.paletteOffset,
                            scale: appState.viewState.scale,
                            showGrid: appState.viewState.showGrid,
                            currentSprite: appState.viewState.currentSprite
                        }
                    });
                }
                break;
            case 'viewSprite':
                // Reset fill mode when changing sprites
                if (window.localState && window.localState.isFillModeActive) {
                    // Find the fill button and simulate a click to toggle it off
                    const fillButton = document.querySelector('#transformControls button[data-action="fill"]');
                    if (fillButton) {
                        // Call handleTransform directly if it's available globally
                        if (typeof handleTransform === 'function') {
                            handleTransform('fill');
                        } else {
                            // Otherwise, simulate a click
                            fillButton.click();
                        }
                    }
                    
                    // Also manually reset the state and styling as a fallback
                    const mainSpriteDetailContainer = document.querySelector('.detail-container');
                    if (mainSpriteDetailContainer) {
                        mainSpriteDetailContainer.classList.remove('fill-mode');
                        mainSpriteDetailContainer.style.cursor = '';
                    }
                    if (window.localState) {
                        window.localState.isFillModeActive = false;
                    }
                }
                break;
            case 'update':
                console.log("[Webview Message] >>> Received 'update' message", message); // <<< ADDED LOG
                try {
                    let isReloadUpdate = false; // Flag to track if this update comes from a reload
                    if (message.viewState) {
                        appState.viewState = message.viewState;
                        appState.editor.isDirty = message.viewState.isDirty;
                        
                        // Update UI elements tied to viewState
                        if (document.getElementById('paletteOffset')) {
                            document.getElementById('paletteOffset').value = Math.floor(message.viewState.paletteOffset / 16);
                            document.getElementById('paletteOffset').disabled = !['sprite4', 'tile8x8'].includes(message.viewState.mode);
                        }
                        if (document.getElementById('viewMode')) {
                            document.getElementById('viewMode').value = message.viewState.mode;
                        }
                        if (document.getElementById('scaleSlider')) {
                             document.getElementById('scaleSlider').value = message.viewState.scale.toString();
                        }
                        if (document.getElementById('scaleValue')) {
                             document.getElementById('scaleValue').textContent = message.viewState.scale + 'x';
                        }
                        if (document.getElementById('showGrid')) {
                             document.getElementById('showGrid').checked = message.viewState.showGrid;
                        }
                        // Update save button state
                        const saveButton = document.getElementById('saveButton');
                        if (saveButton) {
                             saveButton.disabled = !message.viewState.isDirty;
                             saveButton.classList.toggle('save-button-dirty', message.viewState.isDirty);
                        }
                        // Update sprite brush select if it exists and the value differs
                        const currentSpriteBrushSelect = document.getElementById('spriteBrushSelect');
                        if (currentSpriteBrushSelect && message.viewState.spriteBrush) {
                            const brushValue = `${message.viewState.spriteBrush.width}x${message.viewState.spriteBrush.height}`;
                            if (currentSpriteBrushSelect.value !== brushValue) {
                                currentSpriteBrushSelect.value = brushValue;
                            }
                        }
                    }
                    if (message.spriteData) {
                        isReloadUpdate = true; // Assume spriteData update means reload
                        appState.spriteData = message.spriteData;
                        // If this is from a reload, re-enable the reload button
                        const reloadButton = document.getElementById('reloadDataButton');
                        if (reloadButton) {
                            if (reloadButton.disabled) {
                                reloadButton.textContent = "Reload Sprite Data";
                                reloadButton.disabled = false;
                            } 
                        } 
                    } 
                    if (message.palette) {
                        appState.palette.current = message.palette;
                        appState.palette.isCustom = true; // Palette update implies custom
                         const paletteStatusSpan = document.getElementById('paletteStatus');
                        if (paletteStatusSpan && message.paletteName) paletteStatusSpan.textContent = 'Palette: ' + message.paletteName;
                        const savePaletteButton = document.getElementById('savePaletteButton');
                        if (savePaletteButton) savePaletteButton.disabled = false; // Enable save if custom palette loaded
                        
                        // Make sure to update the primary color display to reflect potential priority bit changes
                        refreshPrimaryColorDisplay();
                    } else if (message.hasOwnProperty('palette') && message.palette === null) {
                         // Handle switching back to default palette
                         appState.palette.current = appState.palette.default || [];
                         appState.palette.isCustom = false;
                         const paletteStatusSpan = document.getElementById('paletteStatus');
                         if (paletteStatusSpan) paletteStatusSpan.textContent = 'Default palette';
                         const savePaletteButton = document.getElementById('savePaletteButton');
                         if (savePaletteButton) savePaletteButton.disabled = true; // Disable save for default
                         
                         // Make sure to update the primary color display to reflect priority bit changes
                         refreshPrimaryColorDisplay();
                    }
                    
                    // Update detail pixel size based on brush (and potentially new sprite data from reload)
                    // This replaces the previous inline logic for this
                    updateDetailPixelSizeCss();
                    
                    // Validate current sprite index after potential reload
                    if (appState.viewState && appState.spriteData && 
                        typeof appState.viewState.currentSprite === 'number') {
                        if (appState.viewState.currentSprite >= appState.spriteData.count) {
                            const oldIndex = appState.viewState.currentSprite;
                            const newIndex = Math.max(0, appState.spriteData.count - 1);
                            appState.viewState.currentSprite = newIndex;
                        } 
                    } 
                    
                    // Full redraw
                    console.log("[Webview Message] --- Calling requestFullRedraw after 'update'"); // <<< ADDED LOG
                    requestFullRedraw();
                    console.log("[Webview Message] --- Returned from requestFullRedraw after 'update'"); // <<< ADDED LOG
                } catch (error) {
                    console.error('[Webview JS] Error handling update message:', error);
                    // Display an error message in the UI if possible
                    const errorContainer = document.createElement('div');
                    errorContainer.className = 'error-message';
                    errorContainer.textContent = `Error updating UI: ${error.message}. Try reopening the file.`;
                    document.body.prepend(errorContainer);
                }
                break;
            case 'changesSaved':
                console.log('[Webview JS] Changes saved');
                if (message.isPaletteChange) {
                    // Handle palette save
                    appState.palette.isDirty = false;
                    const savePaletteButton = document.getElementById('savePaletteButton');
                    if (savePaletteButton) {
                        savePaletteButton.classList.remove('save-button-dirty');
                 }
                } else {
                    // Handle sprite save
                    appState.editor.isDirty = false;
                    const saveButton = document.getElementById('saveButton');
                    if (saveButton) {
                        saveButton.disabled = true;
                        saveButton.classList.remove('save-button-dirty');
                    }
                }
                break;
            case 'spritePasted':
                // Handle specifically targeted update for pasted sprite
                if (message.targetIndex !== undefined && message.pixels && appState.spriteData && appState.spriteData.sprites) {
                    const spriteToUpdate = appState.spriteData.sprites.find(s => s.index === message.targetIndex);
                    if (spriteToUpdate) {
                        // Replace only the pixel data
                        spriteToUpdate.pixels = message.pixels;
                        // Redraw just the sprite grid
                        const currentSpriteListContainer = document.querySelector('.sprites-grid');
                        redrawSpriteGrid(currentSpriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState);
                        
                        // If this is the currently viewed sprite, also update detail view
                        if (message.targetIndex === appState.viewState.currentSprite) {
                            const currentMainSpriteDetailContainer = document.querySelector('.detail-container');
                            redrawDetailView(currentMainSpriteDetailContainer, appState.spriteData, appState.viewState, appState.palette.current, !appState.palette.isCustom);
                        }
                        
                        // Mark as dirty
                        appState.editor.isDirty = true;
                     const saveButton = document.getElementById('saveButton');
                     if (saveButton) {
                         saveButton.disabled = false;
                         saveButton.classList.add('save-button-dirty');
                     }
                    }
                }
                break;
            case 'markAsWebviewDirty':
                // Just mark the webview as dirty (e.g., after adding/removing sprites)
                     appState.editor.isDirty = true;
                const saveButtonDirty = document.getElementById('saveButton');
                if (saveButtonDirty) {
                    saveButtonDirty.disabled = false;
                    saveButtonDirty.classList.add('save-button-dirty');
                }
                break;
            case 'dragStarted':
                // Track drag state for color swatches
                const { index, isSwapping } = message;
                console.log(`[Webview JS] Drag started for color ${index}, swapping: ${isSwapping}`);
                if (typeof index === 'number') {
                    // Store this in a local state object accessible to the global scope
                    window.dragState = {
                        sourceIndex: index,
                        isSwapping: !!isSwapping
                    };
                 }
                 break;
            case 'spriteSelected':
                console.log(`[Webview Message] Received spriteSelected for index ${message.currentSpriteIndex}`);
                
                if (appState.viewState) {
                    // Update the current sprite index in viewState
                    appState.viewState.currentSprite = message.currentSpriteIndex;
                    
                    // Call the CSS update function as the selected sprite (and its base dimensions) might have changed
                    updateDetailPixelSizeCss(); 

                    // Redraw the sprite grid to update selection and brush highlights
                    const currentSpriteListContainer = document.querySelector('.sprites-grid');
                    if (currentSpriteListContainer && appState.spriteData) {
                        redrawSpriteGrid(currentSpriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState);
                    }

                    // Only update what's necessary:
                    
                    // 1. Update the selected sprite in the grid
                    // const allSpriteBoxes = document.querySelectorAll('.sprite-box');
                    // allSpriteBoxes.forEach(box => {
                    //     const boxIndex = parseInt(box.dataset.index, 10);
                    //     if (boxIndex === message.currentSpriteIndex) {
                    //         box.classList.add('selected');
                    //     } else {
                    //         box.classList.remove('selected');
                    //     }
                    // });
                    
                    // 2. Update only the detail view with the new sprite
                    const detailContainer = document.querySelector('.detail-container');
                    if (detailContainer && appState.spriteData) {
                        redrawDetailView(
                            detailContainer, 
                            appState.spriteData, 
                            appState.viewState, 
                            appState.palette.current, 
                            !appState.palette.isCustom
                        );
                    }
                    
                    // 3. Update detail title
                    const detailTitle = document.querySelector('.sprite-detail h2');
                    if (detailTitle) {
                        detailTitle.textContent = `Sprite ${message.currentSpriteIndex} Detail`;
                    }
                }
                break;
            case 'highlightDuplicates':
                if (message.duplicates && Array.isArray(message.duplicates)) {
                    console.log(`[Webview JS] Received ${message.duplicates.length} duplicates to highlight`);
                    highlightDuplicateSprites(message.duplicates);
                } else {
                    console.error('[Webview JS] Received highlightDuplicates but data is invalid');
                }
                break;
            default:
                console.log('[Webview JS] Unhandled message:', message);
        }
    });

    // Function to highlight duplicate sprites in the grid
    function highlightDuplicateSprites(duplicates) {
        // Get all sprite boxes
        const spriteBoxes = document.querySelectorAll('.sprite-box');
        
        // Clear any existing highlights first
        spriteBoxes.forEach(box => {
            box.classList.remove('duplicate-exact');
            box.classList.remove('duplicate-flipped');
            box.classList.remove('duplicate-rotated');
            box.removeAttribute('data-original');
            box.removeAttribute('data-match-type');
        });
        
        // Add highlights for duplicates
        duplicates.forEach(duplicate => {
            const originalBox = document.querySelector(`.sprite-box[data-index="${duplicate.originalIndex}"]`);
            const duplicateBox = document.querySelector(`.sprite-box[data-index="${duplicate.duplicateIndex}"]`);
            
            if (originalBox) {
                originalBox.classList.add('original-sprite');
            }
            
            if (duplicateBox) {
                // Add highlight class based on match type
                switch (duplicate.matchType) {
                    case 'exact':
                        duplicateBox.classList.add('duplicate-exact');
                        break;
                    case 'flippedH':
                    case 'flippedV':
                        duplicateBox.classList.add('duplicate-flipped');
                        break;
                    case 'rotated180':
                        duplicateBox.classList.add('duplicate-rotated');
                        break;
                }
                
                // Store original reference and match type
                duplicateBox.setAttribute('data-original', duplicate.originalIndex);
                duplicateBox.setAttribute('data-match-type', duplicate.matchType);
                
                // Add tooltip
                duplicateBox.title = `Duplicate of sprite #${duplicate.originalIndex} (${duplicate.matchType})`;
            }
        });
    }

})(); // End IIFE 