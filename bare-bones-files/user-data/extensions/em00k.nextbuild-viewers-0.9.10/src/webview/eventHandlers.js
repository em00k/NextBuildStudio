/* eslint-disable curly */
// src/webview/eventHandlers.js
console.log("[Webview Handlers] eventHandlers.js script started"); // Log script start

// Import necessary functions if needed
import { floodFill, flipVertical, flipHorizontal, scrollVertical, scrollHorizontal, rotateClockwise, rotateCounterClockwise } from '../drawingUtils';
import { redrawDetailView } from './spriteRenderer.js'; // Import the redrawDetailView function
import { hexToRgb9, rgb9ToHex, rgb9ToBytes, bytesToRgb9, rgbStringToHex } from '../paletteUtils';
import { redrawSpriteGrid } from './spriteRenderer.js'; // Import the redrawSpriteGrid function

// This module encapsulates event handling logic for the sprite viewer webview.

// --- State and Dependencies --- 
// These will be passed in or accessed via a context object
let localState = {
    isDrawing: false,
    lastDrawnPixelIndex: -1,
    draggedIndex: -1,
    draggedSpriteIndex: -1, // Added for sprite dragging
    drawButton: 0, 
    editTimeout: null, 
    isCopyingColor: false, 
    colorCopySourceIndex: -1, 
    colorUpdateTimeout: null, 
    lastMessageTime: 0, 
    isSwappingColor: false, 
    currentlyHoverHighlightedIndex: -1,
    isFillModeActive: false,
    // Add state for Ctrl+LMB drag swapping
    ctrlDragActive: false,
    ctrlDragSourceIndex: -1,
    ctrlDragTargetIndex: -1,
    dragDisabledSwatch: null, // Store swatch element when disabling draggable
    // Add state for tracking 'c' key for color replacement
    isColorReplaceActive: false
};

let appState = {}; // Will hold the main application state object
let domElements = {}; // Will hold references to DOM elements
let utils = {}; // Will hold utility functions like markAsDirty, selectPrimaryColor, etc.
let vscode = null; // Reference to vscode API object

// --- Event Handler Definitions --- 

// --- Add the color replacement function ---
function replaceColorInSprite(sourceColorIndex, targetColorIndex, spriteIndex) {
    if (!appState.spriteData || !appState.spriteData.sprites || 
        spriteIndex < 0 || spriteIndex >= appState.spriteData.sprites.length) {
        return false;
    }
    
    const sprite = appState.spriteData.sprites[spriteIndex];
    let colorChanged = false;
    
    // Replace all instances of sourceColorIndex with targetColorIndex
    for (let i = 0; i < sprite.pixels.length; i++) {
        if (sprite.pixels[i] === sourceColorIndex) {
            sprite.pixels[i] = targetColorIndex;
            colorChanged = true;
        }
    }
    
    return colorChanged;
}

function handleDragStart(event) {
    const swatch = event.target;
    localState.draggedIndex = parseInt(swatch.dataset.colorIndex, 10);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', localState.draggedIndex.toString());
    swatch.classList.add('dragging');
    localState.isSwappingColor = event.ctrlKey;
    // console.log(`[Webview Handlers] Drag Start: index=${localState.draggedIndex}, isSwapping=${localState.isSwappingColor}`); 
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetSwatch = event.target.closest('.color-swatch');
    if (targetSwatch && parseInt(targetSwatch.dataset.colorIndex, 10) !== localState.draggedIndex) {
        targetSwatch.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const targetSwatch = event.target.closest('.color-swatch');
     if (targetSwatch) {
        targetSwatch.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    const targetSwatch = event.target.closest('.color-swatch');
    const sourceIndex = localState.draggedIndex;
    let targetIndex = -1;
    
    if (targetSwatch) {
        targetIndex = parseInt(targetSwatch.dataset.colorIndex, 10);
        targetSwatch.classList.remove('drag-over');
    }

    const draggingElement = document.querySelector('.color-swatch.dragging');
     
    if (draggingElement) draggingElement.classList.remove('dragging');
    
    // Log the drop operation details
    console.log(`[Webview Handlers] Drop event - source=${sourceIndex}, target=${targetIndex}, swapping=${localState.isSwappingColor}`);
    
    if (targetIndex === -1 || sourceIndex === -1 || targetIndex === sourceIndex) {
        console.log('[Webview Handlers] Drop cancelled: Invalid indices or dropped on self.');
        localState.isSwappingColor = false;
        localState.draggedIndex = -1;
        return; 
    }
    
    if (utils.isDefaultPaletteActive()) {
        vscode.postMessage({ command: 'promptEditDefaultPalette' });
        localState.isSwappingColor = false;
        localState.draggedIndex = -1;
        return;
    }
    
    // Ensure target index is within the 256-color limit
    if (targetIndex >= 256) {
        console.log('[Webview Handlers] Drop cancelled: Target index beyond 256-color limit.');
        localState.isSwappingColor = false;
        localState.draggedIndex = -1;
        return;
    }
    
    if (localState.isSwappingColor) {
        // Swap Logic 
        if (sourceIndex < appState.palette.current.length && targetIndex < 256) {
            console.log('[Webview Handlers] Performing color and pixel swap.');
            
            // First store the colors for swapping
            const sourceColor = { ...appState.palette.current[sourceIndex] };
            
            // If we're swapping to a palette index beyond what's loaded, create a black color there
            if (targetIndex >= appState.palette.current.length) {
                // Create a new color at the target position if needed
                while (appState.palette.current.length <= targetIndex) {
                    appState.palette.current.push({ hex: '#000000', priority: false });
                }
                console.log(`[Webview Handlers] Extended palette to index ${targetIndex}`);
            }
            
            const targetColor = { ...appState.palette.current[targetIndex] };
            
            // Now perform the swap in the local palette
            appState.palette.current[sourceIndex] = targetColor;
            appState.palette.current[targetIndex] = sourceColor;
            
            // Swap pixel indices in sprites
            const modifiedSpriteIndices = utils.swapPixelIndices(sourceIndex, targetIndex);
            
            // Update UI - mark sprite as dirty because pixel values change
            utils.markAsDirty(false); // false = this is a sprite change
            
            // Send message to extension to sync state
            vscode.postMessage({
                command: 'paletteSwap', 
                indexA: sourceIndex,
                indexB: targetIndex,
                newColorA: appState.palette.current[sourceIndex],
                newColorB: appState.palette.current[targetIndex]
            });
            
            // Send updated sprite data
            modifiedSpriteIndices.forEach(spriteIdx => {
                if (appState.spriteData && appState.spriteData.sprites && appState.spriteData.sprites[spriteIdx]) {
                     vscode.postMessage({
                         command: 'updateSpritePixels',
                         spriteIndex: spriteIdx,
                         pixels: appState.spriteData.sprites[spriteIdx].pixels,
                         skipVsCodeDirtyNotification: true
                     });
                }
            });
            
            // Redraw the UI
            utils.requestFullRedraw();
        }
    } else {
        // Move Logic - only affects palette order, not sprite pixels
        if (sourceIndex < appState.palette.current.length && targetIndex < 256) {
            console.log('[Webview Handlers] Performing palette color move.');
            
            // Copy the source color
            const sourceColor = { ...appState.palette.current[sourceIndex] };
            
            // If we're moving to a palette index beyond what's loaded, extend the palette
            if (targetIndex >= appState.palette.current.length) {
                // Create new black colors to pad the palette up to the target index
                while (appState.palette.current.length <= targetIndex) {
                    appState.palette.current.push({ hex: '#000000', priority: false });
                }
                console.log(`[Webview Handlers] Extended palette to index ${targetIndex}`);
            }
            
            // Splice it out and in at the target position
            appState.palette.current.splice(sourceIndex, 1);
            appState.palette.current.splice(targetIndex, 0, sourceColor);
            
            // Update UI - mark only palette as dirty since this doesn't affect pixel values
            utils.markAsDirty(true); // true = this is a palette-only change
            
            // Send message to extension to sync state
            vscode.postMessage({
                command: 'updatePaletteOrder',
                palette: appState.palette.current
            });
            
            // Redraw the UI
            utils.requestFullRedraw();
        }
    }
    
    // Reset state
    localState.isSwappingColor = false;
    localState.draggedIndex = -1;
}

function handleDragEnd(event) {
     if(event.target && event.target.classList) { 
        event.target.classList.remove('dragging');
     }
     document.querySelectorAll('.color-swatch.drag-over').forEach(sw => sw.classList.remove('drag-over'));
     localState.draggedIndex = -1;
     localState.isSwappingColor = false;
     console.log('[Webview Handlers] Drag ended, reset draggedIndex and isSwappingColor');
}

function handleColorUpdate() {
    // console.log(`[Webview Handlers] handleColorUpdate START - editorColorIndex: ${appState?.selection?.editorColorIndex}`); // <<< REMOVE LOG
    if (utils.isDefaultPaletteActive()) {
        vscode.postMessage({ command: 'promptEditDefaultPalette' });
        utils.updateEditorPanel(appState.selection.editorColorIndex);
        return;
    }
    const editorActiveIndex = appState.selection.editorColorIndex;
    // --- FIX: Ensure index is valid before proceeding --- 
    if (editorActiveIndex < 0) {
        console.warn("[Webview Handlers] handleColorUpdate: Invalid editorActiveIndex", editorActiveIndex);
        return;
    }
    // --- END FIX ---

    const r9 = parseInt(domElements.sliderR.value, 10);
    const g9 = parseInt(domElements.sliderG.value, 10);
    const b9 = parseInt(domElements.sliderB.value, 10);
    const newHexColor = utils.rgb9ToHex(r9, g9, b9);
    // console.log(`[Webview Handlers] handleColorUpdate - Calculated newHexColor: ${newHexColor}`); // <<< REMOVE LOG
    
    // --- FIX: Update appState, call previews and extension update --- 
    // Extend palette if needed (e.g., editing beyond current length)
    // console.log(`[Webview Handlers] handleColorUpdate - Before palette extend loop. Current length: ${appState.palette.current?.length}`); // <<< REMOVE LOG
    while (appState.palette.current.length <= editorActiveIndex) {
        appState.palette.current.push({ hex: '#000000', priority: false });
    }
    // console.log(`[Webview Handlers] handleColorUpdate - After palette extend loop. New length: ${appState.palette.current?.length}`); // <<< REMOVE LOG
    
    // Update the hex value in the appState
    // console.log(`[Webview Handlers] handleColorUpdate - Before updating appState hex for index ${editorActiveIndex}`); // <<< REMOVE LOG
    appState.palette.current[editorActiveIndex].hex = newHexColor;
    // console.log(`[Webview Handlers] handleColorUpdate - After updating appState hex for index ${editorActiveIndex}`); // <<< REMOVE LOG
    
    // Update UI previews (swatch, L/R boxes, detail/grid pixels)
    // console.log(`[Webview Handlers] handleColorUpdate - Before calling updateColorPreviews`); // <<< REMOVE LOG
    utils.updateColorPreviews(editorActiveIndex, newHexColor);
    // console.log(`[Webview Handlers] handleColorUpdate - After calling updateColorPreviews`); // <<< REMOVE LOG
    
    // Update the text/color picker input (redundant with updateEditorPanel, but safe)
     
    if (domElements.colorPickerInput) domElements.colorPickerInput.value = newHexColor;
    if (domElements.primaryColorHexInput) domElements.primaryColorHexInput.value = newHexColor; 
    
    // Mark palette as dirty and send update to extension (throttled)
    // Note: sendColorUpdateToExtension handles marking dirty
    // console.log(`[Webview Handlers] handleColorUpdate - Before calling sendColorUpdateToExtension (throttled)`); // <<< REMOVE LOG
    const now = Date.now();
    if (now - localState.lastMessageTime >= 100) {
        utils.sendColorUpdateToExtension(editorActiveIndex, newHexColor); // Remove skipDirty flag
        localState.lastMessageTime = now;
    } else {
        if (localState.colorUpdateTimeout) {
            clearTimeout(localState.colorUpdateTimeout);
        }
        localState.colorUpdateTimeout = setTimeout(() => {
            utils.sendColorUpdateToExtension(editorActiveIndex, newHexColor); // Remove skipDirty flag
            localState.lastMessageTime = Date.now();
        }, 100);
    }
    // console.log(`[Webview Handlers] handleColorUpdate - After calling sendColorUpdateToExtension (throttled)`); // <<< REMOVE LOG
    // --- END FIX ---
}

function drawPixel(event, button) { // topLeftSpriteIndex might not be directly needed here anymore for drawing logic itself
    if (!localState.isDrawing && event.type === 'mousemove') return;

    const clickedCompositePixel = event.target.closest('.detail-pixel');
    if (!clickedCompositePixel || !appState.spriteData || !appState.palette.current) return;

    const originalSpriteIndex = parseInt(clickedCompositePixel.dataset.originalSpriteIndex, 10);
    const localPixelIndex = parseInt(clickedCompositePixel.dataset.localPixelIndex, 10);
    // const compositePixelIndex = parseInt(clickedCompositePixel.dataset.compositePixelIndex, 10);

    if (isNaN(originalSpriteIndex) || isNaN(localPixelIndex) || originalSpriteIndex < 0 || originalSpriteIndex >= appState.spriteData.count) {
        console.warn("[DrawPixel] Invalid data attributes on clicked pixel or sprite index out of bounds.", clickedCompositePixel.dataset);
        return;
    }

    const spriteToModify = appState.spriteData.sprites[originalSpriteIndex];
    if (!spriteToModify || localPixelIndex < 0 || localPixelIndex >= spriteToModify.pixels.length) {
        console.warn("[DrawPixel] Sprite to modify not found or local pixel index out of bounds.");
        return;
    }

    let selectedPaletteIndex = button === 2 ? appState.selection.secondaryColorIndex : appState.selection.primaryColorIndex;
    let valueToStore;

    if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
        const baseOffset = appState.viewState.paletteOffset;
        if (selectedPaletteIndex >= baseOffset && selectedPaletteIndex < baseOffset + 16) {
            valueToStore = selectedPaletteIndex - baseOffset;
        } else {
            vscode.postMessage({
                command: 'showColorOutOfBankWarning',
                selectedColorIndex: selectedPaletteIndex,
                paletteOffset: baseOffset,
                mode: appState.viewState.mode
            });
            return;
        }
    } else {
        valueToStore = selectedPaletteIndex;
    }

    if (spriteToModify.pixels[localPixelIndex] !== valueToStore) {
        spriteToModify.pixels[localPixelIndex] = valueToStore;

        const displayIndex = utils.getDisplayColorIndex(valueToStore);
        const colorEntry = appState.palette.current[displayIndex];
        const hexColor = colorEntry?.hex || '#FF00FF';

        // Update the clicked pixel in the composite detail view
        clickedCompositePixel.style.backgroundColor = hexColor;

        // Update the corresponding pixel in the main sprite grid
        const gridPixelBox = domElements.spriteListContainer?.querySelector(`.sprite-box[data-index="${originalSpriteIndex}"]`);
        const gridPixel = gridPixelBox?.querySelector(`.sprite-container .sprite-pixel:nth-child(${localPixelIndex + 1})`);
        if (gridPixel) gridPixel.style.backgroundColor = hexColor;

        // Debounce message sending
        if (localState.editTimeout) clearTimeout(localState.editTimeout);
        localState.editTimeout = setTimeout(() => {
                            vscode.postMessage({ 
                    command: 'updateSpritePixels', 
                    spriteIndex: originalSpriteIndex, 
                    pixels: spriteToModify.pixels,
                    skipVsCodeDirtyNotification: true 
                });
                // Don't notify VSCode of dirty state - only use internal state
        }, 250);

        if (!appState.editor.isDirty) {
            const saveButton = document.getElementById('saveButton');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.classList.add('save-button-dirty');
            }
            appState.editor.isDirty = true;
        }
    }
    // localState.lastDrawnPixelIndex = localPixelIndex; // Still useful if drawing continues on same sprite
}

