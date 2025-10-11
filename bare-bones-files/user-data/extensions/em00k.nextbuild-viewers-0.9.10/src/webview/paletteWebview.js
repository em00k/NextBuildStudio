/* eslint-disable curly */
// Get VS Code API
const vscode = acquireVsCodeApi();

// --- Global State Variables ---
let activeColorIndex = -1;
let currentPaletteHex = []; // Initialize as empty, will be populated
let draggedIndex = -1; // For drag & drop
let hasUnsavedChanges = false; // Track dirty state locally
let secondaryPaletteHex = null; // Add state for secondary palette
let secondaryPaletteName = '';
let activeSecondaryColorIndex = -1; // Add state for tracking selected secondary color
let copyStartColorIndex = -1; // For Shift+LMB copy start selection


// --- DOM Element References ---
// Get DOM elements up front to avoid temporal dead zone issues
const paletteContainer = document.querySelector('.palette-container');
const editorPanel = document.getElementById('editorPanel');
const sliderR = document.getElementById('sliderR');
const sliderG = document.getElementById('sliderG');
const sliderB = document.getElementById('sliderB');
const valueR = document.getElementById('valueR');
const valueG = document.getElementById('valueG');
const valueB = document.getElementById('valueB');
const previewBox = document.getElementById('previewBox');
const previewHex = document.getElementById('previewHex');
const pickerColorIndex = document.getElementById('pickerColorIndex');
const byte1Input = document.getElementById('byte1Input');
const byte2Input = document.getElementById('byte2Input');
const colorPickerInput = document.getElementById('colorPickerInput');
const saveChangesButton = document.getElementById('saveChangesButton');
const priorityBitToggle = document.getElementById('priorityBitToggle');
  
const resetPriorityButton = document.getElementById('resetPriorityButton');
const paletteHoverInfo = document.getElementById('paletteHoverInfo');
const hoverPreviewBox = document.getElementById('hoverPreviewBox');
const hoverPaletteIndex = document.getElementById('hoverPaletteIndex');
const hoverHexValue = document.getElementById('hoverHexValue');
const hoverR9Value = document.getElementById('hoverR9Value');
const hoverG9Value = document.getElementById('hoverG9Value');
const hoverB9Value = document.getElementById('hoverB9Value');
const hoverPriorityValue = document.getElementById('hoverPriorityValue');
const hoverByte1 = document.getElementById('hoverByte1');
const hoverByte2 = document.getElementById('hoverByte2');

// Merge Tool Elements
const loadSecondaryPaletteButton = document.getElementById('loadSecondaryPaletteButton');
const secondaryPaletteInfo = document.getElementById('secondaryPaletteInfo');
const secondaryPaletteNameDisplay = document.getElementById('secondaryPaletteName');
const secondaryPaletteContainer = document.getElementById('secondary-palette-container');
const mergeOffsetInput = document.getElementById('mergeOffsetInput');
const mergeCountInput = document.getElementById('mergeCountInput');
const mergeButton = document.getElementById('mergeButton');

// Import Palette Elements
const importDialog = document.getElementById('importDialog');
const importPreview = document.getElementById('importPreview');
const importInfo = document.getElementById('importInfo');
const importOffset = document.getElementById('importOffset');
const importCount = document.getElementById('importCount');
const importPaletteButton = document.getElementById('importPaletteButton');
const importImageButton = document.getElementById('importImageButton');
const startImportButton = document.getElementById('startImportButton');
const confirmImportButton = document.getElementById('confirmImportButton');
const cancelImportButton = document.getElementById('cancelImportButton');

let importedPalette = null;

// Palette Operations Elements
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const defaultPaletteButton = document.getElementById('defaultPaletteButton'); 
const sortPaletteButton = document.getElementById('sortPaletteButton');
const generateGradientButton = document.getElementById('generateGradientButton');
const generateHarmoniesButton = document.getElementById('generateHarmoniesButton');
const reducePaletteButton = document.getElementById('reducePaletteButton');

// Sort Dialog Elements
const sortPaletteDialog = document.getElementById('sortPaletteDialog');
const sortMode = document.getElementById('sortMode');
const referenceColorRow = document.getElementById('referenceColorRow');
const referenceColorPreview = document.getElementById('referenceColorPreview');
const referenceColorIndex = document.getElementById('referenceColorIndex');
const cancelSortButton = document.getElementById('cancelSortButton');
const confirmSortButton = document.getElementById('confirmSortButton');

// Gradient Dialog Elements
const gradientDialog = document.getElementById('gradientDialog');
const gradientStartColor = document.getElementById('gradientStartColor');
const gradientStartColorIndex = document.getElementById('gradientStartColorIndex');
const gradientEndColor = document.getElementById('gradientEndColor');
const gradientEndColorIndex = document.getElementById('gradientEndColorIndex');
const gradientSteps = document.getElementById('gradientSteps');
const gradientTargetIndex = document.getElementById('gradientTargetIndex');
const gradientPreview = document.getElementById('gradientPreview');
const cancelGradientButton = document.getElementById('cancelGradientButton');
const confirmGradientButton = document.getElementById('confirmGradientButton');

// Harmonies Dialog Elements
const harmoniesDialog = document.getElementById('harmoniesDialog');
const harmonyBaseColor = document.getElementById('harmonyBaseColor');
const harmonyBaseColorIndex = document.getElementById('harmonyBaseColorIndex');
const harmonyMode = document.getElementById('harmonyMode');
const harmonyTargetIndex = document.getElementById('harmonyTargetIndex');
const harmonyPreview = document.getElementById('harmonyPreview');
const cancelHarmonyButton = document.getElementById('cancelHarmonyButton');
const confirmHarmonyButton = document.getElementById('confirmHarmonyButton');

// Reduce Dialog Elements
const reducePaletteDialog = document.getElementById('reducePaletteDialog');
const reduceStartIndex = document.getElementById('reduceStartIndex');
const reduceEndIndex = document.getElementById('reduceEndIndex');
const reduceTargetCount = document.getElementById('reduceTargetCount');
const cancelReduceButton = document.getElementById('cancelReduceButton');
const confirmReduceButton = document.getElementById('confirmReduceButton');

// --- Handler Functions for New Buttons ---

// Reset to default palette
function handleDefaultPalette() {
    console.log('[Webview JS] Requesting confirmation for default palette reset.');
    vscode.postMessage({
        command: 'requestConfirmResetPalette' 
    });
}



// End RESTORED Helper Functions

// Function to update the editor panel
function updateEditorPanel(rgb9, isPriority = false) {
    if (!sliderR || !sliderG || !sliderB || !valueR || !valueG || !valueB || !previewBox || !previewHex || !byte1Input || !byte2Input) {
        console.error("[Webview JS] Editor panel elements not found for update.");
        return;
    }
    sliderR.value = rgb9.r9;
    sliderG.value = rgb9.g9;
    sliderB.value = rgb9.b9;
    valueR.textContent = rgb9.r9;
    valueG.textContent = rgb9.g9;
    valueB.textContent = rgb9.b9;

    const hexColor = rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9);
    previewBox.style.backgroundColor = hexColor;
    previewHex.textContent = hexColor.toUpperCase();

    const bytes = rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
    byte1Input.value = bytes.byte1.toString(16).toUpperCase().padStart(2, '0');
    byte2Input.value = bytes.byte2.toString(16).toUpperCase().padStart(2, '0');

    // Set priority bit checkbox
    if (priorityBitToggle) {
        priorityBitToggle.checked = isPriority;
    }

    if (pickerColorIndex) {
        pickerColorIndex.textContent = `(${activeColorIndex})`;
    }
}

// --- Context Menu Handler for Palette ---
function handlePaletteContextMenu(event) {
    const target = event.target.closest('.color-box');
    if (target) {
        const index = parseInt(target.dataset.index, 10);
        if (!isNaN(index) && index >= 0 && index < currentPaletteHex.length) {
            // Select this color as secondary color
            activeSecondaryColorIndex = index;
            
            // Update visual indicator for secondary selection
            const allBoxes = document.querySelectorAll('.color-box.secondary-selected');
            allBoxes.forEach(box => box.classList.remove('secondary-selected'));
            target.classList.add('secondary-selected');
            
            // Show message
            vscode.postMessage({
                command: 'showInfo',
                message: `Selected color ${index} as secondary color for gradients and operations`
            });
            
            // Prevent default context menu
            event.preventDefault();
        }
    }
}

