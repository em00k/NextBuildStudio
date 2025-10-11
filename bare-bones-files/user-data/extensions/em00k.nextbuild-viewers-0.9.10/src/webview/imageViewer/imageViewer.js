/* eslint-disable curly */
(function() {
    const vscode = acquireVsCodeApi();
    
    // Initialize after DOM is fully loaded
    function initialize() {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const fileName = document.body.dataset.fileName || 'Unknown File'; // Read from data attribute
        let currentImageData = null;
        let currentPalette = [];
        let currentViewState = { scale: 1, paletteOffset: 0 };
        let activePaletteSource = 'default'; // 'default', 'loaded', 'appended', 'prefix'

        // Ensure scale is an integer
        currentViewState.scale = Math.max(1, Math.round(currentViewState.scale));

        // Notify the extension that the webview is fully loaded
        vscode.postMessage({ command: 'webviewLoaded' });

        function updatePaletteStatus() {
            const statusEl = document.getElementById('paletteStatus');
            if (!statusEl) return;
            switch(activePaletteSource) {
                case 'loaded':
                    statusEl.textContent = `Loaded: ${currentViewState.loadedPaletteName || 'Custom'}`;
                    break;
                case 'appended':
                    statusEl.textContent = 'Using Appended Palette';
                    break;
                case 'prefix':
                    statusEl.textContent = 'Using Prefix Palette';
                    break;
                case 'default':
                default:
                    statusEl.textContent = 'Using Default Palette';
                    break;
            }
        }

        function drawImage() {
            if (!currentImageData || !currentImageData.pixels || !ctx) return;
            
            const { pixels, width, height, mode } = currentImageData;
            // Ensure scale is an integer
            const scale = Math.max(1, Math.round(currentViewState.scale));
            const paletteOffset = currentViewState.paletteOffset;
            const use43Aspect = currentViewState.aspect43 && width === 640;
            
            // Calculate canvas dimensions based on aspect ratio setting
            let canvasWidth = width * scale;
            let canvasHeight = height * scale;
            
            if (use43Aspect) {
                // For 4:3 aspect, we double the height (each vertical pixel becomes 2x taller)
                // This transforms the 640x256 (2.5:1) to roughly 4:3 aspect ratio
                canvasHeight = height * 2 * scale; // Double the height
                console.log("Using 4:3 aspect ratio: Original " + width + "x" + height + " -> Adjusted " + width + "x" + (height*2) + " (doubled height)");
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            ctx.imageSmoothingEnabled = false; // Keep pixels sharp
            
            const outputImageData = ctx.createImageData(canvasWidth, canvasHeight);
            const outputPixels = outputImageData.data; // Uint8ClampedArray RGBA
            
            for (let y = 0; y < height; y++) {
                // Calculate the output Y position(s)
                let outputYPositions = [y * scale];
                
                // For 4:3 mode, each source Y creates two output Y rows
                if (use43Aspect) {
                    outputYPositions = [y * 2 * scale, (y * 2 + 1) * scale];
                }
                
                for (let x = 0; x < width; x++) {
                    const sourceIndex = (y * width + x);
                    // Make sure we have valid index in the array
                    if (sourceIndex * 4 + 3 >= pixels.length) continue;
                    
                    const colorIndex = pixels[sourceIndex * 4 + 3]; // Index stored in alpha
                    let finalIndex = colorIndex;
                    
                    if (mode === '4bit') { // Check for 4bit mode correctly
                        finalIndex = colorIndex + paletteOffset;
                    }
                    finalIndex = Math.max(0, Math.min(255, finalIndex)); // Clamp index

                    const hexColor = currentPalette[finalIndex] || '#FF00FF'; // Default to magenta for errors
                    
                    // Convert hex to RGB
                    const r = parseInt(hexColor.slice(1, 3), 16);
                    const g = parseInt(hexColor.slice(3, 5), 16);
                    const b = parseInt(hexColor.slice(5, 7), 16);

                    // Draw each pixel at the appropriate scale
                    // For 4:3 mode, we draw each source pixel in both output rows
                    for (const outputY of outputYPositions) {
                        for (let sy = 0; sy < scale; sy++) {
                            for (let sx = 0; sx < scale; sx++) {
                                const destIndex = ((outputY + sy) * canvasWidth + (x * scale + sx)) * 4;
                                if (destIndex + 3 < outputPixels.length) {
                                    outputPixels[destIndex + 0] = r;
                                    outputPixels[destIndex + 1] = g;
                                    outputPixels[destIndex + 2] = b;
                                    outputPixels[destIndex + 3] = 255; // Alpha
                                }
                            }
                        }
                    }
                }
            }
            ctx.putImageData(outputImageData, 0, 0);
            
            // Update aspect ratio indicator in info bar
            const aspectInfoSpan = document.getElementById('infoAspect');
            if (aspectInfoSpan) {
                toggleVisibility(aspectInfoSpan, use43Aspect);
            }
        }

        // Helper function to toggle element visibility using CSS classes
        function toggleVisibility(element, isVisible) {
            if (isVisible) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }

        // Set up event listeners
        function setupEventListeners() {
            // Event Listeners for controls
            document.getElementById('loadPalette').addEventListener('click', () => {
                vscode.postMessage({ command: 'loadPalette' });
            });

            const applyAppendedBtn = document.getElementById('applyAppendedPalette');
            if (applyAppendedBtn) {
                applyAppendedBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'applyAppendedPalette' });
                });
            }

            const applyPrefixBtn = document.getElementById('applyPrefixPalette');
            if (applyPrefixBtn) {
                applyPrefixBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'applyPrefixPalette' });
                });
            }

            const offsetInput = document.getElementById('paletteOffset');
            if (offsetInput) {
                offsetInput.addEventListener('change', e => {
                    const offset = parseInt(e.target.value, 10);
                    currentViewState.paletteOffset = offset;
                    vscode.postMessage({ command: 'changePaletteOffset', offset });
                });
            }

            const scaleSlider = document.getElementById('scaleSlider');
            const scaleValue = document.getElementById('scaleValue');
            if (scaleSlider) {
                scaleSlider.addEventListener('input', e => {
                    scaleValue.textContent = e.target.value + 'x';
                });
                scaleSlider.addEventListener('change', e => {
                    const scale = parseInt(e.target.value, 10);
                    currentViewState.scale = scale;
                    vscode.postMessage({ command: 'changeScale', scale });
                });
            }
            
            // Handle scale presets dropdown
            const scalePreset = document.getElementById('scalePreset');
            if (scalePreset) {
                scalePreset.addEventListener('change', e => {
                    if (e.target.value) {
                        const scale = parseInt(e.target.value, 10);
                        currentViewState.scale = scale;
                        
                        // Update the slider and text to match
                        if (scaleSlider) {
                            scaleSlider.value = scale.toString();
                        }
                        if (scaleValue) {
                            scaleValue.textContent = scale + 'x';
                        }
                        
                        // Tell the extension about the change
                        vscode.postMessage({ command: 'changeScale', scale });
                        
                        // Reset the dropdown to the default option
                        e.target.selectedIndex = 0;
                    }
                });
            }
            
            const aspect43Checkbox = document.getElementById('aspect43');
            if (aspect43Checkbox) {
                aspect43Checkbox.addEventListener('change', e => {
                    currentViewState.aspect43 = e.target.checked;
                    vscode.postMessage({ command: 'aspect43', checked: e.target.checked });
                });
            }
            
            const applyCustomDims = document.getElementById('applyCustomDims');
            if (applyCustomDims) {
                applyCustomDims.addEventListener('click', () => {
                    const width = parseInt(document.getElementById('customWidth').value, 10);
                    const height = parseInt(document.getElementById('customHeight').value, 10);
                    if (width > 0 && height > 0) {
                        currentViewState.customWidth = width;
                        currentViewState.customHeight = height;
                        vscode.postMessage({ command: 'changeCustomDimensions', width, height });
                    }
                });
            }

            const useDefaultBtn = document.getElementById('useDefaultPalette');
            if (useDefaultBtn) {
                useDefaultBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'useDefaultPalette' });
                });
            }

            // Save as PNG functionality
            const saveAsPngBtn = document.getElementById('saveAsPng');
            if (saveAsPngBtn) {
                saveAsPngBtn.addEventListener('click', () => {
                    if (!currentImageData) return;
                    
                    // Get the selected export scale factor
                    const exportScaleSelect = document.getElementById('exportScale');
                    const exportScale = parseInt(exportScaleSelect.value, 10);
                    
                    // Create a temporary canvas with the export dimensions
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    if (!tempCtx) {
                        console.error('Failed to get 2D context for export canvas');
                        return;
                    }
                    
                    // Set dimensions based on current display settings
                    const { width, height } = currentImageData;
                    let exportWidth, exportHeight;
                    
                    // Apply 4:3 aspect ratio if enabled
                    if (currentViewState.aspect43 && width === 640) {
                        // For 4:3 aspect ratio, double the height
                        exportWidth = width * exportScale;
                        exportHeight = height * 2 * exportScale; // Double the height
                    } else {
                        exportWidth = width * exportScale;
                        exportHeight = height * exportScale;
                    }
                    
                    tempCanvas.width = exportWidth;
                    tempCanvas.height = exportHeight;
                    tempCtx.imageSmoothingEnabled = false; // Keep pixels sharp
                    
                    // We need to redraw the image for export rather than using drawImage on the display canvas
                    // This ensures we get the exact same rendering quality and behavior
                    if (currentViewState.aspect43 && width === 640) {
                        // Render with doubled height for 4:3 aspect ratio
                        for (let y = 0; y < height; y++) {
                            const sourceY = y;
                            
                            // Each source row becomes two destination rows
                            const destY1 = y * 2 * exportScale;
                            const destY2 = (y * 2 + 1) * exportScale;
                            
                            for (let x = 0; x < width; x++) {
                                const sourceIndex = (sourceY * width + x);
                                if (sourceIndex * 4 + 3 >= currentImageData.pixels.length) continue;
                                
                                const colorIndex = currentImageData.pixels[sourceIndex * 4 + 3];
                                let finalIndex = colorIndex;
                                
                                if (currentImageData.mode === '4bit') {
                                    finalIndex = colorIndex + currentViewState.paletteOffset;
                                }
                                finalIndex = Math.max(0, Math.min(255, finalIndex));
                                
                                const hexColor = currentPalette[finalIndex] || '#FF00FF';
                                
                                // Draw to both rows for doubled height
                                tempCtx.fillStyle = hexColor;
                                
                                // First row
                                tempCtx.fillRect(x * exportScale, destY1, exportScale, exportScale);
                                
                                // Second row (duplicate)
                                tempCtx.fillRect(x * exportScale, destY2, exportScale, exportScale);
                            }
                        }
                    } else {
                        // Draw the canvas directly for non-4:3 mode
                        // For simplicity, just draw the current display canvas, scaled appropriately
                        tempCtx.drawImage(canvas, 0, 0, exportWidth, exportHeight);
                    }
                    
                    // Convert to PNG data URL
                    const pngDataUrl = tempCanvas.toDataURL('image/png');
                    
                    // Send to extension to save
                    vscode.postMessage({ 
                        command: 'savePngImage',
                        dataUrl: pngDataUrl,
                        originalFileName: fileName,
                        width: exportWidth,
                        height: exportHeight
                    });
                });
            }
        }

        // Set up message listener
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'redraw') {
                // Log received palette
                console.log('[ImageViewer.js] Received redraw message. Palette (first 8):', message.palette ? message.palette.slice(0, 8) : 'N/A');

                currentImageData = message.imageData; // Includes .mode, .width, .height, .formatDescription, .guessedDimensions, .appendedPalette
                currentPalette = message.palette;
                currentViewState = message.viewState; // Includes .scale, .paletteOffset, .customWidth, .customHeight, .loadedPaletteName, .aspect43
                activePaletteSource = message.paletteSource || 'default'; // Update palette source

                // Ensure scale is an integer
                currentViewState.scale = Math.max(1, Math.round(currentViewState.scale));

                // Update UI elements based on new state
                updatePaletteStatus(); // Update palette status text

                // Update button states based on active source
                const defaultBtn = document.getElementById('useDefaultPalette');
                const appendedBtn = document.getElementById('applyAppendedPalette');
                const prefixBtn = document.getElementById('applyPrefixPalette');
                
                if (defaultBtn) defaultBtn.disabled = activePaletteSource === 'default';
                
                if (appendedBtn) {
                    toggleVisibility(appendedBtn, currentImageData.appendedPalette);
                    appendedBtn.disabled = activePaletteSource === 'appended';
                }
                
                if (prefixBtn) {
                    toggleVisibility(prefixBtn, currentImageData.prefixPalette);
                    prefixBtn.disabled = activePaletteSource === 'prefix';
                }

                document.getElementById('scaleSlider').value = currentViewState.scale.toString();
                document.getElementById('scaleValue').textContent = currentViewState.scale + 'x';
                
                const offsetInput = document.getElementById('paletteOffset');
                if (offsetInput) {
                    offsetInput.value = currentViewState.paletteOffset;
                    // Disable offset if not 4bit
                    offsetInput.disabled = currentImageData.mode !== '4bit'; 
                }
                
                // Update aspect ratio checkbox
                const aspect43 = document.getElementById('aspect43');
                if (aspect43) {
                    aspect43.checked = currentViewState.aspect43;
                    aspect43.disabled = currentImageData.width !== 640;
                }

                // Update custom dimension inputs
                const customWidthInput = document.getElementById('customWidth');
                const customHeightInput = document.getElementById('customHeight');
                if (customWidthInput && customHeightInput) {
                    customWidthInput.value = currentViewState.customWidth || currentImageData.width;
                    customHeightInput.value = currentViewState.customHeight || currentImageData.height;
                }
                
                // Show help text based on whether dimensions were guessed
                const helpText = document.querySelector('.help-text');
                if (helpText) {
                    if (currentImageData.guessedDimensions) {
                        helpText.textContent = 'Dimensions were estimated. Adjust if image looks incorrect.';
                        helpText.classList.add('warning-text');
                    } else {
                        helpText.textContent = 'Adjust dimensions if needed for non-standard formats.';
                        helpText.classList.remove('warning-text');
                    }
                }
                
                // Update info bar elements individually
                if (currentImageData) {
                    document.getElementById('infoFileName').textContent = fileName; // Use fileName read from data attribute
                    document.getElementById('infoFormatDesc').textContent = currentImageData.formatDescription || 'Unknown';
                    
                    const offsetSpan = document.getElementById('infoOffset');
                    const offsetValueSpan = document.getElementById('infoOffsetValue');
                    if (offsetSpan && offsetValueSpan) {
                        const showOffset = currentImageData.mode === '4bit';
                        toggleVisibility(offsetSpan, showOffset);
                        if (showOffset) {
                            offsetValueSpan.textContent = currentViewState.paletteOffset;
                        }
                    }

                    const guessedSpan = document.getElementById('infoGuessed');
                    if (guessedSpan) {
                        toggleVisibility(guessedSpan, currentImageData.guessedDimensions);
                    }
                    
                    const aspectInfoSpan = document.getElementById('infoAspect');
                    if (aspectInfoSpan) {
                        toggleVisibility(aspectInfoSpan, currentViewState.aspect43 && currentImageData.width === 640);
                    }
                }

                drawImage();
            } else if (message.command === 'initialize') {
                // Set the filename attribute from the extension
                document.body.dataset.fileName = message.fileName || 'Unknown File';
            }
        });

        // Initial UI setup
        setupEventListeners();
        updatePaletteStatus();
        
        // Initialize UI controls
        const initialDefaultBtn = document.getElementById('useDefaultPalette');
        const initialAppendedBtn = document.getElementById('applyAppendedPalette');
        const initialPrefixBtn = document.getElementById('applyPrefixPalette');
        
        if (initialDefaultBtn) initialDefaultBtn.disabled = activePaletteSource === 'default';
        if (initialAppendedBtn) {
            initialAppendedBtn.disabled = activePaletteSource === 'appended';
        }
        if (initialPrefixBtn) {
            initialPrefixBtn.disabled = activePaletteSource === 'prefix';
        }
        
        const offsetInput = document.getElementById('paletteOffset');
        if (offsetInput) { 
            offsetInput.disabled = !currentImageData || currentImageData.mode !== '4bit';
            offsetInput.value = currentViewState.paletteOffset;
        }
        
        document.getElementById('scaleSlider').value = currentViewState.scale.toString();
        document.getElementById('scaleValue').textContent = currentViewState.scale + 'x';
        
        // No need to check visibility of custom dims controls as they're always visible now
        const initialCustomWidthInput = document.getElementById('customWidth');
        const initialCustomHeightInput = document.getElementById('customHeight');
        if (initialCustomWidthInput && initialCustomHeightInput && currentImageData) {
            initialCustomWidthInput.value = currentViewState.customWidth || currentImageData.width;
            initialCustomHeightInput.value = currentViewState.customHeight || currentImageData.height;
        }
        
        // Setup aspect ratio checkbox
        const aspect43 = document.getElementById('aspect43');
        if (aspect43 && currentImageData) {
            aspect43.checked = currentViewState.aspect43 || false;
            // Only enable for 640px width images
            aspect43.disabled = !currentImageData || currentImageData.width !== 640;
        }
    }

    // Initialize when the document is loaded
    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }
})(); 