function handleDetailGridHover(event) {
    if (localState.isDrawing) return;
    if (!appState.spriteData || appState.spriteData.sprites.length === 0 || !appState.palette.current) return;
    
    const spriteIndex = appState.viewState.currentSprite;
    const currentSprite = appState.spriteData.sprites[spriteIndex];
    if (!currentSprite) return;

    const spriteWidth = currentSprite.width;
    const spriteHeight = currentSprite.height;
    let pixelDisplaySize = 18;
    try {
        const sizeString = getComputedStyle(document.documentElement).getPropertyValue('--detail-pixel-size').trim();
        if (sizeString.endsWith('px')) pixelDisplaySize = parseInt(sizeString, 10);
        if (isNaN(pixelDisplaySize) || pixelDisplaySize <= 0) pixelDisplaySize = 18;
    } catch (e) { pixelDisplaySize = 18; }

    const rect = domElements.mainSpriteDetailContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pixelX = Math.floor(x / pixelDisplaySize);
    const pixelY = Math.floor(y / pixelDisplaySize);
    const pixelIndex = pixelY * spriteWidth + pixelX;

    if (localState.currentlyHoverHighlightedIndex !== -1) {
        const prevSwatch = domElements.palettePicker?.querySelector(`.color-swatch[data-color-index="${localState.currentlyHoverHighlightedIndex}"]`);
        prevSwatch?.classList.remove('hover-highlight');
        localState.currentlyHoverHighlightedIndex = -1;
    }

    if (pixelX >= 0 && pixelX < spriteWidth && pixelY >= 0 && pixelY < spriteHeight) {
        const rawValue = currentSprite.pixels[pixelIndex];
        const finalPaletteIndex = utils.getDisplayColorIndex(rawValue);
        const colorEntry = appState.palette.current[finalPaletteIndex] || { hex: '#FF00FF', priority: false };
        const hexColor = colorEntry.hex;
        
        // Get RGB9 values from the color
        const rgb9 = utils.hexToRgb9(hexColor);
        
        // Convert to ZX Next hardware bytes format
        // Format: %RRRGGGBB,%P000000B
        const r9 = rgb9.r9;
        const g9 = rgb9.g9;
        const b9 = rgb9.b9;
        
        // Calculate first byte: RRRGGGBB
        const byte1 = ((r9 & 0x7) << 5) | ((g9 & 0x7) << 2) | ((b9 & 0x6) >> 1);
        // Calculate second byte: P000000B (where P is priority bit)
        const byte2 = ((colorEntry.priority ? 1 : 0) << 7) | (b9 & 0x1);
        
        // Convert to binary strings for display
        const byte1Binary = byte1.toString(2).padStart(8, '0');
        const byte2Binary = byte2.toString(2).padStart(8, '0');

        if (domElements.hoverPreviewBox) domElements.hoverPreviewBox.style.backgroundColor = hexColor;
        if (domElements.hoverRawValue) domElements.hoverRawValue.textContent = rawValue.toString();
        if (domElements.hoverPaletteIndex) domElements.hoverPaletteIndex.textContent = finalPaletteIndex.toString();
        if (domElements.hoverHexValue) domElements.hoverHexValue.textContent = hexColor;
        
        // Update byte display elements
        const hoverByte1 = document.getElementById('hoverByte1');
        const hoverByte2 = document.getElementById('hoverByte2');
        
        if (hoverByte1) hoverByte1.textContent = byte1Binary;
        if (hoverByte2) hoverByte2.textContent = byte2Binary;
        
        if (domElements.hoverInfoContainer) domElements.hoverInfoContainer.style.display = 'flex'; 
        
        if (finalPaletteIndex < appState.palette.visibleSize) {
            const currentSwatch = domElements.palettePicker?.querySelector(`.color-swatch[data-color-index="${finalPaletteIndex}"]`);
            currentSwatch?.classList.add('hover-highlight');
            localState.currentlyHoverHighlightedIndex = finalPaletteIndex;
        }
    } else {
        if (domElements.hoverPreviewBox) domElements.hoverPreviewBox.style.backgroundColor = 'transparent';
        if (domElements.hoverRawValue) domElements.hoverRawValue.textContent = '--';
        if (domElements.hoverPaletteIndex) domElements.hoverPaletteIndex.textContent = '--';
        if (domElements.hoverHexValue) domElements.hoverHexValue.textContent = '--';
        
        // Clear byte display elements
        const hoverByte1 = document.getElementById('hoverByte1');
        const hoverByte2 = document.getElementById('hoverByte2');
        
        if (hoverByte1) hoverByte1.textContent = '-';
        if (hoverByte2) hoverByte2.textContent = '-';
    }
}

function handleDetailGridLeave(event) {
    if (localState.currentlyHoverHighlightedIndex !== -1) {
        const prevSwatch = domElements.palettePicker?.querySelector(`.color-swatch[data-color-index="${localState.currentlyHoverHighlightedIndex}"]`);
        prevSwatch?.classList.remove('hover-highlight');
        localState.currentlyHoverHighlightedIndex = -1;
    }
    if (domElements.hoverPreviewBox) domElements.hoverPreviewBox.style.backgroundColor = 'transparent';
    if (domElements.hoverRawValue) domElements.hoverRawValue.textContent = '--';
    if (domElements.hoverPaletteIndex) domElements.hoverPaletteIndex.textContent = '--';
    if (domElements.hoverHexValue) domElements.hoverHexValue.textContent = '--';
    
    // Clear byte display elements
    const hoverByte1 = document.getElementById('hoverByte1');
    const hoverByte2 = document.getElementById('hoverByte2');
    
    if (hoverByte1) hoverByte1.textContent = '-';
    if (hoverByte2) hoverByte2.textContent = '-';
}

// Add this function to analyze colors and offer palette reduction
function analyzeAndReducePalette() {
    if (!appState.spriteData || !appState.spriteData.sprites || appState.spriteData.sprites.length === 0) {
        console.log('[Color Analysis] No sprite data available');
        return;
    }

    console.log('[Color Analysis] Starting color analysis...');
    // Create a Set to track unique color indices used in sprites
    const usedColorIndices = new Set();
    
    // Scan all sprites for unique colors
    appState.spriteData.sprites.forEach(sprite => {
        if (sprite && sprite.pixels) {
            // For each pixel in the sprite, add its color index to the set
            sprite.pixels.forEach(colorIndex => {
                // For 4-bit sprites, we need to adjust for the palette offset
                let actualIndex = colorIndex;
                if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
                    actualIndex = appState.viewState.paletteOffset + colorIndex;
                }
                usedColorIndices.add(actualIndex);
            });
        }
    });
    
    // Convert set to array and sort
    const uniqueColors = Array.from(usedColorIndices).sort((a, b) => a - b);
    const totalColors = uniqueColors.length;
    
    console.log(`[Color Analysis] Found ${totalColors} unique colors: ${uniqueColors.join(', ')}`);
    
    // Create notification to ask user if they want to reduce the palette
    if (totalColors < appState.palette.current.length) {
        // Using vscode dialogs, ask user if they want to reduce the palette
        vscode.postMessage({
            command: 'showConfirmDialog',
            title: 'Palette Reduction',
            message: `Found ${totalColors} unique colors in sprites. Reduce palette to only used colors?`,
            uniqueColors: uniqueColors, // Pass the unique colors to the provider
            totalPaletteSize: appState.palette.current.length
        });
    } else {
        // Already using exactly the needed colors
        vscode.postMessage({
            command: 'showInfoMessage',
            message: `Found ${totalColors} unique colors. All current palette entries are in use.`
        });
    }
}

function handleKeyDown(event, appState, domElements, utils, vscode) {
    if (!appState.spriteData || !appState.viewState) return;

    const currentSelection = appState.viewState.currentSprite;
    const numSprites = appState.spriteData.count;
    let newIndex = currentSelection;
    const SPRITES_PER_ROW = 16; // Assume 16 sprites per row for up/down navigation

    if (event.key === 'ArrowLeft') {
        newIndex = Math.max(0, currentSelection - 1);
    } else if (event.key === 'ArrowRight') {
        newIndex = Math.min(numSprites - 1, currentSelection + 1);
    } else if (event.key === 'ArrowUp') {
        newIndex = Math.max(0, currentSelection - SPRITES_PER_ROW);
    } else if (event.key === 'ArrowDown') {
        newIndex = Math.min(numSprites - 1, currentSelection + SPRITES_PER_ROW);
    } else if (event.key.toLowerCase() === 'f') {
        // Toggle fill mode
        const fillButton = domElements.transformControls?.querySelector('button[data-action="fill"]');
        if (fillButton) {
            fillButton.click(); // Simulate click to use existing toggle logic
        }
        event.preventDefault();
        return; // Prevent further processing
    } else if (event.key.toLowerCase() === 'c') {
        // Activate color replace mode while 'c' is held
        if (!localState.isColorReplaceActive) {
            localState.isColorReplaceActive = true;
            console.log('[Webview Handlers] Color replace mode activated');
            
            // Add visual feedback
            if (domElements.mainSpriteDetailContainer) {
                domElements.mainSpriteDetailContainer.classList.add('color-replace-mode');
                domElements.mainSpriteDetailContainer.style.cursor = 'crosshair';
            }
        }
        event.preventDefault();
        return;
    } else if (event.key.toLowerCase() === 'p') {
        // Toggle priority for the currently selected primary color
        if (domElements.primaryPriorityFlag) {
            domElements.primaryPriorityFlag.click(); // Simulate click
        }
        event.preventDefault();
        return;
    } else if (event.key.toLowerCase() === 'r') {
        // Analyze and reduce palette
        vscode.postMessage({ command: 'analyzeDuplicates' }); // Or a more specific command if needed
        event.preventDefault();
        return;
    }

    if (newIndex !== currentSelection) {
        appState.viewState.currentSprite = newIndex;

        // Redraw the sprite grid to update selection and brush highlights
        const spriteListContainer = domElements.spriteListContainer;
        if (spriteListContainer && appState.spriteData && appState.palette) {
            redrawSpriteGrid(spriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState);
        }

        // Update detail view
        const detailContainer = domElements.mainSpriteDetailContainer;
        if (detailContainer && appState.spriteData && appState.palette) {
            redrawDetailView(detailContainer, appState.spriteData, appState.viewState, appState.palette.current, !utils.isDefaultPaletteActive());
        }
        
        vscode.postMessage({ command: 'viewSprite', index: newIndex });
        event.preventDefault(); // Prevent default arrow key behavior (scrolling)
    } else if (event.key === '+') { // Add new sprite on '+'
        // Find the "Add New Sprite" button and simulate a click
        const addSpriteButton = document.querySelector('.add-sprite-box');
        if (addSpriteButton) {
            addSpriteButton.click();
        }
        event.preventDefault();
    } else if (event.ctrlKey && event.shiftKey && event.key === 'Delete') {
        // Remove current sprite
        if (appState.spriteData && typeof appState.viewState.currentSprite === 'number') {
            vscode.postMessage({ command: 'removeSprite', index: appState.viewState.currentSprite });
        }
        event.preventDefault();
    }
}