// --- Drag & Drop Handlers ---
function handleDragStart(event) {
    const swatch = event.target;
    if (!swatch.classList || !swatch.classList.contains('color-box')) return; // Ensure it's a color box
    
    // If Ctrl is pressed, don't start regular drag, we'll use custom Ctrl+drag
    if (event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    
    draggedIndex = parseInt(swatch.dataset.index, 10);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedIndex.toString()); // Required for Firefox
    swatch.classList.add('dragging');
    // console.log(`Drag Start: Index ${draggedIndex}`);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetSwatch = event.target.closest('.color-box');
    if (targetSwatch && parseInt(targetSwatch.dataset.index, 10) !== draggedIndex) {
        targetSwatch.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const targetSwatch = event.target.closest('.color-box');
    if (targetSwatch) {
        targetSwatch.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    const targetSwatch = event.target.closest('.color-box');
    const sourceIndex = draggedIndex;

    if (targetSwatch) {
        targetSwatch.classList.remove('drag-over');
        const targetIndex = parseInt(targetSwatch.dataset.index, 10);

        if (sourceIndex !== -1 && targetIndex !== sourceIndex && sourceIndex < currentPaletteHex.length && targetIndex < currentPaletteHex.length) {
            
        //    recordPaletteChange ('reorder');

            // Perform swap in local array
            const sourceColor = currentPaletteHex[sourceIndex];
            currentPaletteHex.splice(sourceIndex, 1);
            currentPaletteHex.splice(targetIndex, 0, sourceColor);

            // Redraw the entire grid to reflect new order and indices
            redrawPaletteGrid(); 

            // Update editor panel if the selected color's index changed
            if (activeColorIndex !== -1) {
                 // Find the new index of the color that *was* selected
                 // We need to find the actual OBJECT now, not just the hex
                 const selectedEntry = currentPaletteHex.find(entry => entry.hex.toUpperCase() === previewHex.textContent?.toUpperCase());
                 const newSelectedIndex = selectedEntry ? currentPaletteHex.indexOf(selectedEntry) : -1;
                 
                 if (newSelectedIndex !== -1 && newSelectedIndex !== activeColorIndex) {
                    console.log(`Selected color index shifted from ${activeColorIndex} to ${newSelectedIndex}`);
                     activeColorIndex = newSelectedIndex;
                     // Update selection visuals (redundant due to redraw, but safe)
                     const newSelectedBox = paletteContainer.querySelector(`.color-box[data-index="${activeColorIndex}"]`);
                     if(newSelectedBox) newSelectedBox.classList.add('selected');
                     // Update editor panel index display
                     if (pickerColorIndex) pickerColorIndex.textContent = `(${activeColorIndex})`;
                 } else if (newSelectedIndex === -1 && activeColorIndex < currentPaletteHex.length) { // Color somehow disappeared? Should not happen with object refs
                      console.warn(`Could not find previously selected color after drop. Deselecting.`);
                      activeColorIndex = -1;
                      if (editorPanel) editorPanel.style.display = 'none';
                 } else if (newSelectedIndex === -1) {
                    // This case means the color wasn't found and editor wasn't open or index was invalid
                    activeColorIndex = -1;
                 }
             }            

            // Mark dirty and notify provider
            updateDirtyState(true);
            vscode.postMessage({
                command: 'updatePaletteOrder', 
                palette: currentPaletteHex // Send new order (array of objects)
            });
            console.log("[PaletteWebview] Palette order updated locally and message sent.");
        }
    }
    draggedIndex = -1;
    handleToggleColorIndex();  
}

function handleDragEnd(event) {
    if(event.target && event.target.classList) {
       event.target.classList.remove('dragging');
    }
    document.querySelectorAll('.color-box.drag-over').forEach(sw => sw.classList.remove('drag-over'));
    draggedIndex = -1;
}
// --- End Drag & Drop Handlers ---

// --- Ctrl+LMB Swap Color Handlers ---
let ctrlDragActive = false;
let ctrlDragSourceIndex = -1;
let ctrlDragTargetIndex = -1;
let dragDisabledSwatch = null;

function handleCtrlMouseDown(event) {
    // Only process left mouse button (0) with Ctrl key
    if (event.button !== 0 || !event.ctrlKey) return;
    
    const swatch = event.target.closest('.color-box');
    if (!swatch) return;
    
    const sourceIndex = parseInt(swatch.dataset.index, 10);
    if (isNaN(sourceIndex)) return;
    
    // Start the drag operation
    ctrlDragActive = true;
    ctrlDragSourceIndex = sourceIndex;
    
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
    
    console.log(`[Webview JS] Ctrl+LMB drag started for color ${sourceIndex}`);
    
    // Prevent default to stop regular draggable behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Disable native dragging for the duration of this operation
    if (swatch.draggable) {
        swatch.draggable = false;
        // Store the swatch reference to re-enable draggable after operation
        dragDisabledSwatch = swatch;
    }
}

function handleCtrlMouseMove(event) {
    if (!ctrlDragActive) return;
    
    // Verify Ctrl key is still held down
    if (!event.ctrlKey) {
        cancelCtrlDrag();
        return;
    }
    
    const swatch = event.target.closest('.color-box');
    
    // Update notification position
    const notification = document.getElementById('color-swap-notification');
    if (notification) {
        notification.style.top = `${event.clientY + 20}px`;
        notification.style.left = `${event.clientX + 10}px`;
    }
    
    // Remove previous target highlights
    document.querySelectorAll('.color-box.swap-target').forEach(
        sw => sw.classList.remove('swap-target')
    );
    
    if (swatch) {
        const targetIndex = parseInt(swatch.dataset.index, 10);
        if (!isNaN(targetIndex) && targetIndex !== ctrlDragSourceIndex) {
            // Add visual feedback for the target
            swatch.classList.add('swap-target');
            ctrlDragTargetIndex = targetIndex;
            
            // Update notification text
            if (notification) {
                notification.textContent = `Swap color ${ctrlDragSourceIndex} with ${targetIndex}`;
            }
        } else {
            ctrlDragTargetIndex = -1;
        }
    } else {
        ctrlDragTargetIndex = -1;
    }
}

function handleCtrlMouseUp(event) {
    if (!ctrlDragActive) return;
    
    // recordPaletteChange('swap');

    const sourceIndex = ctrlDragSourceIndex;
    const targetIndex = ctrlDragTargetIndex;
    
    if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
        console.log(`[Webview JS] Ctrl+LMB drag complete - swapping colors ${sourceIndex} and ${targetIndex}`);
        
        // First store the colors for swapping
        const sourceColor = { ...currentPaletteHex[sourceIndex] };
        const targetColor = { ...currentPaletteHex[targetIndex] };
        
        // Now perform the swap in the local palette
        currentPaletteHex[sourceIndex] = targetColor;
        currentPaletteHex[targetIndex] = sourceColor;
        
        // Redraw the entire grid to reflect new colors
        redrawPaletteGrid();
        
        // Mark dirty and notify provider
        updateDirtyState(true);
        
        // Send message to extension to sync state
        vscode.postMessage({
            command: 'paletteSwap', 
            indexA: sourceIndex,
            indexB: targetIndex,
            newColorA: currentPaletteHex[sourceIndex],
            newColorB: currentPaletteHex[targetIndex]
        });
        
        // Update editor panel if the selected color was swapped
        if (activeColorIndex === sourceIndex) {
            activeColorIndex = targetIndex;
            updateEditorPanel(hexToRgb9(currentPaletteHex[targetIndex].hex), currentPaletteHex[targetIndex].priority);
        } else if (activeColorIndex === targetIndex) {
            activeColorIndex = sourceIndex;
            updateEditorPanel(hexToRgb9(currentPaletteHex[sourceIndex].hex), currentPaletteHex[sourceIndex].priority);
        }
    }
    
    // Clean up
    cancelCtrlDrag();
}

function cancelCtrlDrag() {
    if (ctrlDragActive) {
        // Remove visual indicators
        document.querySelectorAll('.color-box.ctrl-dragging').forEach(
            sw => sw.classList.remove('ctrl-dragging')
        );
        document.querySelectorAll('.color-box.swap-target').forEach(
            sw => sw.classList.remove('swap-target')
        );
        
        // Remove notification
        const notification = document.getElementById('color-swap-notification');
        if (notification) {
            notification.remove();
        }
        
        // Re-enable draggable if it was disabled
        if (dragDisabledSwatch) {
            dragDisabledSwatch.draggable = true;
            dragDisabledSwatch = null;
        }
        
        // Reset state
        ctrlDragActive = false;
        ctrlDragSourceIndex = -1;
        ctrlDragTargetIndex = -1;
        
        console.log('[Webview JS] Ctrl+LMB drag operation canceled/completed');
    }
}

// --- Track Ctrl key state ---
window.ctrlKeyPressed = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
        // Track Ctrl key state
        window.ctrlKeyPressed = true;
        
        // Add class to all color swatches to indicate we're in swap mode
        document.querySelectorAll('.color-box').forEach(
            swatch => swatch.classList.add('ctrl-hover')
        );
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
        // Track Ctrl key state
        window.ctrlKeyPressed = false;
        
        // Remove class from all color swatches
        document.querySelectorAll('.color-box').forEach(
            swatch => swatch.classList.remove('ctrl-hover')
        );
        
        // Also cancel any active Ctrl+LMB drag operation
        if (ctrlDragActive) {
            cancelCtrlDrag();
        }
    }
});
// --- End Ctrl+LMB Swap Color Handlers ---

// --- NEW: Hover Handlers ---
function handlePaletteHover(event) {
    const target = event.target.closest('.color-box');
    if (!target || !paletteHoverInfo) return;

    const index = parseInt(target.dataset.index, 10);
    if (isNaN(index) || index < 0 || index >= currentPaletteHex.length) return;

    const colorEntry = currentPaletteHex[index]; // Get the PaletteColor object
    const hexColor = colorEntry.hex;
    const rgb9 = hexToRgb9(hexColor);
    const bytes = rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
    const priority = colorEntry.priority;

    // Update DOM elements
    if (hoverPreviewBox) hoverPreviewBox.style.backgroundColor = hexColor;
    if (hoverPaletteIndex) hoverPaletteIndex.textContent = index.toString();
    if (hoverHexValue) hoverHexValue.textContent = hexColor.toUpperCase();
    if (hoverR9Value) hoverR9Value.textContent = rgb9.r9.toString();
    if (hoverG9Value) hoverG9Value.textContent = rgb9.g9.toString();
    if (hoverB9Value) hoverB9Value.textContent = rgb9.b9.toString();
    if (hoverPriorityValue) hoverPriorityValue.textContent = priority.toString();
    if (hoverByte1) hoverByte1.textContent = bytes.byte1.toString(16).toUpperCase().padStart(2, '0');
    if (hoverByte2) hoverByte2.textContent = bytes.byte2.toString(16).toUpperCase().padStart(2, '0');
}

// Use named handler for click to re-attach after redraw
function handlePaletteClick(event) {
    const target = event.target.closest('.color-box');
    if (!target) return;

    const index = parseInt(target.dataset.index, 10);
    if (isNaN(index)) return;

    // Handle Shift + LMB for selecting copy start color
    if (event.shiftKey) {
        handleShiftLmbClick(event, index);
        return; // Prevent regular click logic from running
    }

    // Regular palette click functionality
    if (index >= 0 && index < currentPaletteHex.length) {
        // Update selection visually
        const previousSelected = paletteContainer.querySelector('.color-box.selected');
        if (previousSelected) previousSelected.classList.remove('selected');
        target.classList.add('selected');
        activeColorIndex = index;

        // Get data directly from the array object
        const colorEntry = currentPaletteHex[index];
        if (colorEntry) {
            const hexColor = colorEntry.hex;
            const rgb9 = hexToRgb9(hexColor);
            updateEditorPanel(rgb9, colorEntry.priority); // Pass priority bit information
            if (editorPanel) editorPanel.style.display = 'flex'; // Show editor
        } else {
            console.error(`[handlePaletteClick] No color entry found for index ${index}`);
            if (editorPanel) editorPanel.style.display = 'none'; // Hide editor if data missing
        }
    } else {
        console.warn(`[handlePaletteClick] Invalid index clicked: ${index}`);
    }
}

// --- End Hover Handlers ---

let colorIndexBoxesActive = true;

