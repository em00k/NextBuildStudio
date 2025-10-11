const mapRenderer = {
    ctx: null,
    canvas: null,
    tileCache: new Map(), // Cache for pre-rendered tiles
    lastPaletteUsedForCache: null, // Track palette for cache invalidation
    
    // Viewport properties
    viewportScrollY: 0,
    viewportHeight: 600, // Default viewport height, will be updated based on container
    isViewportMode: false, // Will be true for maps larger than threshold
    totalMapHeight: 0, // Will store the total map height in pixels
    largeMapThreshold: 100, // Maps taller than this will use viewport rendering

    // Initialization function to set canvas and context
    init: function(canvasElement, context) {
        this.canvas = canvasElement;
        this.ctx = context;
        console.log('[mapRenderer] Initialized with canvas and context.');
        
        // Run diagnostics to help identify issues
        this.diagnoseMissingMapElements();
        
        // Set up scroll listener for viewport mode
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            // Update viewport height based on container's parent (outer container)
            const outerContainer = document.getElementById('map-canvas-outer-container');
            if (outerContainer) {
                // Set a fixed height on the outer container to enable scrolling
                outerContainer.style.height = '600px'; // Default height
                outerContainer.style.overflow = 'auto';
                this.viewportHeight = outerContainer.clientHeight;
                
                // Add scroll listener
                outerContainer.addEventListener('scroll', (e) => {
                    if (this.isViewportMode) {
                        this.viewportScrollY = outerContainer.scrollTop;
                        this.renderViewport();
                    }
                });
                
                // Also handle resize
                window.addEventListener('resize', () => {
                    if (this.isViewportMode) {
                        this.viewportHeight = outerContainer.clientHeight;
                        this.renderViewport();
                    }
                });
                
                console.log(`[mapRenderer] Viewport height set to ${this.viewportHeight}px`);
            }
        }
    },

    // --- NEW: Clear the tile cache --- 
    clearTileCache: function() {
        this.tileCache.clear();
        this.lastPaletteUsedForCache = null; // Reset palette tracking
        console.log("[mapRenderer] Tile cache cleared.");
    },

    // --- Map Editing ---
    handleMapInteraction: function(event, isDragging, blockData, spriteData, viewState, selectedTileIndex, interactionState, postMessageFunc, enableSaveButtonFunc, getColorFunc, customPalette) {
        if (!this.canvas || !this.ctx || !blockData || !spriteData) {
            // console.warn("Map interaction skipped: conditions not met");
            return interactionState; // Return unchanged state
        }

        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const scale = viewState.scale;
        const tileWidth = spriteData.width;
        const tileHeight = spriteData.height;
        const mapWidthTiles = blockData.width;

        const tileX = Math.floor(clickX / (tileWidth * scale));
        const tileY = Math.floor(clickY / (tileHeight * scale));

        if (tileX < 0 || tileX >= mapWidthTiles || tileY < 0 || tileY >= blockData.height) {
            if (isDragging) {
                 interactionState.lastDraggedTileX = -1;
                 interactionState.lastDraggedTileY = -1;
            }
            return interactionState;
        }

        if (isDragging && tileX === interactionState.lastDraggedTileX && tileY === interactionState.lastDraggedTileY) {
            return interactionState;
        }

        const mapIndex = tileY * mapWidthTiles + tileX;
        if (mapIndex >= blockData.indices.length) {
            console.warn("[mapRenderer.handleMapInteraction] Interaction calculation resulted in out-of-bounds map index:", mapIndex);
            return interactionState;
        }

        if (blockData.indices[mapIndex] !== selectedTileIndex) {
            console.log(`[mapRenderer.handleMapInteraction] Placing tile ${selectedTileIndex} at (${tileX}, ${tileY}), map index ${mapIndex}${isDragging ? ' (Drag)':''}`);
            blockData.indices[mapIndex] = selectedTileIndex; // Modify data

            enableSaveButtonFunc(); // Call callback

            this.drawTile(tileX, tileY, selectedTileIndex, spriteData, viewState, getColorFunc, customPalette); 

            postMessageFunc({ command: 'mapEditOccurred' }); // Use callback
        }

        if (isDragging) {
            interactionState.lastDraggedTileX = tileX;
            interactionState.lastDraggedTileY = tileY;
        }
        return interactionState;
    },

    // --- Canvas Drawing ---
    drawMap: function(blockData, spriteData, viewState, getColorFunc, customPalette) {
        try {
            console.log('[mapRenderer.drawMap] Starting drawMap with data:', {
                blockDataExists: !!blockData,
                isMapFile: blockData?.isMapFile,
                mapDimensions: blockData ? `${blockData.width}x${blockData.height}` : 'undefined',
                indices: blockData?.indices ? `${blockData.indices.length} indices` : 'no indices',
                spriteDataExists: !!spriteData,
                spriteDimensions: spriteData ? `${spriteData.width}x${spriteData.height}` : 'undefined',
                spriteCount: spriteData?.sprites ? spriteData.sprites.length : 'undefined',
                scale: viewState?.scale
            });
            
            const ctx = this.ctx; // Use stored context
            if (!this.canvas || !ctx || !blockData || !spriteData) {
                console.error('[mapRenderer.drawMap] MISSING CRITICAL DATA:', {
                    canvas: !!this.canvas,
                    ctx: !!ctx,
                    blockData: !!blockData,
                    spriteData: !!spriteData
                });
                return;
            }

            // Check that map data is valid
            if (!blockData.isMapFile || !blockData.indices || !blockData.width || !blockData.height) {
                console.error('[mapRenderer.drawMap] Invalid map data format:', {
                    isMapFile: blockData.isMapFile,
                    hasIndices: !!blockData.indices,
                    width: blockData.width,
                    height: blockData.height
                });
                return;
            }
            
            // Check that sprite data is valid
            if (!spriteData.sprites || !spriteData.width || !spriteData.height) {
                console.error('[mapRenderer.drawMap] Invalid sprite data format:', {
                    hasSprites: !!spriteData.sprites,
                    width: spriteData.width,
                    height: spriteData.height
                });
                return;
            }

            // --- Cache Invalidation Check --- 
            const currentPalette = customPalette || viewState.defaultPalette;
            if (currentPalette !== this.lastPaletteUsedForCache) {
                console.log("[mapRenderer.drawMap] Palette changed, clearing tile cache.");
                this.clearTileCache();
                this.lastPaletteUsedForCache = currentPalette;
            }
            
            // Store current data for viewport rendering
            this.currentMapData = blockData;
            this.currentSpriteData = spriteData;
            this.currentViewState = viewState;
            this.currentGetColorFunc = getColorFunc;
            this.currentCustomPalette = customPalette;

            const mapWidthTiles = blockData.width;
            const mapHeightTiles = blockData.height;
            if (!spriteData.width || !spriteData.height) {
                console.error("[mapRenderer.drawMap] error: Missing sprite data or dimensions!");
                return;
            }
            const tileWidthPixels = spriteData.width;
            const tileHeightPixels = spriteData.height;
            const scale = viewState.scale;
            const showGrid = viewState.showGrid;

            const canvasWidth = mapWidthTiles * tileWidthPixels * scale;
            const canvasHeight = mapHeightTiles * tileHeightPixels * scale;
            this.totalMapHeight = canvasHeight;

            console.log(`[mapRenderer.drawMap] Resizing canvas. MapTiles: ${mapWidthTiles}x${mapHeightTiles}, TilePixels: ${tileWidthPixels}x${tileHeightPixels}, Scale: ${scale}, Calculated Dims: ${canvasWidth}x${canvasHeight}`);

            // Check if the map is large enough to warrant viewport rendering
            this.isViewportMode = mapHeightTiles > this.largeMapThreshold;
            
            if (this.isViewportMode) {
                console.log(`[mapRenderer.drawMap] Using viewport rendering for large map (${mapHeightTiles} rows)`);
                
                // Create an outer container with fixed height and scrolling
                const mapContainer = document.getElementById('map-container');
                const outerContainer = document.getElementById('map-canvas-outer-container');
                
                if (mapContainer && outerContainer) {
                    // Set map container to full map size
                    mapContainer.style.width = canvasWidth + 'px';
                    mapContainer.style.height = canvasHeight + 'px';
                    
                    // Make sure canvas is same size as map
                    this.canvas.width = canvasWidth;
                    this.canvas.height = canvasHeight;
                    this.canvas.style.width = canvasWidth + 'px';
                    this.canvas.style.height = canvasHeight + 'px';
                    
                    // Setup viewport
                    this.viewportHeight = outerContainer.clientHeight;
                    this.viewportScrollY = outerContainer.scrollTop;
                    
                    // Render visible portion immediately
                    this.renderViewport();
                    return;
                } else {
                    console.error('[mapRenderer.drawMap] Missing required containers for viewport rendering');
                }
            }
            
            // For smaller maps, use the original rendering approach
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            this.canvas.style.width = canvasWidth + 'px';
            this.canvas.style.height = canvasHeight + 'px';

            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                console.log(`[mapRenderer.drawMap] Setting #map-container style size to ${canvasWidth}x${canvasHeight}`);
                mapContainer.style.width = canvasWidth + 'px';
                mapContainer.style.height = canvasHeight + 'px';
            } else {
                console.warn('[mapRenderer.drawMap] Could not find #map-container to set style size.');
            }

            ctx.imageSmoothingEnabled = false;

            // Continue with original rendering approach for smaller maps
            requestAnimationFrame(() => {
                // Re-read potentially changed data inside RAF if needed, but for drawing, blockData/spriteData refs should be okay
                // unless they are completely replaced asynchronously, which isn't the current pattern.
                if (!blockData || !blockData.isMapFile || !blockData.indices || !spriteData || !spriteData.width || !spriteData.height || !ctx) {
                    console.error("[mapRenderer.drawMap RAF] Missing critical data inside RAF callback.");
                    return;
                }
                const width = blockData.width;
                const height = blockData.height;
                const indices = blockData.indices;
                const tWidth = spriteData.width;
                const tHeight = spriteData.height;
                const currentScale = viewState.scale; // Use viewState passed to parent function
                const currentShowGrid = viewState.showGrid;
                // Local reference to the cache for the loop
                const cache = this.tileCache; 

                const calculatedCanvasWidth = width * tWidth * currentScale;
                const calculatedCanvasHeight = height * tHeight * currentScale;

                console.log(`[mapRenderer.drawMap RAF] Drawing with Map: ${width}x${height}, Indices: ${indices.length}, Tile: ${tWidth}x${tHeight}, Scale: ${currentScale}`);

                ctx.clearRect(0, 0, calculatedCanvasWidth, calculatedCanvasHeight);

                for (let ty = 0; ty < height; ty++) {
                    for (let tx = 0; tx < width; tx++) {
                        const mapIndex = ty * width + tx;
                        if (mapIndex >= indices.length) { continue; }

                        const spriteIndex = indices[mapIndex];
                        // const sprite = spriteData.sprites[spriteIndex]; // Don't need full sprite data here anymore
                        
                        let cachedTileCanvas = cache.get(spriteIndex);

                        // If tile not in cache, render it and add it
                        if (!cachedTileCanvas) {
                            const sprite = spriteData.sprites[spriteIndex];
                            if (sprite && sprite.pixels) {
                                // Create offscreen canvas for this tile
                                cachedTileCanvas = document.createElement('canvas');
                                cachedTileCanvas.width = tWidth * currentScale;
                                cachedTileCanvas.height = tHeight * currentScale;
                                const tileCtx = cachedTileCanvas.getContext('2d');
                                if (tileCtx) {
                                    tileCtx.imageSmoothingEnabled = false;
                                    const tilePixels = sprite.pixels;
                                    for (let py = 0; py < tHeight; py++) {
                                        for (let px = 0; px < tWidth; px++) {
                                            const pixelIndexInSprite = py * tWidth + px;
                                            if (pixelIndexInSprite >= tilePixels.length) { continue; }

                                            const colorIndex = tilePixels[pixelIndexInSprite];
                                            // Skip transparent ONLY for default palette (index 0)
                                            if (colorIndex === 0 && !customPalette) { continue; }

                                            const color = getColorFunc(colorIndex);
                                            tileCtx.fillStyle = color;
                                            tileCtx.fillRect(px * currentScale, py * currentScale, currentScale, currentScale);
                                        }
                                    }
                                    // Add to cache
                                    cache.set(spriteIndex, cachedTileCanvas);
                                } else {
                                    console.error(`[mapRenderer] Failed to get context for offscreen tile canvas (sprite ${spriteIndex})`);
                                    cachedTileCanvas = null; // Ensure it remains null if context fails
                                }
                            } else {
                                 // Handle missing sprite data for index (draw placeholder on cache canvas?)
                                 // Create a placeholder canvas
                                 cachedTileCanvas = document.createElement('canvas');
                                 cachedTileCanvas.width = tWidth * currentScale;
                                 cachedTileCanvas.height = tHeight * currentScale;
                                 const tileCtx = cachedTileCanvas.getContext('2d');
                                 if (tileCtx) {
                                     tileCtx.fillStyle = '#cccccc';
                                     tileCtx.fillRect(0, 0, cachedTileCanvas.width, cachedTileCanvas.height);
                                     tileCtx.fillStyle = '#888888';
                                     tileCtx.font = (tWidth * currentScale * 0.6) + 'px sans-serif';
                                     tileCtx.textAlign = 'center';
                                     tileCtx.textBaseline = 'middle';
                                     tileCtx.fillText('?', cachedTileCanvas.width / 2, cachedTileCanvas.height / 2);
                                     cache.set(spriteIndex, cachedTileCanvas); // Cache the placeholder
                                 } else {
                                      cachedTileCanvas = null;
                                 }
                            }
                        }
                        
                        // Draw the cached tile (or placeholder) onto the main canvas
                        if (cachedTileCanvas) {
                            const canvasX = tx * tWidth * currentScale;
                            const canvasY = ty * tHeight * currentScale;
                            ctx.drawImage(cachedTileCanvas, canvasX, canvasY);
                        }
                        
                        // ---- OLD PIXEL DRAWING LOGIC (Remove/Comment Out) ----
                        /*
                        if (sprite && sprite.pixels) {
                            const tilePixels = sprite.pixels;
                            // ... nested loops for px, py ...
                                    const color = getColorFunc(colorIndex); // Use updated signature
                                    ctx.fillStyle = color;
                                    const pixelCanvasX = (tx * tWidth + px) * currentScale;
                                    const pixelCanvasY = (ty * tHeight + py) * currentScale;
                                    ctx.fillRect(pixelCanvasX, pixelCanvasY, currentScale, currentScale);
                        // ... 
                        } else {
                            // ... placeholder drawing ... 
                        }
                        */
                    }
                }

                if (currentShowGrid) {
                     ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
                     ctx.lineWidth = 1;
                     for (let txGrid = 1; txGrid < width; txGrid++) {
                         const x = txGrid * tWidth * currentScale;
                         ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, calculatedCanvasHeight); ctx.stroke();
                     }
                     for (let tyGrid = 1; tyGrid < height; tyGrid++) {
                         const y = tyGrid * tHeight * currentScale;
                         ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(calculatedCanvasWidth, y); ctx.stroke();
                     }
                     if (currentScale >= 4) {
                         ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
                         for (let x = 1; x < width * tWidth; x++) {
                             if (x % tWidth !== 0) {
                                 const pixelGridX = x * currentScale;
                                 ctx.beginPath(); ctx.moveTo(pixelGridX, 0); ctx.lineTo(pixelGridX, calculatedCanvasHeight); ctx.stroke();
                             }
                         }
                         for (let y = 1; y < height * tHeight; y++) {
                              if (y % tHeight !== 0) {
                                 const pixelGridY = y * currentScale;
                                 ctx.beginPath(); ctx.moveTo(0, pixelGridY); ctx.lineTo(calculatedCanvasWidth, pixelGridY); ctx.stroke();
                             }
                         }
                     }
                }
            });
        } catch (error) {
            console.error('[mapRenderer.drawMap] Uncaught error in drawMap:', error);
        }
    },

    // --- NEW Function: Draw a single tile ---
    drawTile: function(tileX, tileY, spriteIndex, spriteData, viewState, getColorFunc, customPalette) {
        if (!this.canvas || !this.ctx || !spriteData || spriteIndex === undefined || spriteIndex === null) {
            console.warn("[mapRenderer.drawTile] skipped: conditions not met or invalid spriteIndex");
            return;
        }
        const ctx = this.ctx;
        const cache = this.tileCache; // Use the cache

        const scale = viewState.scale;
        const showGrid = viewState.showGrid;
        const tileWidthPixels = spriteData.width;
        const tileHeightPixels = spriteData.height;

        if (!tileWidthPixels || !tileHeightPixels) {
            console.error("[mapRenderer.drawTile] skipped: sprite dimensions missing");
            return;
        }

        const canvasX = tileX * tileWidthPixels * scale;
        const canvasY = tileY * tileHeightPixels * scale;
        const tileCanvasWidth = tileWidthPixels * scale;
        const tileCanvasHeight = tileHeightPixels * scale;

        // --- Get tile from cache or render it --- 
        let tileToDraw = cache.get(spriteIndex);
        if (!tileToDraw) {
            const sprite = spriteData.sprites[spriteIndex];
             // Create offscreen canvas for this tile
             tileToDraw = document.createElement('canvas');
             tileToDraw.width = tileWidthPixels * scale;
             tileToDraw.height = tileHeightPixels * scale;
             const tileCtx = tileToDraw.getContext('2d');

            if (tileCtx && sprite && sprite.pixels) {
                tileCtx.imageSmoothingEnabled = false;
                const tilePixels = sprite.pixels;
                for (let py = 0; py < tileHeightPixels; py++) {
                    for (let px = 0; px < tileWidthPixels; px++) {
                        const pixelIndexInSprite = py * tileWidthPixels + px;
                        if (pixelIndexInSprite >= tilePixels.length) { continue; }
                        const colorIndex = tilePixels[pixelIndexInSprite];
                         // Skip transparent ONLY for default palette (index 0)
                        if (colorIndex === 0 && !customPalette) {continue;}
                        const color = getColorFunc(colorIndex);
                        tileCtx.fillStyle = color;
                        tileCtx.fillRect(px * scale, py * scale, scale, scale);
                    }
                }
                cache.set(spriteIndex, tileToDraw); // Add to cache
            } else {
                // Handle missing sprite data or context failure - Draw placeholder ONTO tileToDraw
                if (tileCtx) {
                    tileCtx.fillStyle = '#cccccc';
                    tileCtx.fillRect(0, 0, tileToDraw.width, tileToDraw.height);
                    tileCtx.fillStyle = '#666666';
                    const fontSize = Math.min(tileCanvasWidth, tileCanvasHeight) * 0.5;
                    tileCtx.font = `${fontSize}px sans-serif`;
                    tileCtx.textAlign = 'center';
                    tileCtx.textBaseline = 'middle';
                    const textToShow = spriteIndex.toString();
                    tileCtx.fillText(textToShow, tileToDraw.width / 2, tileToDraw.height / 2);
                    cache.set(spriteIndex, tileToDraw); // Cache placeholder
                } else {
                    console.error(`[mapRenderer.drawTile] Failed to get context for offscreen tile canvas (sprite ${spriteIndex})`);
                    tileToDraw = null; // Set to null if context failed
                }
            }
        }
        // --- End Get tile from cache --- 

        // Clear the area on the main canvas first
        ctx.clearRect(canvasX, canvasY, tileCanvasWidth, tileCanvasHeight);

        // Draw the cached tile (or placeholder) if available
        if (tileToDraw) {
            ctx.drawImage(tileToDraw, canvasX, canvasY);
        }

        // Redraw grid lines for this specific tile area if needed
        if (showGrid) {
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.lineWidth = 1;
            // Draw right and bottom border
            ctx.strokeRect(canvasX, canvasY, tileCanvasWidth, tileCanvasHeight);
            // Draw internal pixel grid if scale is high enough
             if (scale >= 4) {
                 ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
                 for (let pxGrid = 1; pxGrid < tileWidthPixels; pxGrid++) {
                     const x = canvasX + pxGrid * scale;
                     ctx.beginPath(); ctx.moveTo(x, canvasY); ctx.lineTo(x, canvasY + tileCanvasHeight); ctx.stroke();
                 }
                 for (let pyGrid = 1; pyGrid < tileHeightPixels; pyGrid++) {
                     const y = canvasY + pyGrid * scale;
                     ctx.beginPath(); ctx.moveTo(canvasX, y); ctx.lineTo(canvasX + tileCanvasWidth, y); ctx.stroke();
                 }
             }
        }
    },

    // Add this function after the init function
    diagnoseMissingMapElements: function() {
        console.log("[mapRenderer.diagnose] Starting diagnostic check...");
        
        // Check for the map container elements
        const mapContainer = document.getElementById('map-container');
        const mapCanvasOuter = document.getElementById('map-canvas-outer-container');
        const mapCanvas = document.getElementById('mapCanvas');
        
        console.log("[mapRenderer.diagnose] DOM elements check:", {
            mapContainer: !!mapContainer,
            mapCanvasOuter: !!mapCanvasOuter,
            mapCanvas: !!mapCanvas,
            canvasContext: mapCanvas ? !!mapCanvas.getContext('2d') : false,
            thisCanvas: !!this.canvas,
            thisContext: !!this.ctx
        });
        
        // If elements are missing, output more info
        if (!mapContainer || !mapCanvas) {
            console.error('[mapRenderer.diagnose] Critical map elements missing!');
            
            // Check if content area exists but doesn't have the expected elements
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                console.log('[mapRenderer.diagnose] content-area exists but with HTML:', contentArea.innerHTML);
            } else {
                console.error('[mapRenderer.diagnose] content-area element missing completely');
            }
            
            // Check if there's map-specific UI
            const mapWidthInput = document.getElementById('mapWidth');
            const mapHeightInput = document.getElementById('mapHeight');
            console.log('[mapRenderer.diagnose] Map controls exist:', {
                mapWidthInput: !!mapWidthInput,
                mapHeightInput: !!mapHeightInput
            });
        }
    },

    // Add a new viewport rendering method
    renderViewport: function() {
        if (!this.currentMapData || !this.currentSpriteData || !this.currentViewState) {
            console.warn('[mapRenderer] Cannot render viewport: missing data');
            return;
        }
        
        console.log(`[mapRenderer] Rendering viewport at scroll position ${this.viewportScrollY}`);
        const blockData = this.currentMapData;
        const spriteData = this.currentSpriteData;
        const viewState = this.currentViewState;
        const getColorFunc = this.currentGetColorFunc;
        const customPalette = this.currentCustomPalette;
        
        const tileWidth = spriteData.width;
        const tileHeight = spriteData.height;
        const scale = viewState.scale;
        const tileWidthScaled = tileWidth * scale;
        const tileHeightScaled = tileHeight * scale;
        
        // Calculate which tiles are visible
        const startTileY = Math.floor(this.viewportScrollY / tileHeightScaled);
        const endTileY = Math.min(
            Math.ceil((this.viewportScrollY + this.viewportHeight) / tileHeightScaled),
            blockData.height
        );
        
        // Update map info panel
        const mapSizeInfo = document.getElementById('map-size-info');
        const viewportInfo = document.getElementById('map-viewport-info');
        
        if (mapSizeInfo) {
            mapSizeInfo.textContent = `Map size: ${blockData.width}×${blockData.height} tiles (${this.canvas.width}×${this.canvas.height}px)`;
        }
        
        if (viewportInfo) {
            const visibleRows = endTileY - startTileY;
            const percentVisible = Math.round((visibleRows / blockData.height) * 100);
            viewportInfo.textContent = `Viewing rows ${startTileY} - ${endTileY} (${visibleRows} rows, ${percentVisible}% of map)`;
        }
        
        // Clear the entire canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw only the visible tiles
        for (let ty = startTileY; ty < endTileY; ty++) {
            for (let tx = 0; tx < blockData.width; tx++) {
                const mapIndex = ty * blockData.width + tx;
                if (mapIndex >= blockData.indices.length) continue;
                
                const spriteIndex = blockData.indices[mapIndex];
                let cachedTile = this.tileCache.get(spriteIndex);
                
                // If tile not in cache, create it
                if (!cachedTile) {
                    this.createCachedTile(spriteIndex, spriteData, scale, tileWidth, tileHeight, getColorFunc, customPalette);
                    cachedTile = this.tileCache.get(spriteIndex);
                }
                
                // Draw the tile
                if (cachedTile) {
                    const canvasX = tx * tileWidthScaled;
                    const canvasY = ty * tileHeightScaled;
                    this.ctx.drawImage(cachedTile, canvasX, canvasY);
                }
            }
        }
        
        // Draw grid if needed
        if (viewState.showGrid) {
            this.drawGrid(startTileY, endTileY, blockData.width, tileWidthScaled, tileHeightScaled, scale);
        }
        
        console.log(`[mapRenderer] Viewport rendered from row ${startTileY} to ${endTileY}`);
    },
    
    // Helper to create and cache a tile
    createCachedTile: function(spriteIndex, spriteData, scale, tileWidth, tileHeight, getColorFunc, customPalette) {
        const sprite = spriteData.sprites[spriteIndex];
        const cachedTileCanvas = document.createElement('canvas');
        cachedTileCanvas.width = tileWidth * scale;
        cachedTileCanvas.height = tileHeight * scale;
        const tileCtx = cachedTileCanvas.getContext('2d');
        
        if (tileCtx && sprite && sprite.pixels) {
            tileCtx.imageSmoothingEnabled = false;
            const tilePixels = sprite.pixels;
            for (let py = 0; py < tileHeight; py++) {
                for (let px = 0; px < tileWidth; px++) {
                    const pixelIndexInSprite = py * tileWidth + px;
                    if (pixelIndexInSprite >= tilePixels.length) continue;
                    
                    const colorIndex = tilePixels[pixelIndexInSprite];
                    if (colorIndex === 0 && !customPalette) continue;
                    
                    const color = getColorFunc(colorIndex);
                    tileCtx.fillStyle = color;
                    tileCtx.fillRect(px * scale, py * scale, scale, scale);
                }
            }
        } else {
            // Draw placeholder
            if (tileCtx) {
                tileCtx.fillStyle = '#cccccc';
                tileCtx.fillRect(0, 0, cachedTileCanvas.width, cachedTileCanvas.height);
                tileCtx.fillStyle = '#888888';
                tileCtx.font = (tileWidth * scale * 0.6) + 'px sans-serif';
                tileCtx.textAlign = 'center';
                tileCtx.textBaseline = 'middle';
                tileCtx.fillText('?', cachedTileCanvas.width / 2, cachedTileCanvas.height / 2);
            }
        }
        
        this.tileCache.set(spriteIndex, cachedTileCanvas);
    },
    
    // Helper to draw grid lines
    drawGrid: function(startTileY, endTileY, mapWidth, tileWidthScaled, tileHeightScaled, scale) {
        const ctx = this.ctx;
        const startY = startTileY * tileHeightScaled;
        const endY = endTileY * tileHeightScaled;
        const width = mapWidth * tileWidthScaled;
        
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let tx = 1; tx < mapWidth; tx++) {
            const x = tx * tileWidthScaled;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let ty = startTileY; ty <= endTileY; ty++) {
            const y = ty * tileHeightScaled;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Pixel grid if scale is large enough
        if (scale >= 4) {
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
            // We'll only draw pixel grid for visible area
        }
    }
}; 