function handleTransform(action) {
    if (!appState.spriteData || !appState.viewState || appState.viewState.currentSprite >= appState.spriteData.sprites.length) return;

    const brush = appState.viewState.spriteBrush || { width: 1, height: 1 };
    const SPRITES_PER_ROW = 16;
    const topLeftSpriteIndex = appState.viewState.currentSprite;
    const refSprite = appState.spriteData.sprites[topLeftSpriteIndex]; // For getting width/height

    if (!refSprite) return;
    const singleSpriteWidth = refSprite.width;
    const singleSpriteHeight = refSprite.height;

    console.log(`[Webview Handlers] Applying transform: ${action} to brush starting at sprite ${topLeftSpriteIndex}, brush size ${brush.width}x${brush.height}`);

    const spritesToTransformInfo = []; // Store { index, newPixels, newWidth, newHeight }
    let anySpriteChanged = false;

    if (action === 'fill') {
        // Fill mode is just a toggle, actual fill happens on mousedown
        localState.isFillModeActive = !localState.isFillModeActive;
        const fillButton = document.querySelector('#transformControls button[data-action="fill"]');
        if (fillButton) {
            fillButton.classList.toggle('active', localState.isFillModeActive);
            fillButton.setAttribute('aria-pressed', localState.isFillModeActive.toString());
        }
        
        if (domElements.mainSpriteDetailContainer) {
            if (localState.isFillModeActive) {
                domElements.mainSpriteDetailContainer.classList.add('fill-mode');
                domElements.mainSpriteDetailContainer.style.cursor = 'crosshair';
            } else {
                domElements.mainSpriteDetailContainer.classList.remove('fill-mode');
                domElements.mainSpriteDetailContainer.style.cursor = '';
            }
        }
        
        if (localState.isFillModeActive) localState.isDrawing = false;
        console.log(`[Webview Handlers] Fill mode ${localState.isFillModeActive ? 'activated' : 'deactivated'}`);
        return; // Exit after toggling fill mode
    }

    // For brush-level transforms, treat entire brush as one unified pixel grid
    if (['flipH', 'flipV', 'scrollL', 'scrollR', 'scrollU', 'scrollD', 'rotateLeft', 'rotateRight'].includes(action)) {
        
        if (['flipH', 'flipV', 'scrollL', 'scrollR', 'scrollU', 'scrollD', 'rotateLeft', 'rotateRight'].includes(action)) {
            // UNIFIED PIXEL GRID operations: Treat entire brush as one large pixel grid
            const totalWidth = brush.width * singleSpriteWidth;
            const totalHeight = brush.height * singleSpriteHeight;
            
            // Collect all pixels into one large array
            const combinedPixels = new Array(totalWidth * totalHeight);
            
            // Fill the combined pixel array from individual sprites
            for (let brushRow = 0; brushRow < brush.height; brushRow++) {
                for (let brushCol = 0; brushCol < brush.width; brushCol++) {
                    const spriteIndex = topLeftSpriteIndex + (brushRow * brush.width) + brushCol;
                    if (spriteIndex >= 0 && spriteIndex < appState.spriteData.count) {
                        const sprite = appState.spriteData.sprites[spriteIndex];
                        if (sprite && sprite.pixels && Array.isArray(sprite.pixels)) {
                            // Copy sprite pixels to the correct position in combined array
                            for (let spriteY = 0; spriteY < singleSpriteHeight; spriteY++) {
                                for (let spriteX = 0; spriteX < singleSpriteWidth; spriteX++) {
                                    const spritePixelIndex = spriteY * singleSpriteWidth + spriteX;
                                    const globalX = brushCol * singleSpriteWidth + spriteX;
                                    const globalY = brushRow * singleSpriteHeight + spriteY;
                                    const globalPixelIndex = globalY * totalWidth + globalX;
                                    combinedPixels[globalPixelIndex] = sprite.pixels[spritePixelIndex];
                                }
                            }
                        }
                    }
                }
            }
            
            // Apply transform to the entire combined pixel array
            let transformedPixels;
            try {
                switch (action) {
                    case 'flipH':
                        transformedPixels = flipHorizontal(combinedPixels, totalWidth, totalHeight);
                        break;
                    case 'flipV':
                        transformedPixels = flipVertical(combinedPixels, totalWidth, totalHeight);
                        break;
                    case 'scrollL':
                        transformedPixels = scrollHorizontal(combinedPixels, totalWidth, totalHeight, -1);
                        break;
                    case 'scrollR':
                        transformedPixels = scrollHorizontal(combinedPixels, totalWidth, totalHeight, 1);
                        break;
                    case 'scrollU':
                        transformedPixels = scrollVertical(combinedPixels, totalWidth, totalHeight, -1);
                        break;
                    case 'scrollD':
                        transformedPixels = scrollVertical(combinedPixels, totalWidth, totalHeight, 1);
                        break;
                    case 'rotateLeft':
                        if (totalWidth === totalHeight) {
                            const rotateResult = rotateCounterClockwise(combinedPixels, totalWidth, totalHeight);
                            transformedPixels = rotateResult.newPixels;
                        } else {
                            vscode.postMessage({ command: 'showInfoMessage', message: 'Rotation can only be applied to square brush areas.' });
                            return;
                        }
                        break;
                    case 'rotateRight':
                        if (totalWidth === totalHeight) {
                            const rotateResult = rotateClockwise(combinedPixels, totalWidth, totalHeight);
                            transformedPixels = rotateResult.newPixels;
                        } else {
                            vscode.postMessage({ command: 'showInfoMessage', message: 'Rotation can only be applied to square brush areas.' });
                            return;
                        }
                        break;
                }
            } catch (error) {
                console.error(`[Webview Handlers] Error applying brush-wide transform ${action}:`, error);
                return;
            }
            
            // Split the transformed pixels back into individual sprites
            for (let brushRow = 0; brushRow < brush.height; brushRow++) {
                for (let brushCol = 0; brushCol < brush.width; brushCol++) {
                    const spriteIndex = topLeftSpriteIndex + (brushRow * brush.width) + brushCol;
                    if (spriteIndex >= 0 && spriteIndex < appState.spriteData.count) {
                        const newSpritePixels = new Array(singleSpriteWidth * singleSpriteHeight);
                        
                        // Extract pixels for this sprite from the transformed array
                        for (let spriteY = 0; spriteY < singleSpriteHeight; spriteY++) {
                            for (let spriteX = 0; spriteX < singleSpriteWidth; spriteX++) {
                                const globalX = brushCol * singleSpriteWidth + spriteX;
                                const globalY = brushRow * singleSpriteHeight + spriteY;
                                const globalPixelIndex = globalY * totalWidth + globalX;
                                const spritePixelIndex = spriteY * singleSpriteWidth + spriteX;
                                newSpritePixels[spritePixelIndex] = transformedPixels[globalPixelIndex];
                            }
                        }
                        
                        spritesToTransformInfo.push({
                            index: spriteIndex,
                            pixels: newSpritePixels,
                            width: singleSpriteWidth,
                            height: singleSpriteHeight
                        });
                        anySpriteChanged = true;
                    }
                }
            }
        }
    } else {
        // Handle individual sprite transforms (clear, rotate, etc.)
        for (let r = 0; r < brush.height; r++) {
            for (let c = 0; c < brush.width; c++) {
                const spriteIndex = topLeftSpriteIndex + (r * brush.width) + c;
                if (spriteIndex >= 0 && spriteIndex < appState.spriteData.count) {
                    const sprite = appState.spriteData.sprites[spriteIndex];
                    if (!sprite || !sprite.pixels || !Array.isArray(sprite.pixels)) continue;
                    if (sprite.width !== singleSpriteWidth || sprite.height !== singleSpriteHeight) continue;

                    let newPixels = null;

                    try {
                        switch (action) {
                            case 'clear':
                                {
                                    let valueToStore = 0;
                                    const primaryIndex = appState.selection.primaryColorIndex;
                                    if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
                                        const baseOffset = appState.viewState.paletteOffset;
                                        if (primaryIndex >= baseOffset && primaryIndex < baseOffset + 16) {
                                            valueToStore = primaryIndex - baseOffset;
                                        } else {
                                            if (r === 0 && c === 0) {
                                                vscode.postMessage({
                                                    command: 'showColorOutOfBankWarning',
                                                    selectedColorIndex: primaryIndex,
                                                    paletteOffset: baseOffset,
                                                    mode: appState.viewState.mode
                                                });
                                            }
                                            valueToStore = 0;
                                        }
                                    } else {
                                        valueToStore = primaryIndex;
                                    }
                                    newPixels = new Array(sprite.width * sprite.height).fill(valueToStore);
                                }
                                break;
                            case 'rotateLeft':
                                if (sprite.width === sprite.height) {
                                    const rotationResult = rotateCounterClockwise(sprite.pixels, sprite.width, sprite.height);
                                    newPixels = rotationResult.newPixels;
                                } else {
                                    if (r === 0 && c === 0) {
                                        vscode.postMessage({ command: 'showInfoMessage', message: 'Rotation can only be applied to square sprites.' });
                                    }
                                }
                                break;
                            case 'rotateRight':
                                if (sprite.width === sprite.height) {
                                    const rotationResult = rotateClockwise(sprite.pixels, sprite.width, sprite.height);
                                    newPixels = rotationResult.newPixels;
                                } else {
                                    if (r === 0 && c === 0) {
                                        vscode.postMessage({ command: 'showInfoMessage', message: 'Rotation can only be applied to square sprites.' });
                                    }
                                }
                                break;
                            default:
                                console.warn('[Webview Handlers] Unknown transform action:', action);
                        }

                        if (newPixels && Array.isArray(newPixels)) {
                            spritesToTransformInfo.push({
                                index: spriteIndex,
                                pixels: newPixels,
                                width: sprite.width,
                                height: sprite.height
                            });
                            anySpriteChanged = true;
                        }
                    } catch (error) {
                        console.error(`[Webview Handlers] Error applying transform ${action} to sprite ${spriteIndex}:`, error);
                        if (r === 0 && c === 0) {
                            vscode.postMessage({ command: 'showInfoMessage', message: `Failed to apply ${action}: ${error.message}`});
                        }
                    }
                }
            }
        }
    }

    if (anySpriteChanged) {
        spritesToTransformInfo.forEach(info => {
            const sprite = appState.spriteData.sprites[info.index];
            sprite.pixels = info.pixels;
            sprite.width = info.width; 
            sprite.height = info.height;
            vscode.postMessage({ 
                command: 'updateSpritePixels', 
                spriteIndex: info.index, 
                pixels: sprite.pixels,
                skipVsCodeDirtyNotification: true // Don't notify VSCode of dirty state
            });
        });

        utils.markAsDirty(); // Mark main dirty state once (internal only)
        utils.requestFullRedraw(); // Redraw everything after all sprites in brush are updated
    }
}

/**
 * Handles mouseover events on palette swatches to show detailed color information
 */
function handlePaletteHover(event) {
    const swatch = event.target.closest('.color-swatch');
    if (!swatch) return;
    
    // The tooltip is already defined in the HTML via the title attribute
    // But we can add a CSS class to enhance the visual feedback
    swatch.classList.add('palette-hover');
}

/**
 * Removes hover styling from palette swatches
 */
function handlePaletteLeave(event) {
    const swatch = event.target.closest('.color-swatch');
    if (swatch) {
        swatch.classList.remove('palette-hover');
    }
}

// --- NEW: Sprite Drag Handlers ---

