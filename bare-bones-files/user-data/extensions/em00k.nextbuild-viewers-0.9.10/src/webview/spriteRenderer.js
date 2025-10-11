/* eslint-disable curly */
// src/webview/spriteRenderer.js

// Helper functions related to updating the webview's HTML content.

// Import necessary utilities if they are needed *within* these functions
// (e.g., if getDisplayColorIndex was complex and moved to a util)
// import { getDisplayColorIndex } from './someUtils'; 

// --- Helper to get final color index based on mode and offset --- 
// Keep this helper local to the renderer as it's only used here
function getDisplayColorIndex(rawIndex, currentPalette, viewState) {
    if (!viewState || !currentPalette) return 0; // Return 0 (black) if no palette or viewState

    const mode = viewState.mode;
    const offsetBank = viewState.paletteOffset;
    let finalIndex = rawIndex;

    if (mode === 'sprite4' || mode === 'tile8x8') {
        finalIndex = offsetBank + rawIndex;
    } 
    
    // Ensure the index is always valid - if it's beyond the current palette length
    // or the entry doesn't exist, return 0 (black) as a fallback
    if (finalIndex < 0 || finalIndex >= currentPalette.length || !currentPalette[finalIndex]) {
        return 0;
    }
    
    return finalIndex;
}

// --- Palette Picker Rendering --- 
export function populatePalettePicker(palettePicker, paletteState, selectionState, isDefaultPaletteActive, selectPrimaryColor, selectSecondaryColor, vscode) {
    console.log("[Renderer] populatePalettePicker START"); // Add START log
    if (!palettePicker) { 
        console.error("[Renderer] Palette picker element not found!");
        return; 
    }
    palettePicker.innerHTML = '';
    console.log("[Renderer] Cleared palettePicker innerHTML"); // Log after clear

    if (!paletteState || !paletteState.current || paletteState.current.length === 0) {
        console.warn("[Renderer] No valid current palette data found in paletteState.");
        return; 
    }

    const currentPalette = paletteState.current; 

    const limit = Math.min(currentPalette.length, paletteState.visibleSize);
    
    for (let index = 0; index < limit; index++) {
        const color = currentPalette[index];
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color.hex;
        swatch.dataset.colorIndex = index.toString();
        swatch.draggable = true;
        
        // Add tooltip with color information
        // Extract RGB components from hex
        const r = parseInt(color.hex.substring(1, 3), 16);
        const g = parseInt(color.hex.substring(3, 5), 16);
        const b = parseInt(color.hex.substring(5, 7), 16);
        
        // Calculate RGB9 values (simplified approximation)
        const r9 = Math.round(r * 7 / 255);
        const g9 = Math.round(g * 7 / 255);
        const b9 = Math.round(b * 3 / 255);
        
        // Calculate RGB9 bytes (would need proper conversion but this is simplified)
        const rgb9Byte1 = ((r9 & 0x7) << 5) | ((g9 & 0x7) << 2) | ((b9 & 0x3) >> 1);
        const rgb9Byte2 = ((b9 & 0x1) << 7) | (color.priority ? 0x80 : 0);
        
        swatch.title = `Index: ${index}
Hex: ${color.hex}
RGB9 bytes: (${rgb9Byte1}, ${rgb9Byte2})
RGB9: (${r9},${g9},${b9})
RGB24: (${r},${g},${b})
Priority: ${color.priority}`;

        // Add appropriate selection classes
        if (index === selectionState.primaryColorIndex) {
            swatch.classList.add('primary-selected');
        }
        
        if (index === selectionState.secondaryColorIndex) {
            swatch.classList.add('secondary-selected');
        }
        
        // Color selection (primary on left click)
        swatch.addEventListener('click', (event) => {
            if (!event.ctrlKey) { // Only select if not ctrl-clicking (which is for swap)
                selectPrimaryColor(index);
            } else {
                // Log that we're ignoring the click due to Ctrl key
                console.log(`[Renderer] Ignoring color selection click on index ${index} because Ctrl key is pressed`);
            }
        });
        
        // Color selection (secondary on right click)
        swatch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            selectSecondaryColor(index);
            // Store right-click state in window for persistence
            if (!window.colorCopyState) window.colorCopyState = {};
            window.colorCopyState.isCopying = true;
            window.colorCopyState.sourceIndex = index;
            console.log(`[Renderer] Right-click on color ${index} - ready for copy`);
        });

        palettePicker.appendChild(swatch);
    }
    
    console.log("[Renderer] populatePalettePicker END - Added swatches"); // Add END log
}