// Function to redraw the entire palette grid based on currentPaletteHex
function redrawPaletteGrid() {
    if (!paletteContainer) return;

    paletteContainer.innerHTML = ''; // Clear grid

    // Check if Ctrl is currently pressed
    const isCtrlPressed = window.ctrlKeyPressed || false;

    currentPaletteHex.forEach((colorEntry, index) => {
        const hexColor = colorEntry?.hex || '#FF00FF'; // Safely access hex, fallback to magenta

        // Color Box creation
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';

        colorBox.dataset.index = index.toString();
        colorBox.style.backgroundColor = hexColor;

        // Add priority bit class if priority is true
        if (colorEntry?.priority) {
            colorBox.classList.add('priority-bit-active');
        }

        // Add tooltip using the safe variable and other data
        try {
            const hexColor = colorEntry.hex;
            const rgb9 = hexToRgb9(hexColor); // Use hexColor here too
            //const rgb9 = hexToRgb9(currentPaletteHex[activeColorIndex].hex);
            const bytes = rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
            const priority = colorEntry?.priority || false; // Safe access for priority
            colorBox.title = `Index: ${index}\nHex: ${hexColor}\nRGB9: (${rgb9.r9},${rgb9.g9},${rgb9.b9})\nBytes: %${bytes.byte1.toString(16).toUpperCase().padStart(2, '0')},%${bytes.byte2.toString(16).toUpperCase().padStart(2, '0')}\nPriority: ${priority}`;
        } catch (e) {
            colorBox.title = `Index: ${index}\nError generating tooltip`;
        }
        
        colorBox.draggable = true;

        const indexSpan = document.createElement('span');
        indexSpan.className = 'color-index';
        indexSpan.style.display = 'block';
        indexSpan.textContent = index.toString();
        colorBox.appendChild(indexSpan);

        // Attach listeners
        colorBox.addEventListener('click', handlePaletteClick);
        colorBox.addEventListener('dragstart', handleDragStart);
        colorBox.addEventListener('dragover', handleDragOver);
        colorBox.addEventListener('dragleave', handleDragLeave);
        colorBox.addEventListener('drop', handleDrop);
        colorBox.addEventListener('dragend', handleDragEnd);
        colorBox.addEventListener('mouseover', handlePaletteHover);
        colorBox.addEventListener('contextmenu', handlePaletteContextMenu);
        
        // Add Ctrl+LMB drag event listeners
        colorBox.addEventListener('mousedown', handleCtrlMouseDown);
        colorBox.addEventListener('mousemove', handleCtrlMouseMove);
        colorBox.addEventListener('mouseup', handleCtrlMouseUp);

        // Log processing for the first few colors
        if (index < 5) {
            // Log the entire object this time
            console.log(`[redrawPaletteGrid] Processing index ${index}: entry=`, JSON.stringify(colorEntry)); 
        }

        // Re-apply selected class for individual color box
        if (index === activeColorIndex) {
            colorBox.classList.add('selected');
        }
        
        // Re-apply secondary selection class for right-clicked color
        if (index === activeSecondaryColorIndex) {
            colorBox.classList.add('secondary-selected');
        }
        
        // Re-apply copy-start selection class
        if (index === copyStartColorIndex) {
            colorBox.classList.add('copy-start-selected');
        }
        
        // Apply ctrl-hover class if Ctrl is currently pressed
        if (isCtrlPressed) {
            colorBox.classList.add('ctrl-hover');
        }

        handleToggleColorIndex();  

        paletteContainer.appendChild(colorBox);

    });
}

// Populate initial palette from embedded data
if (window.initialPalette && Array.isArray(window.initialPalette)) {
    // Direct assignment instead of map
    currentPaletteHex = window.initialPalette; 
    console.log(`[Webview JS] Initialized currentPaletteHex directly from window.initialPalette (${currentPaletteHex.length} entries).`);
    // Add log to inspect the first element
    if (currentPaletteHex.length > 0) {
        console.log('[Webview JS] Inspecting currentPaletteHex[0]:', JSON.stringify(currentPaletteHex[0]));
    }
} else {
    console.warn('[Webview JS] window.initialPalette not found or invalid. Palette will be empty initially.');
}

function handlePasteLogic(clipboardText) {
     const targetIndex = activeColorIndex; // Get the index selected when paste was initiated
     if (targetIndex < 0) { 
         console.warn("[Webview JS] handlePasteLogic: No target index active.");
         return; 
     }

    // Basic validation: Check if it looks like a hex code
    if (!clipboardText || !clipboardText.match(/^#[0-9a-fA-F]{6}$/)) {
        console.warn("[Webview JS] Paste: Received content is not a valid hex color:", clipboardText);
        return;
    }
    
    // Further validation: Ensure it's a valid 9-bit color by converting
    let validatedHex = '';
    try {
        const rgb9 = hexToRgb9(clipboardText);
        validatedHex = rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9).toUpperCase();
    } catch (e) {
            console.warn("[Webview JS] Paste: Received color ('${clipboardText}') conversion to 9-bit failed:", e);
            return;
    }
    
    // recordPaletteChange('paste');   

    if (targetIndex >= 0 && targetIndex < currentPaletteHex.length) {
        const oldColor = currentPaletteHex[targetIndex];
        const oldHex = oldColor.hex.toUpperCase();

        if (oldHex !== validatedHex) {
                console.log(`[Webview JS] Pasting color ${validatedHex} onto index ${targetIndex} (replacing ${oldHex})`);
            currentPaletteHex[targetIndex].hex = validatedHex;

            // Update the target swatch visually
            const swatch = paletteContainer.querySelector(`.color-box[data-index="${targetIndex}"]`);
            if (swatch) {
                swatch.style.backgroundColor = validatedHex;
            }

            // Update editor panel if the target color was selected
            if (activeColorIndex === targetIndex) {
                updateEditorPanel(hexToRgb9(validatedHex));
            }

            // Mark dirty and notify extension
            updateDirtyState(true);
            vscode.postMessage({ 
                command: 'paletteEdit', 
                index: targetIndex, 
                newHexColor: validatedHex 
            });
            console.log("[Webview JS] Sent paletteEdit message after paste.");
        } else {
                console.log(`[Webview JS] Paste skipped: Target color at index ${targetIndex} is already ${validatedHex}`);
        }
    } else {
            console.warn("[Webview JS] Paste: Invalid target index:", targetIndex);
    }
    // No try/catch needed here as clipboard read was handled by extension
}

// --- NEW: Handler for Shift + LMB clicks ---
function handleShiftLmbClick(event, index) {
    if (index >= 0 && index < currentPaletteHex.length) {
        // Remove selection from previously selected copy-start color
        const previouslySelectedSwatch = paletteContainer.querySelector('.color-box.copy-start-selected');
        if (previouslySelectedSwatch) {
            previouslySelectedSwatch.classList.remove('copy-start-selected');
        }

        // Update the copy start index
        copyStartColorIndex = index;

        // Add selection to the new copy-start color
        const currentSwatch = event.target.closest('.color-box');
        if (currentSwatch) {
            currentSwatch.classList.add('copy-start-selected');
        }

        // Inform the user
        vscode.postMessage({
            command: 'showInfo',
            message: `Selected color ${index} as copy start.`
        });

        console.log(`[Webview JS] Shift+LMB: Selected color ${index} as copy start.`);
    }
    event.preventDefault();
    event.stopPropagation();
}
// --- End NEW ---

// Add keyboard shortcuts for palette operations
document.addEventListener('keydown', (event) => {
    // Check if 'c' key is pressed and we have both selections active
    if (event.key === 'c' && activeSecondaryColorIndex >= 0 && activeColorIndex >= 0 && !event.ctrlKey && !event.metaKey) {
        copySecondaryToMainPalette();
    }
    
    // Check if 'Escape' key is pressed to clear secondary selection
    if (event.key === 'Escape') {
        // Clear secondary selection
        activeSecondaryColorIndex = -1;
        const secondarySelected = paletteContainer.querySelector('.color-box.secondary-selected');
        if (secondarySelected) {
            secondarySelected.classList.remove('secondary-selected');
            vscode.postMessage({
                command: 'showInfo',
                message: 'Secondary color selection cleared'
            });
        }
        // Also clear copy start selection with Escape if no secondary is selected
        if (copyStartColorIndex !== -1) {
            const copyStartSelected = paletteContainer.querySelector('.color-box.copy-start-selected');
            if (copyStartSelected) {
                copyStartSelected.classList.remove('copy-start-selected');
            }
            copyStartColorIndex = -1;
            vscode.postMessage({
                command: 'showInfo',
                message: 'Copy start selection cleared'
            });
        }
    }

    // Handle Alt+C for range copy
    if (event.altKey && event.key.toLowerCase() === 'c') {
        handleRangeCopy();
        event.preventDefault(); // Prevent default browser copy
    }

    // Handle Ctrl+V for range paste
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        handleRangePaste();
        event.preventDefault(); // Prevent default browser paste
    }

    // Handle t to toggle color-index box
    if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        console.log("[Webview JS] Toggle color-index box");
        colorIndexBoxesActive = !colorIndexBoxesActive;    
        handleToggleColorIndex();
        event.preventDefault(); // Prevent default browser paste        
    }
    // Handle p to toggle priority bit
    if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        // Toggle the priority bit
        const newPriority = !currentPaletteHex[activeColorIndex].priority;
        currentPaletteHex[activeColorIndex].priority = newPriority;
        
        // Update the editor panel
        updateEditorPanel(hexToRgb9(currentPaletteHex[activeColorIndex].hex), newPriority);
        
        // Update checkbox
        priorityBitToggle.checked = newPriority;
        
        // Update the color box
        const colorBox = paletteContainer.querySelector(`.color-box[data-index="${activeColorIndex}"]`);
        if (colorBox) {
            colorBox.classList.toggle('priority-bit-active', newPriority);
        }
        
        // Notify provider of priority change
        vscode.postMessage({
            command: 'updatePriority',
            index: activeColorIndex,
            priority: newPriority
        });
    }
});

// --- Event Listeners ---

// Verify DOM elements before attaching listeners
console.log("[Webview JS Check] paletteContainer:", !!paletteContainer);
console.log("[Webview JS Check] sliderR:", !!sliderR);
console.log("[Webview JS Check] saveChangesButton:", !!saveChangesButton);
console.log("[Webview JS Check] colorPickerInput:", !!colorPickerInput);
// Add checks for merge buttons
console.log("[Webview JS Check] loadSecondaryPaletteButton:", !!loadSecondaryPaletteButton);
console.log("[Webview JS Check] mergeButton:", !!mergeButton);

// Initial setup: Call redrawPaletteGrid instead of attaching listeners manually
if (paletteContainer) {
     // Removed initial population from style, rely on window.initialPalette
     redrawPaletteGrid(); // Initial draw with offsets and listeners
     paletteContainer.addEventListener('contextmenu', handlePaletteContextMenu); // Add the new listener
     console.log("[Webview JS] Initialized palette grid, offsets, listeners and local palette array.");
     
     // Add document-level event listeners for mouse move and up
     // These are needed to handle cases where the mouse leaves the color box during a drag
     document.addEventListener('mousemove', (event) => {
         if (ctrlDragActive) {
             handleCtrlMouseMove(event);
         }
     });
     
     document.addEventListener('mouseup', (event) => {
         if (ctrlDragActive) {
             handleCtrlMouseUp(event);
         }
     });
} else {
    console.warn("[Webview JS] Could not initialize palette grid (paletteContainer is null?).");
}