function handleSpriteDragStart(event) {
    const spriteBox = event.target.closest('.sprite-box');
    if (!spriteBox) return;
    
    localState.draggedSpriteIndex = parseInt(spriteBox.dataset.index, 10);
    event.dataTransfer.effectAllowed = 'move';
    // Set dummy data for Firefox compatibility
    event.dataTransfer.setData('text/plain', localState.draggedSpriteIndex.toString()); 
    
    // Add timeout to allow the browser to render the drag image before adding class
    setTimeout(() => {
        spriteBox.classList.add('dragging-sprite'); 
    }, 0);
    
    console.log(`[Webview Handlers] Sprite Drag Start: index=${localState.draggedSpriteIndex}`);
}

function handleSpriteDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';
    
    const targetBox = event.target.closest('.sprite-box');
    const addBox = event.target.closest('.add-sprite-box');
    
    // Remove previous drag-over class
    document.querySelectorAll('.sprite-box.drag-over-sprite').forEach(box => box.classList.remove('drag-over-sprite'));
    
    if (targetBox && parseInt(targetBox.dataset.index, 10) !== localState.draggedSpriteIndex) {
        targetBox.classList.add('drag-over-sprite');
    } else if (addBox) {
        // Handle dragging over the 'add' box if needed (e.g., move to end)
        // addBox.classList.add('drag-over-sprite'); // Optional visual cue
    }
}

function handleSpriteDragLeave(event) {
    const targetBox = event.target.closest('.sprite-box');
    if (targetBox) {
        targetBox.classList.remove('drag-over-sprite');
    }
    const addBox = event.target.closest('.add-sprite-box');
    if (addBox) {
        // addBox.classList.remove('drag-over-sprite'); // Optional visual cue
    }
}

function handleSpriteDrop(event) {
    event.preventDefault();
    const targetBox = event.target.closest('.sprite-box');
    const sourceIndex = localState.draggedSpriteIndex;
    let targetIndex = -1;

    if (targetBox) {
        targetIndex = parseInt(targetBox.dataset.index, 10);
    } else {
        // Dropped outside a valid sprite box (e.g., in gap or on add button)
        // Assume drop at the end if not on a specific sprite box
        targetIndex = appState.spriteData.count; // Place after the last sprite
    }

    // Clean up visual styles
    document.querySelectorAll('.sprite-box.drag-over-sprite').forEach(box => box.classList.remove('drag-over-sprite'));
    const draggingElement = document.querySelector('.sprite-box.dragging-sprite');
    if (draggingElement) draggingElement.classList.remove('dragging-sprite');

    console.log(`[Webview Handlers] Sprite Drop: source=${sourceIndex}, target=${targetIndex}`);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        console.log('[Webview Handlers] Sprite drop cancelled: Invalid indices or dropped on self.');
        localState.draggedSpriteIndex = -1;
        return;
    }

    // --- Reordering Logic ---
    // Send message to extension to handle the actual reordering
    vscode.postMessage({
        command: 'reorderSprites',
        sourceIndex: sourceIndex,
        targetIndex: targetIndex 
    });

    // --- Optimistic UI Update (Optional but recommended for responsiveness) ---
    // 1. Find the sprite object being moved
    const movedSprite = appState.spriteData.sprites.find(s => s.index === sourceIndex);
    if (!movedSprite) {
        console.error("Could not find sprite to move in local state!");
        localState.draggedSpriteIndex = -1;
        return;
    }
    
    // 2. Create a temporary ordered list based on current visual order
    const spriteBoxes = Array.from(domElements.spriteListContainer.querySelectorAll('.sprite-box'));
    let currentOrderIndices = spriteBoxes.map(box => parseInt(box.dataset.index, 10));
    
    // 3. Find the current visual positions
    const currentVisualSourcePos = currentOrderIndices.indexOf(sourceIndex);
    let currentVisualTargetPos = currentOrderIndices.indexOf(targetIndex);
    
    // If dropping onto the gap *after* the target sprite, adjust the target position
    // We need to determine if the drop point is in the first or second half of the target box.
    if (targetBox) {
        const rect = targetBox.getBoundingClientRect();
        const dropX = event.clientX;
        const dropY = event.clientY; // Use clientY as sprites stack vertically in grid
        
        // Assuming grid layout, check if drop is past the midpoint vertically or horizontally depending on layout
        // Let's keep it simple: if dropping on a box, insert *before* it.
        // If the calculated targetIndex was the last sprite, adjust target position accordingly.
        if(targetIndex === appState.spriteData.count) {
           currentVisualTargetPos = currentOrderIndices.length; // Insert at the end
        }
        // Else: currentVisualTargetPos is already correct (index of the element we drop onto)
    } else {
         // Dropped outside a sprite box, assume end
         currentVisualTargetPos = currentOrderIndices.length;
    }


    // 4. Remove from old visual position and insert into new visual position
    currentOrderIndices.splice(currentVisualSourcePos, 1);
    // Adjust target position if source was before target
    const adjustedTargetPos = currentVisualSourcePos < currentVisualTargetPos ? currentVisualTargetPos -1 : currentVisualTargetPos;
    currentOrderIndices.splice(adjustedTargetPos, 0, sourceIndex); 

    // 5. Update the appState.spriteData.sprites array based on the *new visual order*
    // It's crucial that the local appState reflects the order the extension will create
    const newSpritesArray = [];
    let currentOriginalIndex = 0;
    const spritesCopy = [...appState.spriteData.sprites]; // Work with a copy
    
    // Find the sprite object being moved
    const spriteToMove = spritesCopy.find(s => s.index === sourceIndex);
    if (!spriteToMove) {
        console.error("Could not find sprite object for source index:", sourceIndex);
        localState.draggedSpriteIndex = -1;
        return; // Exit if sprite not found
    }

    // Remove the sprite from its original position in the copy
    const originalPosition = spritesCopy.indexOf(spriteToMove);
    if (originalPosition > -1) {
        spritesCopy.splice(originalPosition, 1);
    } else {
        console.error("Could not find sprite object to remove at original position for index:", sourceIndex);
         localState.draggedSpriteIndex = -1;
        return; // Exit if sprite not found
    }

    // Find the sprite that will be *after* the moved sprite in the new order
    // The target index needs to relate to the original indices *before* the move.
    let effectiveTargetIndex = targetIndex;
    // Adjust target index if source was before target in the original array
    if (originalPosition < effectiveTargetIndex) {
        effectiveTargetIndex--;
    }

    // Insert the sprite at the new position in the copy
    spritesCopy.splice(effectiveTargetIndex, 0, spriteToMove);
    
    // Re-index the sprites array sequentially
    spritesCopy.forEach((sprite, newIdx) => {
        sprite.index = newIdx; // Update the index property
    });

    // Update the main sprites array and count
    appState.spriteData.sprites = spritesCopy;
    appState.spriteData.count = spritesCopy.length;

    // Adjust the currently selected sprite index if it was affected by the reorder
    if (appState.viewState.currentSprite === sourceIndex) {
        // If the dragged sprite was selected, update selection to its new index
        appState.viewState.currentSprite = spritesCopy.findIndex(s => s === spriteToMove); // Find new index
    } else {
        // If another sprite was selected, find its new index
        const selectedSpriteOriginalIndex = appState.viewState.currentSprite;
        const selectedSpriteObject = spritesCopy.find(s => {
             // This logic is tricky because original indices are lost after re-indexing.
             // We need a way to track the *object* that was originally selected.
             // For now, let's assume the message to the extension handles selection update correctly.
             // Or, we can just re-select based on the original index, which might be wrong after reorder.
             // Safest bet: let the 'update' message from the provider fix the selection.
             // TODO: Improve selection tracking during reorder if needed.
        });
       // if(selectedSpriteObject) {
       //     appState.viewState.currentSprite = selectedSpriteObject.index;
       // }
    }


    // 6. Redraw the UI based on the new appState
    utils.requestFullRedraw(); 
    // --- End Optimistic Update ---

    // Mark as dirty (let the extension handle this via the message)
    // utils.markAsDirty(false); // Sprite change

    // Reset state
    localState.draggedSpriteIndex = -1;
}

function handleSpriteDragEnd(event) {
    // Clean up visual styles in case drop didn't happen correctly
    const draggingElement = document.querySelector('.sprite-box.dragging-sprite');
    if (draggingElement) draggingElement.classList.remove('dragging-sprite');
    document.querySelectorAll('.sprite-box.drag-over-sprite').forEach(box => box.classList.remove('drag-over-sprite'));
    
    // Reset state if it wasn't reset by drop
    if (localState.draggedSpriteIndex !== -1) {
        console.log('[Webview Handlers] Sprite Drag End (cleanup)');
        localState.draggedSpriteIndex = -1;
    }
}

// --- End Sprite Drag Handlers ---

// --- Main Setup Function --- 

