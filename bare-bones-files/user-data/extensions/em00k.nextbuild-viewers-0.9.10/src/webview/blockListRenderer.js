const blockListRenderer = {
    ctx: null,
    canvas: null,

    // Initialization function to set canvas and context
    init: function(canvasElement, context) {
        this.canvas = canvasElement;
        this.ctx = context;
        console.log('[blockListRenderer] Initialized with canvas and context.');
    },

    // --- NEW Block List Interaction Handler ---
    handleInteraction: function(event, isDragging, blockData, spriteData, viewState, selectedTileIndex, interactionState, postMessageFunc, enableSaveButtonFunc, getColorFunc, customPaletteHex) {
        if (!this.canvas || !this.ctx || !blockData || !spriteData) {
            return interactionState; // Return unchanged state
        }

        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const scale = viewState.scale;
        const blockLayoutWidth = viewState.blockWidth;
        const blockLayoutHeight = viewState.blockHeight;
        const spritePixelWidth = spriteData.width;
        const spritePixelHeight = spriteData.height;

        const compoundBlockPixelWidth = blockLayoutWidth * spritePixelWidth * scale;
        const compoundBlockPixelHeight = blockLayoutHeight * spritePixelHeight * scale;
        const compoundBlockGap = 10 * scale;
        const maxCanvasWidth = 1200;
        const totalSpritesPerBlock = blockLayoutWidth * blockLayoutHeight;
        if (totalSpritesPerBlock <= 0) return interactionState; // Avoid division by zero
        const numCompoundBlocks = Math.ceil(blockData.blocks.length / totalSpritesPerBlock);
        let blocksPerRow = Math.max(1, Math.floor(maxCanvasWidth / (compoundBlockPixelWidth + compoundBlockGap)));
        if (numCompoundBlocks < blocksPerRow) blocksPerRow = numCompoundBlocks;

        const blockGridCol = Math.floor(clickX / (compoundBlockPixelWidth + compoundBlockGap));
        const blockGridRow = Math.floor(clickY / (compoundBlockPixelHeight + compoundBlockGap));

        const xInBlockGrid = clickX % (compoundBlockPixelWidth + compoundBlockGap);
        const yInBlockGrid = clickY % (compoundBlockPixelHeight + compoundBlockGap);

        if (blockGridCol >= blocksPerRow || xInBlockGrid > compoundBlockPixelWidth || yInBlockGrid > compoundBlockPixelHeight) {
            if (isDragging) {
                interactionState.lastEditedBlockIndex = -1;
                interactionState.lastEditedSpriteIndexInBlock = -1;
            }
            return interactionState;
        }

        const compoundBlockIndex = blockGridRow * blocksPerRow + blockGridCol;
        if (compoundBlockIndex >= numCompoundBlocks) {
            if (isDragging) {
                 interactionState.lastEditedBlockIndex = -1;
                 interactionState.lastEditedSpriteIndexInBlock = -1;
            }
            return interactionState;
        }

        const spriteColInBlock = Math.floor(xInBlockGrid / (spritePixelWidth * scale));
        const spriteRowInBlock = Math.floor(yInBlockGrid / (spritePixelHeight * scale));

        if (spriteColInBlock < 0 || spriteColInBlock >= blockLayoutWidth || spriteRowInBlock < 0 || spriteRowInBlock >= blockLayoutHeight) {
             if (isDragging) {
                interactionState.lastEditedBlockIndex = -1;
                interactionState.lastEditedSpriteIndexInBlock = -1;
             }
            return interactionState;
        }

        const spriteIndexInBlock = spriteRowInBlock * blockLayoutWidth + spriteColInBlock;

        if (isDragging && compoundBlockIndex === interactionState.lastEditedBlockIndex && spriteIndexInBlock === interactionState.lastEditedSpriteIndexInBlock) {
            return interactionState;
        }

        const nxbEntryIndex = compoundBlockIndex * totalSpritesPerBlock + spriteIndexInBlock;

        if (nxbEntryIndex >= blockData.blocks.length) {
            console.warn(`[blockListRenderer.handleInteraction] Calculated nxbEntryIndex ${nxbEntryIndex} is out of bounds (${blockData.blocks.length})`);
            if (isDragging) {
                interactionState.lastEditedBlockIndex = -1;
                interactionState.lastEditedSpriteIndexInBlock = -1;
            }
            return interactionState;
        }

        if (blockData.blocks[nxbEntryIndex].spriteIndex !== selectedTileIndex) {
            console.log(`[blockListRenderer.handleInteraction] Placing tile ${selectedTileIndex} in block ${compoundBlockIndex}, inner pos (${spriteColInBlock}, ${spriteRowInBlock}), nxb index ${nxbEntryIndex}${isDragging ? ' (Drag)' : ''}`);

            blockData.blocks[nxbEntryIndex].spriteIndex = selectedTileIndex; // Modify data

            this.drawSingleSpriteInBlock(compoundBlockIndex, spriteIndexInBlock, selectedTileIndex, blockData, spriteData, viewState, getColorFunc, customPaletteHex); // Use internal call

            enableSaveButtonFunc(); // Call callback

            postMessageFunc({ // Use callback
                command: 'blockEditOccurred',
                index: nxbEntryIndex,
                value: selectedTileIndex
            });
        }

        if (isDragging) {
            interactionState.lastEditedBlockIndex = compoundBlockIndex;
            interactionState.lastEditedSpriteIndexInBlock = spriteIndexInBlock;
        }
        return interactionState;
    },

    // --- NEW Canvas Drawing: Block List ---
    drawBlockList: function(blockData, spriteData, viewState, getColorFunc, customPaletteHex) {
        if (!this.ctx || !blockData || !spriteData) {
            console.warn('[BlockListRenderer] Cannot draw: Missing context, block data, or sprite data.');
            return;
        }

        if (!blockData.blocks || !spriteData.sprites) {
            console.warn('[BlockListRenderer] Empty block list or sprite list.');
            return; 
        }

        // Cache colors to avoid excessive calls to getColorFunc
        const colorCache = new Map();
        const getCachedColor = (index) => {
            if (colorCache.has(index)) {
                return colorCache.get(index);
            }
            const color = getColorFunc(index, customPaletteHex);
            colorCache.set(index, color);
            return color;
        };
        
        console.log('[blockListRenderer.drawBlockList] Starting draw...');

        const scale = viewState.scale;
        const showGrid = viewState.showGrid;
        const blockLayoutWidth = viewState.blockWidth;
        const blockLayoutHeight = viewState.blockHeight;
        const spritePixelWidth = spriteData.width;
        const spritePixelHeight = spriteData.height;

        const totalSpritesPerBlock = blockLayoutWidth * blockLayoutHeight;
        if (totalSpritesPerBlock <= 0) return;

        const numCompoundBlocks = Math.ceil(blockData.blocks.length / totalSpritesPerBlock);

        const compoundBlockPixelWidth = blockLayoutWidth * spritePixelWidth * scale;
        const compoundBlockPixelHeight = blockLayoutHeight * spritePixelHeight * scale;
        const compoundBlockGap = 10 * scale;
        const maxCanvasWidth = 1200;

        let blocksPerRow = Math.max(1, Math.floor(maxCanvasWidth / (compoundBlockPixelWidth + compoundBlockGap)));
        if (numCompoundBlocks < blocksPerRow) {
            blocksPerRow = numCompoundBlocks;
        }

        const totalRows = Math.ceil(numCompoundBlocks / blocksPerRow);

        const canvasWidth = blocksPerRow * compoundBlockPixelWidth + Math.max(0, blocksPerRow - 1) * compoundBlockGap;
        const canvasHeight = totalRows * compoundBlockPixelHeight + Math.max(0, totalRows - 1) * compoundBlockGap;

        console.log(`[blockListRenderer.drawBlockList] Layout: ${numCompoundBlocks} blocks, ${blockLayoutWidth}x${blockLayoutHeight} sprites each. Grid: ${blocksPerRow} cols, ${totalRows} rows. Canvas: ${canvasWidth}x${canvasHeight}`);

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';

        this.ctx.imageSmoothingEnabled = false;

        requestAnimationFrame(() => {
            if (!blockData || blockData.isMapFile || !spriteData || !this.ctx) return;
            console.log('[blockListRenderer.drawBlockList RAF] Executing draw frame.');

            this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            let currentNxbIndex = 0;
            for (let blockRow = 0; blockRow < totalRows; blockRow++) {
                for (let blockCol = 0; blockCol < blocksPerRow; blockCol++) {
                    const compoundBlockIndex = blockRow * blocksPerRow + blockCol;
                    if (compoundBlockIndex >= numCompoundBlocks) break;

                    const blockCanvasX = blockCol * (compoundBlockPixelWidth + compoundBlockGap);
                    const blockCanvasY = blockRow * (compoundBlockPixelHeight + compoundBlockGap);

                    for (let spriteRow = 0; spriteRow < blockLayoutHeight; spriteRow++) {
                        for (let spriteCol = 0; spriteCol < blockLayoutWidth; spriteCol++) {
                            if (currentNxbIndex >= blockData.blocks.length) break;

                            const spriteIndexToDraw = blockData.blocks[currentNxbIndex].spriteIndex;
                            const sprite = spriteData.sprites[spriteIndexToDraw];

                            const spriteCanvasX = blockCanvasX + spriteCol * spritePixelWidth * scale;
                            const spriteCanvasY = blockCanvasY + spriteRow * spritePixelHeight * scale;

                            if (sprite && sprite.pixels) {
                                for (let py = 0; py < spritePixelHeight; py++) {
                                    for (let px = 0; px < spritePixelWidth; px++) {
                                        const pixelIndexInSprite = py * spritePixelWidth + px;
                                        if (pixelIndexInSprite >= sprite.pixels.length) continue;

                                        const colorIndex = sprite.pixels[pixelIndexInSprite];
                                        if (colorIndex === 0 && !customPaletteHex) continue;

                                        const color = getCachedColor(colorIndex);
                                        this.ctx.fillStyle = color;

                                        const pixelCanvasX = spriteCanvasX + px * scale;
                                        const pixelCanvasY = spriteCanvasY + py * scale;
                                        this.ctx.fillRect(pixelCanvasX, pixelCanvasY, scale, scale);

                                        if (scale >= 4) {
                                            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                                            const textPadding = 2;
                                            const fontSize = Math.max(8, Math.min(12, scale * 1.5));
                                            this.ctx.font = `${fontSize}px sans-serif`;
                                            this.ctx.textAlign = 'left';
                                            this.ctx.textBaseline = 'top';
                                            const text = spriteIndexToDraw.toString();
                                            const textMetrics = this.ctx.measureText(text);
                                            this.ctx.fillRect(
                                                spriteCanvasX + textPadding,
                                                spriteCanvasY + textPadding,
                                                textMetrics.width + 2,
                                                fontSize + 1
                                            );
                                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                            this.ctx.fillText(text, spriteCanvasX + textPadding + 1, spriteCanvasY + textPadding + 1);
                                        }
                                    }
                                }
                            } else {
                                this.ctx.fillStyle = '#ccc';
                                this.ctx.fillRect(spriteCanvasX, spriteCanvasY, spritePixelWidth * scale, spritePixelHeight * scale);
                                this.ctx.fillStyle = '#888';
                                const fontSize = Math.min(spritePixelWidth, spritePixelHeight) * scale * 0.5;
                                this.ctx.font = `${fontSize}px sans-serif`;
                                this.ctx.textAlign = 'center';
                                this.ctx.textBaseline = 'middle';
                                this.ctx.fillText('?', spriteCanvasX + (spritePixelWidth * scale / 2), spriteCanvasY + (spritePixelHeight * scale / 2));
                            }
                            currentNxbIndex++;
                        }
                        if (currentNxbIndex >= blockData.blocks.length) break;
                    }

                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    const fontSize = Math.max(10, Math.min(16, compoundBlockPixelHeight * 0.1));
                    this.ctx.font = `${fontSize}px sans-serif`;
                    this.ctx.textAlign = 'left';
                    this.ctx.textBaseline = 'top';
                    this.ctx.fillText(`Block ${compoundBlockIndex}`, blockCanvasX + 4 * scale, blockCanvasY + 4 * scale);

                    if (showGrid) {
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
                        for (let sgx = 1; sgx < blockLayoutWidth; sgx++) {
                            const lineX = blockCanvasX + sgx * spritePixelWidth * scale;
                            this.ctx.beginPath(); this.ctx.moveTo(lineX, blockCanvasY); this.ctx.lineTo(lineX, blockCanvasY + compoundBlockPixelHeight); this.ctx.stroke();
                        }
                        for (let sgy = 1; sgy < blockLayoutHeight; sgy++) {
                            const lineY = blockCanvasY + sgy * spritePixelHeight * scale;
                            this.ctx.beginPath(); this.ctx.moveTo(blockCanvasX, lineY); this.ctx.lineTo(blockCanvasX + compoundBlockPixelWidth, lineY); this.ctx.stroke();
                        }

                        if (scale >= 4) {
                            this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
                            for (let spriteRow = 0; spriteRow < blockLayoutHeight; spriteRow++) {
                                for (let spriteCol = 0; spriteCol < blockLayoutWidth; spriteCol++) {
                                    const spriteCanvasX = blockCanvasX + spriteCol * spritePixelWidth * scale;
                                    const spriteCanvasY = blockCanvasY + spriteRow * spritePixelHeight * scale;
                                    for (let px = 1; px < spritePixelWidth; px++) {
                                        const pixelLineX = spriteCanvasX + px * scale;
                                        this.ctx.beginPath(); this.ctx.moveTo(pixelLineX, spriteCanvasY); this.ctx.lineTo(pixelLineX, spriteCanvasY + spritePixelHeight * scale); this.ctx.stroke();
                                    }
                                     for (let py = 1; py < spritePixelHeight; py++) {
                                        const pixelLineY = spriteCanvasY + py * scale;
                                        this.ctx.beginPath(); this.ctx.moveTo(spriteCanvasX, pixelLineY); this.ctx.lineTo(spriteCanvasX + spritePixelWidth * scale, pixelLineY); this.ctx.stroke();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            console.log('[blockListRenderer.drawBlockList RAF] Frame finished.');
        });
    },

    // --- NEW Function: Draw a single sprite within a compound block ---
    drawSingleSpriteInBlock: function(compoundBlockIndex, spriteIndexInBlock, newSpriteIndex, blockData, spriteData, viewState, getColorFunc, customPaletteHex) {
         if (!this.canvas || !this.ctx || !blockData || !spriteData) {
            console.warn('[blockListRenderer.drawSingleSpriteInBlock] skipped: conditions not met');
            return;
        }
        const ctx = this.ctx;

        // Cache colors to avoid excessive calls to getColorFunc
        const colorCache = new Map();
        const getCachedColor = (index) => {
            if (colorCache.has(index)) {
                return colorCache.get(index);
            }
            const color = getColorFunc(index, customPaletteHex);
            colorCache.set(index, color);
            return color;
        };

        const scale = viewState.scale;
        const showGrid = viewState.showGrid;
        const blockLayoutWidth = viewState.blockWidth;
        const blockLayoutHeight = viewState.blockHeight;
        const spritePixelWidth = spriteData.width;
        const spritePixelHeight = spriteData.height;

        const compoundBlockPixelWidth = blockLayoutWidth * spritePixelWidth * scale;
        const compoundBlockPixelHeight = blockLayoutHeight * spritePixelHeight * scale;
        const compoundBlockGap = 10 * scale;
        const maxCanvasWidth = 1200;
        const totalSpritesPerBlock = blockLayoutWidth * blockLayoutHeight;
        if (totalSpritesPerBlock <= 0) return;
        const numCompoundBlocks = Math.ceil(blockData.blocks.length / totalSpritesPerBlock);
        let blocksPerRow = Math.max(1, Math.floor(maxCanvasWidth / (compoundBlockPixelWidth + compoundBlockGap)));
        if (numCompoundBlocks < blocksPerRow) blocksPerRow = numCompoundBlocks;

        const blockGridRow = Math.floor(compoundBlockIndex / blocksPerRow);
        const blockGridCol = compoundBlockIndex % blocksPerRow;
        const blockCanvasX = blockGridCol * (compoundBlockPixelWidth + compoundBlockGap);
        const blockCanvasY = blockGridRow * (compoundBlockPixelHeight + compoundBlockGap);

        const spriteRowInBlock = Math.floor(spriteIndexInBlock / blockLayoutWidth);
        const spriteColInBlock = spriteIndexInBlock % blockLayoutWidth;
        const spriteCanvasX = blockCanvasX + spriteColInBlock * spritePixelWidth * scale;
        const spriteCanvasY = blockCanvasY + spriteRowInBlock * spritePixelHeight * scale;
        const spriteCanvasWidth = spritePixelWidth * scale;
        const spriteCanvasHeight = spritePixelHeight * scale;

        ctx.clearRect(spriteCanvasX, spriteCanvasY, spriteCanvasWidth, spriteCanvasHeight);

        const sprite = spriteData.sprites[newSpriteIndex];

        if (sprite && sprite.pixels) {
            for (let py = 0; py < spritePixelHeight; py++) {
                for (let px = 0; px < spritePixelWidth; px++) {
                    const pixelIndexInSprite = py * spritePixelWidth + px;
                    if (pixelIndexInSprite >= sprite.pixels.length) continue;

                    const colorIndex = sprite.pixels[pixelIndexInSprite];
                    if (colorIndex === 0 && !customPaletteHex) continue;

                    const color = getCachedColor(colorIndex);
                    ctx.fillStyle = color;
                    ctx.fillRect(spriteCanvasX + px * scale, spriteCanvasY + py * scale, scale, scale);

                    if (scale >= 4) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        const textPadding = 2;
                        const fontSize = Math.max(8, Math.min(12, scale * 1.5));
                        ctx.font = `${fontSize}px sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        const text = newSpriteIndex.toString();
                        const textMetrics = ctx.measureText(text);
                        ctx.fillRect(spriteCanvasX + textPadding, spriteCanvasY + textPadding, textMetrics.width + 2, fontSize + 1);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.fillText(text, spriteCanvasX + textPadding + 1, spriteCanvasY + textPadding + 1);
                    }
                }
            }
        } else {
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(spriteCanvasX, spriteCanvasY, spriteCanvasWidth, spriteCanvasHeight);
            ctx.fillStyle = '#666666';
            const fontSize = Math.min(spriteCanvasWidth, spriteCanvasHeight) * 0.5;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(newSpriteIndex.toString(), spriteCanvasX + spriteCanvasWidth / 2, spriteCanvasY + spriteCanvasHeight / 2);
        }

        if (showGrid) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
            // Remove explicit border draw for single sprite - might cause jump
            // ctx.strokeRect(spriteCanvasX, spriteCanvasY, spriteCanvasWidth, spriteCanvasHeight);

            if (scale >= 4) {
                ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
                for (let px = 1; px < spritePixelWidth; px++) {
                    const lineX = spriteCanvasX + px * scale;
                    ctx.beginPath(); ctx.moveTo(lineX, spriteCanvasY); ctx.lineTo(lineX, spriteCanvasY + spriteCanvasHeight); ctx.stroke();
                }
                for (let py = 1; py < spritePixelHeight; py++) {
                    const lineY = spriteCanvasY + py * scale;
                    ctx.beginPath(); ctx.moveTo(spriteCanvasX, lineY); ctx.lineTo(spriteCanvasX + spriteCanvasWidth, lineY); ctx.stroke();
                }
            }
        }
    }
}; 