// --- Sprite Grid Rendering --- 
export function redrawSpriteGrid(spriteListContainer, spriteData, viewState, currentPalette, vscode, appState) {
    console.log(`[Renderer] >>> redrawSpriteGrid START (Mode: ${viewState.mode})`); 
    if (!spriteListContainer || !spriteData) {
        console.log("[Renderer] redrawSpriteGrid END - Early exit (no container or spriteData)"); 
        return;
    }
    spriteListContainer.innerHTML = '';
    if (!spriteData.sprites) {
        console.log("[Renderer] redrawSpriteGrid END - Early exit (no sprites array)"); 
        return;
    }

    const brush = viewState.spriteBrush || { width: 1, height: 1 }; // Default to 1x1 if undefined
    const gridColumnCount = brush.width > 0 ? brush.width : 1; // Ensure at least 1 column
    console.log(`[Renderer redrawSpriteGrid] Brush width: ${brush.width}, Grid column count: ${gridColumnCount}`); // Log the calculated column count
    spriteListContainer.style.gridTemplateColumns = `repeat(${gridColumnCount}, 1fr)`;

    const SPRITES_PER_ROW = 16; // This constant might be less relevant now for display, but used for highlight calc context
    const topLeftBrushIndex = viewState.currentSprite;
    const topLeftBrushRow = Math.floor(topLeftBrushIndex / SPRITES_PER_ROW);
    const topLeftBrushCol = topLeftBrushIndex % SPRITES_PER_ROW;

    spriteData.sprites.forEach((sprite) => {
        const spriteBox = document.createElement('div');
        spriteBox.className = 'sprite-box';

        // New logic to determine if the current sprite is in the brush area
        let isActuallyInBrushArea = false;
        for (let by = 0; by < brush.height; by++) {
            for (let bx = 0; bx < brush.width; bx++) {
                if (sprite.index === topLeftBrushIndex + bx + (by * brush.width)) {
                    isActuallyInBrushArea = true;
                    break;
                }
            }
            if (isActuallyInBrushArea) break;
        }

        if (isActuallyInBrushArea) {
            spriteBox.classList.add('brush-area-sprite'); // New class for general brush area
        }

        if(sprite.index === topLeftBrushIndex) { // Top-left of brush is the primary selection
            spriteBox.classList.add('selected');
        }
        spriteBox.dataset.index = sprite.index.toString();
        spriteBox.draggable = true;

        const spriteContainer = document.createElement('div');
        spriteContainer.className = 'sprite-container';
        spriteContainer.style.gridTemplateColumns = `repeat(${sprite.width}, 1fr)`;
        
        sprite.pixels.forEach((rawPixelIndex) => {
            const pixelDiv = document.createElement('div');
            pixelDiv.className = 'sprite-pixel';
            const displayIndex = getDisplayColorIndex(rawPixelIndex, currentPalette, viewState);
           //if (sprite.index === 0 && rawPixelIndex !== 0) { // Log for first sprite, non-zero raw index
            //     console.log(`[Renderer Grid] Sprite ${sprite.index}, Raw ${rawPixelIndex} -> Display ${displayIndex}, Color: ${currentPalette[displayIndex]?.hex}`);
            //}
            pixelDiv.style.backgroundColor = currentPalette[displayIndex]?.hex || '#FF00FF'; 
            spriteContainer.appendChild(pixelDiv);
        });

        const spriteIndexDiv = document.createElement('div');
        spriteIndexDiv.className = 'sprite-index';
        spriteIndexDiv.textContent = sprite.index.toString();

        spriteBox.appendChild(spriteContainer);
        spriteBox.appendChild(spriteIndexDiv);

        // Event listeners for interaction 
        spriteBox.addEventListener('click', (event) => {
            const index = parseInt(spriteBox.dataset.index || '0', 10);
            if (event.altKey) {
                vscode.postMessage({ command: 'pasteSprite', targetIndex: index });
            } else {
                // Optimistically update the UI immediately before waiting for the round-trip
                if (appState && appState.viewState && appState.spriteData) {
                    const previousIndex = appState.viewState.currentSprite;
                    if (previousIndex === index) return; // No change

                    appState.viewState.currentSprite = index;
                    
                    // 1. Redraw the entire sprite grid to update selection and brush highlights
                    const currentSpriteListContainer = document.querySelector('.sprites-grid'); // Or pass spriteListContainer if available in this scope
                    if (currentSpriteListContainer) {
                        redrawSpriteGrid(currentSpriteListContainer, appState.spriteData, appState.viewState, appState.palette.current, vscode, appState);
                    }
                    
                    // 2. Update the detail view with the new sprite
                    const detailContainer = document.querySelector('.detail-container');
                    if (detailContainer) {
                        redrawDetailView(
                            detailContainer, 
                            appState.spriteData, 
                            appState.viewState, 
                            appState.palette.current, 
                            !appState.palette.isCustom
                        );
                    }
                    
                    // 3. Update detail title (already handled by redrawDetailView typically)
                    // const detailTitle = document.querySelector('.sprite-detail h2');
                    // if (detailTitle) {
                    // detailTitle.textContent = `Sprite ${index} Detail`;
                    // }
                }
                
                // Then send the message to the extension to make it official
                vscode.postMessage({ command: 'viewSprite', index });
            }
        });
        spriteBox.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const index = parseInt(spriteBox.dataset.index || '0', 10);
            if (event.ctrlKey && event.shiftKey) {
                vscode.postMessage({ command: 'removeSprite', index: index });
            } else {
                vscode.postMessage({ command: 'copySprite', sourceIndex: index });
            }
        });

        spriteListContainer.appendChild(spriteBox);
    });

    // --- Append the "Add New Sprite" box --- 
    const addBox = document.createElement('div');
    addBox.className = 'add-sprite-box';
    addBox.title = 'Add new sprite';
    addBox.innerHTML = `
        <div class="add-sprite-plus">+</div>
        <div class="add-sprite-text">New</div>
    `;
    addBox.addEventListener('click', () => {
        vscode.postMessage({ command: 'addNewSprite' });
    });
    spriteListContainer.appendChild(addBox);
    console.log(`[Renderer] >>> redrawSpriteGrid END (Mode: ${viewState.mode})`); // <<< ADDED LOG
}