export function setupEventListeners(passedAppState, passedDomElements, passedUtils, vsCodeApi) {
    console.log("[Webview Handlers] >>> setupEventListeners START"); // <<< ADDED LOG
    // Store references
    appState = passedAppState;
    domElements = passedDomElements;
    utils = passedUtils;
    vscode = vsCodeApi;
    
    // console.log("[Webview Handlers] Received appState object");
    // console.log("[Webview Handlers] Received domElements:", domElements ? Object.keys(domElements) : null);
    // console.log("[Webview Handlers] Received utils:", utils ? Object.keys(utils) : null);
    // console.log("[Webview Handlers] Received vscode:", !!vscode);

    // Reset local state on setup
    localState = {
        isDrawing: false, lastDrawnPixelIndex: -1, draggedIndex: -1, drawButton: 0,
        editTimeout: null, isCopyingColor: false, colorCopySourceIndex: -1,
        colorUpdateTimeout: null, lastMessageTime: 0, isSwappingColor: false,
        currentlyHoverHighlightedIndex: -1, isFillModeActive: false,
        ctrlDragActive: false, ctrlDragSourceIndex: -1, ctrlDragTargetIndex: -1,
        dragDisabledSwatch: null, // Store swatch element when disabling draggable
        isColorReplaceActive: false
    };

    // --- Add global event listeners to track Ctrl key ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Control') {
            // Add class to all color swatches to indicate we're in swap mode
            document.querySelectorAll('.color-swatch').forEach(
                swatch => swatch.classList.add('ctrl-hover')
            );
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (event.key === 'Control') {
            // Remove class from all color swatches
            document.querySelectorAll('.color-swatch').forEach(
                swatch => swatch.classList.remove('ctrl-hover')
            );
            
            // Also cancel any active Ctrl+LMB drag operation
            if (localState.ctrlDragActive) {
                cancelCtrlDrag();
            }
        }
    });

    // --- Attach Global Palette Drag-Drop Handlers ---
    document.addEventListener('dragend', handleDragEnd);
    
    // --- Check for palette element ---
    const palettePicker = document.getElementById('palettePicker');
    if (palettePicker) {
        // Add event delegation for palette operations
        palettePicker.addEventListener('dragover', handleDragOver);
        palettePicker.addEventListener('dragleave', handleDragLeave);
        
        // Add palette hover events
        palettePicker.addEventListener('mouseover', handlePaletteHover);
        palettePicker.addEventListener('mouseout', handlePaletteLeave);

        // Add Ctrl+LMB drag handlers for color swapping
        palettePicker.addEventListener('mousedown', handleCtrlMouseDown);
        palettePicker.addEventListener('mousemove', handleCtrlMouseMove);
        palettePicker.addEventListener('mouseup', handleCtrlMouseUp);
        
        // Cancel Ctrl+LMB drag if mouse leaves palette area
        palettePicker.addEventListener('mouseleave', () => {
            if (localState.ctrlDragActive) {
                cancelCtrlDrag();
            }
        });
        
        // Add global mouseup listener to handle case where mouse is released outside palette
        document.addEventListener('mouseup', (event) => {
            if (localState.ctrlDragActive) {
                handleCtrlMouseUp(event);
            }
        });
        
        // Add global keyup listener to handle case where Ctrl key is released during drag
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Control' && localState.ctrlDragActive) {
                cancelCtrlDrag();
            }
        });
        
        // Handle dragstart at the container level
        palettePicker.addEventListener('dragstart', (event) => {
            // Don't start drag if Ctrl is pressed (we'll use our custom drag)
            if (event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            const swatch = event.target.closest('.color-swatch');
            if (swatch) {
                const index = parseInt(swatch.dataset.colorIndex, 10);
                if (!isNaN(index)) {
                    // Store the dragged index locally AND in window state
                    localState.draggedIndex = index;
                    localState.isSwappingColor = event.ctrlKey;
                    
                    // Set data for the drag operation
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', index.toString());
                    swatch.classList.add('dragging');
                    
                    console.log(`[Webview Handlers] Drag started for color ${index}, CTRL: ${event.ctrlKey}`);
                }
            }
        }, { capture: true });  // Add capture: true to handle the event before it bubbles
        
        // Handle contextmenu (right-click) to initiate copy state
        palettePicker.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const swatch = event.target.closest('.color-swatch');
            if (swatch) {
                const index = parseInt(swatch.dataset.colorIndex, 10);
                if (!isNaN(index)) {
                    // Always select the color as secondary on right-click
                    utils.selectSecondaryColor(index);
                    
                    // Only set up copy drag state if CTRL is pressed
                    if (event.ctrlKey) {
                        // Set up color copy state for CTRL+RMB drag
                        if (!window.colorCopyState) window.colorCopyState = {};
                        window.colorCopyState.isCopying = true;
                        window.colorCopyState.sourceIndex = index;
                        window.colorCopyState.isCopyDrag = true;
                        
                        // Show visual feedback that color is picked up
                        swatch.classList.add('color-pickup');
                        
                        // Show notification
                        const notification = document.createElement('div');
                        notification.className = 'color-copy-notification';
                        notification.textContent = `Color ${index} picked up - drag to copy`;
                        notification.style.position = 'fixed';
                        notification.style.top = `${event.clientY + 20}px`;
                        notification.style.left = `${event.clientX + 10}px`;
                        notification.style.backgroundColor = 'var(--vscode-editor-background)';
                        notification.style.color = 'var(--vscode-editor-foreground)';
                        notification.style.padding = '5px 10px';
                        notification.style.borderRadius = '3px';
                        notification.style.border = '1px solid var(--vscode-widget-border)';
                        notification.style.zIndex = '1000';
                        notification.style.pointerEvents = 'none';
                        notification.id = 'color-copy-notification';
                        
                        // Remove any existing notification
                        const existingNotification = document.getElementById('color-copy-notification');
                        if (existingNotification) {
                            existingNotification.remove();
                        }
                        
                        document.body.appendChild(notification);
                        
                        console.log(`[Webview Handlers] CTRL+Right-click on color ${index} - ready for drag copy`);
                    } else {
                        // Regular right-click should not initiate copy state
                        if (window.colorCopyState) {
                            window.colorCopyState.isCopying = false;
                            window.colorCopyState.sourceIndex = -1;
                            window.colorCopyState.isCopyDrag = false;
                        }
                        
                        console.log(`[Webview Handlers] Right-click selected color ${index} as secondary`);
                    }
                }
            }
        });
        
        // Handle mousemove to track CTRL+RMB drag operation
        palettePicker.addEventListener('mousemove', (event) => {
            // Only process if CTRL is still held down
            if (window.colorCopyState && window.colorCopyState.isCopying && window.colorCopyState.isCopyDrag && event.ctrlKey) {
                // RMB drag operation
                const swatch = event.target.closest('.color-swatch');
                
                // Update notification position
                const notification = document.getElementById('color-copy-notification');
                if (notification) {
                    notification.style.top = `${event.clientY + 20}px`;
                    notification.style.left = `${event.clientX + 10}px`;
                }
                
                // Remove previous target highlights
                document.querySelectorAll('.color-swatch.copy-target').forEach(
                    sw => sw.classList.remove('copy-target')
                );
                
                if (swatch) {
                    // Add visual feedback for the target
                    swatch.classList.add('copy-target');
                    
                    const targetIndex = parseInt(swatch.dataset.colorIndex, 10);
                    if (!isNaN(targetIndex) && targetIndex !== window.colorCopyState.sourceIndex) {
                        // Update notification text
                        if (notification) {
                            notification.textContent = `Copy color ${window.colorCopyState.sourceIndex} to ${targetIndex}`;
                        }
                    }
                }
            } else if (window.colorCopyState && window.colorCopyState.isCopying && !event.ctrlKey) {
                // CTRL was released, cancel the operation
                cancelColorCopy();
            }
        });
        
        // Add helper function for canceling color copy
        function cancelColorCopy() {
            if (window.colorCopyState && window.colorCopyState.isCopying) {
                window.colorCopyState.isCopying = false;
                window.colorCopyState.sourceIndex = -1;
                window.colorCopyState.isCopyDrag = false;
                
                // Remove visual feedback
                document.querySelectorAll('.color-swatch.color-pickup').forEach(
                    sw => sw.classList.remove('color-pickup')
                );
                document.querySelectorAll('.color-swatch.copy-target').forEach(
                    sw => sw.classList.remove('copy-target')
                );
                
                // Remove notification
                const notification = document.getElementById('color-copy-notification');
                if (notification) {
                    notification.remove();
                }
                
                console.log('[Webview Handlers] Color copy operation canceled');
            }
        }
        
        // Handle mouseup for completing the color copy
        palettePicker.addEventListener('mouseup', (event) => {
            // Only handle right mouse button (2) and if we're in a copy operation
            if (event.button === 2 && window.colorCopyState && window.colorCopyState.isCopying && window.colorCopyState.isCopyDrag) {
                const swatch = event.target.closest('.color-swatch');
                if (swatch) {
                    const sourceIndex = window.colorCopyState.sourceIndex;
                    const targetIndex = parseInt(swatch.dataset.colorIndex, 10);
                    
                    if (!isNaN(sourceIndex) && !isNaN(targetIndex) && sourceIndex !== targetIndex) {
                        console.log(`[Webview Handlers] CTRL+Right drag copy from ${sourceIndex} to ${targetIndex}`);
                        
                        if (utils.isDefaultPaletteActive()) {
                            vscode.postMessage({ command: 'promptEditDefaultPalette' });
                        } else if (targetIndex >= 256) {
                            console.log('[Webview Handlers] Color copy cancelled: Target index beyond 256-color limit.');
                        } else {
                            const sourceColor = appState.palette.current[sourceIndex];
                            if (sourceColor) {
                                // Extend the palette if needed (if copying to index beyond current length)
                                if (targetIndex >= appState.palette.current.length) {
                                    // Pad the palette with black colors up to the target index
                                    while (appState.palette.current.length <= targetIndex) {
                                        appState.palette.current.push({ hex: '#000000', priority: false });
                                    }
                                    console.log(`[Webview Handlers] Extended palette to index ${targetIndex} for color copy`);
                                }
                                
                                // Send message to main script to update state & trigger redraw
                                vscode.postMessage({
                                    command: 'paletteEdit',
                                    index: targetIndex,
                                    newHexColor: sourceColor.hex,
                                    newPriority: sourceColor.priority
                                });
                                
                                // Update local state immediately
                                if (appState.palette.current[targetIndex]) {
                                    appState.palette.current[targetIndex].hex = sourceColor.hex;
                                    appState.palette.current[targetIndex].priority = sourceColor.priority;
                                    
                                    // Update tooltip for the swatch with color information
                                    // Extract RGB components from hex
                                    const r = parseInt(sourceColor.hex.substring(1, 3), 16);
                                    const g = parseInt(sourceColor.hex.substring(3, 5), 16);
                                    const b = parseInt(sourceColor.hex.substring(5, 7), 16);
                                    
                                    // Get RGB9 values
                                    const rgb9 = utils.hexToRgb9(sourceColor.hex);
                                    
                                    // Calculate RGB9 bytes
                                    const r9 = rgb9.r9;
                                    const g9 = rgb9.g9;
                                    const b9 = rgb9.b9;
                                    
                                    // Calculate RGB9 bytes for tooltip
                                    const rgb9Byte1 = ((r9 & 0x7) << 5) | ((g9 & 0x7) << 2) | ((b9 & 0x3) >> 1);
                                    const rgb9Byte2 = ((b9 & 0x1) << 7) | (sourceColor.priority ? 0x80 : 0);
                                    
                                    // Update the tooltip
                                    swatch.title = `Index: ${targetIndex}
Hex: ${sourceColor.hex}
RGB9 bytes: (${rgb9Byte1}, ${rgb9Byte2})
RGB9: (${r9},${g9},${b9})
RGB24: (${r},${g},${b})
Priority: ${sourceColor.priority}`;
                                }
                                
                                utils.markAsDirty(true); // Mark palette as dirty only
                                swatch.style.backgroundColor = sourceColor.hex;
                                
                                // If we extended the palette, we need to update visible size
                                if (targetIndex >= appState.palette.visibleSize) {
                                    // Expand the visible palette size to include the new color
                                    const newSize = Math.min(256, Math.max(appState.palette.visibleSize, targetIndex + 1));
                                    appState.palette.visibleSize = newSize;
                                    
                                    // Update the palette size selector if it exists
                                    const paletteSizeSelect = document.getElementById('paletteSizeSelect');
                                    if (paletteSizeSelect) {
                                        // Find or create an option for this size
                                        let found = false;
                                        for (let i = 0; i < paletteSizeSelect.options.length; i++) {
                                            if (parseInt(paletteSizeSelect.options[i].value) === newSize) {
                                                paletteSizeSelect.selectedIndex = i;
                                                found = true;
                                                break;
                                            }
                                        }
                                        
                                        if (!found && newSize !== 256) {
                                            // Create a new option
                                            const newOption = document.createElement('option');
                                            newOption.value = newSize.toString();
                                            newOption.text = `First ${newSize}`;
                                            
                                            // Insert in correct order
                                            let inserted = false;
                                            for (let i = 0; i < paletteSizeSelect.options.length; i++) {
                                                const optionValue = parseInt(paletteSizeSelect.options[i].value);
                                                if (optionValue > newSize) {
                                                    paletteSizeSelect.add(newOption, paletteSizeSelect.options[i]);
                                                    paletteSizeSelect.selectedIndex = i;
                                                    inserted = true;
                                                    break;
                                                }
                                            }
                                            
                                            if (!inserted) {
                                                paletteSizeSelect.add(newOption);
                                                paletteSizeSelect.selectedIndex = paletteSizeSelect.options.length - 1;
                                            }
                                        }
                                    }
                                    
                                    // Request full redraw to show new visible size
                                    utils.requestFullRedraw();
                                }
                                
                                // Show feedback notification
                                const notification = document.getElementById('color-copy-notification');
                                if (notification) {
                                    notification.textContent = `Color copied from ${sourceIndex} to ${targetIndex}`;
                                    // Fade out notification
                                    setTimeout(() => {
                                        notification.style.opacity = '0';
                                        setTimeout(() => notification.remove(), 500);
                                    }, 1000);
                                }
                            }
                        }
                    }
                }
                
                // Always clean up after RMB release
                cancelColorCopy();
            }
        });
        
        // Add keyboard event to cancel on ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && window.colorCopyState && window.colorCopyState.isCopying) {
                cancelColorCopy();
            }
        });
        
        // Add a global mouseup handler to cancel if clicking outside the palette
        document.addEventListener('mouseup', (event) => {
            if (event.button === 2 && window.colorCopyState && window.colorCopyState.isCopying) {
                const isOverPalette = event.target.closest('#palettePicker');
                if (!isOverPalette) {
                    cancelColorCopy();
                }
            }
        });
        
        // Add global keyup for CTRL release
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Control' && window.colorCopyState && window.colorCopyState.isCopying && window.colorCopyState.isCopyDrag) {
                cancelColorCopy();
            }
        });
        
        // Handle drop with existing drop handler
        palettePicker.addEventListener('drop', (event) => {
            // Use existing handler
            handleDrop(event);
        });
    }
    
    // Global mouseup to reset states
    window.addEventListener('mouseup', (event) => {
        // Handle right-click copy cancellation
        if (event.button === 2) {
            if (window.colorCopyState && window.colorCopyState.isCopying) {
                const target = event.target.closest('.color-swatch');
                if (!target) {
                    console.log('[Webview Handlers] Color copy cancelled - released outside swatch');
                    window.colorCopyState.isCopying = false;
                    window.colorCopyState.sourceIndex = -1;
                }
            }
        }
        
        // Reset drawing state
        if (localState.isDrawing && event.button === localState.drawButton) {
            localState.isDrawing = false;
        }
    });

    // --- Attach Sprite Grid Drag-Drop Handlers ---
    if (domElements.spriteListContainer) {
        console.log("[Webview Handlers] Attaching sprite drag/drop listeners to spriteListContainer");
        // Use event delegation on the container
        domElements.spriteListContainer.addEventListener('dragstart', handleSpriteDragStart);
        domElements.spriteListContainer.addEventListener('dragover', handleSpriteDragOver);
        domElements.spriteListContainer.addEventListener('dragleave', handleSpriteDragLeave);
        domElements.spriteListContainer.addEventListener('drop', handleSpriteDrop);
        // Add dragend listener directly to the container as well for cleanup
        domElements.spriteListContainer.addEventListener('dragend', handleSpriteDragEnd); 
    } else {
        console.warn("[Webview Handlers] spriteListContainer not found for sprite drag/drop listeners.");
    }

    // --- Attach Listeners --- 
    if (domElements.viewModeSelect) {
        // console.log("[Webview Handlers] Attaching listener to viewModeSelect");
        domElements.viewModeSelect.addEventListener('change', e => {
            const mode = e.target.value;
            if (domElements.paletteOffsetInput) domElements.paletteOffsetInput.disabled = !['sprite4', 'tile8x8'].includes(mode);
            vscode.postMessage({ command: 'changeMode', mode });
        });
    } else {
        console.warn("[Webview Handlers] viewModeSelect not found");
    }

    if (domElements.paletteOffsetInput) {
        // console.log("[Webview Handlers] Attaching listener to paletteOffsetInput");
        domElements.paletteOffsetInput.addEventListener('change', e => {
            let offsetBank = parseInt(e.target.value, 10);
            if (isNaN(offsetBank) || offsetBank < 0) offsetBank = 0;
            if (offsetBank > 15) offsetBank = 15;
            e.target.value = offsetBank.toString();
            const actualOffset = offsetBank * 16;
            vscode.postMessage({ command: 'changePaletteOffset', offset: actualOffset });
        });
    } else {
         console.warn("[Webview Handlers] paletteOffsetInput not found");
    }

    if (domElements.scaleSlider && domElements.scaleValue) {
        // console.log("[Webview Handlers] Attaching listeners to scaleSlider");
        domElements.scaleSlider.addEventListener('input', e => {
            const currentScaleValue = e.target.value;
            const currentScaleNumber = parseInt(currentScaleValue, 10);
            domElements.scaleValue.textContent = currentScaleValue + 'x';
            document.documentElement.style.setProperty('--sprite-scale', currentScaleNumber.toString());
        });
        domElements.scaleSlider.addEventListener('change', e => {
            const scale = parseInt(e.target.value, 10);
            vscode.postMessage({ command: 'changeScale', scale });
        });
    } else {
         console.warn("[Webview Handlers] scaleSlider or scaleValue not found");
    }

    if (domElements.gridCheckbox && domElements.spriteListContainer) {
        domElements.gridCheckbox.addEventListener('change', e => {
            domElements.spriteListContainer.classList.toggle('show-sprite-borders', e.target.checked);
            vscode.postMessage({ command: 'toggleGrid', showGrid: e.target.checked });
        });
    }

    if (domElements.loadPaletteButton) {
        domElements.loadPaletteButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'loadPalette' });
        });
    }

    if (domElements.useDefaultPaletteButton) {
        domElements.useDefaultPaletteButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'useDefaultPalette' });
        });
    }

    // Note: Listeners for sprite boxes are added dynamically in redrawSpriteGrid (in spriteRenderer.js)

    if (domElements.mainSpriteDetailContainer) {
        // console.log("[Webview Handlers] Attaching listeners to mainSpriteDetailContainer");
        domElements.mainSpriteDetailContainer.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        domElements.mainSpriteDetailContainer.addEventListener('mousedown', (event) => {
            if (event.altKey) { // Eyedropper
                event.preventDefault();
                if (!appState.spriteData || !appState.palette.current) return;

                const hoveredCompositePixel = event.target.closest('.detail-pixel');
                if (!hoveredCompositePixel) return;

                const originalSpriteIndexStr = hoveredCompositePixel.dataset.originalSpriteIndex;
                const localPixelIndexStr = hoveredCompositePixel.dataset.localPixelIndex;

                if (originalSpriteIndexStr === undefined || localPixelIndexStr === undefined) return; // Pixel is a placeholder

                const originalSpriteIndex = parseInt(originalSpriteIndexStr, 10);
                const localPixelIndex = parseInt(localPixelIndexStr, 10);

                if (isNaN(originalSpriteIndex) || isNaN(localPixelIndex) || originalSpriteIndex < 0 || originalSpriteIndex >= appState.spriteData.count) return;
                
                const currentSprite = appState.spriteData.sprites[originalSpriteIndex];
                if (!currentSprite || localPixelIndex < 0 || localPixelIndex >= currentSprite.pixels.length) return;
                
                const rawValue = currentSprite.pixels[localPixelIndex];
                const finalPaletteIndex = utils.getDisplayColorIndex(rawValue);
                if (event.button === 0) utils.selectPrimaryColor(finalPaletteIndex);
                else if (event.button === 2) utils.selectSecondaryColor(finalPaletteIndex);
                return; 
            } else if (localState.isFillModeActive) { // Fill mode
                event.preventDefault();
                if (event.button !== 0 && event.button !== 2) return;
                
                const clickedCompositePixel = event.target.closest('.detail-pixel');
                if (!clickedCompositePixel) return;

                const originalSpriteIndexStr = clickedCompositePixel.dataset.originalSpriteIndex;
                const localPixelIndexStr = clickedCompositePixel.dataset.localPixelIndex;

                if (originalSpriteIndexStr === undefined || localPixelIndexStr === undefined) return;

                const originalSpriteIndex = parseInt(originalSpriteIndexStr, 10);
                const localPixelIndex = parseInt(localPixelIndexStr, 10);

                if (isNaN(originalSpriteIndex) || isNaN(localPixelIndex) || originalSpriteIndex < 0 || originalSpriteIndex >= appState.spriteData.count) return;

                const spriteToFill = appState.spriteData.sprites[originalSpriteIndex];
                if (!spriteToFill || localPixelIndex < 0 || localPixelIndex >= spriteToFill.pixels.length) return;

                // Calculate fill coordinates
                const spriteWidth = spriteToFill.width;
                const fillX = localPixelIndex % spriteWidth;
                const fillY = Math.floor(localPixelIndex / spriteWidth);

                // Get fill color
                let selectedPaletteIndex = event.button === 2 ? appState.selection.secondaryColorIndex : appState.selection.primaryColorIndex;
                let fillColor;

                if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
                    const baseOffset = appState.viewState.paletteOffset;
                    if (selectedPaletteIndex >= baseOffset && selectedPaletteIndex < baseOffset + 16) {
                        fillColor = selectedPaletteIndex - baseOffset;
                    } else {
                        vscode.postMessage({
                            command: 'showColorOutOfBankWarning',
                            selectedColorIndex: selectedPaletteIndex,
                            paletteOffset: baseOffset,
                            mode: appState.viewState.mode
                        });
                        return;
                    }
                } else {
                    fillColor = selectedPaletteIndex;
                }

                // Make a copy of the pixels array for flood fill (since it modifies in-place)
                const pixelsCopy = [...spriteToFill.pixels];
                
                // Perform flood fill (modifies pixelsCopy in-place, returns boolean)
                const fillHappened = floodFill(pixelsCopy, spriteWidth, spriteToFill.height, fillX, fillY, fillColor);
                if (fillHappened) {
                    spriteToFill.pixels = pixelsCopy;
                    utils.markAsDirty();
                    
                    // Update only the affected sprite in grid and detail view, not full redraw
                    const displayIndex = utils.getDisplayColorIndex(fillColor);
                    const colorEntry = appState.palette.current[displayIndex];
                    const hexColor = colorEntry?.hex || '#FF00FF';
                    
                    // Update sprite in grid
                    const gridSpriteBox = document.querySelector(`.sprite-box[data-index="${originalSpriteIndex}"]`);
                    if (gridSpriteBox) {
                        const spritePixels = gridSpriteBox.querySelectorAll('.sprite-pixel');
                        pixelsCopy.forEach((colorIndex, pixelIndex) => {
                            if (spritePixels[pixelIndex]) {
                                const displayColorIndex = utils.getDisplayColorIndex(colorIndex);
                                const pixelColor = appState.palette.current[displayColorIndex]?.hex || '#FF00FF';
                                spritePixels[pixelIndex].style.backgroundColor = pixelColor;
                            }
                        });
                    }
                    
                    // Update detail view
                    const detailPixels = document.querySelectorAll(`.detail-pixel[data-original-sprite-index="${originalSpriteIndex}"]`);
                    detailPixels.forEach(detailPixel => {
                        const localPixelIndex = parseInt(detailPixel.dataset.localPixelIndex, 10);
                        if (!isNaN(localPixelIndex) && localPixelIndex < pixelsCopy.length) {
                            const colorIndex = pixelsCopy[localPixelIndex];
                            const displayColorIndex = utils.getDisplayColorIndex(colorIndex);
                            const pixelColor = appState.palette.current[displayColorIndex]?.hex || '#FF00FF';
                            detailPixel.style.backgroundColor = pixelColor;
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'updateSpritePixels',
                        spriteIndex: originalSpriteIndex,
                        pixels: spriteToFill.pixels,
                        skipVsCodeDirtyNotification: true
                    });
                }
                return;
            } else if (localState.isColorReplaceActive) { // Color Replace mode
                event.preventDefault();
                if (event.button !== 0 && event.button !== 2) return;
                
                const clickedCompositePixel = event.target.closest('.detail-pixel');
                if (!clickedCompositePixel) return;

                const originalSpriteIndexStr = clickedCompositePixel.dataset.originalSpriteIndex;
                const localPixelIndexStr = clickedCompositePixel.dataset.localPixelIndex;

                if (originalSpriteIndexStr === undefined || localPixelIndexStr === undefined) return;

                const originalSpriteIndex = parseInt(originalSpriteIndexStr, 10);
                const localPixelIndex = parseInt(localPixelIndexStr, 10);

                if (isNaN(originalSpriteIndex) || isNaN(localPixelIndex) || originalSpriteIndex < 0 || originalSpriteIndex >= appState.spriteData.count) return;

                const spriteToReplace = appState.spriteData.sprites[originalSpriteIndex];
                if (!spriteToReplace || localPixelIndex < 0 || localPixelIndex >= spriteToReplace.pixels.length) return;

                // Get the source color index (the color we're clicking on)
                const sourceColorIndex = spriteToReplace.pixels[localPixelIndex];
                
                // Get the target color index (primary or secondary color)
                let targetColorIndex = event.button === 2 ? appState.selection.secondaryColorIndex : appState.selection.primaryColorIndex;
                
                // Handle 4-bit mode color conversion
                if (appState.viewState.mode === 'sprite4' || appState.viewState.mode === 'tile8x8') {
                    const baseOffset = appState.viewState.paletteOffset;
                    if (targetColorIndex >= baseOffset && targetColorIndex < baseOffset + 16) {
                        targetColorIndex = targetColorIndex - baseOffset;
                    } else {
                        vscode.postMessage({
                            command: 'showColorOutOfBankWarning',
                            selectedColorIndex: targetColorIndex,
                            paletteOffset: baseOffset,
                            mode: appState.viewState.mode
                        });
                        return;
                    }
                }

                // Only replace if source and target colors are different
                if (sourceColorIndex !== targetColorIndex) {
                    const colorChanged = replaceColorInSprite(sourceColorIndex, targetColorIndex, originalSpriteIndex);
                    
                    if (colorChanged) {
                        utils.markAsDirty();
                        
                        // Update the visual representation
                        const targetDisplayIndex = utils.getDisplayColorIndex(targetColorIndex);
                        const colorEntry = appState.palette.current[targetDisplayIndex];
                        const hexColor = colorEntry?.hex || '#FF00FF';
                        
                        // Update sprite in grid
                        const gridSpriteBox = document.querySelector(`.sprite-box[data-index="${originalSpriteIndex}"]`);
                        if (gridSpriteBox) {
                            const spritePixels = gridSpriteBox.querySelectorAll('.sprite-pixel');
                            spriteToReplace.pixels.forEach((colorIndex, pixelIndex) => {
                                if (spritePixels[pixelIndex]) {
                                    const displayColorIndex = utils.getDisplayColorIndex(colorIndex);
                                    const pixelColor = appState.palette.current[displayColorIndex]?.hex || '#FF00FF';
                                    spritePixels[pixelIndex].style.backgroundColor = pixelColor;
                                }
                            });
                        }
                        
                        // Update detail view
                        const detailPixels = document.querySelectorAll(`.detail-pixel[data-original-sprite-index="${originalSpriteIndex}"]`);
                        detailPixels.forEach(detailPixel => {
                            const localPixelIndex = parseInt(detailPixel.dataset.localPixelIndex, 10);
                            if (!isNaN(localPixelIndex) && localPixelIndex < spriteToReplace.pixels.length) {
                                const colorIndex = spriteToReplace.pixels[localPixelIndex];
                                const displayColorIndex = utils.getDisplayColorIndex(colorIndex);
                                const pixelColor = appState.palette.current[displayColorIndex]?.hex || '#FF00FF';
                                detailPixel.style.backgroundColor = pixelColor;
                            }
                        });
                        
                        vscode.postMessage({
                            command: 'updateSpritePixels',
                            spriteIndex: originalSpriteIndex,
                            pixels: spriteToReplace.pixels,
                            skipVsCodeDirtyNotification: true
                        });
                        
                        console.log(`[Webview Handlers] Color ${sourceColorIndex} replaced with ${targetColorIndex} in sprite ${originalSpriteIndex}`);
                    }
                }
                return;
            } else {
                // Regular drawing
                event.preventDefault();
                if (event.button !== 0 && event.button !== 2) return;
                localState.isDrawing = true;
                localState.drawButton = event.button;
                localState.lastDrawnPixelIndex = -1;
                drawPixel(event, localState.drawButton);
            }
        });

        // Separate handlers for drawing and hovering
        domElements.mainSpriteDetailContainer.addEventListener('mousemove', (event) => {
            // Hover logic needs to be adapted for composite view
            const hoveredPixel = event.target.closest('.detail-pixel');
            if (hoveredPixel && !localState.isDrawing) {
                const originalSpriteIndexStr = hoveredPixel.dataset.originalSpriteIndex;
                const localPixelIndexStr = hoveredPixel.dataset.localPixelIndex;
                
                // Only proceed if these data attributes exist (i.e., not a placeholder pixel)
                if (originalSpriteIndexStr !== undefined && localPixelIndexStr !== undefined) {
                    const originalSpriteIndex = parseInt(originalSpriteIndexStr, 10);
                    const localPixelIndex = parseInt(localPixelIndexStr, 10);

                    if (!isNaN(originalSpriteIndex) && !isNaN(localPixelIndex) && 
                        originalSpriteIndex >= 0 && originalSpriteIndex < appState.spriteData.count) {
                        
                        const currentSprite = appState.spriteData.sprites[originalSpriteIndex];
                        if (currentSprite && localPixelIndex >= 0 && localPixelIndex < currentSprite.pixels.length) {
                            const rawValue = currentSprite.pixels[localPixelIndex];
                            const finalPaletteIndex = utils.getDisplayColorIndex(rawValue);
                            const colorEntry = appState.palette.current[finalPaletteIndex] || { hex: '#FF00FF', priority: false };
                            const hexColor = colorEntry.hex;
                            const rgb9 = utils.hexToRgb9(hexColor);
                            const [byte1Val, byte2Val] = rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9, colorEntry.priority); // Assuming rgb9ToBytes takes priority

                            if (domElements.hoverPreviewBox) domElements.hoverPreviewBox.style.backgroundColor = hexColor;
                            if (domElements.hoverRawValue) domElements.hoverRawValue.textContent = rawValue.toString();
                            if (domElements.hoverPaletteIndex) domElements.hoverPaletteIndex.textContent = finalPaletteIndex.toString();
                            if (domElements.hoverHexValue) domElements.hoverHexValue.textContent = hexColor;
                            if (domElements.hoverByte1) domElements.hoverByte1.textContent = byte1Val.toString(2).padStart(8, '0');
                            if (domElements.hoverByte2) domElements.hoverByte2.textContent = byte2Val.toString(2).padStart(8, '0');
                            if (domElements.hoverInfoContainer) domElements.hoverInfoContainer.style.display = 'flex';

                            if (localState.currentlyHoverHighlightedIndex !== -1) {
                                const prevSwatch = domElements.palettePicker?.querySelector(`.color-swatch[data-color-index="${localState.currentlyHoverHighlightedIndex}"]`);
                                prevSwatch?.classList.remove('hover-highlight');
                            }
                            if (finalPaletteIndex < appState.palette.visibleSize) {
                                const currentSwatch = domElements.palettePicker?.querySelector(`.color-swatch[data-color-index="${finalPaletteIndex}"]`);
                                currentSwatch?.classList.add('hover-highlight');
                                localState.currentlyHoverHighlightedIndex = finalPaletteIndex;
                            }
                        } else {
                            handleDetailGridLeave(); // Clear hover if data invalid
                        }
                    } else {
                        handleDetailGridLeave(); // Clear hover if data invalid
                    }
                } else {
                    handleDetailGridLeave(); // Clear hover if it's a placeholder pixel
                }
            } else if (!hoveredPixel && !localState.isDrawing) {
                 handleDetailGridLeave(); // Clear hover if mouse is not over any pixel
            }

            // Drawing logic remains largely the same, just calls the modified drawPixel
            if (localState.isDrawing) {
                event.preventDefault();
                drawPixel(event, localState.drawButton);
            }
        });
        
        // domElements.mainSpriteDetailContainer.addEventListener('mousemove', handleDetailGridHover);
        domElements.mainSpriteDetailContainer.addEventListener('mouseleave', handleDetailGridLeave);
        
        domElements.mainSpriteDetailContainer.addEventListener('mousemove', (event) => {
            if (localState.isDrawing) {
                event.preventDefault();
                drawPixel(event, localState.drawButton);
            }
        });
        
        // Add mouseleave handler to stop drawing if mouse leaves the container
        domElements.mainSpriteDetailContainer.addEventListener('mouseleave', (event) => {
            if (localState.isDrawing) {
                localState.isDrawing = false;
            }
        });
        
        // Global mouseup to stop drawing
        // console.log("[Webview Handlers] Attaching global mouseup listener");
        window.addEventListener('mouseup', (event) => {
            if (localState.isDrawing && event.button === localState.drawButton) {
                localState.isDrawing = false; 
            }
            // Handle right-click copy cancellation
            if (localState.isCopyingColor && event.button === 2) {
                 if (!event.target || !(event.target instanceof Element) || !event.target.closest('.color-swatch')) {
                    localState.isCopyingColor = false;
                    localState.colorCopySourceIndex = -1;
                }
            }
        });
    } else {
         console.warn("[Webview Handlers] mainSpriteDetailContainer not found");
    }

    if (domElements.saveButton) {
        domElements.saveButton.addEventListener('click', () => {
             // Check the central state directly
             if (appState.editor.isDirty) { 
                 vscode.postMessage({ command: 'saveChanges' });
             } else {
                 // console.log("[Webview Handlers] Save button clicked, but no changes detected (appState.editor.isDirty is false).");
              }
         });
    }

    if (domElements.sliderR && domElements.sliderG && domElements.sliderB) {
        [domElements.sliderR, domElements.sliderG, domElements.sliderB].forEach(slider => {
            slider.addEventListener('input', () => {
                const valueSpanId = 'value' + slider.id.slice(-1);
                const valueSpan = document.getElementById(valueSpanId);
                if (valueSpan) valueSpan.textContent = slider.value;
                // console.log(`[Webview Handlers] Slider input detected: ${slider.id}`); // <<< REMOVE LOG
                handleColorUpdate();
            });
        });
    }

    if (domElements.colorPickerInput && domElements.sliderR && domElements.sliderG && domElements.sliderB) {
        domElements.colorPickerInput.addEventListener('input', (event) => {
            if (utils.isDefaultPaletteActive()) {
                vscode.postMessage({ command: 'promptEditDefaultPalette' });
                const activeIndex = appState.selection.editorColorIndex;
                if(activeIndex !== -1) event.target.value = appState.palette.current[activeIndex];
                return;
            }
            if (appState.selection.editorColorIndex !== appState.selection.primaryColorIndex) {
                 event.target.value = appState.palette.current[appState.selection.primaryColorIndex];
                return; 
            }
            const pickedHexColor = event.target.value;
            const rgb9 = utils.hexToRgb9(pickedHexColor);
            const quantizedHexColor = utils.rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9);
            domElements.sliderR.value = rgb9.r9.toString();
            domElements.sliderG.value = rgb9.g9.toString();
            domElements.sliderB.value = rgb9.b9.toString();
            domElements.valueR.textContent = rgb9.r9.toString();
            domElements.valueG.textContent = rgb9.g9.toString();
            domElements.valueB.textContent = rgb9.b9.toString();
            if (pickedHexColor !== quantizedHexColor) event.target.value = quantizedHexColor;
            handleColorUpdate();
        });
    }

    const savePaletteButton = document.getElementById('savePaletteButton');
    if (savePaletteButton) {
        savePaletteButton.addEventListener('click', () => {
            if (!utils.isDefaultPaletteActive()) {
                vscode.postMessage({ command: 'savePalette' }); 
                // When saving the palette, mark it as clean
                appState.palette.isDirty = false;
                savePaletteButton.classList.remove('save-button-dirty');
            } else {
                 vscode.postMessage({ command: 'promptEditDefaultPalette' });
            }
        });
    }

    if (domElements.reloadDataButton) {
        domElements.reloadDataButton.addEventListener('click', () => {
            // Add a loading indicator and disable the button to prevent multiple clicks
            const button = domElements.reloadDataButton;
            if (button.disabled) return; // Prevent multiple clicks
            
            // Add visual feedback
            const originalText = button.textContent;
            button.textContent = "Reloading...";
            button.disabled = true;
            
            // Send reload message to extension
            vscode.postMessage({ command: 'reloadData' });
            
            // Set a timeout to reset button state in case the reload fails
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 5000); // 5 second timeout
        });
    }

    if (domElements.paletteSizeSelect) {
        // console.log("[Webview Handlers] Attaching listener to paletteSizeSelect");
        domElements.paletteSizeSelect.addEventListener('change', (event) => {
            const newSize = parseInt(event.target.value, 10);
            if (!isNaN(newSize)) {
                appState.palette.visibleSize = newSize;
                // console.log(`[Webview Handlers] Palette size changed to: ${newSize}`);
                utils.requestPaletteRedraw();
            }
        });
    } else {
        console.warn("[Webview Handlers] paletteSizeSelect not found");
    }

    if (domElements.mergePaletteButton) {
        domElements.mergePaletteButton.addEventListener('click', () => {
            if (utils.isDefaultPaletteActive()) {
                vscode.postMessage({ command: 'promptEditDefaultPalette' });
                return;
            }
            vscode.postMessage({ 
                command: 'requestPaletteMerge',
                visiblePaletteSize: appState.palette.visibleSize,
                startIndex: appState.selection.primaryColorIndex
            });
        });
    } else {
        console.warn("[Webview Handlers] mergePaletteButton not found.");
    }
    
    // Add transform button listeners (assuming #transformControls exists)
    const transformControls = document.getElementById('transformControls');
    if (transformControls) {
        // console.log("[Webview Handlers] Attaching listeners to transformControls buttons");
        transformControls.querySelectorAll('button').forEach(btn => {
            // Get action from data-action attribute
            const action = btn.dataset.action;
            if (action) {
                btn.addEventListener('click', () => handleTransform(action));
            } else {
                console.warn(`[Webview Handlers] Button missing data-action attribute: ${btn.outerHTML}`);
            }
        });
    } else {
        console.warn('[Webview Handlers] Could not find #transformControls to attach listeners.');
    }

    // Attach listeners to dynamically created palette swatches
    if (domElements.palettePicker) {
        // console.log("[Webview Handlers] Attaching drag/drop listeners to palette swatches");
        domElements.palettePicker.querySelectorAll('.color-swatch').forEach(swatch => {
            // Drag/Drop handlers defined earlier in this file
            swatch.addEventListener('dragstart', handleDragStart);
            swatch.addEventListener('dragover', handleDragOver);
            swatch.addEventListener('dragleave', handleDragLeave);
            swatch.addEventListener('drop', handleDrop);
            swatch.addEventListener('dragend', handleDragEnd);
        });
    } else {
        console.warn("[Webview Handlers] palettePicker not found for attaching swatch listeners.");
    }

    // Keyboard listener
    // console.log("[Webview Handlers] Attaching global keydown listener");
    document.addEventListener('keydown', (event) => {
        console.log(`[Webview] Key pressed: ${event.key}`);
        handleKeyDown(event, appState, domElements, utils, vscode);
    });
    
    // Add keyup listener to reset color replace mode when 'c' key is released
    document.addEventListener('keyup', (event) => {
        if (event.key === 'c' || event.key === 'C') {
            if (localState.isColorReplaceActive) {
                localState.isColorReplaceActive = false;
                console.log('[Webview Handlers] Color replace mode deactivated');
                
                // Remove visual feedback
                if (domElements.mainSpriteDetailContainer) {
                    domElements.mainSpriteDetailContainer.classList.remove('color-replace-mode');
                    domElements.mainSpriteDetailContainer.style.cursor = '';
                }
            }
        }
    });

    // Add listener for palette visibility slider
    const paletteSizeSlider = document.getElementById('paletteSizeSlider');
    const paletteSizeValue = document.getElementById('paletteSizeValue');
    if (paletteSizeSlider && paletteSizeValue) {
        paletteSizeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            paletteSizeValue.textContent = value;
            appState.palette.visibleSize = value;
            utils.requestFullRedraw(); // Need to redraw palette picker
            // No need to message provider for this UI-only change
        });
    }

    // Add listener for merge palette button
    const mergeButton = document.getElementById('mergePaletteButton');
    if (mergeButton) {
        mergeButton.addEventListener('click', () => {
            if (utils.isDefaultPaletteActive()) {
                vscode.postMessage({ command: 'promptEditDefaultPalette' });
            } else {
                vscode.postMessage({ 
                    command: 'mergePalette', 
                    targetOffset: 0, // Example: always merge at start for now
                    paletteSize: appState.palette.visibleSize // Use visible size
                }); 
            }
        });
    }

    // NEW: Add listener for Primary Priority Checkbox
    const priorityCheckbox = document.getElementById('primaryPriorityFlag');
    if (priorityCheckbox) {
        priorityCheckbox.addEventListener('change', handlePriorityChange);
    } else {
        console.warn("[Webview Handlers] Primary priority checkbox (#primaryPriorityFlag) not found.");
    }

    // --- Initial setup based on passed state ---
    if (appState.viewState.showGrid && domElements.spriteListContainer) {
        domElements.spriteListContainer.classList.add('show-sprite-borders');
    }

    // Add handler for analyze duplicates button
    const analyzeDuplicatesButton = document.getElementById('analyzeDuplicatesButton');
    if (analyzeDuplicatesButton) {
        analyzeDuplicatesButton.addEventListener('click', () => {
            vsCodeApi.postMessage({ command: 'analyzeDuplicates' });
        });
    }

    // console.log("[Webview Handlers] Event listeners setup complete.");
    console.log("[Webview Handlers] >>> setupEventListeners END"); // <<< ADDED LOG

    // Add listener for sprite brush select
    if (domElements.spriteBrushSelect) {
        console.log("[Webview Handlers] Attaching listener to spriteBrushSelect");
        domElements.spriteBrushSelect.addEventListener('change', e => {
            const selectedValue = e.target.value; // e.g., "1x1", "1x2", "2x2"
            const parts = selectedValue.split('x');
            if (parts.length === 2) {
                const brushWidth = parseInt(parts[0], 10);
                const brushHeight = parseInt(parts[1], 10);
                if (!isNaN(brushWidth) && !isNaN(brushHeight)) {
                    const newBrush = { width: brushWidth, height: brushHeight };
                    console.log(`[Webview Handlers] Sprite brush changed to: ${newBrush.width}x${newBrush.height}`);
                    // Update local appState immediately for responsiveness
                    if (appState.viewState) {
                        appState.viewState.spriteBrush = newBrush;
                    }
                    // Send message to the extension
                    vscode.postMessage({
                        command: 'changeSpriteBrush',
                        brush: newBrush
                    });
                    // The extension will send back an 'update' message with the new viewState,
                    // which will re-confirm this change and trigger any necessary UI updates
                    // related to the viewState (though brush size primarily affects drawing logic).
                } else {
                    console.warn("[Webview Handlers] Invalid sprite brush value parsed:", selectedValue);
                }
            } else {
                console.warn("[Webview Handlers] Invalid sprite brush value format:", selectedValue);
            }
        });
    } else {
        console.warn("[Webview Handlers] spriteBrushSelect DOM element not found.");
    }

    return {
        domElements,
        utils,
        vscode
    };
}

