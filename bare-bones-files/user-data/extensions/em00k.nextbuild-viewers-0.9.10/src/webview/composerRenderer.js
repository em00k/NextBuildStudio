// Rendering logic for the Sprite Frame Composer will go here 

    // --- Rendering Functions --- 
    function renderUI() {
        console.log('[Composer] Rendering UI');
        renderFrameList();
        renderCompositionCanvas();
        renderSpritePalette();
        renderPropertiesPanel();
        // Update global controls state (save button enabled/disabled)
        if(saveProjectButton) saveProjectButton.disabled = !projectState.isDirty;
        if(exportForNextButton) exportForNextButton.disabled = projectState.frames.length === 0;
    }

    function renderFrameList() {
        if (!frameListDiv) return;
        console.log('[Composer] Rendering Frame List');
        frameListDiv.innerHTML = ''; // Clear previous
        if (projectState.frames.length === 0) {
            frameListDiv.innerHTML = '<p style="font-style: italic; color: #888;">No frames created.</p>';
        }
        projectState.frames.forEach((frame, index) => {
            const frameItem = document.createElement('div');
            frameItem.className = 'frame-list-item';
            frameItem.textContent = frame.name || `Frame ${index}`;
            frameItem.dataset.index = index.toString();
            if (index === projectState.currentFrameIndex) {
                frameItem.classList.add('selected');
            }
            frameItem.addEventListener('click', () => {
                projectState.currentFrameIndex = index;
                projectState.selectedSpriteInstanceId = null; // Deselect sprite instance when changing frame
                if (currentFrameNameSpan) currentFrameNameSpan.textContent = frame.name || `Frame ${index}`;
                console.log(`[Composer] Selected frame ${index}: ${frame.name}`);
                renderUI();
            });
            frameListDiv.appendChild(frameItem);
        });
        // Disable remove/rename if no frame selected
        if(removeFrameButton) removeFrameButton.disabled = projectState.currentFrameIndex < 0;
        if(renameFrameButton) renameFrameButton.disabled = projectState.currentFrameIndex < 0;
    }

    // --- Helper Function to Draw Sprite Pattern --- 
    function drawSpritePattern(ctx, spritePattern, spritePixelW, spritePixelH, palette, drawX, drawY, drawW, drawH) {
        if (!ctx || !spritePattern || !spritePattern.pixels) {
            console.warn("[drawSpritePattern] Invalid context or sprite pattern data");
            // Draw fallback rectangle if data is missing
            ctx.fillStyle = '#555';
            ctx.fillRect(drawX, drawY, drawW, drawH);
            ctx.strokeStyle = 'red';
            ctx.strokeRect(drawX, drawY, drawW, drawH);
            return;
        }

        // Determine effective palette (use projectState.paletteHex if available)
        const effectivePalette = projectState.paletteHex || []; 

        // Calculate scaling factor
        const scaleX = drawW / spritePixelW;
        const scaleY = drawH / spritePixelH;

        const pixels = spritePattern.pixels;
        const pixelCount = spritePixelW * spritePixelH;
        // Check the actual format based on parsed data if available
        const is8Bit = spritePattern.format === '8bit';
        const is4Bit = spritePattern.format === '4bit'; 
        // Fallback check if format isn't stored explicitly (less reliable)
        const check8Bit = !is4Bit && pixels.length === pixelCount;
        const check4Bit = !is8Bit && pixels.length === pixelCount / 2;


        ctx.imageSmoothingEnabled = false; // Ensure pixelated rendering
        // Don't clear here, assume caller cleared if needed
        // ctx.clearRect(drawX, drawY, drawW, drawH);

        // Determine palette offset from sprite data, if it exists
        const paletteOffset = spritePattern.paletteOffset || 0;

        for (let y = 0; y < spritePixelH; y++) {
            for (let x = 0; x < spritePixelW; x++) {
                let colorIndex = 0;
                let adjustedIndex = 0; // Index after applying palette offset

                if (is8Bit || check8Bit) {
                    const pixelIndex = y * spritePixelW + x;
                    if (pixelIndex < pixels.length) {
                        colorIndex = pixels[pixelIndex];
                        adjustedIndex = colorIndex; // No offset for 8-bit usually
                    }
                } else if (is4Bit || check4Bit) {
                    const pixelPairIndex = Math.floor((y * spritePixelW + x) / 2);
                    if (pixelPairIndex < pixels.length) {
                        const pixelPair = pixels[pixelPairIndex];
                        const isFirstPixel = (x % 2 === 0); // Assuming packing order: P1P2
                        colorIndex = isFirstPixel ? (pixelPair >> 4) & 0x0F : pixelPair & 0x0F;
                        // Apply palette offset (only if colorIndex is not 0)
                        adjustedIndex = colorIndex === 0 ? 0 : colorIndex + paletteOffset;
                    }
                } else {
                    console.warn("[drawSpritePattern] Unknown/unhandled sprite format for pattern:", spritePattern);
                     continue; // Skip drawing if format is unknown
                }

                // Skip transparent pixels (index 0)
                if (adjustedIndex === 0) continue; 

                // Get color from palette
                const color = effectivePalette[adjustedIndex] || `hsl(${(adjustedIndex * 20) % 360}, 70%, 50%)`; // Fallback color

                ctx.fillStyle = color;
                // Draw the scaled pixel
                ctx.fillRect(
                    Math.floor(drawX + x * scaleX),
                    Math.floor(drawY + y * scaleY),
                    Math.ceil(scaleX), // Use ceil to avoid gaps
                    Math.ceil(scaleY)  // Use ceil to avoid gaps
                );
            }
        }
    }

    function renderCompositionCanvas() {
        if (!frameCtx || !frameCompositionCanvas) return;
        console.log('[Composer] Rendering Composition Canvas');
        
        // Clear canvas
        frameCtx.clearRect(0, 0, frameCompositionCanvas.width, frameCompositionCanvas.height);
        
        // Background (maybe a checkerboard or grid?)
        frameCtx.fillStyle = '#2a2a2a';
        frameCtx.fillRect(0, 0, frameCompositionCanvas.width, frameCompositionCanvas.height);
        
        // Draw origin/center lines (optional)
        frameCtx.strokeStyle = '#555';
        frameCtx.lineWidth = 1;
        frameCtx.beginPath();
        frameCtx.moveTo(frameCompositionCanvas.width / 2 + canvasPanX * zoomLevel, 0);
        frameCtx.lineTo(frameCompositionCanvas.width / 2 + canvasPanX * zoomLevel, frameCompositionCanvas.height);
        frameCtx.moveTo(0, frameCompositionCanvas.height / 2 + canvasPanY * zoomLevel);
        frameCtx.lineTo(frameCompositionCanvas.width, frameCompositionCanvas.height / 2 + canvasPanY * zoomLevel);
        frameCtx.stroke();
        
        const currentFrame = projectState.frames[projectState.currentFrameIndex];
        if (!currentFrame || !projectState.spriteData || !projectState.spriteData.sprites) {
            // console.log('[Composer] No current frame or sprite data to render on canvas');
            return; // Nothing to draw
        }
        
        // Get sprite dimensions from loaded data
        const spritePixelW = projectState.spriteData.width || 16;
        const spritePixelH = projectState.spriteData.height || 16;
        
        // Draw sprites in the current frame
        currentFrame.sprites.forEach(spriteInstance => {
            const patternIndex = spriteInstance.patternIndex;
            const spritePattern = projectState.spriteData.sprites[patternIndex];

            if (spritePattern) {
                // Calculate draw position and size
                const drawX = frameCompositionCanvas.width / 2 + (spriteInstance.xOffset + canvasPanX) * zoomLevel;
                const drawY = frameCompositionCanvas.height / 2 + (spriteInstance.yOffset + canvasPanY) * zoomLevel;
                const drawW = spritePixelW * zoomLevel;
                const drawH = spritePixelH * zoomLevel;

                // TODO: Apply transformations (mirror, rotate) to a temporary canvas/context before drawing
                // For now, draw directly:
                drawSpritePattern(frameCtx, spritePattern, spritePixelW, spritePixelH, projectState.paletteHex, drawX, drawY, drawW, drawH);

                // Draw selection highlight if spriteInstance.id === projectState.selectedSpriteInstanceId
                if (spriteInstance.id === projectState.selectedSpriteInstanceId) {
                     frameCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow highlight
                     frameCtx.lineWidth = 2;
                     frameCtx.strokeRect(drawX -1, drawY -1, drawW + 2, drawH + 2); // Slightly outside
                }

            } else {
                 console.warn(`[Composer] Sprite pattern not found for index: ${patternIndex}`);
                 // Optionally draw a placeholder for missing patterns
                 const drawX = frameCompositionCanvas.width / 2 + (spriteInstance.xOffset + canvasPanX) * zoomLevel;
                 const drawY = frameCompositionCanvas.height / 2 + (spriteInstance.yOffset + canvasPanY) * zoomLevel;
                 const drawW = spritePixelW * zoomLevel;
                 const drawH = spritePixelH * zoomLevel;
                 frameCtx.fillStyle = 'rgba(255,0,0,0.5)';
                 frameCtx.fillRect(drawX, drawY, drawW, drawH);
                 frameCtx.strokeStyle = 'red';
                 frameCtx.strokeRect(drawX, drawY, drawW, drawH);
            }
        });
        
        console.log('[Composer] Finished rendering composition canvas');
    }

    function renderSpritePalette() {
        if (!spritePaletteDiv) return;
        console.log('[Composer] Rendering Sprite Palette');
        spritePaletteDiv.innerHTML = ''; // Clear previous
        if(spriteFileNameLabelSpan) spriteFileNameLabelSpan.textContent = `Sprite File: ${projectState.spriteFilePath ? projectState.spriteFilePath.split(/\\|\//).pop() : 'None'}`;
        
        if (!projectState.spriteData || !projectState.spriteData.sprites || projectState.spriteData.sprites.length === 0) {
            spritePaletteDiv.innerHTML = '<p style="font-style: italic; color: #888;">No sprite data loaded.</p>';
            return;
        }
        
        // Get sprite dimensions and scale for palette display
        const spritePixelW = projectState.spriteData.width || 16;
        const spritePixelH = projectState.spriteData.height || 16;
        const paletteSpriteSize = 32; // Max size in palette
        const scale = Math.min(1, paletteSpriteSize / spritePixelW, paletteSpriteSize / spritePixelH); // Scale down if needed, but don't scale up
        const displayW = Math.floor(spritePixelW * scale);
        const displayH = Math.floor(spritePixelH * scale);
        
        projectState.spriteData.sprites.forEach((spritePattern, index) => {
            const paletteItem = document.createElement('div');
            paletteItem.className = 'sprite-palette-item';
            paletteItem.dataset.patternIndex = index.toString();
            paletteItem.title = `Pattern Index: ${index}`;
            paletteItem.style.width = `${displayW}px`;
            paletteItem.style.height = `${displayH}px`;
            paletteItem.draggable = true;
            
            const canvas = document.createElement('canvas');
            canvas.width = displayW;
            canvas.height = displayH;
            const ctx = canvas.getContext('2d');

            // Draw the actual sprite pattern
            if(ctx) {
                drawSpritePattern(ctx, spritePattern, spritePixelW, spritePixelH, projectState.paletteHex, 0, 0, displayW, displayH);
            }
            paletteItem.appendChild(canvas);

            // Drag start listener
            paletteItem.addEventListener('dragstart', (e) => {
                if(!e.dataTransfer) return;
                isDraggingSprite = true;
                draggedPatternIndex = index;
                e.dataTransfer.setData('text/plain', index.toString());
                e.dataTransfer.effectAllowed = 'copy';
                 // Optional: Create a custom drag image
                const dragImage = canvas.cloneNode(true);
                (dragImage).getContext('2d').drawImage(canvas, 0, 0);
                dragImage.style.opacity = '0.7';
                dragImage.style.position = 'absolute';
                dragImage.style.left = '-1000px'; // Position off-screen initially
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, displayW / 2, displayH / 2);
                // Clean up the temporary drag image element after the drag operation
                setTimeout(() => document.body.removeChild(dragImage), 0);
            });
            paletteItem.addEventListener('dragend', () => {
                isDraggingSprite = false;
                draggedPatternIndex = null;
            });
            
            spritePaletteDiv.appendChild(paletteItem);
        });
    }

    function renderPropertiesPanel() {
        if (!spritePropertiesFormDiv) return;
        console.log('[Composer] Rendering Properties Panel');
        spritePropertiesFormDiv.innerHTML = ''; // Clear previous
        
        const currentFrame = projectState.frames[projectState.currentFrameIndex];
        if (!currentFrame || projectState.selectedSpriteInstanceId === null) {
            spritePropertiesFormDiv.innerHTML = '<p style="font-style: italic; color: #888;">(Select a sprite instance in the frame canvas)</p>';
            return;
        }
        
        // Find the selected sprite instance
        const selectedInstance = currentFrame.sprites.find(s => s.id === projectState.selectedSpriteInstanceId);
        
        if (!selectedInstance) {
            spritePropertiesFormDiv.innerHTML = '<p style="color: red;">Error: Selected sprite instance not found!</p>';
            return;
        }
        
        // --- Create Form Elements --- 
        
        // Helper to create labeled input
        function createInput(labelText, inputType, inputId, value, options = {}) {
            const container = document.createElement('div');
            container.className = 'property-item';
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = `${labelText}:`;
            
            const input = document.createElement('input');
            input.type = inputType;
            input.id = inputId;
            input.value = value;

            if (inputType === 'number') {
                 input.style.width = '60px'; // Consistent width for number inputs
                 if (options.min !== undefined) input.min = options.min;
                 if (options.max !== undefined) input.max = options.max;
                 if (options.step !== undefined) input.step = options.step;
            }
            if (options.readOnly) {
                input.readOnly = true;
                input.style.backgroundColor = '#444'; // Indicate read-only
            }
            if (options.pattern) {
                 input.pattern = options.pattern;
            }

            container.appendChild(label);
            container.appendChild(input);
            return { container, input };
        }

        // Pattern Index (Read-Only for now)
        const { container: patternContainer, input: patternInput } = createInput(
            'Pattern Index', 
            'number', 
            'prop-patternIndex', 
            selectedInstance.patternIndex,
            { readOnly: true, min: 0 }
        );
        spritePropertiesFormDiv.appendChild(patternContainer);
        
        // X Offset
        const { container: xOffsetContainer, input: xOffsetInput } = createInput(
            'X Offset', 
            'number', 
            'prop-xOffset', 
            selectedInstance.xOffset,
            { min: -128, max: 127, step: 1 }
        );
        spritePropertiesFormDiv.appendChild(xOffsetContainer);

        // Y Offset
        const { container: yOffsetContainer, input: yOffsetInput } = createInput(
            'Y Offset', 
            'number', 
            'prop-yOffset', 
            selectedInstance.yOffset,
            { min: -128, max: 127, step: 1 }
        );
        spritePropertiesFormDiv.appendChild(yOffsetContainer);
        
        // --- Add Event Listeners --- 
        
        function updateInstanceProperty(propertyName, value, isNumeric = false) {
            const frame = projectState.frames[projectState.currentFrameIndex];
            const instance = frame?.sprites.find(s => s.id === projectState.selectedSpriteInstanceId);
            if (instance) {
                const parsedValue = isNumeric ? parseInt(value, 10) : value;
                if (isNumeric && isNaN(parsedValue)) return; // Don't update if number parsing fails
                
                // Clamp values if min/max are defined
                let finalValue = parsedValue;
                if (isNumeric) {
                     if (propertyName === 'xOffset' || propertyName === 'yOffset') {
                         finalValue = Math.max(-128, Math.min(127, parsedValue));
                     }
                     // Add clamps for other numeric properties here if needed
                }

                if (instance[propertyName] !== finalValue) {
                    console.log(`[Props] Updating ${propertyName} from ${instance[propertyName]} to ${finalValue}`);
                    instance[propertyName] = finalValue;
                    projectState.isDirty = true;
                    renderCompositionCanvas(); // Redraw canvas for position changes
                    // Potentially update the input field value if clamped
                    if (isNumeric && finalValue !== parsedValue) {
                         if (propertyName === 'xOffset') xOffsetInput.value = finalValue;
                         if (propertyName === 'yOffset') yOffsetInput.value = finalValue;
                    }
                    // Update global UI elements like save button state
                    if(saveProjectButton) saveProjectButton.disabled = false;
                }
            }
        }
        
        xOffsetInput.addEventListener('input', (e) => {
            updateInstanceProperty('xOffset', (e.target).value, true);
        });
        // Also update on 'change' in case user types and blurs
        xOffsetInput.addEventListener('change', (e) => {
            updateInstanceProperty('xOffset', (e.target).value, true);
        });
        
        yOffsetInput.addEventListener('input', (e) => {
            updateInstanceProperty('yOffset', (e.target).value, true);
        });
        yOffsetInput.addEventListener('change', (e) => {
            updateInstanceProperty('yOffset', (e.target).value, true);
        });
        
        // TODO: Add listeners for other properties (Mirror, Palette Offset, etc.)
        
        // Placeholder for other properties
        // spritePropertiesFormDiv.innerHTML = `
        //     <p><strong>Sprite Instance ID:</strong> ${selectedInstance.id}</p>
        //     <p><strong>Pattern Index:</strong> ${selectedInstance.patternIndex}</p>
        //     <p><strong>Offset:</strong> (${selectedInstance.xOffset}, ${selectedInstance.yOffset})</p>
        //     <p><em>(More properties editing UI coming soon)</em></p>
        // `;
        
        // Add event listeners to form elements to update projectState and mark as dirty
    }

    // --- Event Listeners Setup --- 