if (colorPickerInput && sliderR && sliderG && sliderB && valueR && valueG && valueB) {
    colorPickerInput.addEventListener('input', (event) => {
        const pickedHexColor = (event.target).value; // Standard #RRGGBB hex
        console.log("[Webview JS] Added input listener to color picker.");
    });

    // Add event listeners for RGB sliders
    sliderR.addEventListener('input', handleRGBSliderChange);
    sliderG.addEventListener('input', handleRGBSliderChange);
    sliderB.addEventListener('input', handleRGBSliderChange);
    
    console.log("[Webview JS] Added input listeners to RGB sliders.");
} else {
    console.warn("[Webview JS] Could not add color picker listener (missing elements?).");
}

// Function to update the dirty state and save button
function updateDirtyState(isDirty) {
    hasUnsavedChanges = isDirty;
    if (saveChangesButton) {
        saveChangesButton.disabled = !isDirty;
        if (isDirty) {
            saveChangesButton.classList.add('save-button-dirty');
        } else {
            saveChangesButton.classList.remove('save-button-dirty');
        }
    }
}

// Function to update only the save button appearance without affecting dirty state
function updateSaveButtonAppearance(isDirty) {
    // Only update the button appearance, don't change hasUnsavedChanges
    if (saveChangesButton) {
        saveChangesButton.disabled = !isDirty;
        if (isDirty) {
            saveChangesButton.classList.add('save-button-dirty');
        } else {
            saveChangesButton.classList.remove('save-button-dirty');
        }
    }
    console.log(`[Webview JS] Save button appearance updated (dirty: ${isDirty}), hasUnsavedChanges unchanged: ${hasUnsavedChanges}`);
}

// In the click event for saveChangesButton
if (saveChangesButton) {
    saveChangesButton.addEventListener('click', () => {
        if (!saveChangesButton.disabled) {
            console.log("[Webview JS] Save button clicked - sending save request to extension.");
            vscode.postMessage({
                command: 'saveChanges'
            });
            saveChangesButton.disabled = true; // Disable until next change
            updateDirtyState(false);
        }
    });
} else {
    console.warn("[Webview JS] Could not add save button listener (saveChangesButton is null?).");
}

// --- Add Event Listeners for Merge Controls --- 
if (loadSecondaryPaletteButton) {
    loadSecondaryPaletteButton.addEventListener('click', () => {
        console.log("[Webview JS] Load Secondary Palette button clicked.");
        vscode.postMessage({ command: 'loadSecondaryPalette' });
    });
} else {
    console.warn("[Webview JS] Load Secondary Palette button not found.");
}

if (mergeButton && mergeOffsetInput && mergeCountInput) {
    mergeButton.addEventListener('click', () => {
        console.log("[Webview JS] Merge button clicked."); 
        if (!secondaryPaletteHex) {
             console.warn("[Webview JS] Merge button clicked, but no secondary palette loaded.");
             return;
        }

        const targetOffset = parseInt(mergeOffsetInput.value, 10);
        const count = parseInt(mergeCountInput.value, 10);

        // Validate inputs
        if (isNaN(targetOffset) || targetOffset < 0 || targetOffset >= currentPaletteHex.length || targetOffset % 16 !== 0) {
            vscode.postMessage({ command: 'showError', message: `Invalid merge offset: ${targetOffset}. Must be a multiple of 16 and within bounds.` });
            return;
        }
        if (isNaN(count) || count < 1 || count > secondaryPaletteHex.length) {
            vscode.postMessage({ command: 'showError', message: `Invalid merge count: ${count}. Must be between 1 and ${secondaryPaletteHex.length}.` });
            return;
        }
        if (targetOffset + count > currentPaletteHex.length) {
            vscode.postMessage({ command: 'showError', message: `Merge would exceed palette bounds (Offset ${targetOffset} + Count ${count} > ${currentPaletteHex.length}).` });
            return;
        }

        // Perform the merge locally
        for (let i = 0; i < count; i++) {
            if (secondaryPaletteHex[i]) { // Check if secondary color exists
                currentPaletteHex[targetOffset + i] = { ...secondaryPaletteHex[i] }; // Deep copy
            }
        }

        // Redraw the main grid
        redrawPaletteGrid(); 

        // Mark dirty and notify provider
        updateDirtyState(true);
        vscode.postMessage({
            command: 'updateFullPalette', // Use the existing provider command
            palette: currentPaletteHex
        });
        console.log(`[Webview JS] Merged ${count} colors from secondary palette to offset ${targetOffset} in main palette.`);
    });
} else { 
    console.warn("[Webview JS] Merge button or inputs not found, listener not attached.");
}

// Add message listener
window.addEventListener('message', event => {
    const message = event.data;
    console.log('[Webview JS] Received message:', message);
    switch (message.command) {
        case 'updateDirtyState':
            updateDirtyState(message.isDirty);
            break;
        case 'updateSaveButtonAppearance':
            // Update only the button appearance without triggering autosave
            updateSaveButtonAppearance(message.isDirty);
            break;
        case 'updateUndoRedoButtons':
            // Update undo/redo button states
            updateUndoRedoButtons(message.canUndo, message.canRedo);
            break;
        case 'updateFullPalette':
            console.log("[Webview JS] Received updateFullPalette message with", message.palette.length, "colors"); 
            if (message.palette) {
                // Update the local palette array
                currentPaletteHex = message.palette;
                
                // Mark the document as dirty if specified in the message or if it's from a default palette reset
                if (message.isDirty === true) {
                    updateDirtyState(true);
                }
                
                // Use a small timeout to ensure DOM updates properly
                setTimeout(() => {
                    // Redraw the palette grid
                    redrawPaletteGrid();
                    
                    // If a color is selected, update the editor panel
                    if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                        const rgb9 = hexToRgb9(currentPaletteHex[activeColorIndex].hex);
                        const isPriority = currentPaletteHex[activeColorIndex].priority;
                        updateEditorPanel(rgb9, isPriority);
                    }
                    
                    console.log("[Webview JS] Palette grid redrawn after updateFullPalette");
                }, 10);
            }
            break;
        case 'loadSecondaryPaletteData':
            console.log("[Webview JS] Received loadSecondaryPaletteData message."); 
            if (message.palette && message.name) {
                console.log(`[Webview JS] Received secondary palette: ${message.name} with ${message.palette.length} colors.`);
                secondaryPaletteHex = message.palette;
                secondaryPaletteName = message.name;
                // Update UI elements displaying the name
                if (secondaryPaletteNameDisplay) { 
                    secondaryPaletteNameDisplay.textContent = secondaryPaletteName;
                }
                if (secondaryPaletteInfo) {
                    secondaryPaletteInfo.style.display = 'block';
                }
                renderSecondaryPalette(); // Display the loaded palette
            } else {
                console.error("[Webview JS] Invalid secondary palette data received.");
                secondaryPaletteHex = null;
                if (mergeButton) mergeButton.disabled = true;
                if (secondaryPaletteContainer) secondaryPaletteContainer.innerHTML = '';
                if (secondaryPaletteInfo) secondaryPaletteInfo.style.display = 'none';
            }
            break;
        case 'clipboardReadResult':
            console.log("[Webview JS] Received clipboardReadResult:", message.text);
            if (typeof message.text === 'string') {
                handlePasteLogic(message.text);
            } else {
                console.warn("[Webview JS] Received invalid clipboardReadResult.");
            }
            break;
        case 'previewImportedPalette':
            console.log("[Webview JS] Received imported palette preview:", message.palette.length, "colors");
            importedPalette = message.palette;
            renderImportPreview(
                message.palette, 
                `Imported ${message.palette.length} colors from ${message.fileName} (${message.importType} format)`,
                message.isNativeFormat
            );
            break;
        case 'paletteOperationResult':
            console.log(`[Webview JS] Received palette operation result: ${message.operation}`);
            if (message.palette) {
                // Update the local palette array
                currentPaletteHex = message.palette;
                // Redraw the palette grid
                redrawPaletteGrid();
                
                // Update undo/redo buttons
                if (undoButton && redoButton) {
                    undoButton.disabled = !message.canUndo;
                    redoButton.disabled = !message.canRedo;
                }
                
                // If a color is selected, update the editor panel
                if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                    const rgb9 = hexToRgb9(currentPaletteHex[activeColorIndex].hex);
                    const isPriority = currentPaletteHex[activeColorIndex].priority;
                    updateEditorPanel(rgb9, isPriority);
                }
            }
            break;
        case 'updatePriorityVisualization':
            console.log("[Webview JS] Received priority visualization update");
            if (message.visualizationData && Array.isArray(message.visualizationData)) {
                // Apply visualization data to color boxes
                message.visualizationData.forEach(item => {
                    const colorBox = paletteContainer.querySelector(`.color-box[data-index="${item.index}"]`);
                    if (colorBox) {
                        // Remove old class first
                        colorBox.classList.remove('priority-bit-active');
                        
                        // Add class if needed
                        if (item.className) {
                            colorBox.classList.add(item.className);
                        }
                        
                        // Apply styles
                        for (const [key, value] of Object.entries(item.style)) {
                            colorBox.style[key] = value;
                        }
                    }
                });
            }
            break;
        case 'importbuttonaction':
            console.log("[Webview JS] Received importbuttonaction message.");
            importbuttonaction();
            break;  
    }
});

// Function to render the secondary palette grid
function renderSecondaryPalette() {
    if (!secondaryPaletteContainer || !secondaryPaletteHex) {
        console.warn("[Webview JS] Cannot render secondary palette: container or data missing.");
        return;
    }

    console.log(`[Webview JS] Rendering secondary palette with ${secondaryPaletteHex.length} colors.`);
    secondaryPaletteContainer.innerHTML = ''; // Clear previous
    secondaryPaletteContainer.style.display = 'grid'; // Make sure it's visible

    secondaryPaletteHex.forEach((colorEntry, index) => {
        const hexColor = colorEntry?.hex || '#808080'; // Grey fallback
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box secondary'; // Add secondary class for styling
        colorBox.style.backgroundColor = hexColor;
        colorBox.dataset.index = index; // Add index for selection
        
        // Tooltip for secondary palette colors
        try {
            const rgb9 = hexToRgb9(hexColor);
            colorBox.title = `Secondary Index: ${index}\nHex: ${hexColor}\nRGB9: (${rgb9.r9},${rgb9.g9},${rgb9.b9})`;
        } catch(e) { /* ignore */ }
        
        // Add click handler for selection
        colorBox.addEventListener('click', handleSecondaryPaletteClick);
        
        secondaryPaletteContainer.appendChild(colorBox);
    });

    // Enable merge button only if secondary palette is loaded
    if (mergeButton) {
        mergeButton.disabled = false; 
        console.log("[Webview JS] Secondary palette rendered, Merge button enabled.");
    }
}