// --- Sprite Detail View Rendering --- 
export function redrawDetailView(mainSpriteDetailContainer, spriteData, viewState, currentPalette, isDefaultPaletteMode) {
    console.log(`[Renderer] >>> redrawDetailView START (Mode: ${viewState.mode}, Sprite: ${viewState.currentSprite})`); // <<< ADDED LOG
    if (!mainSpriteDetailContainer || !spriteData || !spriteData.sprites) {
        if (mainSpriteDetailContainer) {
            mainSpriteDetailContainer.innerHTML = '<div>Error: Sprite data unavailable.</div>';
        }
        console.log("[Renderer] redrawDetailView END - Early exit (no container or spriteData)");
        return;
    }

    const brush = viewState.spriteBrush || { width: 1, height: 1 };
    const SPRITES_PER_ROW = 16; // Consistent with other parts
    const topLeftSpriteIndex = viewState.currentSprite;

    // Determine the actual dimensions of the sprite (assuming all sprites in brush are same size as top-left)
    const refSpriteForDim = spriteData.sprites[topLeftSpriteIndex];
    if (!refSpriteForDim) {
        if (mainSpriteDetailContainer) {
            mainSpriteDetailContainer.innerHTML = `<div>Error: Top-left sprite for brush (index: ${topLeftSpriteIndex}) not found.</div>`;
        }
        console.log("[Renderer] redrawDetailView END - Early exit (top-left sprite not found)");
        return;
    }
    const singleSpriteWidth = refSpriteForDim.width;
    const singleSpriteHeight = refSpriteForDim.height;

    const compositeWidthInSprites = brush.width;
    const compositeHeightInSprites = brush.height;
    const compositePixelWidth = singleSpriteWidth * compositeWidthInSprites;
    const compositePixelHeight = singleSpriteHeight * compositeHeightInSprites;

    mainSpriteDetailContainer.innerHTML = ''; 
    mainSpriteDetailContainer.style.gridTemplateColumns = `repeat(${compositePixelWidth}, 1fr)`;
    // Adjust container size if needed, or rely on CSS to handle overflow if it becomes too large
    // For now, let --detail-pixel-size control individual pixel size, and grid will expand.

    const compositePixels = []; // This will store pixels row by row for the final composite image

    // Iterate over each row of pixels in the final composite brush image
    for (let compositeRow = 0; compositeRow < compositePixelHeight; compositeRow++) {
        // Determine which row of sprites in the brush this compositeRow belongs to
        const brushSpriteRow = Math.floor(compositeRow / singleSpriteHeight); // e.g., 0 or 1 for a 2-sprite high brush

        // Determine which pixel row *within* that sprite this compositeRow corresponds to
        const pixelRowInSprite = compositeRow % singleSpriteHeight;

        // Now iterate over each column of sprites in the brush
        for (let brushSpriteCol = 0; brushSpriteCol < brush.width; brushSpriteCol++) {
            // Determine the actual original sprite index for this part of the brush
            const actualOriginalSpriteIndex = topLeftSpriteIndex + brushSpriteCol + (brushSpriteRow * brush.width);

            const sprite = (actualOriginalSpriteIndex >= 0 && actualOriginalSpriteIndex < spriteData.count) ? spriteData.sprites[actualOriginalSpriteIndex] : null;
            const spriteIsValid = sprite && sprite.pixels && sprite.width === singleSpriteWidth && sprite.height === singleSpriteHeight;

            // Now iterate over each pixel column *within* the current source sprite
            for (let pixelColInSprite = 0; pixelColInSprite < singleSpriteWidth; pixelColInSprite++) {
                if (spriteIsValid) {
                    const pixelIndexInSourceSprite = pixelRowInSprite * singleSpriteWidth + pixelColInSprite;
                    const rawPixelValue = sprite.pixels[pixelIndexInSourceSprite];
                    const displayPaletteIndex = getDisplayColorIndex(rawPixelValue, currentPalette, viewState);
                    compositePixels.push({
                        raw: rawPixelValue,
                        displayHex: currentPalette[displayPaletteIndex]?.hex || '#FF00FF',
                        spriteIndex: actualOriginalSpriteIndex,
                        localPixelIndex: pixelIndexInSourceSprite
                    });
                } else {
                    // Handle placeholder for invalid/missing sprite part of brush
                    compositePixels.push({ raw: 0, displayHex: 'rgba(0,0,0,0.1)' /* Placeholder */, spriteIndex: -1, localPixelIndex: -1 });
                }
            }
        }
    }
    
    compositePixels.forEach((pixelData, i) => {
        const pixelDiv = document.createElement('div');
        pixelDiv.className = 'detail-pixel';
        pixelDiv.style.backgroundColor = pixelData.displayHex;
        // Store data attributes for interaction if needed later by drawPixel
        pixelDiv.dataset.originalSpriteIndex = pixelData.spriteIndex;
        pixelDiv.dataset.localPixelIndex = pixelData.localPixelIndex;
        pixelDiv.dataset.compositePixelIndex = i.toString(); // Index in the composite view

        pixelDiv.draggable = false; // Explicitly prevent dragging
        mainSpriteDetailContainer.appendChild(pixelDiv);
    });
    
    // Update detail info text
    const detailInfoDiv = document.querySelector('.detail-info');
    if (detailInfoDiv) {
        let paletteName = 'Default';
        if (!isDefaultPaletteMode) {
            const statusElement = document.getElementById('paletteStatus');
            if (statusElement && statusElement.textContent && statusElement.textContent.includes('Palette:')) {
                paletteName = statusElement.textContent.replace('Palette: ','').trim() || 'Custom';
            } else {
                paletteName = 'Custom';
            }
        }
        let infoText = `Size: ${compositePixelWidth}x${compositePixelHeight} pixels (${compositeWidthInSprites}x${compositeHeightInSprites} sprites) | Palette: ${paletteName}`;
        if (viewState.mode === 'sprite4' || viewState.mode === 'tile8x8') {
            infoText += ` | Offset: ${viewState.paletteOffset}`;
        }
        detailInfoDiv.textContent = infoText;
    }
    
    // Update footer text
    const footerDiv = document.querySelector('.footer'); 
    if (footerDiv) {
        footerDiv.textContent = `ZX Next Sprite format: ${spriteData.count} sprites loaded. Brush: ${brush.width}x${brush.height}.`;
    }
    
    // Update detail title
    const detailTitleH2 = document.querySelector('.sprite-detail-container h2'); 
    if (detailTitleH2) {
        detailTitleH2.innerHTML = `Sprite Brush Detail (Top-Left: ${topLeftSpriteIndex}, Size: ${brush.width}x${brush.height})`;
    }

    // Update the CSS variable for detail pixel size
    if (typeof window.updateDetailPixelSizeCss === 'function') {
        window.updateDetailPixelSizeCss();
    }

    console.log(`[Renderer] >>> redrawDetailView END (Mode: ${viewState.mode}, Sprite: ${viewState.currentSprite}, Brush: ${brush.width}x${brush.height})`);
}