// NEW: Handler for priority checkbox change
function handlePriorityChange(event) {
    // Skip handling if this change was triggered programmatically
    if (event.target._isBeingUpdatedProgrammatically) {
        console.log(`[handlePriorityChange] Ignoring event triggered by programmatic update`);
        return;
    }

    const isChecked = event.target.checked;
    const primaryIndex = appState.selection.primaryColorIndex;
    console.log(`[handlePriorityChange] Priority checkbox changed for index ${primaryIndex} to ${isChecked}`);

    if (utils.isDefaultPaletteActive()) {
        vscode.postMessage({ command: 'promptEditDefaultPalette' });
        // Revert checkbox state visually
        event.target.checked = !isChecked;
        return;
    }

    if (primaryIndex >= 0 && primaryIndex < appState.palette.current.length) {
        // Find the palette entry object and update its priority
        const colorEntry = appState.palette.current[primaryIndex];
        if (colorEntry) {
            console.log(`[handlePriorityChange] Before: priority=${colorEntry.priority}`);
            colorEntry.priority = isChecked;
            console.log(`[handlePriorityChange] After: priority=${colorEntry.priority}`);
            utils.markAsDirty(true); // Mark only the palette as dirty, not the sprite
            
            // Send update to extension (reuse paletteEdit)
            const message = {
                command: 'paletteEdit',
                index: primaryIndex,
                newHexColor: colorEntry.hex, // Send hex as well
                priority: isChecked        // Include new priority state
            };
            console.log(`[handlePriorityChange] Sending paletteEdit message:`, message);
            vscode.postMessage(message);
            
            // Update tooltip of the corresponding swatch
            const allSwatches = domElements.palettePicker?.querySelectorAll('.color-swatch');
            let swatch = null;
            
            // Find the swatch with the matching index
            if (allSwatches) {
                console.log(`[Priority Change] Looking for swatch with index ${primaryIndex} among ${allSwatches.length} swatches`);
                
                allSwatches.forEach(sw => {
                    const swatchIndex = parseInt(sw.dataset.colorIndex, 10);
                    if (swatchIndex === primaryIndex) {
                        swatch = sw;
                        console.log(`[Priority Change] Found matching swatch for index ${primaryIndex}`);
                    }
                });
            }
            
            if (swatch) {
                console.log(`[Priority Change] Updating tooltip for index ${primaryIndex}, priority: ${isChecked}`);
                
                // Extract RGB components from hex
                const r = parseInt(colorEntry.hex.substring(1, 3), 16);
                const g = parseInt(colorEntry.hex.substring(3, 5), 16);
                const b = parseInt(colorEntry.hex.substring(5, 7), 16);
                
                // Get RGB9 values
                const rgb9 = utils.hexToRgb9(colorEntry.hex);
                
                // Calculate RGB9 bytes
                const r9 = rgb9.r9;
                const g9 = rgb9.g9;
                const b9 = rgb9.b9;
                
                // Calculate RGB9 bytes for tooltip
                const rgb9Byte1 = ((r9 & 0x7) << 5) | ((g9 & 0x7) << 2) | ((b9 & 0x3) >> 1);
                const rgb9Byte2 = ((b9 & 0x1) << 7) | (isChecked ? 0x80 : 0);
                
                // Update the tooltip with all information
                swatch.title = `Index: ${primaryIndex}
Hex: ${colorEntry.hex}
RGB9 bytes: (${rgb9Byte1}, ${rgb9Byte2})
RGB9: (${r9},${g9},${b9})
RGB24: (${r},${g},${b})
Priority: ${isChecked}`;
            }
        } else {
            console.warn(`[Webview Handlers] Could not find palette entry for index ${primaryIndex} to update priority.`);
        }
    } else {
        console.warn(`[Webview Handlers] Invalid primary color index (${primaryIndex}) for priority change.`);
    }
}