// Handler for secondary palette color box clicks
function handleSecondaryPaletteClick(event) {
    const target = event.target.closest('.color-box');
    if (target) {
        const index = parseInt(target.dataset.index, 10);
        if (!isNaN(index) && index >= 0 && index < secondaryPaletteHex.length) {
            // Update selection visually
            const previousSelected = secondaryPaletteContainer.querySelector('.color-box.selected');
            if (previousSelected) previousSelected.classList.remove('selected');
            target.classList.add('selected');
            activeSecondaryColorIndex = index;
            
            // Enable copy to main palette when both a secondary color and main color are selected
            if (activeColorIndex >= 0) {
                vscode.postMessage({
                    command: 'showInfo',
                    message: `Selected secondary color ${index}. Click main palette to copy to or press 'c' to copy to selected main color.`
                });
            }
        }
    }
}

// Function to copy selected secondary color to selected main color
function copySecondaryToMainPalette() {
    // Ensure we use activeColorIndex, not activeIndex (which doesn't exist)
    const targetColorIndex = activeColorIndex;
    
    if (activeSecondaryColorIndex >= 0 && targetColorIndex >= 0 && 
        secondaryPaletteHex && activeSecondaryColorIndex < secondaryPaletteHex.length && 
        targetColorIndex < currentPaletteHex.length) {
        
        const colorToCopy = secondaryPaletteHex[activeSecondaryColorIndex];
        if (!colorToCopy || !colorToCopy.hex) {
            console.warn("[Webview JS] Invalid secondary color selected for copy");
            return;
        }
        
        // Update main palette color with secondary color
        currentPaletteHex[targetColorIndex].hex = colorToCopy.hex;
        
        // Update the main palette box visually
        const swatch = paletteContainer.querySelector(`.color-box[data-index="${targetColorIndex}"]`);
        if (swatch) {
            swatch.style.backgroundColor = colorToCopy.hex;
        }
        
        // Update editor panel if open
        updateEditorPanel(hexToRgb9(colorToCopy.hex), currentPaletteHex[targetColorIndex].priority);
        
        // Mark dirty and notify extension
        updateDirtyState(true);
        vscode.postMessage({ 
            command: 'paletteEdit', 
            index: targetColorIndex, 
            newHexColor: colorToCopy.hex 
        });
        
        console.log(`[Webview JS] Copied secondary color ${activeSecondaryColorIndex} to main color ${targetColorIndex}`);
    }
}

// --- Priority Bit Toggle Handler ---
if (priorityBitToggle) {
    priorityBitToggle.addEventListener('change', () => {
        if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
            const isPriority = priorityBitToggle.checked;
            console.log(`[Webview JS] Priority bit changed for color ${activeColorIndex}: ${isPriority}`);
            
            // Update local data
            currentPaletteHex[activeColorIndex].priority = isPriority;
            
            // Update UI as needed
            const colorBox = paletteContainer.querySelector(`.color-box[data-index="${activeColorIndex}"]`);
            if (colorBox) {
                colorBox.dataset.priority = isPriority.toString();
                // Update tooltip
                const rgb9 = hexToRgb9(currentPaletteHex[activeColorIndex].hex);
                const bytes = rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
                colorBox.title = `Index: ${activeColorIndex}\nHex: ${currentPaletteHex[activeColorIndex].hex}\nRGB9: (${rgb9.r9},${rgb9.g9},${rgb9.b9})\nBytes: %${bytes.byte1.toString(16).toUpperCase().padStart(2, '0')},%${bytes.byte2.toString(16).toUpperCase().padStart(2, '0')}\nPriority: ${isPriority}`;
            }
            
            // Mark as dirty
            updateDirtyState(true);
            
            // Notify the extension
            vscode.postMessage({
                command: 'updatePriorityBit',
                index: activeColorIndex,
                priority: isPriority
            });
        }
    });
}

// --- Reset Priority Button Handler ---
if (resetPriorityButton) {
    resetPriorityButton.addEventListener('click', () => {
        console.log("[Webview JS] Reset all priority bits requested");
        
        // Reset all priority bits in local data
        let changed = false;
        currentPaletteHex.forEach((color, index) => {
            if (color.priority) {
                color.priority = false;
                changed = true;
            }
        });
        
        if (changed) {
            // Update UI
            redrawPaletteGrid();
            
            // If a color is selected, update its display too
            if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                updateEditorPanel(hexToRgb9(currentPaletteHex[activeColorIndex].hex), false);
            }
            
            // Mark as dirty
            updateDirtyState(true);
            
            // Notify the extension
            vscode.postMessage({
                command: 'updateFullPalette',
                palette: currentPaletteHex
            });
        }
    });
}

// Add clipboard handling for copy/paste support
document.addEventListener('copy', (event) => {
    if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
        const colorToCopy = currentPaletteHex[activeColorIndex].hex;
        event.clipboardData.setData('text/plain', colorToCopy);
        console.log(`[Webview JS] Copied color ${colorToCopy} from index ${activeColorIndex} to clipboard`);
        event.preventDefault(); // Prevent default to use our data
    }
});

document.addEventListener('cut', (event) => {
    if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
        const colorToCut = currentPaletteHex[activeColorIndex].hex;
        event.clipboardData.setData('text/plain', colorToCut);
        console.log(`[Webview JS] Cut color ${colorToCut} from index ${activeColorIndex}`);
        event.preventDefault(); // Prevent default to use our data
    }
});

// document.addEventListener('paste', (event) => {
//     if (activeColorIndex >= 0) {
//         const clipboardData = event.clipboardData || window.clipboardData;
//         const pastedText = clipboardData.getData('text');
        
//         if (pastedText && pastedText.match(/^#[0-9a-fA-F]{6}$/)) {
//             // Direct paste if it's a valid hex color
//             handlePasteLogic(pastedText);
//             event.preventDefault(); // Prevent default paste
//         } else {
//             // Let the extension handle clipboard data via message
//             vscode.postMessage({
//                 command: 'readClipboard'
//             });
//             event.preventDefault(); // Prevent default paste
//         }
//     }
// });

// Function to handle RGB slider changes
function handleRGBSliderChange(event) {
    if (activeColorIndex < 0 || activeColorIndex >= currentPaletteHex.length) {
        console.warn("[Webview JS] Cannot update color: No active color selected");
        return;
    }

    // Get current values from sliders
    const r9 = parseInt(sliderR.value, 10);
    const g9 = parseInt(sliderG.value, 10);
    const b9 = parseInt(sliderB.value, 10);
    
    // Update value labels
    valueR.textContent = r9;
    valueG.textContent = g9;
    valueB.textContent = b9;
    
    // Convert to hex color
    const newHexColor = rgb9ToHex(r9, g9, b9);
    
    // Update preview
    previewBox.style.backgroundColor = newHexColor;
    previewHex.textContent = newHexColor.toUpperCase();
    
    // Update bytes display
    const bytes = rgb9ToBytes(r9, g9, b9);
    byte1Input.value = bytes.byte1.toString(16).toUpperCase().padStart(2, '0');
    byte2Input.value = bytes.byte2.toString(16).toUpperCase().padStart(2, '0');
    
    // Update the color in the palette array
    const oldHexColor = currentPaletteHex[activeColorIndex].hex;
    if (oldHexColor !== newHexColor) {
        currentPaletteHex[activeColorIndex].hex = newHexColor;
        
        // Update the visual color box in the palette
        const colorBox = paletteContainer.querySelector(`.color-box[data-index="${activeColorIndex}"]`);
        if (colorBox) {
            colorBox.style.backgroundColor = newHexColor;
            
            // Update tooltip
            try {
                const priority = currentPaletteHex[activeColorIndex].priority || false;
                colorBox.title = `Index: ${activeColorIndex}\nHex: ${newHexColor}\nRGB9: (${r9},${g9},${b9})\nBytes: %${bytes.byte1.toString(16).toUpperCase().padStart(2, '0')},%${bytes.byte2.toString(16).toUpperCase().padStart(2, '0')}\nPriority: ${priority}`;
            } catch (e) { /* ignore */ }
        }
        
        // Mark as dirty
        updateDirtyState(true);
        
        // Notify extension
        vscode.postMessage({
            command: 'paletteEdit',
            index: activeColorIndex,
            newHexColor: newHexColor
        });
        
        console.log(`[Webview JS] Updated color at index ${activeColorIndex} to ${newHexColor} using RGB sliders`);
    }
}

// Also implement the color picker input
if (colorPickerInput) {
    colorPickerInput.addEventListener('input', (event) => {
        if (activeColorIndex < 0 || activeColorIndex >= currentPaletteHex.length) {
            console.warn("[Webview JS] Cannot update color: No active color selected");
            return;
        }
        
        const pickedHexColor = event.target.value; // Standard #RRGGBB hex
        
        // Convert to 9-bit RGB (this will quantize/snap to nearest valid 9-bit color)
        const rgb9 = hexToRgb9(pickedHexColor);
        
        // Update sliders to show the quantized values
        sliderR.value = rgb9.r9;
        sliderG.value = rgb9.g9;
        sliderB.value = rgb9.b9;
        
        // Use the handleRGBSliderChange to process the update
        handleRGBSliderChange(null);
        
        console.log(`[Webview JS] Color picker changed to ${pickedHexColor}, quantized to 9-bit color`);
    });
}

// --- Import Palette Functionality ---

// Show import dialog
if (importPaletteButton) {
    importPaletteButton.addEventListener('click', () => {
        if (importDialog) {
            importbuttonaction();            
        }        
    });
}

function importbuttonaction() {
    importDialog.style.display = 'flex';
    // Reset state
    importedPalette = null;
    importPreview.style.display = 'none';
    importInfo.textContent = 'Select Import... to choose a palette file to import.';
    startImportButton.style.display = 'inline-block';
    confirmImportButton.style.display = 'none';
}

// Show import dialog for images
if (importImageButton) {
    importImageButton.addEventListener('click', () => {
        if (importDialog) {
            importDialog.style.display = 'flex';
            // Reset state
            importedPalette = null;
            importPreview.style.display = 'none';
            importInfo.textContent = 'Select Import... to choose an image file to extract colours from.';
            startImportButton.style.display = 'inline-block';
            confirmImportButton.style.display = 'none';
            
            // Update dialog title
            const dialogTitle = importDialog.querySelector('h2');
            if (dialogTitle) {
                dialogTitle.textContent = 'Extract Colours from Image';
            }
        }
    });
}