// --- Helper to update sprite pixel display colors when palette changes --- 
export function updateSpritePixelColors(spriteListContainer, mainSpriteDetailContainer, spriteData, viewState, currentPalette, colorIndexToUpdate, newHexColor) {
    const displayIndexToUpdate = colorIndexToUpdate; 
    
    // Update pixels in the main grid
    const spriteBoxes = spriteListContainer?.querySelectorAll('.sprite-box');
    spriteBoxes?.forEach(box => {
        const spriteIndex = parseInt(box.dataset.index, 10);
        if (!isNaN(spriteIndex) && spriteData?.sprites && spriteIndex < spriteData.sprites.length) {
            const sprite = spriteData.sprites[spriteIndex];
            const pixelElements = box.querySelectorAll('.sprite-pixel');
            pixelElements.forEach((pixelEl, pixelIdx) => {
                const rawPixelIndex = sprite.pixels[pixelIdx];
                const displayIndex = getDisplayColorIndex(rawPixelIndex, currentPalette, viewState);
                if (displayIndex === displayIndexToUpdate) {
                    (pixelEl).style.backgroundColor = newHexColor;
                }
            });
        }
    });

    // Update pixels in the detail view
    if (mainSpriteDetailContainer && spriteData?.sprites && viewState.currentSprite < spriteData.sprites.length) {
        const currentSprite = spriteData.sprites[viewState.currentSprite];
        const detailPixelElements = mainSpriteDetailContainer.querySelectorAll('.detail-pixel');
         detailPixelElements.forEach((pixelEl, pixelIdx) => {
            const rawPixelIndex = currentSprite.pixels[pixelIdx];
            const displayIndex = getDisplayColorIndex(rawPixelIndex, currentPalette, viewState);
            if (displayIndex === displayIndexToUpdate) {
                (pixelEl).style.backgroundColor = newHexColor;
            }
        });
    }
} 