// --- Ctrl+LMB Drag Handlers ---
function handleCtrlMouseDown(event) {
    // Only process left mouse button (0) with Ctrl key
    if (event.button !== 0 || !event.ctrlKey) return;
    
    const swatch = event.target.closest('.color-swatch');
    if (!swatch) return;
    
    const sourceIndex = parseInt(swatch.dataset.colorIndex, 10);
    if (isNaN(sourceIndex)) return;
    
    // Start the drag operation
    localState.ctrlDragActive = true;
    localState.ctrlDragSourceIndex = sourceIndex;
    
    // Add visual indicator for dragged swatch
    swatch.classList.add('ctrl-dragging');
    
    // Show visual feedback notification
    const notification = document.createElement('div');
    notification.className = 'color-swap-notification';
    notification.textContent = `Swap color ${sourceIndex} with...`;
    notification.style.position = 'fixed';
    notification.style.top = `${event.clientY + 20}px`;
    notification.style.left = `${event.clientX + 10}px`;
    notification.style.backgroundColor = 'var(--vscode-editor-background)';
    notification.style.color = 'var(--vscode-editor-foreground)';
    notification.style.padding = '5px 10px';
    notification.style.borderRadius = '3px';
    notification.style.border = '1px solid var(--vscode-widget-border)';
    notification.style.zIndex = '1000';
    notification.style.pointerEvents = 'none';
    notification.id = 'color-swap-notification';
    
    // Remove any existing notification
    const existingNotification = document.getElementById('color-swap-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    document.body.appendChild(notification);
    
    console.log(`[Webview Handlers] Ctrl+LMB drag started for color ${sourceIndex}`);
    
    // Prevent default to stop regular draggable behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Disable native dragging for the duration of this operation
    if (swatch.draggable) {
        swatch.draggable = false;
        // Store the swatch reference to re-enable draggable after operation
        localState.dragDisabledSwatch = swatch;
    }
}

function handleCtrlMouseMove(event) {
    if (!localState.ctrlDragActive) return;
    
    // Verify Ctrl key is still held down
    if (!event.ctrlKey) {
        cancelCtrlDrag();
        return;
    }
    
    const swatch = event.target.closest('.color-swatch');
    
    // Update notification position
    const notification = document.getElementById('color-swap-notification');
    if (notification) {
        notification.style.top = `${event.clientY + 20}px`;
        notification.style.left = `${event.clientX + 10}px`;
    }
    
    // Remove previous target highlights
    document.querySelectorAll('.color-swatch.swap-target').forEach(
        sw => sw.classList.remove('swap-target')
    );
    
    if (swatch) {
        const targetIndex = parseInt(swatch.dataset.colorIndex, 10);
        if (!isNaN(targetIndex) && targetIndex !== localState.ctrlDragSourceIndex) {
            // Add visual feedback for the target
            swatch.classList.add('swap-target');
            localState.ctrlDragTargetIndex = targetIndex;
            
            // Update notification text
            if (notification) {
                notification.textContent = `Swap color ${localState.ctrlDragSourceIndex} with ${targetIndex}`;
            }
        } else {
            localState.ctrlDragTargetIndex = -1;
        }
    } else {
        localState.ctrlDragTargetIndex = -1;
    }
}

function handleCtrlMouseUp(event) {
    if (!localState.ctrlDragActive) return;
    
    const sourceIndex = localState.ctrlDragSourceIndex;
    const targetIndex = localState.ctrlDragTargetIndex;
    
    if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
        console.log(`[Webview Handlers] Ctrl+LMB drag complete - swapping colors ${sourceIndex} and ${targetIndex}`);
        
        if (utils.isDefaultPaletteActive()) {
            vscode.postMessage({ command: 'promptEditDefaultPalette' });
        } else {
            // First store the colors for swapping
            const sourceColor = { ...appState.palette.current[sourceIndex] };
            
            // If we're swapping to a palette index beyond what's loaded, create a black color there
            if (targetIndex >= appState.palette.current.length) {
                // Create a new color at the target position if needed
                while (appState.palette.current.length <= targetIndex) {
                    appState.palette.current.push({ hex: '#000000', priority: false });
                }
                console.log(`[Webview Handlers] Extended palette to index ${targetIndex}`);
            }
            
            const targetColor = { ...appState.palette.current[targetIndex] };
            
            // Now perform the swap in the local palette
            appState.palette.current[sourceIndex] = targetColor;
            appState.palette.current[targetIndex] = sourceColor;
            
            // Swap pixel indices in sprites
            const modifiedSpriteIndices = utils.swapPixelIndices(sourceIndex, targetIndex);
            
            // Update UI - mark sprite as dirty because pixel values change
            utils.markAsDirty(false); // false = this is a sprite change
            
            // Send message to extension to sync state
            vscode.postMessage({
                command: 'paletteSwap', 
                indexA: sourceIndex,
                indexB: targetIndex,
                newColorA: appState.palette.current[sourceIndex],
                newColorB: appState.palette.current[targetIndex]
            });
            
            // Send updated sprite data
            modifiedSpriteIndices.forEach(spriteIdx => {
                if (appState.spriteData && appState.spriteData.sprites && appState.spriteData.sprites[spriteIdx]) {
                     vscode.postMessage({
                         command: 'updateSpritePixels',
                         spriteIndex: spriteIdx,
                         pixels: appState.spriteData.sprites[spriteIdx].pixels,
                         skipVsCodeDirtyNotification: true
                     });
                }
            });
            
            // Redraw the UI
            utils.requestFullRedraw();
        }
    }
    
    // Clean up
    cancelCtrlDrag();
}

function cancelCtrlDrag() {
    if (localState.ctrlDragActive) {
        // Remove visual indicators
        document.querySelectorAll('.color-swatch.ctrl-dragging').forEach(
            sw => sw.classList.remove('ctrl-dragging')
        );
        document.querySelectorAll('.color-swatch.swap-target').forEach(
            sw => sw.classList.remove('swap-target')
        );
        
        // Remove notification
        const notification = document.getElementById('color-swap-notification');
        if (notification) {
            notification.remove();
        }
        
        // Re-enable draggable if it was disabled
        if (localState.dragDisabledSwatch) {
            localState.dragDisabledSwatch.draggable = true;
            localState.dragDisabledSwatch = null;
        }
        
        // Reset state
        localState.ctrlDragActive = false;
        localState.ctrlDragSourceIndex = -1;
        localState.ctrlDragTargetIndex = -1;
        
        console.log('[Webview Handlers] Ctrl+LMB drag operation canceled/completed');
    }
}