// Handle start import button (open file picker)
if (startImportButton) {
    startImportButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'importPalette'
        });
    });
}

// Handle cancel import
if (cancelImportButton) {
    cancelImportButton.addEventListener('click', () => {
        if (importDialog) {
            importDialog.style.display = 'none';
        }
    });
}

// Handle confirm import (apply to current palette)
if (confirmImportButton) {
    confirmImportButton.addEventListener('click', () => {
        if (!importedPalette) {
            console.warn("[Webview JS] Cannot apply import: No palette loaded");
            return;
        }

        const offset = parseInt(importOffset.value, 10);
        const count = parseInt(importCount.value, 10);

        // Validate inputs
        if (isNaN(offset) || offset < 0 || offset >= currentPaletteHex.length) {
            vscode.postMessage({ 
                command: 'showError', 
                message: `Invalid import offset: ${offset}. Must be between 0 and ${currentPaletteHex.length - 1}.` 
            });
            return;
        }

        if (isNaN(count) || count < 1 || count > importedPalette.length) {
            vscode.postMessage({
                command: 'showError',
                message: `Invalid import count: ${count}. Must be between 1 and ${importedPalette.length}.`
            });
            return;
        }

        if (offset + count > currentPaletteHex.length) {
            vscode.postMessage({
                command: 'showError',
                message: `Import would exceed palette bounds (${offset} + ${count} > ${currentPaletteHex.length}).`
            });
            return;
        }

        // Apply the imported colors to the current palette
        for (let i = 0; i < count; i++) {
            if (offset + i < currentPaletteHex.length && i < importedPalette.length) {
                currentPaletteHex[offset + i].hex = importedPalette[i].hex;
                // Keep existing priority bit
            }
        }

        // Redraw the palette grid
        redrawPaletteGrid();

        // Close the dialog
        importDialog.style.display = 'none';

        // Mark as dirty
        updateDirtyState(true);

        // Notify extension
        vscode.postMessage({
            command: 'updateFullPalette',
            palette: currentPaletteHex
        });

        vscode.postMessage({
            command: 'showInfo',
            message: `Imported ${count} colors at offset ${offset}`
        });
    });
}

// Function to render the import preview
function renderImportPreview(palette, infoText, isNativeFormat) {
    if (!importPreview || !importInfo) return;

    // Show preview area
    importPreview.style.display = 'grid';
    importPreview.innerHTML = '';

    // Update info text
    importInfo.textContent = infoText || 'Imported palette preview:';
    
    // If it's a native format, add additional info about clicking
    if (isNativeFormat) {
        importInfo.textContent += ' (Click a color to set import offset)';
    }

    // Create color boxes for preview
    palette.forEach((colorEntry, index) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'preview-color';
        colorBox.style.backgroundColor = colorEntry.hex;
        colorBox.title = `Index: ${index}, Hex: ${colorEntry.hex}`;
        
        // For native format, make the colors clickable to set import offset
        if (isNativeFormat) {
            colorBox.classList.add('clickable');
            colorBox.addEventListener('click', () => {
                if (importOffset) {
                    // Set the offset to the clicked color index
                    importOffset.value = index;
                    vscode.postMessage({
                        command: 'showInfo',
                        message: `Set import offset to ${index}`
                    });
                }
            });
        }
        
        importPreview.appendChild(colorBox);
    });

    // Show confirm button
    if (confirmImportButton) {
        confirmImportButton.style.display = 'inline-block';
    }
    
    // Start with reasonable defaults for import offset/count
    if (importOffset && importCount) {
        importOffset.value = 0;
        importCount.value = Math.min(16, palette.length);
    }
}

// --- Palette Operations Event Handlers ---

// Default Palette button - Open dialog
if (defaultPaletteButton) {
    defaultPaletteButton.addEventListener('click', () => {
        console.log("[Webview JS] Default Palette button clicked");
        handleDefaultPalette();
    });
}


// Sort Palette button - Open dialog
if (sortPaletteButton) {
    sortPaletteButton.addEventListener('click', () => {
        console.log("[Webview JS] Sort Palette button clicked");
        if (sortPaletteDialog) {
            // Reset sort settings to defaults
            if (sortMode) sortMode.value = 'hue';
            if (referenceColorRow) referenceColorRow.style.display = 'none';

            // *** NEW: Populate reference color from active selection ***
            if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                const selectedColor = currentPaletteHex[activeColorIndex]?.hex || '#000000';
                if (referenceColorPreview && referenceColorIndex) {
                    referenceColorPreview.style.backgroundColor = selectedColor;
                    referenceColorIndex.textContent = `(${activeColorIndex})`;
                }
            } else {
                // Reset if no color is selected
                if (referenceColorPreview && referenceColorIndex) {
                    referenceColorPreview.style.backgroundColor = 'transparent';
                    referenceColorIndex.textContent = 'None selected';
                }
            }
            // *** END NEW ***

            sortPaletteDialog.style.display = 'flex';
        }
    });
}

// Sort mode change handler - Show/hide reference color option
if (sortMode) {
    sortMode.addEventListener('change', () => {
        if (referenceColorRow) {
            const showReference = sortMode.value === 'similarity';
            referenceColorRow.style.display = showReference ? 'flex' : 'none';

            // *** NEW: Update preview when switching TO similarity ***
            if (showReference) {
                if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                    const selectedColor = currentPaletteHex[activeColorIndex]?.hex || '#000000';
                    if (referenceColorPreview && referenceColorIndex) {
                        referenceColorPreview.style.backgroundColor = selectedColor;
                        referenceColorIndex.textContent = `(${activeColorIndex})`;
                    }
                } else {
                     if (referenceColorPreview && referenceColorIndex) {
                        referenceColorPreview.style.backgroundColor = 'transparent';
                        referenceColorIndex.textContent = 'None selected';
                    }
                }
            }
            // *** END NEW ***
        }
    });
}

// Cancel sort button
if (cancelSortButton) {
    cancelSortButton.addEventListener('click', () => {
        if (sortPaletteDialog) {
            sortPaletteDialog.style.display = 'none';
        }
    });
}

// Confirm sort button
if (confirmSortButton) {
    confirmSortButton.addEventListener('click', () => {
        if (!sortMode) {
            console.warn("[Webview JS] Cannot apply sort: No sort mode selected");
            return;
        }
        
        const mode = sortMode.value;
        let referenceIndex = -1;
        
        // For similarity sort, get the reference color index
        if (mode === 'similarity') {
            if (activeColorIndex >= 0) {
                referenceIndex = activeColorIndex;
            } else {
                vscode.postMessage({
                    command: 'showError',
                    message: 'No reference color selected for similarity sort.'
                });
                return;
            }
        }
        
        // Send message to extension to perform the sort
        vscode.postMessage({
            command: 'sortPalette',
            sortMode: mode,
            referenceIndex: referenceIndex
        });
        
        // Close the dialog
        if (sortPaletteDialog) {
            sortPaletteDialog.style.display = 'none';
        }
    });
}

// Generate Gradient button - Open dialog
if (generateGradientButton) {
    generateGradientButton.addEventListener('click', () => {
        console.log("[Webview JS] Generate Gradient button clicked");
        if (gradientDialog) {
            // Reset the dialog defaults first
            let startColorHex = '#000000';
            let startColorIdxText = 'None selected';
            let endColorHex = '#FFFFFF'; // Default end color
            let endColorIdxText = 'Default white';

            // *** NEW: Set start color to primary selection (left click) ***
            if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                startColorHex = currentPaletteHex[activeColorIndex]?.hex || '#000000';
                startColorIdxText = `(${activeColorIndex})`;
            }
            // *** END NEW ***

            // Set end color to secondary selection (right click) if available
            if (activeSecondaryColorIndex >= 0 && activeSecondaryColorIndex < currentPaletteHex.length) {
                const secondaryEntry = currentPaletteHex[activeSecondaryColorIndex];
                if (secondaryEntry && secondaryEntry.hex) {
                    endColorHex = secondaryEntry.hex;
                    endColorIdxText = `(${activeSecondaryColorIndex})`;
                }
            }

            // Populate dialog elements
            if (gradientStartColor && gradientStartColorIndex) {
                gradientStartColor.style.backgroundColor = startColorHex;
                gradientStartColorIndex.textContent = startColorIdxText;
            }
            if (gradientEndColor && gradientEndColorIndex) {
                gradientEndColor.style.backgroundColor = endColorHex;
                gradientEndColorIndex.textContent = endColorIdxText;
            }
            if (gradientSteps) gradientSteps.value = '8';
            // *** NEW: Set target index based on active selection ***
            if (gradientTargetIndex) {
                 gradientTargetIndex.value = (activeColorIndex >= 0) ? activeColorIndex.toString() : '0';
            }
            // *** END NEW ***
            if (gradientPreview) gradientPreview.innerHTML = '';

            // Generate initial preview
            try {
                previewGradient(endColorHex);
            } catch (error) {
                console.error("Failed to generate initial preview:", error);
                 if (gradientPreview) gradientPreview.innerHTML = '<div style="color: red;">Error generating preview</div>';
            }

            // Add instruction text (if not already present)
            const dialogContent = gradientDialog.querySelector('.operation-dialog-content');
            // ... (instruction text logic remains the same) ...
             if (dialogContent) {
                let instructionEl = dialogContent.querySelector('.gradient-instructions');
                if (!instructionEl) {
                    instructionEl = document.createElement('div');
                    instructionEl.className = 'gradient-instructions';
                    instructionEl.style.margin = '10px 0';
                    instructionEl.style.padding = '8px';
                    instructionEl.style.backgroundColor = 'rgba(0,0,0,0.1)';
                    instructionEl.style.borderRadius = '4px';
                    instructionEl.innerHTML = `
                        <p style="margin: 0 0 5px 0; font-weight: bold;">How to use:</p>
                        <p style="margin: 0 0 3px 0; font-size: 0.9em;">• Left-click selects the start colour</p>
                        <p style="margin: 0 0 3px 0; font-size: 0.9em;">• Right-click selects the end colour</p>
                        <p style="margin: 0; font-size: 0.9em;">• Select colours before opening this dialog</p>
                    `;

                    const previewElement = dialogContent.querySelector('#gradientPreview');
                    if (previewElement) {
                        dialogContent.insertBefore(instructionEl, previewElement);
                    } else {
                        const firstFormRow = dialogContent.querySelector('.operation-form-row');
                        if (firstFormRow) {
                            dialogContent.insertBefore(instructionEl, firstFormRow.nextSibling);
                        } else {
                            dialogContent.appendChild(instructionEl);
                        }
                    }
                }
            }

            gradientDialog.style.display = 'flex';
        }
    });
}

