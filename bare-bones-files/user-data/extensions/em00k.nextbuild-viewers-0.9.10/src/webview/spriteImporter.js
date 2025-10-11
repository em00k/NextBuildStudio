/* eslint-disable curly */
(function() {
    const vscode = acquireVsCodeApi();

    // DOM Elements
    const sourceCanvas = document.getElementById('sourceCanvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const selectionInfoDiv = document.getElementById('selectionInfo');
    const paletteSwatchesDiv = document.getElementById('paletteSwatches');
    const importButton = document.getElementById('importButton');
    const outputFormatSelect = document.getElementById('outputFormat');
    const outputBitDepthSelect = document.getElementById('outputBitDepth');
    const loadTargetPaletteButton = document.getElementById('loadTargetPaletteButton');
    const targetPaletteInfoSpan = document.getElementById('targetPaletteInfo');
    const importSheetButton = document.getElementById('importSheetButton');
    const addSelectionButton = document.getElementById('addSelectionButton');
    const spriteListDiv = document.getElementById('spriteList');
    const spriteCountSpan = document.getElementById('spriteCount');
    const saveExtractedPaletteButton = document.getElementById('saveExtractedPaletteButton');
    const cutterGridWidthInput = document.getElementById('cutterGridWidth'); // <-- Grid W Input
    const cutterGridHeightInput = document.getElementById('cutterGridHeight'); // <-- Grid H Input
    const showSourceGridCheckbox = document.getElementById('showSourceGrid'); // <-- Show Grid Checkbox
    const gridCellWidthInput = document.getElementById('gridCellWidth'); // <-- Grid Cell W Input
    const gridCellHeightInput = document.getElementById('gridCellHeight'); // <-- Grid Cell H Input
    const loadNewImageButton = document.getElementById('loadNewImageButton'); // <-- Load New Image Button
    const clearSpriteListButton = document.getElementById('clearSpriteListButton'); // <-- Clear List Button
    const showPreviewGridCheckbox = document.getElementById('showPreviewGrid'); // <-- Preview Grid Checkbox
    // New sprite size DOM elements
    const spriteWidthInput = document.getElementById('spriteWidth'); // <-- Sprite Width Input
    const spriteHeightInput = document.getElementById('spriteHeight'); // <-- Sprite Height Input
    const saveActualSizeCheckbox = document.getElementById('saveActualSize'); // <-- Save Actual Size Checkbox
    // Add more selectors for output options later...

    // State
    let sourceWidth = 0;
    let sourceHeight = 0;
    let sourceImageData = null;
    let selectionRect = { x: 0, y: 0, w: 0, h: 0 };
    let lastValidSelectionRect = { x: 0, y: 0, w: 0, h: 0 };
    let zoomLevel = 1.0;
    const minZoom = 1.0;
    const maxZoom = 16.0;
    let isSelecting = false;
    let startX = 0, startY = 0; // These will store image coordinates
    
    // New state for right-click drag selection
    let isRightDragging = false;
    let rightDragStartX = 0;
    let rightDragStartY = 0;
    let rightDragRect = { x: 0, y: 0, w: 0, h: 0 };

    // Caching the source image on a hidden canvas can improve redraw performance
    let offscreenSourceCanvas = null; 
    let offscreenSourceCtx = null;

    // --- Cookie Cutter Size (default, could be made configurable later) ---
    let cutterWidth = 16;
    let cutterHeight = 16;

    // --- State ---
    let loadedTargetPaletteHex = null; // <-- General loaded palette (up to 256)
    let targetPaletteFilename = null;
    let currentExtractedPaletteHex = []; // <-- Store hex strings of extracted colors
    let selectedSpriteList = [];
    let rectToAdd = null; // <-- Holds the rect captured by the last click
    let cutterGridW = 1; // <-- Grid Width state
    let cutterGridH = 1; // <-- Grid Height state
    let showSourceGrid = false; // <-- Show source grid state
    let gridCellW = 16; // <-- Source grid cell width
    let gridCellH = 16; // <-- Source grid cell height
    let currentSourceImageFsPath = null; // <-- Identifier for current image
    let showPreviewGrid = false; // <-- Show preview grid state
    let blockCaptureMode = false; // <-- New state variable for block capture mode
    let showBlockPreview = false; // <-- New state variable for block preview
    
    // Selection flash effect
    let isFlashing = false;
    let flashStartTime = 0;
    let flashDuration = 500; // Flash duration in milliseconds

    // --- Image Loading ---
    function loadImageFromPixelData(width, height, pixelDataBase64, imageFsPath) {
        try {
            console.log(`[Importer] Received image data: ${width}x${height}`);
            // Decode Base64
            const binaryString = atob(pixelDataBase64);
            currentSourceImageFsPath = imageFsPath; // <-- Store the path
            console.log(`[Importer] Current source image path: ${currentSourceImageFsPath}`);

            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Create Uint8ClampedArray required by ImageData
            const pixelDataClamped = new Uint8ClampedArray(bytes.buffer);

            if (pixelDataClamped.length !== width * height * 4) {
                 throw new Error(`Decoded pixel data length (${pixelDataClamped.length}) does not match expected length (${width * height * 4}).`);
            }

            // Create ImageData
            sourceImageData = new ImageData(pixelDataClamped, width, height);
            sourceWidth = width;
            sourceHeight = height;

            // Prepare the offscreen canvas with the source image data
            offscreenSourceCanvas = document.createElement('canvas');
            offscreenSourceCanvas.width = sourceWidth;
            offscreenSourceCanvas.height = sourceHeight;
            offscreenSourceCtx = offscreenSourceCanvas.getContext('2d');
            if (offscreenSourceCtx) {
                offscreenSourceCtx.putImageData(sourceImageData, 0, 0);
            } else {
                console.error("[Importer] Could not get offscreen canvas context.");
            }

            // --- Reset State for New Image --- 
            console.log('[Importer] Resetting state for new image.');
            // selectedSpriteList = []; // <-- DO NOT Clear sprite list
            // renderSpriteList(); // <-- DO NOT Update list UI
            rectToAdd = null; // Clear captured rect
            selectionRect = { x: 0, y: 0, w: 0, h: 0 }; // Reset selection box drawing
            lastValidSelectionRect = { x: 0, y: 0, w: 0, h: 0 }; // Reset last valid selection
            currentExtractedPaletteHex = []; // Clear extracted palette
            if (paletteSwatchesDiv) paletteSwatchesDiv.innerHTML = ''; // Clear palette UI
            if (saveExtractedPaletteButton) saveExtractedPaletteButton.disabled = true; // Disable save palette button
            if (previewCtx) previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); // Clear preview canvas
            // Reset target palette info if desired? Or keep it loaded?
            // loadedTargetPaletteHex = null; 
            // targetPaletteFilename = null;
            // if (targetPaletteInfoSpan) targetPaletteInfoSpan.textContent = '';

            // Set the *backing store* size of the visible canvas
            sourceCanvas.width = sourceWidth;
            sourceCanvas.height = sourceHeight;

            console.log('[Importer] Image data loaded.');
            // Update instructions
            selectionInfoDiv.textContent = 'Image loaded. Scroll wheel to zoom. Left-click to select.';
            zoomLevel = 1.0; // Reset zoom
            redrawSourceCanvas(); // Initial draw

        } catch (error) {
            console.error('[Importer] Error processing pixel data:', error);
            selectionInfoDiv.textContent = 'Error processing image data.';
            vscode.postMessage({ command: 'showError', text: `Error processing image data: ${error.message || error}` });
            sourceImageData = null; // Reset state on error
            sourceWidth = 0;
            sourceHeight = 0;
            sourceCanvas.width = 100; // Clear canvas visually
            sourceCanvas.height = 30;
        }
    }

    // --- Coordinate Conversion Helper (Simplified) ---
    function screenToImageCoords(screenX, screenY) {
        // Simple scaling from top-left
        return { 
            x: screenX / zoomLevel,
            y: screenY / zoomLevel
        };
    }

    // --- Canvas Redraw Function (Simplified - Resizes Backing Store) ---
    function redrawSourceCanvas() {
        if (!sourceCtx || !offscreenSourceCanvas) return;
        
        // 1. Calculate desired backing store size
        const newCanvasWidth = Math.max(1, Math.floor(sourceWidth * zoomLevel));
        const newCanvasHeight = Math.max(1, Math.floor(sourceHeight * zoomLevel));

        // 2. Set canvas backing store size 
        // (Avoids excessive resizing if size hasn't changed much? Maybe not needed)
        if (sourceCanvas.width !== newCanvasWidth) {
            sourceCanvas.width = newCanvasWidth;
        }
        if (sourceCanvas.height !== newCanvasHeight) {
            sourceCanvas.height = newCanvasHeight;
        }

        // 3. Remove CSS sizing (size is now controlled by width/height attributes)
        sourceCanvas.style.width = ''; 
        sourceCanvas.style.height = '';

        // 4. Clear the *entire* (potentially resized) canvas backing store
        sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);

        // 5. Set image smoothing OFF (important *after* resizing canvas potentially)
        sourceCtx.imageSmoothingEnabled = false;

        // 6. Draw the offscreen canvas (original image) scaled onto the main canvas
        sourceCtx.drawImage(
            offscreenSourceCanvas, 
            0, 0, sourceWidth, sourceHeight, // Source rect (full original image)
            0, 0, newCanvasWidth, newCanvasHeight // Destination rect (entire resized canvas)
        );

        // --- NEW: Draw Source Grid (if enabled) --- 
        if (showSourceGrid && gridCellW > 0 && gridCellH > 0) {
            sourceCtx.strokeStyle = 'rgba(128, 128, 128, 0.5)'; // Faint grey
            sourceCtx.lineWidth = 1;
            const scaledCellW = gridCellW * zoomLevel;
            const scaledCellH = gridCellH * zoomLevel;

            // Vertical lines
            for (let x = scaledCellW; x < sourceCanvas.width; x += scaledCellW) {
                sourceCtx.beginPath();
                sourceCtx.moveTo(Math.floor(x), 0);
                sourceCtx.lineTo(Math.floor(x), sourceCanvas.height);
                sourceCtx.stroke();
            }
            // Horizontal lines
            for (let y = scaledCellH; y < sourceCanvas.height; y += scaledCellH) {
                sourceCtx.beginPath();
                sourceCtx.moveTo(0, Math.floor(y));
                sourceCtx.lineTo(sourceCanvas.width, Math.floor(y));
                sourceCtx.stroke();
            }
        }

        // 7. Draw the selection rectangle (scaled to the new canvas dimensions)
        if (selectionRect.w > 0 && selectionRect.h > 0) {
            // Check if we need to apply the flash effect
            if (isFlashing) {
                const elapsed = Date.now() - flashStartTime;
                if (elapsed < flashDuration) {
                    // Calculate flash intensity (starts bright, fades out)
                    const flashProgress = 1 - (elapsed / flashDuration);
                    const flashIntensity = Math.floor(255 * flashProgress);
                    
                    // Flash color (bright yellow that fades out)
                    sourceCtx.strokeStyle = `rgba(255, 255, ${flashIntensity}, ${0.9 * flashProgress})`; 
                    sourceCtx.lineWidth = 3 + Math.floor(5 * flashProgress); // Thicker line during flash
                    
                    // Apply a highlight fill as well
                    sourceCtx.fillStyle = `rgba(255, 255, 0, ${0.3 * flashProgress})`;
                    
                    // Calculate dimensions for the *entire grid* selection box
                    const gridDrawW = Math.max(1, Math.floor(selectionRect.w * cutterGridW));
                    const gridDrawH = Math.max(1, Math.floor(selectionRect.h * cutterGridH));
                    
                    // Draw the fill first
                    sourceCtx.fillRect(
                        Math.floor(selectionRect.x) * zoomLevel,      
                        Math.floor(selectionRect.y) * zoomLevel,      
                        Math.floor(gridDrawW * zoomLevel),      
                        Math.floor(gridDrawH * zoomLevel)       
                    );
                    
                    // Then draw the stroke
                    sourceCtx.strokeRect(
                        Math.floor(selectionRect.x) * zoomLevel,      
                        Math.floor(selectionRect.y) * zoomLevel,     
                        Math.floor(gridDrawW * zoomLevel),      
                        Math.floor(gridDrawH * zoomLevel)       
                    );
                    
                    // Request another animation frame to continue the flash effect
                    requestAnimationFrame(redrawSourceCanvas);
                } else {
                    // Flash effect is done
                    isFlashing = false;
                    
                    // Draw normal selection rectangle after flash completes
                    sourceCtx.strokeStyle = 'rgba(255, 0, 0, 0.9)'; 
                    sourceCtx.lineWidth = 2; // Normal line width
                    
                    // Calculate dimensions for the *entire grid* selection box
                    const gridDrawW = Math.max(1, Math.floor(selectionRect.w * cutterGridW));
                    const gridDrawH = Math.max(1, Math.floor(selectionRect.h * cutterGridH));
                    
                    sourceCtx.strokeRect(
                        Math.floor(selectionRect.x) * zoomLevel,      
                        Math.floor(selectionRect.y) * zoomLevel,      
                        Math.floor(gridDrawW * zoomLevel),      
                        Math.floor(gridDrawH * zoomLevel)       
                    );
                }
            } else {
                // Normal selection rectangle (no flash)
            sourceCtx.strokeStyle = 'rgba(255, 0, 0, 0.9)'; 
            sourceCtx.lineWidth = 2; // Make the line thicker

            // Calculate dimensions for the *entire grid* selection box
            const gridDrawW = Math.max(1, Math.floor(selectionRect.w * cutterGridW));
            const gridDrawH = Math.max(1, Math.floor(selectionRect.h * cutterGridH));

            sourceCtx.strokeRect(
                // Floor the image coordinate *first*, then scale for drawing
                Math.floor(selectionRect.x) * zoomLevel,      
                Math.floor(selectionRect.y) * zoomLevel,      
                // Use calculated grid dimensions, scaled by zoom
                Math.floor(gridDrawW * zoomLevel),      
                Math.floor(gridDrawH * zoomLevel)       
                );
            }
        }
        
        // 8. Draw the right-drag selection rectangle if active
        if (isRightDragging && rightDragRect.w > 0 && rightDragRect.h > 0) {
            sourceCtx.strokeStyle = 'rgba(0, 180, 0, 0.9)'; // Green color for right-drag
            sourceCtx.lineWidth = 2;
            
            // Draw the right-drag selection rectangle
            sourceCtx.strokeRect(
                Math.floor(rightDragRect.x) * zoomLevel,
                Math.floor(rightDragRect.y) * zoomLevel,
                Math.floor(rightDragRect.w) * zoomLevel,
                Math.floor(rightDragRect.h) * zoomLevel
            );
            
            // Add a semi-transparent fill to make it more visible
            sourceCtx.fillStyle = 'rgba(0, 180, 0, 0.1)';
            sourceCtx.fillRect(
                Math.floor(rightDragRect.x) * zoomLevel,
                Math.floor(rightDragRect.y) * zoomLevel,
                Math.floor(rightDragRect.w) * zoomLevel,
                Math.floor(rightDragRect.h) * zoomLevel
            );
        }
    }

    // --- Event Listeners (Simplified) --- 

    // Mousedown: Implement right-click drag selection
    sourceCanvas.addEventListener('mousedown', (e) => {
        if (!sourceImageData) return;
        
        // Right mouse button (e.button === 2) for custom selection
        if (e.button === 2) {
            e.preventDefault(); // Prevent context menu
            
            // Start right-drag selection
            isRightDragging = true;
            
            // Capture pointer to ensure we get all mouse events even if outside canvas
            sourceCanvas.setPointerCapture(e.pointerId);
            
            // Get cursor position in image coordinates
            const imageCoords = screenToImageCoords(e.offsetX, e.offsetY);
            rightDragStartX = imageCoords.x;
            rightDragStartY = imageCoords.y;
            
            // Initialize drag rectangle
            rightDragRect = { 
                x: rightDragStartX, 
                y: rightDragStartY, 
                w: 0, 
                h: 0 
            };
            
            // Update UI status
            selectionInfoDiv.textContent = 'Right-drag to create a custom selection';
            
            console.log('[Importer] Started right-drag selection at:', rightDragStartX, rightDragStartY);
        }
        // Left mouse button (e.button === 0) for standard selection
        else if (e.button === 0) {
            // Standard selection behavior remains (handled by click event)
        }
    });

    // Mousemove: Update right-drag selection when active
    sourceCanvas.addEventListener('mousemove', (e) => {
        if (!sourceImageData) return;

        // Handle standard selection behavior (left mouse button or no buttons)
        if (!isRightDragging) {
            // Get custom sprite size values from inputs
            const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
            const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
            
            // Update the cutter dimensions to match the custom sprite size
            cutterWidth = customWidth;
            cutterHeight = customHeight;

        const imageCoords = screenToImageCoords(e.offsetX, e.offsetY);
        let potentialX = imageCoords.x - cutterWidth / 2;
        let potentialY = imageCoords.y - cutterHeight / 2;
        const clampedX = Math.max(0, Math.min(sourceWidth - cutterWidth, potentialX));
        const clampedY = Math.max(0, Math.min(sourceHeight - cutterHeight, potentialY));
        
        // Update rect for drawing the moving box
        selectionRect.x = clampedX;
        selectionRect.y = clampedY;
        selectionRect.w = cutterWidth;
        selectionRect.h = cutterHeight;

        // Update the persistent state for the last valid position
        lastValidSelectionRect.x = clampedX;
        lastValidSelectionRect.y = clampedY;
        lastValidSelectionRect.w = cutterWidth;
        lastValidSelectionRect.h = cutterHeight;

        redrawSourceCanvas(); 
            updateSelectionInfo();
        } 
        // Handle right-drag selection (right mouse button)
        else {
            const imageCoords = screenToImageCoords(e.offsetX, e.offsetY);
            const currentX = imageCoords.x;
            const currentY = imageCoords.y;
            
            // Calculate the rectangle from the start point to the current point
            // Ensure we handle drags in any direction
            const startX = Math.min(rightDragStartX, currentX);
            const startY = Math.min(rightDragStartY, currentY);
            const width = Math.abs(currentX - rightDragStartX);
            const height = Math.abs(currentY - rightDragStartY);
            
            // Update the right-drag rectangle
            rightDragRect = {
                x: startX,
                y: startY,
                w: width,
                h: height
            };
            
            // Update the UI with current dimensions
            selectionInfoDiv.textContent = `Custom selection: X=${Math.floor(startX)}, Y=${Math.floor(startY)}, W=${Math.floor(width)}, H=${Math.floor(height)}`;
            
            // Redraw the canvas to show the updated selection rectangle
            redrawSourceCanvas();
        }
    });

    // Mouseup: Finalize right-drag selection
    sourceCanvas.addEventListener('mouseup', (e) => {
        // Right mouse button release (e.button === 2)
        if (e.button === 2 && isRightDragging) {
            // Release pointer capture
            if (e.pointerId !== undefined) {
                sourceCanvas.releasePointerCapture(e.pointerId);
            }
            
            // Ensure we have a valid selection (minimum size)
            if (rightDragRect.w >= 1 && rightDragRect.h >= 1) {
                // Update cutter dimensions to match the selection
                cutterWidth = Math.floor(rightDragRect.w);
                cutterHeight = Math.floor(rightDragRect.h);
                
                // Update the sprite size inputs to match
                if (spriteWidthInput) spriteWidthInput.value = cutterWidth.toString();
                if (spriteHeightInput) spriteHeightInput.value = cutterHeight.toString();
                
                // Update the selection rectangle to match the right-drag rectangle
                lastValidSelectionRect = { ...rightDragRect };
                
                // Create the selection for preview
                rectToAdd = { ...rightDragRect };
                
                // Update preview
                updatePreview(rectToAdd);
                updatePalettePreview(rectToAdd);
                
                // Trigger the selection flash effect
                startSelectionFlash();
                
                // Update UI
                selectionInfoDiv.textContent = `Custom selection: X=${Math.floor(rightDragRect.x)}, Y=${Math.floor(rightDragRect.y)}, W=${Math.floor(rightDragRect.w)}, H=${Math.floor(rightDragRect.h)} - Ready to Add`;
                
                console.log('[Importer] Finalized right-drag selection:', rightDragRect);
            } else {
                // Clear if selection is too small
                console.warn('[Importer] Right-drag selection too small, ignoring');
                selectionInfoDiv.textContent = 'Selection too small. Try again with a larger area.';
            }
            
            // End right-drag mode
            isRightDragging = false;
            
            // Redraw to update the canvas
            redrawSourceCanvas();
        }
        // Left mouse button release is handled by the click event
    });

    // Add a global mouseup handler for cases when the mouse is released outside the canvas
    document.addEventListener('mouseup', (e) => {
        if (e.button === 2 && isRightDragging) {
            isRightDragging = false;
            redrawSourceCanvas();
        }
    });

    // Context menu: Prevent the default context menu on the canvas
    sourceCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Click: Use lastValidSelectionRect
    sourceCanvas.addEventListener('click', (e) => { 
        if (!sourceImageData || e.button !== 0) return;
        
        // Check the *last valid position* for width/height
        if (lastValidSelectionRect.w <= 0 || lastValidSelectionRect.h <= 0) { 
             console.warn('[Importer] Clicked, but last valid selection rect has no size.');
             vscode.postMessage({ command: 'showError', text: 'Please move the mouse over the image first to set the selection area.'});
             return;
        }
        
        console.log('[Importer] Selection finalized via click. Using lastValidSelectionRect:', JSON.stringify(lastValidSelectionRect));
        // Use lastValidSelectionRect for updates
        updatePalettePreview(lastValidSelectionRect); // Pass rect explicitly
        updatePreview(lastValidSelectionRect);       // Pass rect explicitly
        
        // Trigger the selection flash effect
        startSelectionFlash();
        
        redrawSourceCanvas(); // Redraw to show persistent box (uses selectionRect for drawing)
        selectionInfoDiv.textContent += ' - Selected!'; 
    });

    // Mouseleave: Only reset the drawing rect
    sourceCanvas.addEventListener('mouseleave', (e) => {
        if (!sourceImageData) return;
        // Clear the *drawing* rectangle visually
        selectionRect = { x: 0, y: 0, w: 0, h: 0 }; 
        redrawSourceCanvas(); 
        selectionInfoDiv.textContent = 'Move mouse over image to select area.'; 
        // Do NOT reset lastValidSelectionRect here
    });
    
    // Zoom Logic (Simplified - No offset calculation)
    sourceCanvas.addEventListener('wheel', (e) => {
        if (!sourceImageData) return;
        e.preventDefault();

        // Calculate new zoom level
        const scaleAmount = -e.deltaY / 500; 
        const newZoomLevel = zoomLevel * (1 + scaleAmount);
        const oldZoomLevel = zoomLevel;

        // Clamp the zoom level
        zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));

        // If zoom didn't change, do nothing
        if (zoomLevel === oldZoomLevel) {
            return;
        }
        
        console.log(`[Importer] Zoom: ${zoomLevel.toFixed(2)}`);
        redrawSourceCanvas();
    });

    // --- Helper for starting the selection flash effect ---
    function startSelectionFlash() {
        isFlashing = true;
        flashStartTime = Date.now();
        redrawSourceCanvas(); // Start redrawing to show the flash effect
    }

    // --- Preview Update (Refactored) ---
    function updatePreview(rectToPreview) {
        // Draw from sourceImageData via a temporary canvas
        if (!sourceImageData || !rectToPreview || rectToPreview.w <= 0 || rectToPreview.h <= 0 || !previewCtx) return;

        try {
            // Get custom sprite dimensions
            const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
            const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
            
            // Update cutter dimensions to match custom sprite dimensions
            cutterWidth = customWidth;
            cutterHeight = customHeight;
            
            // Make sure the preview rect has the correct dimensions
            rectToPreview.w = cutterWidth;
            rectToPreview.h = cutterHeight;

            const srcX = Math.floor(rectToPreview.x);
            const srcY = Math.floor(rectToPreview.y);
            const srcW = Math.max(1, Math.floor(rectToPreview.w)); // Base sprite width
            const srcH = Math.max(1, Math.floor(rectToPreview.h)); // Base sprite height

            // --- Calculate total grid dimensions --- 
            const totalGridW = srcW * cutterGridW;
            const totalGridH = srcH * cutterGridH;

            // Create a temporary canvas for the selection
            const tempPreviewCanvas = document.createElement('canvas');
            tempPreviewCanvas.width = totalGridW;
            tempPreviewCanvas.height = totalGridH;
            const tempPreviewCtx = tempPreviewCanvas.getContext('2d');

            if (!tempPreviewCtx) {
                 console.error("[Importer] Failed to get temp preview context.");
                 return;
            }

            // Get the ImageData for the selected region from the original data
            // Need to extract the sub-rectangle manually
            const selectionPixelData = new Uint8ClampedArray(totalGridW * totalGridH * 4);
            const sourcePixels = sourceImageData.data;
            for (let y = 0; y < totalGridH; y++) {
                for (let x = 0; x < totalGridW; x++) {
                    const sourceIndex = ((srcY + y) * sourceWidth + (srcX + x)) * 4;
                    const destIndex = (y * totalGridW + x) * 4;
                    // Boundary check for safety (though grid logic should prevent this)
                    if (sourceIndex < 0 || sourceIndex + 3 >= sourcePixels.length) continue;

                    selectionPixelData[destIndex] = sourcePixels[sourceIndex];         // R
                    selectionPixelData[destIndex + 1] = sourcePixels[sourceIndex + 1]; // G
                    selectionPixelData[destIndex + 2] = sourcePixels[sourceIndex + 2]; // B
                    selectionPixelData[destIndex + 3] = sourcePixels[sourceIndex + 3]; // A
                }
            }
            const selectionImgData = new ImageData(selectionPixelData, totalGridW, totalGridH);
            
            // Put this data onto the temporary canvas
            tempPreviewCtx.putImageData(selectionImgData, 0, 0);

            // --- Now scale and draw temp canvas onto the visible preview canvas ---
            const maxPreviewSize = 256;
            
            // Special handling for 640x256 mode: double the height for correct aspect ratio
            // ZX Next pixels are twice as tall as they are wide in 640x256 mode
            const is640x256Mode = totalGridW === 640 && totalGridH === 256;
            let effectiveHeight = totalGridH;
            if (is640x256Mode) {
                effectiveHeight = totalGridH * 2; // Double height for correct aspect ratio
                console.log('[Importer] 640x256 mode detected - doubling height for preview aspect ratio');
            }
            
            const scale = Math.min(maxPreviewSize / totalGridW, maxPreviewSize / effectiveHeight);
            // Make sure scale is at least 1 for pixelated look, unless original is > maxPreviewSize
             const displayScale = Math.max(1.0, scale);
            // Or maybe just floor scale? Let's try just using scale directly first.
            // const displayScale = Math.floor(scale > 0 ? scale : 1);
            
            const previewW = Math.floor(totalGridW * displayScale);
            const previewH = Math.floor(effectiveHeight * displayScale);

            // Resize preview canvas
            previewCanvas.width = previewW;
            previewCanvas.height = previewH;

            // Draw scaled from temp canvas, ensuring no smoothing
            previewCtx.clearRect(0, 0, previewW, previewH); // Clear before drawing
            previewCtx.imageSmoothingEnabled = false;
            
            if (is640x256Mode) {
                // For 640x256, draw each row twice to get the correct 4:3 aspect ratio
                // This simulates how the pixels appear on the actual ZX Next hardware
                for (let row = 0; row < totalGridH; row++) {
                    const sourceY = row;
                    const destY1 = Math.floor(row * 2 * displayScale); // First copy of the row
                    const destY2 = Math.floor((row * 2 + 1) * displayScale); // Second copy of the row
                    const rowHeight = Math.ceil(displayScale);
                    
                    // Draw the same row twice (double height)
                    previewCtx.drawImage(
                        tempPreviewCanvas,
                        0, sourceY, totalGridW, 1, // Source: full width, 1 pixel height
                        0, destY1, previewW, rowHeight // Destination: first copy
                    );
                    previewCtx.drawImage(
                        tempPreviewCanvas,
                        0, sourceY, totalGridW, 1, // Source: full width, 1 pixel height  
                        0, destY2, previewW, rowHeight // Destination: second copy
                    );
                }
            } else {
                // Standard drawing for all other modes
                previewCtx.drawImage(
                    tempPreviewCanvas, // Source is the temp canvas with the selection
                    0, 0, totalGridW, totalGridH, // Source rect (entire temp canvas)
                    0, 0, previewW, previewH // Destination rect (scaled on preview canvas)
                );
            }
            
            // --- Draw Preview Grid (if enabled) --- 
            console.log(`[Importer][PreviewGrid] Checking condition: showPreviewGrid=${showPreviewGrid}, totalGridW=${totalGridW}, totalGridH=${totalGridH}, cutterGridW=${cutterGridW}, cutterGridH=${cutterGridH}`);
            if (showPreviewGrid && totalGridW > 0 && totalGridH > 0) {
                console.log(`[Importer][PreviewGrid] Drawing PIXEL grid. Total selection size: ${totalGridW}x${totalGridH}. Preview canvas size: ${previewW}x${previewH}`);
                previewCtx.strokeStyle = 'rgba(255, 0, 0, 0.9)'; // Same red as selection box
                previewCtx.lineWidth = 1;
                const pixelDrawW = previewW / totalGridW; // Scaled size of ONE original pixel
                const pixelDrawH = previewH / totalGridH;

                // Vertical Lines (for every original pixel column boundary)
                for (let x = 1; x < totalGridW; x++) { 
                    const lineX = Math.floor(x * pixelDrawW);
                    // console.log(`[Importer][PreviewGrid] Drawing vertical pixel line at x=${lineX} (loop var x=${x})`); // Optional: uncomment for extreme debug
                    previewCtx.beginPath();
                    previewCtx.moveTo(lineX, 0);
                    previewCtx.lineTo(lineX, previewH);
                    previewCtx.stroke(); // <-- Draw the line!
                }
                // Horizontal Lines (for every original pixel row boundary)
                for (let y = 1; y < totalGridH; y++) { 
                    const lineY = Math.floor(y * pixelDrawH);
                    // console.log(`[Importer][PreviewGrid] Drawing horizontal pixel line at y=${lineY} (loop var y=${y})`); // Optional: uncomment for extreme debug
                    previewCtx.beginPath();
                    previewCtx.moveTo(0, lineY);
                    previewCtx.lineTo(previewW, lineY);
                    previewCtx.stroke(); // <-- Draw the line!
                }
                console.log(`[Importer][PreviewGrid] Finished drawing grid lines.`);
            } else {
                console.log(`[Importer][PreviewGrid] Condition not met or grid size is 1x1, skipping grid draw.`);
            }
            
            // --- Draw Block Preview (if enabled) ---
            if (showBlockPreview && totalGridW > 0 && totalGridH > 0) {
                console.log(`[Importer][BlockPreview] Drawing block grid overlay. Grid dimensions: ${cutterGridW}x${cutterGridH}`);
                
                // Use a different color for block grid
                previewCtx.strokeStyle = 'rgba(0, 100, 255, 0.8)'; // Blue color
                previewCtx.lineWidth = 2; // Thicker lines for block boundaries
                
                // Calculate cell dimensions
                const cellWidth = previewW / cutterGridW;
                const cellHeight = previewH / cutterGridH;
                
                // Draw vertical lines at block boundaries
                for (let x = 1; x < cutterGridW; x++) {
                    const lineX = Math.floor(x * cellWidth);
                    previewCtx.beginPath();
                    previewCtx.moveTo(lineX, 0);
                    previewCtx.lineTo(lineX, previewH);
                    previewCtx.stroke();
                }
                
                // Draw horizontal lines at block boundaries
                for (let y = 1; y < cutterGridH; y++) {
                    const lineY = Math.floor(y * cellHeight);
                    previewCtx.beginPath();
                    previewCtx.moveTo(0, lineY);
                    previewCtx.lineTo(previewW, lineY);
                    previewCtx.stroke();
                }
                
                // Add indices to cells
                if (cutterGridW <= 8 && cutterGridH <= 8) { // Only for smaller grids
                    previewCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    previewCtx.font = '12px monospace';
                    previewCtx.textAlign = 'center';
                    previewCtx.textBaseline = 'middle';
                    
                    for (let y = 0; y < cutterGridH; y++) {
                        for (let x = 0; x < cutterGridW; x++) {
                            const cellX = Math.floor(x * cellWidth + cellWidth / 2);
                            const cellY = Math.floor(y * cellHeight + cellHeight / 2);
                            const index = y * cutterGridW + x;
                            previewCtx.fillText(index.toString(), cellX, cellY);
                        }
                    }
                }
                
                console.log(`[Importer][BlockPreview] Finished drawing block grid overlay.`);
            }
            
            console.log(`[Importer] Preview updated. Source ${totalGridW}x${totalGridH}, Display ${previewW}x${previewH}`);

        } catch (error) {
             console.error("[Importer] Error updating preview:", error);
             if(previewCtx) {
                 previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                 previewCanvas.width = 100; previewCanvas.height = 30;
                 previewCtx.fillText("Error", 10, 20);
             }
        }
    }

    // --- Palette Extraction ---
    function updatePalettePreview(rectToExtract) {
        // This function remains the same, using image coords from selectionRect
        if (!sourceImageData || !rectToExtract || rectToExtract.w <= 0 || rectToExtract.h <= 0 || !paletteSwatchesDiv) return;
        
        // Get custom sprite dimensions
        const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
        const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
        
        // Update cutter dimensions to match custom sprite dimensions
        cutterWidth = customWidth;
        cutterHeight = customHeight;
        
        // Make sure the extraction rect has the correct dimensions
        rectToExtract.w = cutterWidth;
        rectToExtract.h = cutterHeight;

        console.log('[Importer] Extracting palette from sourceImageData using rect:', rectToExtract);
        currentExtractedPaletteHex = []; // Reset before extraction
        saveExtractedPaletteButton.disabled = true; // Disable button initially
        try {
            const uniqueColors = new Set();
            const pixels = sourceImageData.data;
            
            // Calculate the bounds for the entire grid
            const startX = Math.floor(rectToExtract.x);
            const startY = Math.floor(rectToExtract.y);
            const singleSpriteW = Math.max(1, Math.floor(rectToExtract.w));
            const singleSpriteH = Math.max(1, Math.floor(rectToExtract.h));
            
            // Use the full block dimensions for palette extraction
            const blockW = singleSpriteW * cutterGridW;
            const blockH = singleSpriteH * cutterGridH;
            
            // Ensure we don't go out of image bounds
            const endX = Math.min(startX + blockW, sourceWidth);
            const endY = Math.min(startY + blockH, sourceHeight);
            
            console.log(`[Importer] Extracting colors from full block: (${startX},${startY}) to (${endX},${endY}), dimensions: ${blockW}x${blockH}`);
            
            const imgWidth = sourceWidth; // Use sourceWidth for index calculation

            // Iterate only over pixels within the selection bounds in the sourceImageData buffer
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    // Ensure x, y are within image bounds (though selection rect should be)
                    if (x < 0 || x >= imgWidth || y < 0 || y >= sourceHeight) continue;

                    // Calculate index in the 1D pixel array (RGBA)
                    const index = (y * imgWidth + x) * 4;
                    
                    const r = pixels[index];
                    const g = pixels[index + 1];
                    const b = pixels[index + 2];
                    const a = pixels[index + 3]; // Also check alpha
                    
                    // Skip fully transparent pixels
                    if (a === 0) continue;
                    
                    const hexColor = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
                    uniqueColors.add(hexColor); // Add to set to find unique ones
                }
            }

            // --- Display logic (using unique colors) --- 
            paletteSwatchesDiv.innerHTML = ''; // Clear previous swatches
            console.log(`[Importer] Found ${uniqueColors.size} unique colors in the full block.`);
            const sortedColors = Array.from(uniqueColors).sort();
            currentExtractedPaletteHex = sortedColors; // <-- CORRECT: Assign the unique sorted colors
            
            if (uniqueColors.size > 0) {
                saveExtractedPaletteButton.disabled = false; // Enable button if colors found
            }

            if (uniqueColors.size > 512) { // Limit displayed swatches
                const warningDiv = document.createElement('div');
                warningDiv.textContent = `(${uniqueColors.size} colors found, showing first 512)`;
                warningDiv.style.fontSize = '0.8em';
                warningDiv.style.color = 'var(--vscode-editorWarning-foreground)';
                paletteSwatchesDiv.appendChild(warningDiv);
            }
            
            let displayedCount = 0;
            for (const colorString of sortedColors) {
                if (displayedCount >= 512) break;
                
                const swatch = document.createElement('div');
                swatch.style.width = '16px';
                swatch.style.height = '16px';
                swatch.style.backgroundColor = colorString;
                swatch.style.display = 'inline-block';
                swatch.style.margin = '1px';
                swatch.style.border = '1px solid var(--vscode-editorWidget-border)';
                swatch.title = `RGB(${colorString})`;
                paletteSwatchesDiv.appendChild(swatch);
                displayedCount++;
            }
            
        } catch (error) {
            console.error('[Importer] Error extracting palette:', error);
            paletteSwatchesDiv.innerHTML = '<span style="color: var(--vscode-errorForeground);">Error extracting palette.</span>';
        }
    }

    // --- Sprite List Rendering ---
    function renderSpriteList() {
        if (!spriteListDiv || !spriteCountSpan) return;

        spriteListDiv.innerHTML = ''; // Clear existing list
        spriteCountSpan.textContent = selectedSpriteList.length.toString();

        selectedSpriteList.forEach((spriteItem, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'sprite-list-item';

            // --- Display Preview Image --- 
            const img = document.createElement('img');
            console.log(`[Importer][renderSpriteList] Rendering item ${index}, previewUrl:`, spriteItem.previewUrl?.substring(0, 100) + (spriteItem.previewUrl?.length > 100 ? '...' : '')); // Log start of URL
            img.src = spriteItem.previewUrl || ''; // Use stored URL or empty string
            img.title = `Sprite ${index + 1} (X:${spriteItem.rect.x}, Y:${spriteItem.rect.y}, W:${spriteItem.rect.w}, H:${spriteItem.rect.h})`;
            if (!spriteItem.previewUrl) { // Add basic style if URL failed
                 img.style.border = '1px dashed red';
                 img.alt = 'Preview Error';
            } 
            listItem.appendChild(img);
            // --- End Preview Display ---

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-sprite-button';
            removeButton.textContent = 'X';
            removeButton.title = 'Remove this sprite';
            removeButton.dataset.index = index.toString();

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent potential parent clicks
                const indexToRemove = parseInt((e.target).dataset.index, 10);
                if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < selectedSpriteList.length) {
                    selectedSpriteList.splice(indexToRemove, 1); // Remove from array
                    renderSpriteList(); // Re-render the list
                    console.log('[Importer] Removed sprite at index:', indexToRemove);
                }
            });

            listItem.appendChild(removeButton);
            spriteListDiv.appendChild(listItem);
        });
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // ... (existing listeners: zoom, mouse, click, leave) ...

        // --- ADD KEYBOARD NAVIGATION --- 
        document.addEventListener('keydown', (e) => {
            if (!sourceImageData) return;
            
            // Get custom sprite size values from inputs
            const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
            const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
            
            // Update the cutter dimensions to match the custom sprite size
            cutterWidth = customWidth;
            cutterHeight = customHeight;
            
            // Only process in block capture mode with loaded image
            if (blockCaptureMode && e.key === 'Tab') {
                e.preventDefault();
                
                // First capture current selection if valid
                if (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0) {
                    rectToAdd = { ...lastValidSelectionRect };
                    updatePreview(rectToAdd);
                    updatePalettePreview(rectToAdd);
                    
                    // Add to list
                    if (addSelectionButton) {
                        addSelectionButton.click();
                        console.log('[Importer] Auto-added selection via Tab key in Block Capture Mode');
                    }
                }
                
                // Now auto-advance to next position
                // Calculate full block dimensions for movement
                const blockStepX = cutterWidth * cutterGridW;  // Full block width
                const blockStepY = cutterHeight * cutterGridH; // Full block height
                
                if (!e.shiftKey) {
                    // Without shift: Move right by block width, and when at edge, down and to left
                    if (selectionRect.x + blockStepX <= sourceWidth - cutterWidth) {
                        selectionRect.x += blockStepX;
                    } else {
                        selectionRect.x = 0; // Return to left side
                        if (selectionRect.y + blockStepY <= sourceHeight - cutterHeight) {
                            selectionRect.y += blockStepY;
                        } else {
                            // If at the bottom right, wrap to top left
                            selectionRect.x = 0;
                            selectionRect.y = 0;
                        }
                    }
                } else {
                    // Shift+Tab: Move left by block width, and when at edge, up and to right
                    if (selectionRect.x >= blockStepX) {
                        selectionRect.x -= blockStepX;
                    } else {
                        // Move to rightmost position
                        const rightmostX = Math.floor((sourceWidth - cutterWidth) / blockStepX) * blockStepX;
                        selectionRect.x = rightmostX;
                        
                        if (selectionRect.y >= blockStepY) {
                            selectionRect.y -= blockStepY;
                        } else {
                            // If at the top left, wrap to bottom right
                            selectionRect.x = rightmostX;
                            selectionRect.y = Math.floor((sourceHeight - cutterHeight) / blockStepY) * blockStepY;
                        }
                    }
                }
                
                // Update state and UI
                lastValidSelectionRect.x = selectionRect.x;
                lastValidSelectionRect.y = selectionRect.y;
                lastValidSelectionRect.w = cutterWidth;
                lastValidSelectionRect.h = cutterHeight;
                redrawSourceCanvas();
                updateSelectionInfo();
                return;
            }
            
            // Non-block mode (or block mode with keys other than Tab)
            const step = e.shiftKey ? 5 : 1; // Bigger steps with shift key
            let didMove = false;
            let didCapture = false;
            let didResize = false;
            
            switch(e.key) {
                // Arrow keys for repositioning
                case 'ArrowLeft':
                    e.preventDefault();
                    if (selectionRect.x >= step) {
                        selectionRect.x -= step;
                        lastValidSelectionRect.x = selectionRect.x;
                        didMove = true;
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (selectionRect.x + selectionRect.w + step <= sourceWidth) {
                        selectionRect.x += step;
                        lastValidSelectionRect.x = selectionRect.x;
                        didMove = true;
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (selectionRect.y >= step) {
                        selectionRect.y -= step;
                        lastValidSelectionRect.y = selectionRect.y;
                        didMove = true;
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (selectionRect.y + selectionRect.h + step <= sourceHeight) {
                        selectionRect.y += step;
                        lastValidSelectionRect.y = selectionRect.y;
                        didMove = true;
                    }
                    break;
                    
                // Numpad keys for resizing
                case '6': // Numpad 6 - Increase width
                case 'Numpad6':
                    e.preventDefault();
                    // Ensure we can increase width within bounds
                    if (selectionRect.x + cutterWidth + step <= sourceWidth) {
                        cutterWidth += step;
                        // Update sprite width input
                        if (spriteWidthInput) {
                            spriteWidthInput.value = cutterWidth.toString();
                        }
                        didResize = true;
                        console.log(`[Importer] Increased sprite width to ${cutterWidth}`);
                    }
                    break;
                case '4': // Numpad 4 - Decrease width
                case 'Numpad4':
                    e.preventDefault();
                    // Ensure we don't go below minimum width
                    if (cutterWidth > step) {
                        cutterWidth -= step;
                        // Update sprite width input
                        if (spriteWidthInput) {
                            spriteWidthInput.value = cutterWidth.toString();
                        }
                        didResize = true;
                        console.log(`[Importer] Decreased sprite width to ${cutterWidth}`);
                    }
                    break;
                case '8': // Numpad 8 - Decrease height
                case 'Numpad8':
                    e.preventDefault();
                    // Ensure we don't go below minimum height
                    if (cutterHeight > step) {
                        cutterHeight -= step;
                        // Update sprite height input
                        if (spriteHeightInput) {
                            spriteHeightInput.value = cutterHeight.toString();
                        }
                        didResize = true;
                        console.log(`[Importer] Decreased sprite height to ${cutterHeight}`);
                    }
                    break;
                case '5': // Numpad 5 - Increase height
                case 'Numpad5':
                case '2': // Also allow Numpad 2 for more intuitive up/down control
                case 'Numpad2':
                    e.preventDefault();
                    // Ensure we can increase height within bounds
                    if (selectionRect.y + cutterHeight + step <= sourceHeight) {
                        cutterHeight += step;
                        // Update sprite height input
                        if (spriteHeightInput) {
                            spriteHeightInput.value = cutterHeight.toString();
                        }
                        didResize = true;
                        console.log(`[Importer] Increased sprite height to ${cutterHeight}`);
                    }
                    break;
                    
                // Additional helpful commands
                case 'c': // C key - Center the selection in current view
                case 'C':
                    e.preventDefault();
                    // Center the selection in the current view
                    const centerX = Math.floor(sourceWidth / 2 - cutterWidth / 2);
                    const centerY = Math.floor(sourceHeight / 2 - cutterHeight / 2);
                    // Ensure we stay in bounds
                    selectionRect.x = Math.max(0, Math.min(sourceWidth - cutterWidth, centerX));
                    selectionRect.y = Math.max(0, Math.min(sourceHeight - cutterHeight, centerY));
                    lastValidSelectionRect.x = selectionRect.x;
                    lastValidSelectionRect.y = selectionRect.y;
                    didMove = true;
                    console.log(`[Importer] Centered selection at (${selectionRect.x}, ${selectionRect.y})`);
                    break;
                case 'a': // A key - Add current selection to list
                case 'A':
                    e.preventDefault();
                    if (addSelectionButton) {
                        addSelectionButton.click();
                        console.log('[Importer] Added selection via A key');
                    }
                    break;
                case 's': // S key - Square selection (make width = height)
                case 'S':
                    e.preventDefault();
                    // Make width = height for square sprite
                    cutterWidth = cutterHeight;
                    if (spriteWidthInput) {
                        spriteWidthInput.value = cutterWidth.toString();
                    }
                    didResize = true;
                    console.log(`[Importer] Made selection square: ${cutterWidth}x${cutterHeight}`);
                    break;
                
                // Grid dimension controls
                case '*': // Numpad * - Increase grid width/height
                case 'NumpadMultiply':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Increase grid height
                        cutterGridH = Math.min(16, cutterGridH + 1);
                        if (cutterGridHeightInput) {
                            cutterGridHeightInput.value = cutterGridH.toString();
                        }
                        console.log(`[Importer] Increased grid height to ${cutterGridH}`);
                    } else {
                        // Increase grid width
                        cutterGridW = Math.min(16, cutterGridW + 1);
                        if (cutterGridWidthInput) {
                            cutterGridWidthInput.value = cutterGridW.toString();
                        }
                        console.log(`[Importer] Increased grid width to ${cutterGridW}`);
                    }
                    didResize = true;
                    break;
                case '/': // Numpad / - Decrease grid width/height
                case 'NumpadDivide':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Decrease grid height
                        cutterGridH = Math.max(1, cutterGridH - 1);
                        if (cutterGridHeightInput) {
                            cutterGridHeightInput.value = cutterGridH.toString();
                        }
                        console.log(`[Importer] Decreased grid height to ${cutterGridH}`);
                    } else {
                        // Decrease grid width
                        cutterGridW = Math.max(1, cutterGridW - 1);
                        if (cutterGridWidthInput) {
                            cutterGridWidthInput.value = cutterGridW.toString();
                        }
                        console.log(`[Importer] Decreased grid width to ${cutterGridW}`);
                    }
                    didResize = true;
                    break;
                case 'Enter':
                case ' ': // Space bar
                    e.preventDefault();
                    // Capture current selection
                    rectToAdd = { ...lastValidSelectionRect };
                    console.log('[Importer] Captured selection rect via keyboard:', JSON.stringify(rectToAdd));
                    updatePreview(rectToAdd);
                    updatePalettePreview(rectToAdd);
                    
                    // Trigger the selection flash effect
                    startSelectionFlash();
                    
                    selectionInfoDiv.textContent += ' - Ready to Add'; // Update status text
                    didCapture = true;
                    
                    // If shift is pressed, also add to sprite list
                    if (e.shiftKey && addSelectionButton) {
                        addSelectionButton.click();
                        console.log('[Importer] Auto-added selection from keyboard capture + shift');
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Cancel current capture
                    rectToAdd = null;
                    if (selectionInfoDiv.textContent.endsWith(' - Ready to Add')) {
                        selectionInfoDiv.textContent = selectionInfoDiv.textContent.replace(' - Ready to Add', '');
                    }
                    console.log('[Importer] Cancelled selection capture');
                    break;
            }
            
            if (didMove || didResize) {
                // Make sure we update the size of the selection rectangle too
                selectionRect.w = cutterWidth;
                selectionRect.h = cutterHeight;
                lastValidSelectionRect.w = cutterWidth;
                lastValidSelectionRect.h = cutterHeight;
                
                redrawSourceCanvas();
                updateSelectionInfo();
                
                // If anything changed, update the preview
                    updatePreview(lastValidSelectionRect);
                    updatePalettePreview(lastValidSelectionRect);
            }
        });

        // Listener for the Load Target Palette button (always enabled now)
        if (loadTargetPaletteButton) {
            loadTargetPaletteButton.addEventListener('click', () => {
                vscode.postMessage({ command: 'loadTargetPalette' });
            });
        }

        // Click on Source Canvas: Captures the current selection into rectToAdd
        sourceCanvas.addEventListener('click', (e) => { 
             if (!sourceImageData || e.button !== 0) return;
             
             // Get custom sprite dimensions
             const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
             const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
             
             // Update cutter dimensions to match custom sprite dimensions
             cutterWidth = customWidth;
             cutterHeight = customHeight;
             
             // Update the selection rect with custom dimensions
             selectionRect.w = cutterWidth;
             selectionRect.h = cutterHeight;
             
             // Check if the position under the cursor is valid before capturing
             if (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0) {
                 // Make sure last valid rect has the right dimensions
                 lastValidSelectionRect.w = cutterWidth;
                 lastValidSelectionRect.h = cutterHeight;
                 
                 // Capture a *copy* of the last valid rect
                 rectToAdd = { ...lastValidSelectionRect }; 
                 console.log('[Importer] Captured selection rect on click:', JSON.stringify(rectToAdd));
                 // Update UI to indicate selection is ready (optional)
                 // e.g., addSelectionButton.textContent = "Add Captured Selection"; 
                 //      addSelectionButton.style.border = "1px solid var(--vscode-focusBorder)";
                 selectionInfoDiv.textContent += ' - Ready to Add'; // Update status text
                 
                 // Update preview/palette based on this *captured* click position
                 updatePreview(rectToAdd);
                 updatePalettePreview(rectToAdd);
             } else {
                 console.warn('[Importer] Click ignored, last valid rect has no size.');
                 rectToAdd = null; // Ensure nothing is captured
             }
        });

        // Add Selection Button: Uses the captured rectToAdd
        if (addSelectionButton) {
            addSelectionButton.addEventListener('click', () => {
                // Use the rect captured by the last click (top-left of the grid)
                if (!rectToAdd || rectToAdd.w <= 0 || rectToAdd.h <= 0 || !previewCanvas) {
                    vscode.postMessage({ command: 'showError', text: 'Cannot add: Please click on the image first to capture a selection.'});
                    return;
                }

                // Get custom sprite dimensions
                const customWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
                const customHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
                
                // Update cutter dimensions to match custom sprite dimensions
                cutterWidth = customWidth;
                cutterHeight = customHeight;

                // Get the current grid dimensions
                const gridW = cutterGridW; // Use state variable
                const gridH = cutterGridH; // Use state variable
                const baseRect = { ...rectToAdd }; // Top-left rect captured by click
                
                // Make sure the base rect has the correct dimensions
                baseRect.w = cutterWidth;
                baseRect.h = cutterHeight;

                console.log(`[Importer] Adding ${gridW}x${gridH} grid starting at (${baseRect.x}, ${baseRect.y}) with sprite size ${cutterWidth}x${cutterHeight}`);

                // Loop through grid cells and add each sprite's rect
                for (let row = 0; row < gridH; row++) {
                    for (let col = 0; col < gridW; col++) {
                        const spriteX = Math.floor(baseRect.x + col * baseRect.w);
                        const spriteY = Math.floor(baseRect.y + row * baseRect.h);

                        // Basic boundary check (optional but good practice)
                        if (spriteX + baseRect.w > sourceWidth || spriteY + baseRect.h > sourceHeight) {
                             console.warn(`Skipping sprite at grid pos (${col},${row}) - out of image bounds.`);
                             continue; 
                        }

                        const calculatedRect = {
                            x: spriteX,
                            y: spriteY,
                            w: baseRect.w, // Use base cutter width/height
                            h: baseRect.h
                        };

                        // --- Log path just before adding --- 
                        console.log(`[Importer] Storing sprite with sourceFsPath: ${currentSourceImageFsPath}`);

                        // --- Generate Preview Data URL --- 
                        let previewUrl = null;
                        const previewSize = 32; 
                        const miniCanvas = document.createElement('canvas');
                        miniCanvas.width = previewSize;
                        miniCanvas.height = previewSize;
                        const miniCtx = miniCanvas.getContext('2d');

                        if (miniCtx && offscreenSourceCanvas) {
                            miniCtx.imageSmoothingEnabled = false;
                            miniCtx.drawImage(
                                offscreenSourceCanvas,
                                calculatedRect.x, calculatedRect.y, calculatedRect.w, calculatedRect.h, // Source rect
                                0, 0, previewSize, previewSize // Dest rect (scaled)
                            );
                            previewUrl = miniCanvas.toDataURL(); // Capture as Data URL
                            console.log(`[Importer] Generated previewUrl (first 100 chars):`, previewUrl?.substring(0, 100));
                        } else {
                             console.warn('Could not generate preview for sprite list item.');
                        }
                        // --- End Preview Generation ---

                        // Add rect to list (now with both source path and preview URL)
                        selectedSpriteList.push({
                            rect: calculatedRect, 
                            previewUrl: previewUrl, // Store the generated URL (or null)
                            sourceFsPath: currentSourceImageFsPath // Store the source path too!
                        });
                    }
                }
                
                renderSpriteList(); // Update the UI list
                
                // Clear the captured rect state
                rectToAdd = null;
                // Reset UI indication (optional)
                // addSelectionButton.textContent = "Add Selection to List";
                // addSelectionButton.style.border = ""; 
                // Remove the "Ready to Add" text?
                 if (selectionInfoDiv.textContent.endsWith(' - Ready to Add')) {
                     selectionInfoDiv.textContent = selectionInfoDiv.textContent.replace(' - Ready to Add', '');
                 }
            });
        }

        // --- Grid Width/Height Input Listeners --- 
        if (cutterGridWidthInput) {
            cutterGridWidthInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 16) val = 16; // Add a reasonable max?
                cutterGridW = val;
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Cutter Grid Width set to: ${cutterGridW}`);
                // No redraw needed here, only affects selection box drawing/adding logic
            });
        }
         if (cutterGridHeightInput) {
            cutterGridHeightInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 16) val = 16; // Add a reasonable max?
                cutterGridH = val;
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Cutter Grid Height set to: ${cutterGridH}`);
                // No redraw needed here
            });
        }

        // --- NEW: Save Extracted Palette Button --- 
        if (saveExtractedPaletteButton) {
            saveExtractedPaletteButton.addEventListener('click', () => {
                if (!currentExtractedPaletteHex || currentExtractedPaletteHex.length === 0) {
                    vscode.postMessage({ command: 'showError', text: 'No palette extracted from current selection.'});
                    return;
                }
                console.log(`[Importer] Requesting save for ${currentExtractedPaletteHex.length} extracted colors.`);
                vscode.postMessage({
                    command: 'saveExtractedPalette',
                    paletteHex: currentExtractedPaletteHex
                });
            });
        }

        // --- Source Grid Control Listeners --- 
        if (showSourceGridCheckbox) {
            showSourceGridCheckbox.addEventListener('change', (e) => {
                showSourceGrid = (e.target).checked;
                console.log('[Importer] Show Source Grid set to:', showSourceGrid);
                redrawSourceCanvas(); // Redraw to show/hide grid
            });
        }
        if (gridCellWidthInput) {
             gridCellWidthInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 8) val = 8; // Min 8?
                if (val > 128) val = 128; // Max 128?
                gridCellW = val;
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Grid Cell Width set to: ${gridCellW}`);
                if(showSourceGrid) redrawSourceCanvas(); // Redraw if grid is visible
            });
        }
        if (gridCellHeightInput) {
             gridCellHeightInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 8) val = 8; // Min 8?
                if (val > 128) val = 128; // Max 128?
                gridCellH = val;
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Grid Cell Height set to: ${gridCellH}`);
                if(showSourceGrid) redrawSourceCanvas(); // Redraw if grid is visible
            });
        }

        // --- Clear Sprite List Button Listener --- 
        if (clearSpriteListButton) {
            clearSpriteListButton.addEventListener('click', () => {
                console.log('[Importer] Requesting sprite list clear.');
                selectedSpriteList = [];
                renderSpriteList();
            });
        }

        // --- Load New Image Button Listener --- 
        if (loadNewImageButton) {
            loadNewImageButton.addEventListener('click', () => {
                console.log('[Importer] Requesting new image load.');
                vscode.postMessage({ command: 'loadImageRequest' });
            });
        }

        // --- Preview Grid Checkbox Listener --- 
        if (showPreviewGridCheckbox) {
            showPreviewGridCheckbox.addEventListener('change', (e) => {
                showPreviewGrid = e.target.checked;
                console.log('[Importer] Show Preview Grid set to:', showPreviewGrid);
                // Redraw preview if a selection exists
                if (rectToAdd || (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0)) {
                    updatePreview(rectToAdd || lastValidSelectionRect);
                }
            });
        }

        // Add Block Capture Mode UI and functionality
        const blockCaptureDiv = document.createElement('div');
        blockCaptureDiv.className = 'control-group';
        blockCaptureDiv.innerHTML = `
            <input type="checkbox" id="blockCaptureMode">
            <label for="blockCaptureMode">Block Capture Mode</label>
            <div id="blockCaptureModeHelp" style="font-size: 0.8em; margin-top: 3px; color: #888;">
                Use arrows to move, Space to capture, Tab to auto-capture and advance
            </div>
        `;
        
        // Insert after grid controls
        const controlsDiv = document.getElementById('output-options');
        if (controlsDiv) {
            controlsDiv.appendChild(blockCaptureDiv);
        }

        // Reference the new control
        const blockCaptureModeCheckbox = document.getElementById('blockCaptureMode');
        if (blockCaptureModeCheckbox) {
            blockCaptureModeCheckbox.addEventListener('change', (e) => {
                blockCaptureMode = e.target.checked;
                console.log(`[Importer] Block Capture Mode ${blockCaptureMode ? 'enabled' : 'disabled'}`);
                if (blockCaptureMode) {
                    sourceCanvas.focus();
                    selectionInfoDiv.textContent += ' - Block Capture Mode Active';
                } else {
                    selectionInfoDiv.textContent = selectionInfoDiv.textContent.replace(' - Block Capture Mode Active', '');
                }
            });
        }

        // Add block preview checkbox
        const blockPreviewCheck = document.createElement('div');
        blockPreviewCheck.className = 'control-group';
        blockPreviewCheck.innerHTML = `
            <input type="checkbox" id="showBlockPreview">
            <label for="showBlockPreview">Show Block Grid Preview</label>
        `;
        
        // Insert before the selectionInfo div in the preview area
        const previewArea = document.getElementById('preview-area');
        if (previewArea) {
            const selectionInfoDiv = document.getElementById('selectionInfo');
            if (selectionInfoDiv) {
                previewArea.insertBefore(blockPreviewCheck, selectionInfoDiv);
            } else {
                previewArea.appendChild(blockPreviewCheck);
            }
        }

        // Get reference to the checkbox and add event listener
        const showBlockPreviewCheckbox = document.getElementById('showBlockPreview');
        if (showBlockPreviewCheckbox) {
            showBlockPreviewCheckbox.addEventListener('change', (e) => {
                showBlockPreview = e.target.checked;
                console.log(`[Importer] Block Preview ${showBlockPreview ? 'enabled' : 'disabled'}`);
                // Update the preview if we have a selection
                if (rectToAdd || (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0)) {
                    updatePreview(rectToAdd || lastValidSelectionRect);
                }
            });
        }

        // --- NEW: Sprite Size Input Listeners --- 
        if (spriteWidthInput) {
            spriteWidthInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 1) val = 16;
                if (val > 256) val = 256; // Set reasonable maximum
                
                // Update cutter width if it matches the sprite width
                if (cutterWidth === 16 || cutterWidth === parseInt(spriteWidthInput.value, 10)) {
                    cutterWidth = val;
                    console.log(`[Importer] Cutter width automatically updated to match sprite width: ${cutterWidth}`);
                }
                
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Sprite width set to: ${val}`);
                
                // Also update preview based on current selection
                if (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0) {
                    updatePreview(lastValidSelectionRect);
                }
            });
        }
        
        if (spriteHeightInput) {
            spriteHeightInput.addEventListener('change', (e) => {
                let val = parseInt((e.target).value, 10);
                if (isNaN(val) || val < 1) val = 16;
                if (val > 256) val = 256; // Set reasonable maximum
                
                // Update cutter height if it matches the sprite height
                if (cutterHeight === 16 || cutterHeight === parseInt(spriteHeightInput.value, 10)) {
                    cutterHeight = val;
                    console.log(`[Importer] Cutter height automatically updated to match sprite height: ${cutterHeight}`);
                }
                
                (e.target).value = val.toString(); // Update input if changed
                console.log(`[Importer] Sprite height set to: ${val}`);
                
                // Also update preview based on current selection
                if (lastValidSelectionRect.w > 0 && lastValidSelectionRect.h > 0) {
                    updatePreview(lastValidSelectionRect);
                }
            });
        }
        
        if (saveActualSizeCheckbox) {
            saveActualSizeCheckbox.addEventListener('change', (e) => {
                console.log(`[Importer] Save actual size set to: ${(e.target).checked}`);
            });
        }
    }

    // --- Initialize UI ---
    function initializeUI() {
        console.log('[Importer] Initializing UI');
        
        // Get initial sprite size values
        if (spriteWidthInput && spriteHeightInput) {
            const initialWidth = parseInt(spriteWidthInput.value, 10) || 16;
            const initialHeight = parseInt(spriteHeightInput.value, 10) || 16;
            
            // Set initial cutter dimensions
            cutterWidth = initialWidth;
            cutterHeight = initialHeight;
            
            console.log(`[Importer] Initial sprite size set to: ${cutterWidth}x${cutterHeight}`);
        }
        
        // Set up help modal
        setupHelpModal();
        
        // Set up the events for mouse and keyboard interaction
        setupEventListeners();
        
        // Setup the conversion modal
        console.log('[Importer] Setting up conversion modal from initializeUI');
        setupConversionModal();
    }

    // --- Set up help modal ---
    function setupHelpModal() {
        const helpButton = document.getElementById('helpButton');
        const helpModal = document.getElementById('keyboardHelpModal');
        const closeHelpButton = document.getElementById('closeHelpButton');
        
        if (helpButton && helpModal) {
            // Show modal when help button is clicked
            helpButton.addEventListener('click', () => {
                helpModal.style.display = 'block';
            });
            
            // Hide modal when close button is clicked
            if (closeHelpButton) {
                closeHelpButton.addEventListener('click', () => {
                    helpModal.style.display = 'none';
                });
            }
            
            // Hide modal when clicking outside of it
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.style.display = 'none';
                }
            });
            
            // Add keyboard shortcut (F1 or ?) to toggle help
            document.addEventListener('keydown', (e) => {
                // F1 key or ? key (with or without shift)
                if (e.key === 'F1' || e.key === '?' || e.key === '/') {
                    e.preventDefault();
                    // Toggle visibility
                    helpModal.style.display = helpModal.style.display === 'none' ? 'block' : 'none';
                } else if (e.key === 'Escape' && helpModal.style.display === 'block') {
                    // Close with Escape if modal is open
                    helpModal.style.display = 'none';
                }
            });
            
            console.log('[Importer] Help modal initialized. Press F1 or ? to show/hide.');
        }
    }

    // --- Import *Sheet* Button --- 
    importSheetButton.addEventListener('click', () => {
        if (selectedSpriteList.length === 0) {
            vscode.postMessage({ command: 'showError', text: 'Please add at least one sprite selection to the list.'});
            return;
        }
        
        const selectedFormat = outputFormatSelect ? outputFormatSelect.value : 'spr';
        const selectedBitDepth = outputBitDepthSelect ? parseInt(outputBitDepthSelect.value, 10) : 8;
        
        if (selectedBitDepth === 4 && (!loadedTargetPaletteHex || loadedTargetPaletteHex.length < 16)) {
            vscode.postMessage({ command: 'showError', text: 'Please load a target palette with at least 16 colors for 4-bit import.'});
            return;
        }

        const outputOptions = {
            format: selectedFormat,
            bitDepth: selectedBitDepth,
            targetPalette: loadedTargetPaletteHex
        };

        // Get custom sprite size values
        const spriteWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
        const spriteHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
        const saveActualSize = saveActualSizeCheckbox ? saveActualSizeCheckbox.checked : true;

        // Send the full list items (including rect, sourceFsPath, previewUrl)
        console.log(`[Importer] Exporting ${selectedSpriteList.length} sprites with size ${spriteWidth}x${spriteHeight}, Save actual size: ${saveActualSize}...`);
        vscode.postMessage({
            command: 'importSprites',
            data: {
                selections: selectedSpriteList, // Send full array
                options: outputOptions,
                // Include sprite size parameters
                spriteWidth: spriteWidth,
                spriteHeight: spriteHeight,
                saveActualSize: saveActualSize
                // No pixel data sent from webview anymore
            }
        });
    });

    // --- Export Block Button --- 
    const exportBlockButton = document.createElement('button');
    exportBlockButton.id = 'exportBlockButton';
    exportBlockButton.textContent = 'Export as Block';
    document.getElementById('actions').appendChild(exportBlockButton);

    exportBlockButton.addEventListener('click', () => {
        if (selectedSpriteList.length === 0) {
            vscode.postMessage({ command: 'showError', text: 'Please add at least one sprite selection to the list.'});
            return;
        }
        
        const selectedFormat = outputFormatSelect ? outputFormatSelect.value : 'spr';
        const selectedBitDepth = outputBitDepthSelect ? parseInt(outputBitDepthSelect.value, 10) : 8;
        
        if (selectedBitDepth === 4 && (!loadedTargetPaletteHex || loadedTargetPaletteHex.length < 16)) {
            vscode.postMessage({ command: 'showError', text: 'Please load a target palette with at least 16 colors for 4-bit import.'});
            return;
        }

        const outputOptions = {
            format: selectedFormat,
            bitDepth: selectedBitDepth,
            targetPalette: loadedTargetPaletteHex
        };

        // Get custom sprite size values
        const spriteWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
        const spriteHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
        const saveActualSize = saveActualSizeCheckbox ? saveActualSizeCheckbox.checked : true;

        // Send the full list items with grid dimensions and sprite size information
        console.log(`[Importer] Exporting ${selectedSpriteList.length} sprites as block with size ${spriteWidth}x${spriteHeight}, Save actual size: ${saveActualSize}...`);
        vscode.postMessage({
            command: 'exportAsBlock',
            data: {
                selections: selectedSpriteList,
                gridWidth: cutterGridW,
                gridHeight: cutterGridH,
                options: outputOptions,
                spriteWidth: spriteWidth,
                spriteHeight: spriteHeight,
                saveActualSize: saveActualSize
            }
        });
    });

    // Run initial setup
    initializeUI();

    // --- Message Handling ---
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('[Importer] Received message:', message);
        switch (message.command) {
            case 'loadImageData':
                console.log('[Importer] Raw loadImageData message received:', message);
                if (message.data && message.data.width && message.data.height && message.data.pixelDataBase64) {
                    loadImageFromPixelData(
                        message.data.width, 
                        message.data.height, 
                        message.data.pixelDataBase64, 
                        message.data.currentImageFsPath
                    );
                }
                break;
            case 'showError':
                if (message.text) {
                    displayErrorMessage(message.text);
                }
                break;
            case 'showBmpConverterButton':
                // Show BMP converter button when image is BMP
                if (document.getElementById('convertToPngButton')) {
                    document.getElementById('convertToPngButton').style.display = 'inline-block';
                }
                if (message.text) {
                    // Display optional warning
                    displayWarningMessage(message.text);
                }
                break;
            case 'updateTargetPalette':
                // Handle palette update for both normal targeting and conversion
                if (message.paletteHex && Array.isArray(message.paletteHex)) {
                    // Update regular target palette
                    loadedTargetPaletteHex = message.paletteHex;
                    targetPaletteFilename = message.filename || '';
                    // Also store for conversion modal
                    loadedConversionPalette = message.paletteHex;
                    
                    // Update UI
                    const targetInfo = document.getElementById('targetPaletteInfo');
                    if (targetInfo) {
                        targetInfo.textContent = message.filename ? 
                            `Loaded: ${message.filename} (${message.paletteHex.length} colors)` : 
                            `Loaded palette (${message.paletteHex.length} colors)`;
                    }
                    
                    // Update conversion modal palette info if visible
                    const paletteSelection = document.getElementById('paletteSelection');
                    if (paletteSelection && paletteSelection.value === 'loaded') {
                        const conversionPaletteInfo = document.getElementById('conversionPaletteInfo');
                        if (conversionPaletteInfo) {
                            conversionPaletteInfo.textContent = message.filename ? 
                                `Using loaded palette: ${message.filename} (${message.paletteHex.length} colors)` : 
                                `Using loaded palette (${message.paletteHex.length} colors)`;
                        }
                    }
                    
                    console.log(`[Importer] Updated target palette (count: ${message.paletteHex.length})`);
                }
                break;
            case 'previewGenerated':
                console.log('[Importer] Backend preview generated');
                handleBackendPreview(message.previewData, message.width, message.height);
                break;
            case 'previewError':
                console.error('[Importer] Backend preview error:', message.error);
                const previewInfo = document.getElementById('conversionPreviewInfo');
                if (previewInfo) {
                    previewInfo.textContent = `Preview generation failed: ${message.error}`;
                }
                break;
        }
    });

    // Handler for backend-generated Sharp previews
    function handleBackendPreview(previewBase64, width, height) {
        console.log(`[Importer] Handling backend preview: ${width}x${height}`);
        
        const previewCanvas = document.getElementById('conversionPreviewCanvas');
        const previewInfo = document.getElementById('conversionPreviewInfo');
        const ctx = previewCanvas.getContext('2d');
        
        // Create an image from the base64 data
        const img = new Image();
        img.onload = function() {
            console.log(`[Importer] Backend preview image loaded: ${img.width}x${img.height}`);
            
            // Calculate preview dimensions with 640x256 aspect ratio correction
            const maxPreviewSize = 400;
            const is640x256Mode = width === 640 && height === 256;
            const effectiveHeight = is640x256Mode ? height * 2 : height; // Double height for 640x256
            
            const aspectRatio = width / effectiveHeight;
            let previewWidth, previewHeight;
            
            if (aspectRatio > 1) {
                previewWidth = Math.min(maxPreviewSize, width);
                previewHeight = previewWidth / aspectRatio;
            } else {
                previewHeight = Math.min(maxPreviewSize, effectiveHeight);
                previewWidth = previewHeight * aspectRatio;
            }
            
            // Set canvas size
            previewCanvas.width = previewWidth;
            previewCanvas.height = previewHeight;
            
            // Clear canvas
            ctx.clearRect(0, 0, previewWidth, previewHeight);
            
            if (is640x256Mode) {
                // For 640x256, draw each row twice to get the correct 4:3 aspect ratio
                ctx.imageSmoothingEnabled = false;
                const rowHeight = previewHeight / (height * 2);
                
                for (let row = 0; row < height; row++) {
                    const sourceY = row;
                    const destY1 = row * 2 * rowHeight; // First copy of the row
                    const destY2 = (row * 2 + 1) * rowHeight; // Second copy of the row
                    
                    // Draw the same row twice (double height)
                    ctx.drawImage(
                        img,
                        0, sourceY, width, 1, // Source: full width, 1 pixel height
                        0, destY1, previewWidth, rowHeight // Destination: first copy
                    );
                    ctx.drawImage(
                        img,
                        0, sourceY, width, 1, // Source: full width, 1 pixel height
                        0, destY2, previewWidth, rowHeight // Destination: second copy
                    );
                }
            } else {
                // Standard drawing
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
            }
            
            // Update preview info
            previewInfo.textContent = `Sharp-quantized preview: ${width}x${height}, 4-bit with dithering`;
            console.log('[Importer] Backend preview rendered successfully');
        };
        
        img.onerror = function() {
            console.error('[Importer] Failed to load backend preview image');
            previewInfo.textContent = 'Failed to load preview image';
        };
        
        // Load the base64 image
        img.src = `data:image/png;base64,${previewBase64}`;
    }

    // Request image data when webview loads
    vscode.postMessage({ command: 'getImageData' });
    console.log('[Importer] Webview script initialized and requested image data.');

    // Add this helper function
    function updateSelectionInfo() {
        const spriteWidth = spriteWidthInput ? parseInt(spriteWidthInput.value, 10) : 16;
        const spriteHeight = spriteHeightInput ? parseInt(spriteHeightInput.value, 10) : 16;
        const saveActualSize = saveActualSizeCheckbox ? saveActualSizeCheckbox.checked : true;
        
        const spriteInfo = (spriteWidth !== 16 || spriteHeight !== 16) ? 
            `, Sprite Size: ${spriteWidth}x${spriteHeight}${!saveActualSize ? ' (will pad to 16px)' : ''}` : 
            '';
            
        selectionInfoDiv.textContent = `Area: X=${Math.floor(selectionRect.x)}, Y=${Math.floor(selectionRect.y)}, W=${cutterWidth}, H=${cutterHeight}${spriteInfo}`;
    }

    // --- NEW: Image Conversion Functions and Variables ---
    let conversionPalette = null;
    let conversionPreviewData = null;
    let loadedConversionPalette = null; // Store loaded conversion palette
    
    // Get the current conversion options from the UI
    function getConversionOptions() {
        // Get resolution
        const width = parseInt(document.getElementById('conversionWidth').value, 10) || 256;
        const height = parseInt(document.getElementById('conversionHeight').value, 10) || 192;
        
        // Get bit depth
        const bitDepth = parseInt(document.getElementById('conversionBitDepth').value, 10) || 8;
        
        // Get palette type
        const paletteType = document.getElementById('paletteSelection').value || 'default';
        
        // Get dithering option
        const dithering = document.getElementById('conversionDithering').value || 'none';
        
        // Get append palette option
        const appendPalette = document.getElementById('appendPalette') ? 
            document.getElementById('appendPalette').checked : 
            false;
            
        // Get prefix palette option
        const prefixPalette = document.getElementById('prefixPalette') ? 
            document.getElementById('prefixPalette').checked : 
            false;
            
        return {
            width,
            height,
            bitDepth,
            paletteType,
            dithering,
            appendPalette,
            prefixPalette
        };
    }
    
    // Function to generate a default palette
    function generateDefaultPalette() {
        // For 8-bit, generate a 256-color palette
        // This is a simple RGB332 palette
        const palette = [];
        
        // Generate RGB332 palette (3 bits red, 3 bits green, 2 bits blue)
        for (let r = 0; r < 8; r++) {
            for (let g = 0; g < 8; g++) {
                for (let b = 0; b < 4; b++) {
                    // Convert 3-3-2 bits to 8-bit RGB components
                    const red = Math.round(r * 255 / 7);
                    const green = Math.round(g * 255 / 7);
                    const blue = Math.round(b * 255 / 3);
                    
                    // Convert to hex
                    const hexR = red.toString(16).padStart(2, '0');
                    const hexG = green.toString(16).padStart(2, '0');
                    const hexB = blue.toString(16).padStart(2, '0');
                    
                    palette.push(`#${hexR}${hexG}${hexB}`);
                }
            }
        }
        
        return palette;
    }
    
    // Function to simulate palette reduction for preview with improved color matching
    function simulatePaletteReduction(imageData, palette, bitDepth, ditheringMethod) {
        const { width, height, data } = imageData;
        const result = new ImageData(width, height);
        
        // Create a lookup function to find the nearest color in the palette
        const findNearestColor = (r, g, b) => {
            // Limit palette size based on bit depth
            const maxColors = bitDepth === 4 ? 16 : 256;
            const paletteSize = Math.min(palette.length, maxColors);
            
            // For optimized search, first try an exact match
            for (let i = 0; i < paletteSize; i++) {
                const color = palette[i];
                
                // Parse hex color
                const pr = parseInt(color.substring(1, 3), 16);
                const pg = parseInt(color.substring(3, 5), 16);
                const pb = parseInt(color.substring(5, 7), 16);
                
                // Check for exact match
                if (r === pr && g === pg && b === pb) {
                    return {
                        r: pr,
                        g: pg,
                        b: pb,
                        index: i
                    };
                }
            }
            
            // No exact match found, do distance calculation
            let minDistance = Infinity;
            let nearestIndex = 0;
            
            for (let i = 0; i < paletteSize; i++) {
                const color = palette[i];
                
                // Parse hex color
                const pr = parseInt(color.substring(1, 3), 16);
                const pg = parseInt(color.substring(3, 5), 16);
                const pb = parseInt(color.substring(5, 7), 16);
                
                // Use improved perceptual color distance
                // CIE-Lab based approach (approximation)
                const rWeight = 0.299;
                const gWeight = 0.587;
                const bWeight = 0.114;
                
                // Calculate luminance difference (weighted more heavily)
                const luminance1 = r * rWeight + g * gWeight + b * bWeight;
                const luminance2 = pr * rWeight + pg * gWeight + pb * bWeight;
                const lumDiff = luminance1 - luminance2;
                
                // Calculate weighted Euclidean distance
                // More sensitive to differences in red and green than blue (human eye sensitivity)
                const rDiff = r - pr;
                const gDiff = g - pg;
                const bDiff = b - pb;
                
                const distance = 
                    (rDiff * rDiff * 0.3) + 
                    (gDiff * gDiff * 0.59) + 
                    (bDiff * bDiff * 0.11) + 
                    (lumDiff * lumDiff * 0.5); // Extra weight for luminance difference
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }
            
            // Return the nearest color
            const nearestColor = palette[nearestIndex];
            return {
                r: parseInt(nearestColor.substring(1, 3), 16),
                g: parseInt(nearestColor.substring(3, 5), 16),
                b: parseInt(nearestColor.substring(5, 7), 16),
                index: nearestIndex
            };
        };
        
        // Ordered dither matrix 4x4 (Bayer matrix)
        const bayerMatrix = [
            [ 0, 8, 2, 10],
            [12, 4, 14, 6],
            [ 3, 11, 1, 9],
            [15, 7, 13, 5]
        ];
        
        // Dither intensity - adjustable for better quality
        const orderedDitherIntensity = bitDepth === 4 ? 32 : 24; // Higher for 4-bit mode
        
        // Process each pixel
        if (ditheringMethod === 'floydSteinberg' || ditheringMethod === 'sierra') {
            // Error diffusion dithering with error buffer
            const errorBuffer = new Float32Array(width * height * 3); // R,G,B error for each pixel
            
            for (let y = 0; y < height; y++) {
                // Serpentine processing for better dithering (alternate direction each row)
                const serpentine = ditheringMethod === 'sierra' && y % 2 === 1;
                
                for (let xDir = 0; xDir < width; xDir++) {
                    // Apply serpentine processing if enabled
                    const x = serpentine ? width - 1 - xDir : xDir;
                    
                    const idx = (y * width + x) * 4;
                    const errIdx = (y * width + x) * 3;
                    
                    // Get original color
                    let r = data[idx];
                    let g = data[idx + 1];
                    let b = data[idx + 2];
                    const a = data[idx + 3];
                    
                    // Apply stored error
                    r = Math.max(0, Math.min(255, Math.round(r + errorBuffer[errIdx])));
                    g = Math.max(0, Math.min(255, Math.round(g + errorBuffer[errIdx + 1])));
                    b = Math.max(0, Math.min(255, Math.round(b + errorBuffer[errIdx + 2])));
                    
                    // Find nearest color in palette
                    const nearest = findNearestColor(r, g, b);
                    
                    // Set the result pixel
                    result.data[idx] = nearest.r;
                    result.data[idx + 1] = nearest.g;
                    result.data[idx + 2] = nearest.b;
                    result.data[idx + 3] = a;
                    
                    // Calculate quantization error
                    const errR = r - nearest.r;
                    const errG = g - nearest.g;
                    const errB = b - nearest.b;
                    
                    // Distribute error to neighboring pixels based on the selected algorithm
                    if (ditheringMethod === 'floydSteinberg') {
                        // Floyd-Steinberg error distribution:
                        //     *   7
                        //   3 5 1
                        // (divide by 16)
                        if (!serpentine && x + 1 < width || serpentine && x > 0) {
                            // Right pixel (7/16) or Left pixel if serpentine
                            const nextX = serpentine ? x - 1 : x + 1;
                            errorBuffer[(y * width + nextX) * 3] += errR * 7 / 16;
                            errorBuffer[(y * width + nextX) * 3 + 1] += errG * 7 / 16;
                            errorBuffer[(y * width + nextX) * 3 + 2] += errB * 7 / 16;
                    }
                    
                    if (y + 1 < height) {
                        const nextRowIdx = ((y + 1) * width + x) * 3;
                        
                        // Bottom pixel (5/16)
                        errorBuffer[nextRowIdx] += errR * 5 / 16;
                        errorBuffer[nextRowIdx + 1] += errG * 5 / 16;
                        errorBuffer[nextRowIdx + 2] += errB * 5 / 16;
                        
                            if (!serpentine && x > 0 || serpentine && x + 1 < width) {
                                // Bottom-left (3/16) or Bottom-right if serpentine
                                const diagX = serpentine ? x + 1 : x - 1;
                                const diagIdx = ((y + 1) * width + diagX) * 3;
                                errorBuffer[diagIdx] += errR * 3 / 16;
                                errorBuffer[diagIdx + 1] += errG * 3 / 16;
                                errorBuffer[diagIdx + 2] += errB * 3 / 16;
                            }
                            
                            if (!serpentine && x + 1 < width || serpentine && x > 0) {
                                // Bottom-right (1/16) or Bottom-left if serpentine
                                const diagX = serpentine ? x - 1 : x + 1;
                                const diagIdx = ((y + 1) * width + diagX) * 3;
                                errorBuffer[diagIdx] += errR * 1 / 16;
                                errorBuffer[diagIdx + 1] += errG * 1 / 16;
                                errorBuffer[diagIdx + 2] += errB * 1 / 16;
                            }
                        }
                    } else if (ditheringMethod === 'sierra') {
                        // Sierra Lite error distribution (simpler version of Sierra):
                        //      *  2
                        //   1  1
                        // (divide by 4)
                        
                        // Right/Left pixel (2/4)
                        if (!serpentine && x + 1 < width || serpentine && x > 0) {
                            const nextX = serpentine ? x - 1 : x + 1;
                            errorBuffer[(y * width + nextX) * 3] += errR * 2 / 4;
                            errorBuffer[(y * width + nextX) * 3 + 1] += errG * 2 / 4;
                            errorBuffer[(y * width + nextX) * 3 + 2] += errB * 2 / 4;
                        }
                        
                        if (y + 1 < height) {
                            // Bottom-left/right pixel (1/4)
                            if (!serpentine && x > 0 || serpentine && x + 1 < width) {
                                const diagX = serpentine ? x + 1 : x - 1;
                                const diagIdx = ((y + 1) * width + diagX) * 3;
                                errorBuffer[diagIdx] += errR * 1 / 4;
                                errorBuffer[diagIdx + 1] += errG * 1 / 4;
                                errorBuffer[diagIdx + 2] += errB * 1 / 4;
                            }
                            
                            // Bottom pixel (1/4)
                            const nextRowIdx = ((y + 1) * width + x) * 3;
                            errorBuffer[nextRowIdx] += errR * 1 / 4;
                            errorBuffer[nextRowIdx + 1] += errG * 1 / 4;
                            errorBuffer[nextRowIdx + 2] += errB * 1 / 4;
                        }
                    }
                }
            }
        } else if (ditheringMethod === 'ordered') {
            // Ordered dithering (Bayer matrix)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Get original color
                    let r = data[idx];
                    let g = data[idx + 1];
                    let b = data[idx + 2];
                    const a = data[idx + 3];
                    
                    // Apply threshold map
                    const threshold = bayerMatrix[y % 4][x % 4] * orderedDitherIntensity / 16 - orderedDitherIntensity / 2;
                    r = Math.max(0, Math.min(255, r + threshold));
                    g = Math.max(0, Math.min(255, g + threshold));
                    b = Math.max(0, Math.min(255, b + threshold));
                    
                    // Find nearest color in palette
                    const nearest = findNearestColor(r, g, b);
                    
                    // Set the result pixel
                    result.data[idx] = nearest.r;
                    result.data[idx + 1] = nearest.g;
                    result.data[idx + 2] = nearest.b;
                    result.data[idx + 3] = a;
                }
            }
        } else {
            // No dithering - straight color mapping
            for (let i = 0; i < width * height * 4; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                const nearest = findNearestColor(r, g, b);
                
                result.data[i] = nearest.r;
                result.data[i + 1] = nearest.g;
                result.data[i + 2] = nearest.b;
                result.data[i + 3] = a;
            }
        }
        
        return result;
    }
    
    // Setup conversion modal functionality
    function setupConversionModal() {
        console.log('[Importer] Setting up conversion modal');
        
        const convertToNxiButton = document.getElementById('convertToNxiButton');
        console.log('[Importer] convertToNxiButton found:', !!convertToNxiButton);
        
        const nxiConversionModal = document.getElementById('nxiConversionModal');
        console.log('[Importer] nxiConversionModal found:', !!nxiConversionModal);
        
        const closeConversionButton = document.getElementById('closeConversionButton');
        console.log('[Importer] closeConversionButton found:', !!closeConversionButton);
        
        const conversionResolution = document.getElementById('conversionResolution');
        const customResolutionControls = document.getElementById('customResolutionControls');
        const conversionWidth = document.getElementById('conversionWidth');
        const conversionHeight = document.getElementById('conversionHeight');
        const paletteSelection = document.getElementById('paletteSelection');
        const loadPaletteForConversion = document.getElementById('loadPaletteForConversion');
        const conversionPaletteInfo = document.getElementById('conversionPaletteInfo');
        const previewConversionButton = document.getElementById('previewConversionButton');
        console.log('[Importer] previewConversionButton found:', !!previewConversionButton);
        
        const conversionPreviewCanvas = document.getElementById('conversionPreviewCanvas');
        console.log('[Importer] conversionPreviewCanvas found:', !!conversionPreviewCanvas);
        
        const conversionPreviewInfo = document.getElementById('conversionPreviewInfo');
        const applyConversionButton = document.getElementById('applyConversionButton');
        console.log('[Importer] applyConversionButton found:', !!applyConversionButton);
        
        // Try a direct approach by querying with document.querySelector
        const applyButtonBySelector = document.querySelector('#applyConversionButton');
        console.log('[Importer] applyButtonBySelector found:', !!applyButtonBySelector);
        
        // Open modal when button is clicked
        if (convertToNxiButton) {
            convertToNxiButton.addEventListener('click', () => {
                // Populate initial values based on current image
                if (sourceImageData) {
                    conversionWidth.value = sourceImageData.width;
                    conversionHeight.value = sourceImageData.height;
                }
                toggleConversionModal(true);
            });
        }
        
        // Close modal when close button is clicked
        if (closeConversionButton) {
            closeConversionButton.addEventListener('click', () => {
                toggleConversionModal(false);
            });
        }
        
        // Handle resolution dropdown changes
        if (conversionResolution) {
            conversionResolution.addEventListener('change', () => {
                const selection = conversionResolution.value;
                const isCustom = selection === 'custom';
                
                // Show/hide custom resolution controls
                customResolutionControls.style.display = isCustom ? 'block' : 'none';
                
                // Set width/height for standard resolutions
                if (!isCustom) {
                    const [w, h] = selection.split('x').map(Number);
                    conversionWidth.value = w;
                    conversionHeight.value = h;
                }
            });
        }
        
        // Handle palette loading
        if (loadPaletteForConversion) {
            loadPaletteForConversion.addEventListener('click', () => {
                vscode.postMessage({ command: 'loadTargetPalette' });
                // The palette will be sent back via a message
            });
        }
        
        // Handle bit depth changes (update UI and preview)
        const conversionBitDepth = document.getElementById('conversionBitDepth');
        if (conversionBitDepth) {
            conversionBitDepth.addEventListener('change', () => {
                const selectedBitDepth = conversionBitDepth.value;
                const paletteSelection = document.getElementById('paletteSelection');
                const conversionPaletteInfo = document.getElementById('conversionPaletteInfo');

                if (selectedBitDepth === '9') {
                    if (paletteSelection) paletteSelection.disabled = true;
                    if (conversionPaletteInfo) conversionPaletteInfo.textContent = 'Custom 9-bit palette (up to 256 colors) will be generated and appended.';
                } else {
                    if (paletteSelection) paletteSelection.disabled = false;
                    // Restore normal palette info text based on current paletteSelection value
                    if (paletteSelection && conversionPaletteInfo) {
                         updatePaletteInfoText(paletteSelection.value);
                    }
                }
                updateConversionPalette(); // This might trigger a preview update or prepare palette
            });
        }
        
        // Handle palette selection changes
        if (paletteSelection) {
            paletteSelection.addEventListener('change', () => {
                const selection = paletteSelection.value;
                
                // Enable/disable the load button based on selection
                loadPaletteForConversion.disabled = (selection !== 'loaded');
                
                // Update palette info text
                updatePaletteInfoText(selection);
                
                // Update the preview with the new palette
                updateConversionPalette();
            });
        }
        
        // Preview button functionality
        if (previewConversionButton) {
            previewConversionButton.addEventListener('click', () => {
                // Generate preview image
                previewConversion();
            });
        }
        
        // Apply conversion button functionality - NEW IMPLEMENTATION
        const applyButton = document.getElementById('applyConversionButton');
        if (applyButton) {
            console.log('[Importer] Found Apply button, adding event listener');
            applyButton.addEventListener('click', function() {
                console.log('[Importer] Apply button clicked');
                
                // Get conversion options
                const options = getConversionOptions();
                console.log('[Importer] Options:', options);
                
                // Add palette data if using loaded palette
                if (options.paletteType === 'loaded' && loadedConversionPalette) {
                    options.loadedPalette = loadedConversionPalette;
                }
                
                // Send the message to the extension
                console.log('[Importer] Sending convertImage message');
                vscode.postMessage({
                    command: 'convertImage',
                    options: options
                });
                
                // Close the modal
                toggleConversionModal(false);
            });
        } else {
            console.error('[Importer] Apply button not found');
        }
        
        // Function to update palette info text
        function updatePaletteInfoText(selection) {
            let infoText = '';
            
            switch(selection) {
                case 'default':
                    infoText = 'Using default ZX Next palette (256 colors)';
                    break;
                case 'grayscale':
                    infoText = 'Using grayscale palette';
                    break;
                case 'loaded':
                    infoText = loadedConversionPalette ? 
                        `Using loaded palette (${loadedConversionPalette.length} colors)` : 
                        'No palette loaded. Click "Load..." to select one.';
                    break;
            }
            
            if (conversionPaletteInfo) {
                conversionPaletteInfo.textContent = infoText;
            }
        }
        
        // Function to update the conversion palette based on user selections
        function updateConversionPalette() {
            const paletteType = paletteSelection.value;
            const bitDepth = parseInt(conversionBitDepth.value, 10);
            
            // Set initial palette info
            updatePaletteInfoText(paletteType);
            
            // We'll update the palette when preview is requested
        }
        
        // Initial UI setup
        updatePaletteInfoText(paletteSelection.value);
        // Trigger change event on bit depth to set initial state for 9-bit mode if selected by default (though 8-bit is default)
        if (conversionBitDepth) {
            conversionBitDepth.dispatchEvent(new Event('change'));
        }
    }
    
    // Generate a preview of the conversion with current settings
    function previewConversion() {
        if (!sourceImageData) {
            console.error('[Importer] Cannot generate preview: No source image data');
            return;
        }
        
        // Get conversion options from UI
        const options = getConversionOptions();
        
        const previewCanvas = document.getElementById('conversionPreviewCanvas');
        const previewInfo = document.getElementById('conversionPreviewInfo');
        const conversionPaletteInfo = document.getElementById('conversionPaletteInfo');
        
        if (!previewCanvas || !previewInfo) {
            console.error('[Importer] Preview elements not found');
            return;
        }
        
        const ctx = previewCanvas.getContext('2d');
        
        // Reset canvas
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Calculate the maximum preview size
        const maxPreviewWidth = 400;
        const maxPreviewHeight = 300;
        
        // Special handling for 640x256 mode: use backend Sharp quantization for best quality
        const is640x256Mode = options.width === 640 && options.height === 256;
        if (is640x256Mode && options.bitDepth === 4) {
            console.log('[Importer] Using backend Sharp quantization for 640x256 4-bit preview');
            
            // Send to backend for Sharp-based preview generation
            vscode.postMessage({
                command: 'generatePreview',
                options: options
            });
            
            // Show loading message
            previewInfo.textContent = 'Generating Sharp-quantized preview...';
            return;
        }
        
        // ZX Next pixels are twice as tall as they are wide in 640x256 mode
        let effectiveHeight = options.height;
        if (is640x256Mode) {
            effectiveHeight = options.height * 2; // Double height for correct aspect ratio
            console.log('[Importer] NXI Preview: 640x256 mode detected - doubling height for preview aspect ratio');
        }
        
        const aspectRatio = options.width / effectiveHeight;
        let previewWidth, previewHeight;
        
        if (aspectRatio > 1) {
            // Wider than tall
            previewWidth = Math.min(options.width, maxPreviewWidth);
            previewHeight = previewWidth / aspectRatio;
        } else {
            // Taller than wide or square
            previewHeight = Math.min(effectiveHeight, maxPreviewHeight);
            previewWidth = previewHeight * aspectRatio;
        }
        
        previewCanvas.width = previewWidth;
        previewCanvas.height = previewHeight;
        
        // Create a temporary canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = options.width;
        tempCanvas.height = options.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the source image onto the temporary canvas
        tempCtx.imageSmoothingEnabled = false;
        
        // Create the raw image data
        const imageData = new ImageData(options.width, options.height);
        
        // Extract the source image and resize/reposition as needed
        let sourceImage;
        
        // Create an offscreen canvas to hold the source image
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = sourceImageData.width;
        srcCanvas.height = sourceImageData.height;
        const srcCtx = srcCanvas.getContext('2d');
        
        // Create imageData for the source
        const srcImageData = srcCtx.createImageData(sourceImageData.width, sourceImageData.height);
        srcImageData.data.set(new Uint8ClampedArray(sourceImageData.data.buffer));
        srcCtx.putImageData(srcImageData, 0, 0);
        
        // Draw the source on the temp canvas
        tempCtx.drawImage(srcCanvas, 0, 0, sourceImageData.width, sourceImageData.height, 
                          0, 0, options.width, options.height);
        
        // Get the pixel data
        const tempImageData = tempCtx.getImageData(0, 0, options.width, options.height);
        
        // Get the palette to use
        let palette;
        
        // Special handling for 640x256 4-bit mode
        const is640x256_4bit = options.width === 640 && options.height === 256 && options.bitDepth === 4;
        const is9bit_Custom = options.bitDepth === 9;
        
        if (is640x256_4bit) {
            // Extract optimal palette from the image
            palette = extractOptimalPalette(tempImageData, 16);
            
            // Update the palette info text to show we're using an extracted palette
            if (conversionPaletteInfo) {
                conversionPaletteInfo.textContent = `Using extracted optimal palette (16 colors) for 640x256 4-bit mode`;
            }
            
            // Show the extracted palette
            showPalettePreview(palette);
        } else if (is9bit_Custom) {
            // For 9-bit custom, extract up to 256 colors
            palette = extractOptimalPalette(tempImageData, 256); // Max 256 colors for 9-bit custom
             if (conversionPaletteInfo) {
                conversionPaletteInfo.textContent = `Using extracted optimal palette (${palette.length} colors) for 9-bit mode`;
            }
            showPalettePreview(palette);
        } else {
            // Standard palette selection
        switch (options.paletteType) {
            case 'loaded':
                palette = loadedConversionPalette || generateDefaultPalette();
                break;
            case 'grayscale':
                if (options.bitDepth === 4) {
                    // 16-color grayscale
                    palette = Array(16).fill(0).map((_, i) => {
                        const v = Math.floor(i * 255 / 15).toString(16).padStart(2, '0');
                        return `#${v}${v}${v}`;
                    });
                } else {
                    // 256-color grayscale
                    palette = Array(256).fill(0).map((_, i) => {
                        const v = i.toString(16).padStart(2, '0');
                        return `#${v}${v}${v}`;
                    });
                }
                break;
            case 'default':
            default:
                palette = generateDefaultPalette();
                break;
            }
            
            // Show palette preview for 4-bit mode
            if (options.bitDepth === 4) {
                showPalettePreview(palette.slice(0, 16));
            }
        }
        
        // Create a reduced color version to simulate the conversion
        const reducedImageData = simulatePaletteReduction(
            tempImageData, 
            palette, 
            options.bitDepth, 
            options.dithering === 'floydSteinberg' ? 'floydSteinberg' : 
            options.dithering === 'ordered' ? 'ordered' : 'none'
        );
        
        // Put the processed image on the temporary canvas
        tempCtx.putImageData(reducedImageData, 0, 0);
        
        // Scale and draw the result onto the preview canvas
        ctx.imageSmoothingEnabled = false;
        
        if (is640x256Mode) {
            // For 640x256, draw each row twice to get the correct 4:3 aspect ratio
            // This simulates how the pixels appear on the actual ZX Next hardware
            const rowHeight = previewHeight / (options.height * 2);
            for (let row = 0; row < options.height; row++) {
                const sourceY = row;
                const destY1 = row * 2 * rowHeight; // First copy of the row
                const destY2 = (row * 2 + 1) * rowHeight; // Second copy of the row
                
                // Draw the same row twice (double height)
                ctx.drawImage(
                    tempCanvas,
                    0, sourceY, options.width, 1, // Source: full width, 1 pixel height
                    0, destY1, previewWidth, rowHeight // Destination: first copy
                );
                ctx.drawImage(
                    tempCanvas,
                    0, sourceY, options.width, 1, // Source: full width, 1 pixel height
                    0, destY2, previewWidth, rowHeight // Destination: second copy
                );
            }
        } else {
            // Standard drawing for all other modes
            ctx.drawImage(tempCanvas, 0, 0, options.width, options.height, 
                          0, 0, previewWidth, previewHeight);
        }
        
        // Update preview info
        let ditheringInfo = 'no dithering';
        if (options.dithering === 'floydSteinberg') ditheringInfo = 'Floyd-Steinberg dithering';
        if (options.dithering === 'ordered') ditheringInfo = 'Ordered dithering';
        
        previewInfo.textContent = `Preview: ${options.width}x${options.height}, ${options.bitDepth}-bit, ${ditheringInfo}`;
    }
    
    // Function to extract an optimal palette from image data
    function extractOptimalPalette(imageData, maxColors) {
        console.log(`[Importer] Extracting optimal palette with max ${maxColors} colors`);
        
        // Create a map to count color occurrences
        const colorMap = new Map();
        const { width, height, data } = imageData;
        
        // Step 1: Scan the image and count unique colors
        for (let i = 0; i < width * height * 4; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Create a key for this color
            const colorKey = `${r},${g},${b}`;
            
            // Update the color count
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Convert to array of color objects with RGB and count
        const allColors = Array.from(colorMap.entries())
            .map(([colorKey, count]) => {
                const [r, g, b] = colorKey.split(',').map(Number);
                return { r, g, b, count };
            });
        
        console.log(`[Importer] Found ${allColors.length} unique colors in image`);
        
        // Step 2: Always include black and white if they exist
        const finalPalette = [];
        
        // Find black or darkest color
        const blackThreshold = 30;
        const darkestColor = allColors.find(c => 
            c.r <= blackThreshold && c.g <= blackThreshold && c.b <= blackThreshold
        );
        
        if (darkestColor) {
            finalPalette.push(`#${darkestColor.r.toString(16).padStart(2, '0')}${darkestColor.g.toString(16).padStart(2, '0')}${darkestColor.b.toString(16).padStart(2, '0')}`);
            // Remove from consideration
            const darkIndex = allColors.indexOf(darkestColor);
            if (darkIndex !== -1) allColors.splice(darkIndex, 1);
        } else {
            finalPalette.push('#000000'); // Add pure black
        }
        
        // Find white or brightest color
        const whiteThreshold = 220;
        const brightestColor = allColors.find(c => 
            c.r >= whiteThreshold && c.g >= whiteThreshold && c.b >= whiteThreshold
        );
        
        if (brightestColor) {
            finalPalette.push(`#${brightestColor.r.toString(16).padStart(2, '0')}${brightestColor.g.toString(16).padStart(2, '0')}${brightestColor.b.toString(16).padStart(2, '0')}`);
            // Remove from consideration
            const brightIndex = allColors.indexOf(brightestColor);
            if (brightIndex !== -1) allColors.splice(brightIndex, 1);
        } else if (finalPalette.length < maxColors) {
            finalPalette.push('#FFFFFF'); // Add pure white
        }
        
        // Step 3: Define color regions for balanced distribution
        const colorRegions = [
            { name: "Reds", test: (r, g, b) => r > Math.max(g, b) * 1.5, colors: [], allocation: 0.15 },
            { name: "Greens", test: (r, g, b) => g > Math.max(r, b) * 1.5, colors: [], allocation: 0.15 },
            { name: "Blues", test: (r, g, b) => b > Math.max(r, g) * 1.5, colors: [], allocation: 0.15 },
            { name: "Yellows", test: (r, g, b) => r > 170 && g > 170 && b < 100, colors: [], allocation: 0.125 },
            { name: "Cyans", test: (r, g, b) => b > 170 && g > 170 && r < 100, colors: [], allocation: 0.125 },
            { name: "Magentas", test: (r, g, b) => r > 170 && b > 170 && g < 100, colors: [], allocation: 0.125 },
            { name: "Grays", test: (r, g, b) => Math.abs(r - g) < 30 && Math.abs(r - b) < 30 && Math.abs(g - b) < 30, colors: [], allocation: 0.1 },
            { name: "Others", test: () => true, colors: [], allocation: 0.075 }
        ];
        
        // Step 4: Categorize each color into its region
        allColors.forEach(color => {
            // Calculate color importance (frequency and saturation)
            const { r, g, b, count } = color;
            
            // Max component defines saturation intensity
            const maxComponent = Math.max(r, g, b);
            const minComponent = Math.min(r, g, b);
            const saturation = maxComponent > 0 ? (maxComponent - minComponent) / maxComponent : 0;
            
            // Calculate perceived brightness
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Calculate importance based on frequency, saturation and brightness
            const importance = Math.sqrt(count) * (1 + saturation + brightness/255);
            
            // Assign to first matching region
            for (const region of colorRegions) {
                if (region.test(r, g, b)) {
                    region.colors.push({...color, importance});
                    break;
                }
            }
        });
        
        // Step 5: Calculate and allocate slots for each region
        const remainingSlots = maxColors - finalPalette.length;
        
        // Calculate how many colors to take from each region
        colorRegions.forEach(region => {
            region.slots = Math.min(
                Math.round(remainingSlots * region.allocation),
                region.colors.length
            );
        });
        
        // Adjust if we allocated too many or too few slots
        const totalAllocated = colorRegions.reduce((sum, r) => sum + r.slots, 0);
        let difference = remainingSlots - totalAllocated;
        
        // Distribute remaining slots or remove excess
        while (difference !== 0) {
            if (difference > 0) {
                // Find region with most colors that can take another slot
                const regionToAdd = colorRegions
                    .filter(r => r.colors.length > r.slots)
                    .sort((a, b) => b.colors.length - a.colors.length)[0];
                
                if (regionToAdd) {
                    regionToAdd.slots++;
                    difference--;
                } else {
                    break; // No region can take more slots
                }
            } else {
                // Remove slot from region with least proportional need
                const regionToRemove = colorRegions
                    .filter(r => r.slots > 0)
                    .sort((a, b) => (a.colors.length / a.slots) - (b.colors.length / b.slots))[0];
                
                if (regionToRemove) {
                    regionToRemove.slots--;
                    difference++;
                } else {
                    break; // No more slots to remove
                }
            }
        }
        
        // Step 6: Select colors from each region based on importance
        colorRegions.forEach(region => {
            if (region.slots <= 0) return;
            
            // Sort by importance
            region.colors.sort((a, b) => b.importance - a.importance);
            
            // Take top colors from this region
            const selectedColors = region.colors.slice(0, region.slots);
            
            console.log(`[Importer] Selected ${selectedColors.length} colors from ${region.name} region`);
            
            // Add to final palette
            selectedColors.forEach(color => {
                const hex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
                finalPalette.push(hex);
            });
        });
        
        // Ensure we have exactly maxColors colors
        while (finalPalette.length < maxColors) {
            finalPalette.push('#000000'); // Add black for missing colors
        }
        
        // Trim if we somehow got too many
        if (finalPalette.length > maxColors) {
            finalPalette.splice(maxColors);
        }
        
        return finalPalette;
    }
    
    // Function to show palette preview in the conversion modal
    function showPalettePreview(palette) {
        // Create or get the palette preview container
        let palettePreviewContainer = document.getElementById('conversionPalettePreview');
        
        if (!palettePreviewContainer) {
            // Create the container if it doesn't exist
            palettePreviewContainer = document.createElement('div');
            palettePreviewContainer.id = 'conversionPalettePreview';
            palettePreviewContainer.style.display = 'flex';
            palettePreviewContainer.style.flexWrap = 'wrap';
            palettePreviewContainer.style.marginTop = '10px';
            palettePreviewContainer.style.border = '1px solid var(--vscode-editorWidget-border)';
            palettePreviewContainer.style.padding = '5px';
            palettePreviewContainer.style.maxWidth = '400px';
            palettePreviewContainer.style.maxHeight = '140px';
            palettePreviewContainer.style.overflow = 'auto';
            
            
            // Add a title
            const title = document.createElement('div');
            title.textContent = 'Palette Preview:';
            title.style.width = '100%';
            title.style.marginBottom = '5px';
            title.style.fontSize = '0.9em';
            palettePreviewContainer.appendChild(title);
            
            // Add to the DOM
            const conversionPaletteInfo = document.getElementById('conversionPaletteInfo');
            if (conversionPaletteInfo) {
                conversionPaletteInfo.parentNode.insertBefore(palettePreviewContainer, conversionPaletteInfo.nextSibling);
            }
        } else {
            // Clear existing swatches
            while (palettePreviewContainer.childElementCount > 1) { // Keep the title
                palettePreviewContainer.removeChild(palettePreviewContainer.lastChild);
            }
        }
        
        // Create a container for color information
        const colorInfoDiv = document.createElement('div');
        colorInfoDiv.style.width = '100%';
        colorInfoDiv.style.marginTop = '5px';
        colorInfoDiv.style.fontSize = '0.85em';
        colorInfoDiv.style.color = 'var(--vscode-descriptionForeground)';
        colorInfoDiv.textContent = 'Hover over colors for RGB values';
        
        // Add color swatches with improved visualization
        palette.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.style.width = '24px';
            swatch.style.height = '24px';
            swatch.style.backgroundColor = color;
            swatch.style.margin = '2px';
            swatch.style.border = '1px solid var(--vscode-editorWidget-border)';
            swatch.style.position = 'relative';
            swatch.style.cursor = 'pointer';
            
            // Parse RGB values
            const r = parseInt(color.substring(1, 3), 16);
            const g = parseInt(color.substring(3, 5), 16);
            const b = parseInt(color.substring(5, 7), 16);
            
            // Create tooltip with color info
            swatch.title = `Color ${index}: ${color}\nR:${r} G:${g} B:${b}`;
            
            // Add index overlay
            const indexOverlay = document.createElement('div');
            indexOverlay.style.position = 'absolute';
            indexOverlay.style.bottom = '0';
            indexOverlay.style.right = '0';
            indexOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            indexOverlay.style.color = 'white';
            indexOverlay.style.fontSize = '8px';
            indexOverlay.style.padding = '1px 2px';
            indexOverlay.textContent = index.toString();
            swatch.appendChild(indexOverlay);
            
            // Add click handler to show color detail
            swatch.addEventListener('click', () => {
                colorInfoDiv.textContent = `Color ${index}: ${color} (R:${r} G:${g} B:${b})`;
            });
            
            palettePreviewContainer.appendChild(swatch);
        });
        
        // Add the color info div
        palettePreviewContainer.appendChild(colorInfoDiv);
        
        // Show the container
        palettePreviewContainer.style.display = 'flex';
    }

    // --- Helper Functions for UI Messaging ---
    function displayErrorMessage(text) {
        // Show error in the selection info area
        if (selectionInfoDiv) {
            selectionInfoDiv.textContent = `Error: ${text}`;
                     // Clear canvas on provider-side error?
                     if (sourceCtx) sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
                     if (previewCtx) previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                     sourceImageData = null; // Reset state
                     sourceWidth = 0;
                     sourceHeight = 0;
                }
    }
    
    function displayWarningMessage(text) {
                // Add a warning notice and button to convert from BMP to PNG
                const warningDiv = document.createElement('div');
                warningDiv.className = 'warning-message';
                warningDiv.style.backgroundColor = 'var(--vscode-editorWarning-background, rgba(255, 200, 0, 0.1))';
                warningDiv.style.color = 'var(--vscode-editorWarning-foreground, #855200)';
                warningDiv.style.padding = '8px';
                warningDiv.style.borderRadius = '3px';
                warningDiv.style.margin = '5px 0 10px 0';
                warningDiv.style.display = 'flex';
                warningDiv.style.alignItems = 'center';
                warningDiv.style.justifyContent = 'space-between';
                
                const warningText = document.createElement('span');
        warningText.textContent = text || 'BMP files may have compatibility issues';
                
                const convertButton = document.createElement('button');
                convertButton.textContent = 'Convert to PNG';
                convertButton.addEventListener('click', () => {
                    vscode.postMessage({ command: 'convertToPng' });
                });
                
                warningDiv.appendChild(warningText);
                warningDiv.appendChild(convertButton);
                
                // Insert at the top of controls
                const controlsDiv = document.getElementById('controls');
                if (controlsDiv && controlsDiv.firstChild) {
                    controlsDiv.insertBefore(warningDiv, controlsDiv.firstChild);
                } else if (controlsDiv) {
                    controlsDiv.appendChild(warningDiv);
                }
    }

    // Toggle conversion modal visibility
    function toggleConversionModal(show) {
        const modal = document.getElementById('nxiConversionModal');
        if (modal) {
            modal.style.display = show ? 'block' : 'none';
        }
    }

    // Add this at the end of the file, inside the IIFE but before the closing parentheses
    // Directly attach events to conversion buttons
    function attachConversionButtonEvents() {
        console.log('[Importer] Attaching conversion button events');
        
        // Convert to NXI button
        const convertToNxiButton = document.getElementById('convertToNxiButton');
        if (convertToNxiButton) {
            convertToNxiButton.addEventListener('click', function() {
                console.log('[Importer] Convert to NXI button clicked');
                // Populate initial values based on current image
                const conversionWidth = document.getElementById('conversionWidth');
                const conversionHeight = document.getElementById('conversionHeight');
                if (sourceImageData && conversionWidth && conversionHeight) {
                    conversionWidth.value = sourceImageData.width;
                    conversionHeight.value = sourceImageData.height;
                }
                toggleConversionModal(true);
            });
        }
        
        // Close button
        const closeConversionButton = document.getElementById('closeConversionButton');
        if (closeConversionButton) {
            closeConversionButton.addEventListener('click', function() {
                console.log('[Importer] Close conversion button clicked');
                toggleConversionModal(false);
            });
        }
        
        // Preview button
        const previewConversionButton = document.getElementById('previewConversionButton');
        if (previewConversionButton) {
            previewConversionButton.addEventListener('click', function() {
                console.log('[Importer] Preview conversion button clicked');
                previewConversion();
            });
        }
        
        // Apply button
        const applyConversionButton = document.getElementById('applyConversionButton');
        if (applyConversionButton) {
            applyConversionButton.addEventListener('click', function() {
                console.log('[Importer] Apply conversion button clicked');
                
                // Get conversion options
                const options = getConversionOptions();
                console.log('[Importer] Conversion options:', options);
                
                // Add palette data if using loaded palette
                if (options.paletteType === 'loaded' && loadedConversionPalette) {
                    options.loadedPalette = loadedConversionPalette;
                }
                
                // Send the message to the extension
                console.log('[Importer] Sending convertImage message');
                vscode.postMessage({
                    command: 'convertImage',
                    options: options
                });
                
                // Close the modal
                toggleConversionModal(false);
            });
        }
        
        console.log('[Importer] Conversion button events attached');
    }
    
    // Call this function when the window loads
    window.addEventListener('load', function() {
        console.log('[Importer] Window loaded - attaching conversion button events');
        attachConversionButtonEvents();
    });
}());

// Polyfill Buffer if running in a browser environment without it (basic version)
// Note: This is a very simplified polyfill. For full Buffer functionality,
// a library like 'buffer/' might be needed, potentially bundled via Webpack.
if (typeof Buffer === 'undefined') {
    window.Buffer = {
        from: function(arg, enc) {
            if (arg instanceof ArrayBuffer) {
                const view = new Uint8Array(arg);
                // Basic toString('base64') - might not be fully spec compliant
                const toString = (encoding) => {
                    if (encoding === 'base64') {
                        let binary = '';
                        const len = view.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(view[i]);
                        }
                        return btoa(binary);
                    }
                    // Add other encodings if needed
                    return String(view); // Default
                };
                return { buffer: arg, toString: toString }; 
            }
            // Handle other types like strings if necessary
            return arg;
        }
    };
} 