// Helper function to preview gradient
function previewGradient(endColor) {
    if (!gradientPreview || !gradientStartColor) {
        console.error("Cannot preview gradient: missing DOM elements");
        return;
    }
    
    const startColorStyle = gradientStartColor.style.backgroundColor;
    if (!startColorStyle) {
        console.error("Cannot preview gradient: missing start colour");
        return;
    }
    
    // Convert RGB string to hex
    let startColor;
    try {
        startColor = rgbStringToHex(startColorStyle);
        if (!startColor) throw new Error("Invalid start colour format");
    } catch (error) {
        console.error("Error converting start colour:", error);
        return;
    }
    
    // Ensure endColor is valid
    if (!endColor) {
        console.error("Cannot preview gradient: missing end colour");
        return;
    }
    
    const steps = parseInt(gradientSteps?.value || '8', 10);
    
    // Clear preview
    gradientPreview.innerHTML = '';
    
    try {
        // Convert colors to RGB9 and validate
        const startRgb = hexToRgb9(startColor);
        const endRgb = hexToRgb9(endColor);
        
        if (!startRgb || !endRgb) {
            throw new Error("Invalid colour format");
        }
        
        // Generate preview boxes
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1); // 0 to 1
            
            // Linear interpolation between start and end colors
            const r9 = Math.round(startRgb.r9 + t * (endRgb.r9 - startRgb.r9));
            const g9 = Math.round(startRgb.g9 + t * (endRgb.g9 - startRgb.g9));
            const b9 = Math.round(startRgb.b9 + t * (endRgb.b9 - startRgb.b9));
            
            const hexColor = rgb9ToHex(r9, g9, b9);
            
            const colorBox = document.createElement('div');
            colorBox.className = 'color-preview';
            colorBox.style.backgroundColor = hexColor;
            colorBox.title = `Step ${i + 1}: ${hexColor}`;
            
            gradientPreview.appendChild(colorBox);
        }
    } catch (error) {
        console.error("Error generating gradient preview:", error);
        
        // Show error in preview area
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error generating preview: ${error.message}`;
        errorDiv.style.color = 'red';
        gradientPreview.appendChild(errorDiv);
    }
}

// Cancel gradient button
if (cancelGradientButton) {
    cancelGradientButton.addEventListener('click', () => {
        if (gradientDialog) {
            gradientDialog.style.display = 'none';
        }
    });
}

// Confirm gradient button
if (confirmGradientButton) {
    confirmGradientButton.addEventListener('click', () => {
        try {
            // Get start color
            const startColorStyle = gradientStartColor?.style.backgroundColor;
            if (!startColorStyle) {
                vscode.postMessage({
                    command: 'showError',
                    message: 'No start color selected for gradient.'
                });
                return;
            }
            
            // Get end color
            const endColorStyle = gradientEndColor?.style.backgroundColor;
            if (!endColorStyle) {
                vscode.postMessage({
                    command: 'showError',
                    message: 'No end color selected for gradient.'
                });
                return;
            }
            
            // Convert to hex
            const startColor = rgbStringToHex(startColorStyle);
            const endColor = rgbStringToHex(endColorStyle);
            
            // Validate converted colors
            if (!startColor) { // Remove the check for black
                vscode.postMessage({
                    command: 'showError',
                    message: 'Invalid start color format.'
                });
                return;
            }
            
            if (!endColor || endColor === '#000000') {
                vscode.postMessage({
                    command: 'showError',
                    message: 'Invalid end color format.'
                });
                return;
            }
            
            // Get steps and target index
            const steps = parseInt(gradientSteps?.value || '8', 10);
            const targetIndex = parseInt(gradientTargetIndex?.value || '0', 10);
            
            // Validate inputs
            if (isNaN(steps) || steps < 2 || steps > 256) {
                vscode.postMessage({
                    command: 'showError',
                    message: 'Invalid number of steps. Must be between 2 and 256.'
                });
                return;
            }
            
            if (isNaN(targetIndex) || targetIndex < 0 || targetIndex + steps > currentPaletteHex.length) {
                vscode.postMessage({
                    command: 'showError',
                    message: `Invalid target index or too many steps. Would exceed palette bounds (${targetIndex} + ${steps} > ${currentPaletteHex.length}).`
                });
                return;
            }
            
            // Send message to extension to generate gradient
            vscode.postMessage({
                command: 'generateGradient',
                startColor: startColor,
                endColor: endColor,
                steps: steps,
                targetIndex: targetIndex
            });
            
            // Close the dialog
            if (gradientDialog) {
                gradientDialog.style.display = 'none';
            }
        } catch (error) {
            console.error("Error in gradient creation:", error);
            vscode.postMessage({
                command: 'showError',
                message: `Error creating gradient: ${error.message}`
            });
        }
    });
}

// Generate Harmonies button - Open dialog
if (generateHarmoniesButton) {
    generateHarmoniesButton.addEventListener('click', () => {
        console.log("[Webview JS] Generate Harmonies button clicked");
        if (harmoniesDialog) {
            // Reset the dialog defaults
            let baseColorHex = '#000000';
            let baseColorIdxText = 'None selected';

            // *** NEW: Use left-click selection as default base color ***
            if (activeColorIndex >= 0 && activeColorIndex < currentPaletteHex.length) {
                baseColorHex = currentPaletteHex[activeColorIndex]?.hex || '#000000';
                baseColorIdxText = `(${activeColorIndex})`;
            }
            // *** END NEW ***

            // Populate dialog elements
            if (harmonyBaseColor && harmonyBaseColorIndex) {
                harmonyBaseColor.style.backgroundColor = baseColorHex;
                harmonyBaseColorIndex.textContent = baseColorIdxText;
            }
            if (harmonyMode) harmonyMode.value = 'complementary';
             // *** NEW: Set target index based on active selection ***
            if (harmonyTargetIndex) {
                 harmonyTargetIndex.value = (activeColorIndex >= 0) ? activeColorIndex.toString() : '0';
            }
            // *** END NEW ***
            if (harmonyPreview) harmonyPreview.innerHTML = '';

            // Generate initial preview
            try {
                previewHarmonies(baseColorHex);
            } catch (error) {
                 console.error("Failed to generate initial harmony preview:", error);
                 if (harmonyPreview) harmonyPreview.innerHTML = '<div style="color: red;">Error generating preview</div>';
            }

            // Add instruction text (if not already present)
            const dialogContent = harmoniesDialog.querySelector('.operation-dialog-content');
             if (dialogContent) {
                let instructionEl = dialogContent.querySelector('.harmonies-instructions');
                if (!instructionEl) {
                    instructionEl = document.createElement('div');
                    instructionEl.className = 'harmonies-instructions';
                    instructionEl.style.margin = '10px 0';
                    instructionEl.style.padding = '8px';
                    instructionEl.style.backgroundColor = 'rgba(0,0,0,0.1)';
                    instructionEl.style.borderRadius = '4px';
                    instructionEl.innerHTML = `
                        <p style="margin: 0 0 5px 0; font-weight: bold;">How to use:</p>
                        <p style="margin: 0 0 3px 0; font-size: 0.9em;">• Left-click selects the base color</p>
                        <p style="margin: 0; font-size: 0.9em;">• Select color before opening this dialog</p>
                    `;
                    const previewElement = dialogContent.querySelector('#harmonyPreview');
                    if (previewElement) {
                        dialogContent.insertBefore(instructionEl, previewElement);
                    } else {
                        const firstFormRow = dialogContent.querySelector('.operation-form-row');
                        if (firstFormRow) {
                            dialogContent.insertBefore(instructionEl, firstFormRow.nextSibling);
                        } else {
                             dialogContent.appendChild(instructionEl);
                        }
                    }
                }
            }

            harmoniesDialog.style.display = 'flex';
        }
    });
}

// Helper function to preview harmonies
function previewHarmonies(baseColorHex) {
    if (!harmonyPreview || !harmonyMode) return;
    
    const mode = harmonyMode.value;
    
    // Clear preview
    harmonyPreview.innerHTML = '';
    
    // Get base color as HSV (hue, saturation, value)
    const baseRgb = hexToRgb9(baseColorHex);
    
    // Quick and simple conversion to HSV for preview purposes
    const r = baseRgb.r9 / 7; // Normalize to 0-1
    const g = baseRgb.g9 / 7;
    const b = baseRgb.b9 / 7;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    // Calculate hue (0-360)
    let h;
    if (delta === 0) {
        h = 0;
    } else if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
    } else {
        h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
    
    // Calculate saturation and value (0-1)
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    // Generate harmony colors based on selected mode
    const harmonyColors = [];
    
    // Add base color first
    harmonyColors.push(baseColorHex);
    
    switch (mode) {
        case 'complementary':
            // Add opposite color (180° from base)
            harmonyColors.push(hsvToHex((h + 180) % 360, s, v));
            break;
            
        case 'analogous':
            // Add colors 30° on either side of base
            harmonyColors.push(hsvToHex((h + 30) % 360, s, v));
            harmonyColors.push(hsvToHex((h + 330) % 360, s, v));
            break;
            
        case 'triadic':
            // Add colors 120° on either side of base
            harmonyColors.push(hsvToHex((h + 120) % 360, s, v));
            harmonyColors.push(hsvToHex((h + 240) % 360, s, v));
            break;
            
        case 'tetradic':
            // Add square harmony (90° apart)
            harmonyColors.push(hsvToHex((h + 90) % 360, s, v));
            harmonyColors.push(hsvToHex((h + 180) % 360, s, v));
            harmonyColors.push(hsvToHex((h + 270) % 360, s, v));
            break;
            
        case 'monochromatic':
            // Add same hue with varying saturation/value
            harmonyColors.push(hsvToHex(h, Math.max(0.1, s - 0.3), Math.min(1, v + 0.1)));
            harmonyColors.push(hsvToHex(h, Math.min(1, s + 0.2), Math.max(0.2, v - 0.2)));
            break;
    }
    
    // Display harmony colors
    harmonyColors.forEach((color, index) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-preview';
        colorBox.style.backgroundColor = color;
        colorBox.title = `Harmony ${index + 1}: ${color}`;
        
        harmonyPreview.appendChild(colorBox);
    });
}

// Simple HSV to Hex conversion for preview
function hsvToHex(h, s, v) {
    // Normalize inputs
    h = h % 360;
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));
    
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r, g, b;
    if (h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }
    
    // Convert to 0-7 range for ZX Next
    const r9 = Math.round((r + m) * 7);
    const g9 = Math.round((g + m) * 7);
    const b9 = Math.round((b + m) * 7);
    
    return rgb9ToHex(r9, g9, b9);
}

// Update harmony mode and preview
if (harmonyMode) {
    harmonyMode.addEventListener('change', () => {
        const baseColorStyle = harmonyBaseColor?.style.backgroundColor;
        if (baseColorStyle) {
            const baseColor = rgbStringToHex(baseColorStyle);
            previewHarmonies(baseColor);
        }
    });
}

// Cancel harmonies button
if (cancelHarmonyButton) {
    cancelHarmonyButton.addEventListener('click', () => {
        if (harmoniesDialog) {
            harmoniesDialog.style.display = 'none';
        }
    });
}

// Confirm harmonies button
if (confirmHarmonyButton) {
    confirmHarmonyButton.addEventListener('click', () => {
        try {
            // Get base color
            const baseColorStyle = harmonyBaseColor?.style.backgroundColor;
            if (!baseColorStyle) {
                vscode.postMessage({
                    command: 'showError',
                    message: 'No base color selected for harmonies.'
                });
                return;
            }
            
            // Convert to hex
            const baseColor = rgbStringToHex(baseColorStyle);
            
            // Validate converted color
            if (!baseColor || baseColor === '#000000') {
                vscode.postMessage({
                    command: 'showError',
                    message: 'Invalid base color format.'
                });
                return;
            }
            
            // Get harmony mode and target index
            const selectedHarmonyMode = harmonyMode?.value || 'complementary';
            const targetIndex = parseInt(harmonyTargetIndex?.value || '0', 10);
            
            // Validate target index
            if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= currentPaletteHex.length) {
                vscode.postMessage({
                    command: 'showError',
                    message: `Invalid target index. Must be between 0 and ${currentPaletteHex.length - 1}.`
                });
                return;
            }
            
            // Send message to extension to generate harmonies
            vscode.postMessage({
                command: 'generateHarmonies',
                baseColor: baseColor,
                harmonyMode: selectedHarmonyMode,
                targetIndex: targetIndex
            });
            
            // Close the dialog
            if (harmoniesDialog) {
                harmoniesDialog.style.display = 'none';
            }
        } catch (error) {
            console.error("Error in harmony creation:", error);
            vscode.postMessage({
                command: 'showError',
                message: `Error creating harmonies: ${error.message}`
            });
        }
    });
}

// Reduce Palette button - Open dialog
if (reducePaletteButton) {
    reducePaletteButton.addEventListener('click', () => {
        console.log("[Webview JS] Reduce Palette button clicked");
        if (reducePaletteDialog) {
            // Reset dialog
            if (reduceStartIndex) reduceStartIndex.value = '0';
            if (reduceEndIndex) reduceEndIndex.value = '15';
            if (reduceTargetCount) reduceTargetCount.value = '8';
            
            reducePaletteDialog.style.display = 'flex';
        }
    });
}

// Cancel reduce button
if (cancelReduceButton) {
    cancelReduceButton.addEventListener('click', () => {
        if (reducePaletteDialog) {
            reducePaletteDialog.style.display = 'none';
        }
    });
}

// Confirm reduce button
if (confirmReduceButton) {
    confirmReduceButton.addEventListener('click', () => {
        // Get range and target count
        const startIndex = parseInt(reduceStartIndex?.value || '0', 10);
        const endIndex = parseInt(reduceEndIndex?.value || '15', 10);
        const targetCount = parseInt(reduceTargetCount?.value || '8', 10);
        
        // Validate inputs
        if (isNaN(startIndex) || startIndex < 0 || startIndex >= currentPaletteHex.length) {
            vscode.postMessage({
                command: 'showError',
                message: `Invalid start index. Must be between 0 and ${currentPaletteHex.length - 1}.`
            });
            return;
        }
        
        if (isNaN(endIndex) || endIndex < startIndex || endIndex >= currentPaletteHex.length) {
            vscode.postMessage({
                command: 'showError',
                message: `Invalid end index. Must be between ${startIndex} and ${currentPaletteHex.length - 1}.`
            });
            return;
        }
        
        if (isNaN(targetCount) || targetCount < 1 || targetCount > (endIndex - startIndex + 1)) {
            vscode.postMessage({
                command: 'showError',
                message: `Invalid target count. Must be between 1 and ${endIndex - startIndex + 1}.`
            });
            return;
        }
        
        // Send message to extension to reduce palette
        vscode.postMessage({
            command: 'reducePalette',
            startIndex: startIndex,
            endIndex: endIndex,
            targetCount: targetCount
        });
        
        // Close the dialog
        if (reducePaletteDialog) {
            reducePaletteDialog.style.display = 'none';
        }
    });
}

// --- Helper function for Ctrl+C range copy ---
function handleRangeCopy() {
    if (copyStartColorIndex === -1 || activeSecondaryColorIndex === -1) {
        vscode.postMessage({
            command: 'showInfo',
            message: 'Please select a start (Shift+LMB) and end (RMB) color for range copy.'
        });
        return;
    }

    const startIndex = Math.min(copyStartColorIndex, activeSecondaryColorIndex);
    const endIndex = Math.max(copyStartColorIndex, activeSecondaryColorIndex);

    if (startIndex > endIndex || startIndex < 0 || endIndex >= currentPaletteHex.length) {
        vscode.postMessage({ command: 'showError', message: 'Invalid range for copy.' });
        return;
    }

    const colorsToCopy = currentPaletteHex.slice(startIndex, endIndex + 1);
    const hexStringsToCopy = colorsToCopy.map(colorEntry => colorEntry.hex);
    const clipboardString = hexStringsToCopy.join(',');

    navigator.clipboard.writeText(clipboardString).then(() => {
        vscode.postMessage({
            command: 'showInfo',
            message: `${hexStringsToCopy.length} colors copied to clipboard (#RRGGBB, comma-separated).`
        });
        console.log(`[Webview JS] Copied ${hexStringsToCopy.length} colors: ${clipboardString}`);
    }).catch(err => {
        vscode.postMessage({ command: 'showError', message: 'Failed to copy colors to clipboard.' });
        console.error('[Webview JS] Failed to copy colors: ', err);
    });
}
// --- End Helper --- 

async function handleToggleColorIndex() {
    const colorIndexBoxes = document.querySelectorAll('.color-index');
    console.log("[Webview JS] Toggling color index visibility");
         
    colorIndexBoxes.forEach(colorIndexBox => {
        colorIndexBox.style.display = colorIndexBoxesActive ? 'block' : 'none';
    });
    
}   

// --- Helper function for Ctrl+V range paste ---
async function handleRangePaste() {
    if (activeColorIndex === -1) {
        vscode.postMessage({
            command: 'showInfo',
            message: 'Please select a target color (LMB) to start pasting.'
        });
        return;
    }

    try {
        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText) {
            vscode.postMessage({ command: 'showInfo', message: 'Clipboard is empty.' });
            return;
        }

        const hexStrings = clipboardText.split(',');
        const colorsToPaste = [];
        const hexRegex = /^#[0-9a-fA-F]{6}$/;

        for (const rawHexString of hexStrings) {
            const trimmedHex = rawHexString.trim();
            if (hexRegex.test(trimmedHex)) {
                // Ensure it's a valid 9-bit color by converting (snapping)
                try {
                    const rgb9 = hexToRgb9(trimmedHex);
                    const snappedHex = rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9);
                    colorsToPaste.push({ hex: snappedHex, priority: false });
                } catch (e) {
                    console.warn(`[Webview JS] Skipping invalid 9-bit hex during paste: ${trimmedHex}`, e);
                }
            } else {
                console.warn(`[Webview JS] Skipping invalid hex format during paste: ${trimmedHex}`);
            }
        }

        if (colorsToPaste.length === 0) {
            vscode.postMessage({ command: 'showInfo', message: 'No valid colors (#RRGGBB) found on clipboard to paste.' });
            return;
        }

        // recordPaletteChange('paste');

        let pastedCount = 0;

        for (let i = 0; i < colorsToPaste.length; i++) {
            const targetPaletteIndex = activeColorIndex + i;
            if (targetPaletteIndex < currentPaletteHex.length) {
                currentPaletteHex[targetPaletteIndex] = colorsToPaste[i];
                pastedCount++;
            } else {
                break; // Stop if we reach the end of the palette
            }
        }

        if (pastedCount > 0) {
            updateDirtyState(true);
            redrawPaletteGrid(); 
            vscode.postMessage({
                command: 'updateFullPalette',
                palette: currentPaletteHex
            });
            vscode.postMessage({
                command: 'showInfo',
                message: `${pastedCount} colors pasted.`
            });
            console.log(`[Webview JS] Pasted ${pastedCount} colors.`);
        } else {
            vscode.postMessage({ command: 'showInfo', message: 'No colors were pasted (possibly out of bounds or none valid).' });
        }

    } catch (err) {
        vscode.postMessage({ command: 'showError', message: 'Failed to read from clipboard or paste colors.' });
        console.error('[Webview JS] Failed to paste colors: ', err);
    }
}
// --- End Helper ---

// Modified recordPaletteChange function that doesn't depend on document
function recordPaletteChange(operationType) {
    // Skip local undo tracking (we'll let the extension handle it)
    // Just send the operation to the extension
    
    vscode.postMessage({
        command: 'updateFullPalette',
        palette: currentPaletteHex,
        operationType: operationType // Pass the operation type to the extension
    });
    
    // Update UI to reflect changes are pending save
    updateDirtyState(true);
}

// Remove or comment out the addToUndo function since it won't work in the webview context
// Let the extension side _addToUndo method handle the history management

// Function to update undo/redo button states
function updateUndoRedoButtons(canUndo, canRedo) {
    if (undoButton) {
        undoButton.disabled = !canUndo;
    }
    if (redoButton) {
        redoButton.disabled = !canRedo;
    }
    console.log(`[Webview JS] Updated undo/redo buttons: canUndo=${canUndo}, canRedo=${canRedo}`);
}

// Attach click handlers to undo/redo buttons
if (undoButton) {
    undoButton.addEventListener('click', () => {
        console.log("[Webview JS] Undo button clicked");
        vscode.postMessage({
            command: 'undoPaletteOperation'
        });
    });
}

if (redoButton) {
    redoButton.addEventListener('click', () => {
        console.log("[Webview JS] Redo button clicked");
        vscode.postMessage({
            command: 'redoPaletteOperation'
        });
    });
}

// Example usage:
// After color edit: recordPaletteChange('colorEdit')
// After reordering: recordPaletteChange('reorder')
// After swap: recordPaletteChange('swap')
// Etc.