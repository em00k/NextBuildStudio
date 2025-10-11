// Hex Editor Webview Script
(function () {
    const vscode = acquireVsCodeApi();
    const editorContent = document.getElementById('editor-content');
    const fileLengthSpan = document.getElementById('file-length');
    const editOffsetDisplay = document.getElementById('edit-offset-display');
    const byteEditInput = document.getElementById('byte-edit-input');
    const currentOffsetSpan = document.getElementById('current-offset');
    const editModeSpan = document.getElementById('edit-mode'); // For forcing insert mode
    const editModeTypeSpan = document.getElementById('edit-mode-type'); // For updating Hex/Text

    // Wrap editor content in container for performance optimizations
    editorContent.innerHTML = '<div class="hex-editor-container"></div>';
    const container = editorContent.querySelector('.hex-editor-container');

    let isOffsetHex = true; // Default to hex offset
    let currentSelectedOffset = -1;
    let selectionStartOffset = -1; // Start of selection range
    let selectionEndOffset = -1;   // End of selection range
    let currentFileBytes = null; // To store the bytes for easy lookup
    let inhibitPostMessage = false; // Prevents re-triggering edits when input is programmatically set
    let isOverwriteMode = true; // Default to overwrite
    let activeRow = -1; // Keep track of active row
    let visibleRows = { start: 0, end: 50 }; // Track visible rows for virtualization
    let isEditingTextMode = false; // Track whether we're editing in text mode or hex mode
    let rowHeight = 21; // Will be measured from actual row height
    let totalRows = 0; // Total number of rows
    let isRangeSelectionMode = false; // Track whether we're selecting a range (Shift key pressed)
    let targetOffsetAfterEdit = -1; // Used to restore cursor after full data reload

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'init':
                console.log('Received init message');
                currentFileBytes = message.fileData;
                // Use requestAnimationFrame to defer DOM manipulation
                requestAnimationFrame(() => {
                    displayHexData(message.fileData, message.fileSize);
                });
                break;
            case 'update':
                console.log('Received update from extension host');
                currentFileBytes = message.fileData;
                // Use requestAnimationFrame to defer DOM manipulation
                requestAnimationFrame(() => {
                    // If we're editing a single byte (overwrite), just update that byte instead of re-rendering everything
                    if (message.singleByteUpdate && message.offset !== undefined) {
                        updateCellValue(message.offset, message.fileData[message.offset]);
                        // Re-select the byte if it was being edited
                        if (currentSelectedOffset === message.offset) {
                            selectByteAtOffset(currentSelectedOffset, isEditingTextMode);
                        }
                    } else {
                        // Full update, likely due to insert/delete or initial load/reload
                        const focusOffset = targetOffsetAfterEdit !== -1 ? targetOffsetAfterEdit : currentSelectedOffset;
                        displayHexData(message.fileData, message.fileSize, focusOffset);
                        targetOffsetAfterEdit = -1; // Reset after use
                        // Re-select the byte that was being edited if possible
                        if (focusOffset !== -1) {
                            selectByteAtOffset(focusOffset, isEditingTextMode);
                        }
                    }
                });
                break;
        }
    });

    // Function to display hex data in a table
    function displayHexData(fileDataUint8Array, fileSize, targetOffsetToFocus) {
        // Start a performance measurement
        console.time('displayHexData');
        
        currentFileBytes = fileDataUint8Array; // Ensure currentFileBytes is updated

        container.innerHTML = ''; // Clear previous content
        // Format file length according to current mode
        fileLengthSpan.textContent = isOffsetHex 
            ? '0x' + fileSize.toString(16).toUpperCase() 
            : fileSize.toString();
        currentOffsetSpan.textContent = isOffsetHex ? '00000000' : '0';

        if (fileSize === 0) {
            container.innerHTML = 
                `<div id="empty-file-container" tabindex="0">
                    <p>File is empty.</p>
                    <p>Click here or use Alt Input to start editing in Insert mode.</p>
                </div>`;
            
            const emptyFileContainer = document.getElementById('empty-file-container');
            if (emptyFileContainer) {
                emptyFileContainer.addEventListener('click', () => {
                    selectByteAtOffset(0, false); // Select offset 0, hex mode default
                    byteEditInput.focus();
                });
            }
            
            // Force insert mode and select offset 0 for editing an empty file
            isOverwriteMode = false;
            if (editModeSpan) editModeSpan.textContent = 'Insert';
            selectByteAtOffset(0, false);
            console.timeEnd('displayHexData');
            return; // Nothing more to display for an empty file
        }

        // Create table container with fixed layout
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = thead.insertRow();
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        
        // Create header row
        const offsetHeader = headerRow.insertCell();
        offsetHeader.textContent = "Offset";
        offsetHeader.style.fontWeight = "bold";
        offsetHeader.className = 'offset-cell';
        
        // Add column headers 00-0F
        for (let i = 0; i < 16; i++) {
            const th = headerRow.insertCell();
            th.textContent = i.toString(16).padStart(2, '0').toUpperCase();
            th.style.fontWeight = "bold";
            th.className = 'hex-byte';
        }
        
        const decodedTextHeader = headerRow.insertCell();
        decodedTextHeader.textContent = "Decoded Text";
        decodedTextHeader.style.fontWeight = "bold";
        decodedTextHeader.className = 'decoded-text';

        // Calculate total rows needed
        const bytesPerRow = 16;
        totalRows = Math.ceil(fileSize / bytesPerRow);
        
        // Determine initial window of rows to render
        const maxInitialRows = 500; // Number of rows in our render window
        let initialRenderStartRow = 0;

        if (targetOffsetToFocus !== undefined && targetOffsetToFocus >= 0) {
            const targetRow = Math.floor(targetOffsetToFocus / bytesPerRow);
            // Try to center the target row, with a bit more content below it
            initialRenderStartRow = Math.max(0, targetRow - Math.floor(maxInitialRows / 3));
        }

        const actualStartRowIndex = initialRenderStartRow;
        const actualEndRowIndexExclusive = Math.min(totalRows, actualStartRowIndex + maxInitialRows);
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        for (let i = actualStartRowIndex * bytesPerRow; i < actualEndRowIndexExclusive * bytesPerRow; i += bytesPerRow) {
            const row = createDataRow(i, fileDataUint8Array, fileSize, bytesPerRow);
            fragment.appendChild(row);
        }
        tbody.appendChild(fragment);
        
        // Add table to container
        tableContainer.appendChild(table);
        container.appendChild(tableContainer);
        
        // Set up scroll-based loading for rows below the initial window
        if (actualEndRowIndexExclusive < totalRows) {
            setupInfiniteScroll(tbody, fileDataUint8Array, fileSize, bytesPerRow, actualEndRowIndexExclusive);
        }
        
        // Log file size information
        console.log(`File size: ${fileSize} bytes, Total rows: ${totalRows}`);
        
        // If a target offset was specified (e.g., from "Go To"), scroll to it
        if (targetOffsetToFocus !== undefined && targetOffsetToFocus >= 0) {
            setTimeout(() => {
                scrollToOffset(targetOffsetToFocus);
                // Also re-select to ensure focus and proper highlighting
                selectByteAtOffset(targetOffsetToFocus, isEditingTextMode);
            }, 50); // Small delay for DOM updates
        }
        console.timeEnd('displayHexData');
    }
    
    // Function to setup infinite scrolling
    let scrollHandler = null; // Keep a reference to the currently active scroll handler

    function setupInfiniteScroll(tbody, fileDataUint8Array, fileSize, bytesPerRow, startRowIndex) {
        // Remove any existing scroll listener to prevent duplicates
        if (scrollHandler) {
            editorContent.removeEventListener('scroll', scrollHandler);
            console.log('Removed existing scroll handler.');
        }

        // Keep track of the current row index for loading at the bottom
        let currentBottomLoadRowIndex = startRowIndex;
        // How many rows to load per batch at the bottom
        const batchSize = 200;
        // Flag to prevent multiple simultaneous loads/management operations
        let isProcessingScroll = false;
        // Define max rows in DOM before we start removing from top
        const maxDomRowsThreshold = 1500; // e.g. initial 500 + 5 batches of 200
        // Buffer of rows to keep above the visible area before removing
        const topRowRemovalBuffer = 100; 

        scrollHandler = function() { // Assign the new handler to our reference
            if (isProcessingScroll) {
                return;
            }
            isProcessingScroll = true;

            requestAnimationFrame(() => {
                const scrollTop = editorContent.scrollTop;
                const clientHeight = editorContent.clientHeight;
                const scrollHeight = editorContent.scrollHeight;

                // --- Logic for loading more rows at the bottom ---
                if (currentBottomLoadRowIndex < totalRows && (scrollTop + clientHeight >= scrollHeight * 0.9)) {
                    const loadingRow = document.createElement('tr');
                    const loadingCell = document.createElement('td');
                    loadingCell.colSpan = 18;
                    loadingCell.className = 'loading-indicator';
                    loadingCell.textContent = 'Loading more rows...';
                    loadingRow.appendChild(loadingCell);
                    tbody.appendChild(loadingRow);

                    const nextBatchSize = Math.min(batchSize, totalRows - currentBottomLoadRowIndex);
                    const endRowIndexForLoad = currentBottomLoadRowIndex + nextBatchSize;
                    const fragment = document.createDocumentFragment();

                    for (let i = currentBottomLoadRowIndex * bytesPerRow; i < endRowIndexForLoad * bytesPerRow; i += bytesPerRow) {
                        const row = createDataRow(i, fileDataUint8Array, fileSize, bytesPerRow);
                        fragment.appendChild(row);
                    }
                    tbody.removeChild(loadingRow);
                    tbody.appendChild(fragment);
                    console.log(`Loaded rows ${currentBottomLoadRowIndex} to ${endRowIndexForLoad - 1}`);
                    currentBottomLoadRowIndex = endRowIndexForLoad;
                }

                // --- Logic for removing rows from the top if DOM is too large ---
                const currentDomRowCount = tbody.children.length;
                if (currentDomRowCount > maxDomRowsThreshold) {
                    const firstChildRow = tbody.querySelector('tr[data-row-index]');
                    const measuredRowHeight = firstChildRow ? (firstChildRow.offsetHeight || 21) : 21;
                    
                    const firstVisibleLogicalRow = Math.floor(scrollTop / measuredRowHeight);
                    const removalCutoffRowIndex = firstVisibleLogicalRow - topRowRemovalBuffer;

                    const rowsToRemoveFromTop = [];
                    for (const row of tbody.children) {
                        if (row.classList.contains('loading-indicator')) continue;
                        const rowIndexAttr = row.dataset.rowIndex;
                        if (rowIndexAttr) {
                            const rowIndex = parseInt(rowIndexAttr, 10);
                            if (rowIndex < removalCutoffRowIndex) {
                                rowsToRemoveFromTop.push(row);
                            } else {
                                break; 
                            }
                        }
                    }

                    if (rowsToRemoveFromTop.length > 0) {
                        const heightOfRowsRemoved = rowsToRemoveFromTop.length * measuredRowHeight;
                        rowsToRemoveFromTop.forEach(row => tbody.removeChild(row));
                        console.log(`Virtualized: Removed ${rowsToRemoveFromTop.length} rows from top. DOM rows: ${tbody.children.length}`);
                        
                        const newScrollTop = editorContent.scrollTop - heightOfRowsRemoved;
                        editorContent.scrollTop = Math.max(0, newScrollTop);
                    }
                }
                isProcessingScroll = false;
            });
        };

        editorContent.addEventListener('scroll', scrollHandler);
        console.log('Added new scroll handler.');
    }
    
    // Create a row for the hex data table
    function createDataRow(startOffset, fileDataUint8Array, fileSize, bytesPerRow) {
        const row = document.createElement('tr');
        row.dataset.rowIndex = Math.floor(startOffset / bytesPerRow);
        
        // Offset cell
        const offsetCell = document.createElement('td');
        const offsetValue = isOffsetHex 
            ? startOffset.toString(16).padStart(8, '0').toUpperCase() 
            : startOffset.toString(10);
        offsetCell.textContent = offsetValue;
        offsetCell.className = 'offset-cell';
        row.appendChild(offsetCell);

        // Hex bytes
        for (let j = 0; j < bytesPerRow; j++) {
            const byteIndex = startOffset + j;
            const hexCell = document.createElement('td');
            
            if (byteIndex < fileSize) {
                const byte = fileDataUint8Array[byteIndex];
                hexCell.textContent = byte.toString(16).padStart(2, '0').toUpperCase();
                hexCell.className = 'hex-byte';
                hexCell.dataset.offset = byteIndex;
                hexCell.setAttribute('tabindex', '0'); // Make focusable
                
                // Add keyboard navigation handlers
                hexCell.addEventListener('keydown', (e) => handleHexKeydown(e, byteIndex, hexCell));
            } else {
                hexCell.textContent = '--';
                hexCell.className = 'hex-byte empty';
            }
            row.appendChild(hexCell);
        }

        // Decoded text cell
        const decodedTextCell = document.createElement('td');
        decodedTextCell.className = 'decoded-text';
        
        // Create span elements for each character in the decoded text
        for (let j = 0; j < bytesPerRow; j++) {
            const byteIndex = startOffset + j;
            if (byteIndex < fileSize) {
                const byte = fileDataUint8Array[byteIndex];
                const charSpan = document.createElement('span');
                charSpan.className = 'decoded-char';
                charSpan.textContent = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
                charSpan.dataset.offset = byteIndex;
                charSpan.setAttribute('tabindex', '0'); // Make focusable
                charSpan.addEventListener('keydown', (e) => handleTextKeydown(e, byteIndex, charSpan));
                decodedTextCell.appendChild(charSpan);
            }
        }
        row.appendChild(decodedTextCell);
        
        return row;
    }
    
    // Select a byte at a given offset
    function selectByteAtOffset(offset, inTextMode = false) {
        // Allow selection at offset 0 for empty file, or up to fileData.length for appending
        if (offset < 0 || (currentFileBytes && offset > currentFileBytes.length) ) {
            return; 
        }
        
        // Handle 0-byte file: select offset 0, force insert mode
        if (currentFileBytes && currentFileBytes.length === 0 && offset === 0) {
            currentSelectedOffset = 0;
            selectionStartOffset = 0;
            selectionEndOffset = 0;
            isEditingTextMode = false; // Default to hex for byteEditInput

            const offsetDisplayValue = isOffsetHex ? '0'.toString(16).padStart(8, '0').toUpperCase() : '0'.toString(10);
            if(editOffsetDisplay) editOffsetDisplay.textContent = offsetDisplayValue;
            if(currentOffsetSpan) currentOffsetSpan.textContent = offsetDisplayValue;
            if(byteEditInput) byteEditInput.value = '';
            if(editModeTypeSpan) editModeTypeSpan.textContent = 'Hex';
            
            // Force insert mode for empty file editing
            isOverwriteMode = false;
            if(editModeSpan) editModeSpan.textContent = 'Insert';
            
            updateSelectionLength(); // Will show 0 length
            return; // No table cells to highlight or focus
        }

        // If trying to select beyond actual data in a non-empty file (e.g. for appending visualization - not currently supported directly by selection)
        // For now, cap selection to the last valid byte if we are not in a 0-byte scenario handled above.
        if (currentFileBytes && offset >= currentFileBytes.length && currentFileBytes.length > 0) {
             //This case should ideally not be reached if we only allow selection up to length for appending state.
             // For now, let's just log or prevent, as direct selection beyond end isn't fully defined for interaction.
            console.warn("Attempting to select offset beyond file data for non-empty file.");
            return; 
        }
        
        // If not in range selection mode, clear previous selection
        if (!isRangeSelectionMode) {
            clearSelection();
            selectionStartOffset = offset;
            selectionEndOffset = offset;
        } else {
            // In range selection mode, we keep the start offset and update the end offset
            selectionEndOffset = offset;
        }
        
        currentSelectedOffset = offset;
        isEditingTextMode = inTextMode;
        
        // Highlight the range or a single byte
        highlightByteRange();
        
        // Highlight the row
        highlightActiveRow(offset);
        
        // Update offset display
        const offsetDisplayValue = isOffsetHex 
            ? offset.toString(16).padStart(8, '0').toUpperCase() 
            : offset.toString(10);
        editOffsetDisplay.textContent = offsetDisplayValue;
        currentOffsetSpan.textContent = offsetDisplayValue;
        
        // Update status to show the current edit mode
        const editModeEl = document.getElementById('edit-mode-type');
        if (editModeEl) {
            editModeEl.textContent = isEditingTextMode ? 'Text' : 'Hex';
        }
        
        // Update selection length in status bar
        updateSelectionLength();
        
        // Update the hidden input's value (but don't focus it)
        if (currentFileBytes && offset < currentFileBytes.length) {
            inhibitPostMessage = true; // Prevent sending change event when programmatically updating
            byteEditInput.value = currentFileBytes[offset].toString(16).padStart(2, '0').toUpperCase();
            inhibitPostMessage = false;
        } else {
            byteEditInput.value = '';
        }
    }
    
    // Highlight a range of bytes
    function highlightByteRange() {
        if (selectionStartOffset < 0 || selectionEndOffset < 0) return;
        
        // Calculate the actual start and end of the range (handle selecting backwards)
        const start = Math.min(selectionStartOffset, selectionEndOffset);
        const end = Math.max(selectionStartOffset, selectionEndOffset);
        
        // Iterate over all currently rendered rows in the tbody
        const tbody = container.querySelector('tbody');
        if (!tbody) return;
        const renderedRows = tbody.querySelectorAll('tr[data-row-index]');

        renderedRows.forEach(row => {
            const rowIndex = parseInt(row.dataset.rowIndex, 10);
            if (isNaN(rowIndex)) return;

            const rowStartOffset = rowIndex * 16;
            const rowEndOffset = rowStartOffset + 15;

            // Check if this row overlaps with the selection range
            if (rowEndOffset >= start && rowStartOffset <= end) {
                // Determine which cells in this row are part of the selection
                const cellHighlightStart = Math.max(start, rowStartOffset);
                const cellHighlightEnd = Math.min(end, rowEndOffset);

                for (let offset = cellHighlightStart; offset <= cellHighlightEnd; offset++) {
                    const hexCell = row.querySelector(`.hex-byte[data-offset='${offset}']`);
                    if (hexCell) {
                        hexCell.classList.add('selected');
                    }
                    
                    const charSpan = row.querySelector(`.decoded-char[data-offset='${offset}']`);
                    if (charSpan) {
                        charSpan.classList.add('selected');
                    }
                }
            }
        });
            
        // Ensure the current cell is visible and focused
        let elementToFocus = null;
        if (isEditingTextMode) {
            elementToFocus = container.querySelector(`.decoded-char[data-offset='${currentSelectedOffset}']`);
        } else {
            elementToFocus = container.querySelector(`.hex-byte[data-offset='${currentSelectedOffset}']`);
        }

        if (elementToFocus) {
            ensureElementIsVisible(elementToFocus);
            elementToFocus.focus();
        }
    }

    // Update selection length in status bar
    function updateSelectionLength() {
        const selectionLengthSpan = document.getElementById('selection-length');
        const selectionInfo = document.getElementById('selection-info');
        
        if (!selectionLengthSpan || !selectionInfo) return;

        if (selectionStartOffset >= 0 && selectionEndOffset >= 0) {
            const length = Math.abs(selectionEndOffset - selectionStartOffset) + 1;
            
            // Format selection length according to current mode
            selectionLengthSpan.textContent = isOffsetHex 
                ? '0x' + length.toString(16).toUpperCase() 
                : length.toString();
            selectionInfo.style.display = 'inline';
            
            // Also update selection info with range details
            const start = Math.min(selectionStartOffset, selectionEndOffset);
            const end = Math.max(selectionStartOffset, selectionEndOffset);
            
            if (start === end) {
                // Single byte, don't show range
                const formattedOffset = isOffsetHex 
                    ? '0x' + start.toString(16).toUpperCase() 
                    : start.toString();
                selectionInfo.title = `Selected offset: ${formattedOffset}`;
            } else {
                // Range of bytes, show details in tooltip
                const startStr = isOffsetHex ? '0x' + start.toString(16).toUpperCase() : start;
                const endStr = isOffsetHex ? '0x' + end.toString(16).toUpperCase() : end;
                selectionInfo.title = `Selection range: ${startStr}-${endStr}`;
            }
        } else {
            selectionLengthSpan.textContent = '0';
            selectionInfo.style.display = 'none';
            selectionInfo.title = '';
        }
    }
    
    // Ensure an element is visible in the viewport
    function ensureElementIsVisible(element) {
        if (!element) return;
        
        const container = editorContent;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top) {
            // Element is above the visible area
            container.scrollTop -= (containerRect.top - elementRect.top + 10); // Add padding
        } else if (elementRect.bottom > containerRect.bottom) {
            // Element is below the visible area
            container.scrollTop += (elementRect.bottom - containerRect.bottom + 10); // Add padding
        }
    }
    
    // Clear all selections
    function clearSelection() {
        // Clear hex selection
        const selectedHexCells = container.querySelectorAll('.hex-byte.selected');
        selectedHexCells.forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Clear text selection
        const selectedChars = container.querySelectorAll('.decoded-char.selected');
        selectedChars.forEach(char => {
            char.classList.remove('selected');
        });
        
        // Clear active row
        if (activeRow >= 0) {
            const activeRowElement = container.querySelector(`tr[data-row-index='${activeRow}']`);
            if (activeRowElement) {
                activeRowElement.classList.remove('active-row');
            }
        }

        // Reset selection range
        selectionStartOffset = -1;
        selectionEndOffset = -1;
        
        // Update selection length in status bar
        updateSelectionLength();
    }
    
    // Highlight the active row
    function highlightActiveRow(offset) {
        // Find row index for this offset
        const rowIndex = Math.floor(offset / 16);
        
        // Remove highlight from previous active row
        if (activeRow >= 0 && activeRow !== rowIndex) {
            const previousActiveRow = container.querySelector(`tr[data-row-index='${activeRow}']`);
            if (previousActiveRow) {
                previousActiveRow.classList.remove('active-row');
            }
        }
        
        // Highlight new active row
        const newActiveRow = container.querySelector(`tr[data-row-index='${rowIndex}']`);
        if (newActiveRow) {
            newActiveRow.classList.add('active-row');
            activeRow = rowIndex;
        }
    }
    
    // Handle keyboard navigation in hex view - updated to support range selection
    function handleHexKeydown(e, offset, cellElement) {
        // Handle range selection with shift key
        if (e.shiftKey) {
            switch (e.key) {
                case 'ArrowRight':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset + 1);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowLeft':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset - 1);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowUp':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset - 16);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowDown':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset + 16);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
            }
        }
        
        // Handle regular navigation keys
        switch (e.key) {
            case 'ArrowRight':
                navigateToOffset(offset + 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                navigateToOffset(offset - 1);
                e.preventDefault();
                break;
            case 'ArrowUp':
                navigateToOffset(offset - 16);
                e.preventDefault();
                break;
            case 'ArrowDown':
                navigateToOffset(offset + 16);
                e.preventDefault();
                break;
            case 'Tab':
                if (e.shiftKey) {
                    navigateToOffset(offset - 1);
                } else {
                    navigateToOffset(offset + 1);
                }
                e.preventDefault();
                break;
            
            // Direct editing with hex keys
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
            case 'a': case 'b': case 'c': case 'd': case 'e': case 'f':
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
                // Start or continue hex input
                if (!cellElement.editBuffer) {
                    cellElement.editBuffer = '';
                }
                
                cellElement.editBuffer += e.key.toUpperCase();
                
                if (cellElement.editBuffer.length === 2) {
                    const newValue = parseInt(cellElement.editBuffer, 16);
                    if (!isNaN(newValue)) {
                        handleByteEdit(offset, newValue, isOverwriteMode);
                        
                        // Move to the next byte only if in overwrite mode or if insert was successful
                        // For insert, the full update will handle cursor positioning
                        if (isOverwriteMode) {
                            setTimeout(() => navigateToOffset(offset + 1), 50);
                        }
                    }
                    cellElement.editBuffer = '';
                } else {
                    cellElement.textContent = cellElement.editBuffer; // Show partial input
                }
                e.preventDefault();
                break;
            
            case 'Backspace':
                if (!isOverwriteMode) {
                    // In insert mode, Backspace deletes the byte before the cursor and moves cursor back
                    if (offset > 0) {
                        vscode.postMessage({
                            type: 'deleteBytes',
                            offset: offset - 1,
                            count: 1
                        });
                        targetOffsetAfterEdit = offset - 1;
                    } else {
                        // If at the beginning, just navigate back without deleting
                        navigateToOffset(offset - 1, true);
                    }
                } else {
                    // In overwrite mode, Backspace moves backward and doesn't edit
                    navigateToOffset(offset - 1, true);
                }
                e.preventDefault();
                break;
            case 'Delete':
                if (!isOverwriteMode) {
                    // In insert mode, Delete deletes the byte at the cursor
                    if (offset < currentFileBytes.length) {
                        vscode.postMessage({
                            type: 'deleteBytes',
                            offset: offset,
                            count: 1
                        });
                        targetOffsetAfterEdit = offset; // Cursor stays at this offset
                    }
                } else {
                    // In overwrite mode, just navigate forward (or do nothing if no next char)
                    // Default behavior, perhaps allow deletion if we implement overwriting with a 'delete' char
                }
                e.preventDefault(); // Prevent default delete if any
                break;
        }
    }
    
    // Handle keyboard navigation in text view - updated to support range selection
    function handleTextKeydown(e, offset, charElement) {
        // Handle range selection with shift key
        if (e.shiftKey) {
            switch (e.key) {
                case 'ArrowRight':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset + 1, true);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowLeft':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset - 1, true);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowUp':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset - 16, true);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
                case 'ArrowDown':
                    isRangeSelectionMode = true;
                    navigateToOffset(offset + 16, true);
                    isRangeSelectionMode = false;
                    e.preventDefault();
                    return;
            }
        }
        
        // Handle regular navigation keys
        switch (e.key) {
            case 'ArrowRight':
                navigateToOffset(offset + 1, true);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                navigateToOffset(offset - 1, true);
                e.preventDefault();
                break;
            case 'ArrowUp':
                navigateToOffset(offset - 16, true);
                e.preventDefault();
                break;
            case 'ArrowDown':
                navigateToOffset(offset + 16, true);
                e.preventDefault();
                break;
            case 'Tab':
                if (e.shiftKey) {
                    navigateToOffset(offset - 1, true);
                } else {
                    navigateToOffset(offset + 1, true);
                }
                e.preventDefault();
                break;
            case 'Backspace':
                if (!isOverwriteMode) {
                    // In insert mode, Backspace deletes the byte before the cursor and moves cursor back
                    if (offset > 0) {
                        vscode.postMessage({
                            type: 'deleteBytes',
                            offset: offset - 1,
                            count: 1
                        });
                        targetOffsetAfterEdit = offset - 1;
                    } else {
                        // If at the beginning, just navigate back without deleting
                        navigateToOffset(offset - 1, true);
                    }
                } else {
                    // In overwrite mode, Backspace moves backward and doesn't edit
                    navigateToOffset(offset - 1, true);
                }
                e.preventDefault();
                break;
            
            // Handle direct text input
            default:
                if (e.key.length === 1) {
                    const charCode = e.key.charCodeAt(0);
                    // Allow printable ASCII characters
                    if (charCode >= 32 && charCode <= 126) { 
                        handleByteEdit(offset, charCode, isOverwriteMode, true); // true for inTextMode
                        
                        // In overwrite mode, move to next char, insert mode will be handled by full update
                        if (isOverwriteMode) {
                           setTimeout(() => navigateToOffset(offset + 1, true), 50);
                        }
                        e.preventDefault();
                    }
                }
                break;
        }
    }
    
    // Navigate to a specific offset
    function navigateToOffset(offset, inTextMode = false) {
        if (offset >= 0 && currentFileBytes && (offset <= currentFileBytes.length)) {
            if (currentFileBytes.length === 0 && offset === 0) {
                selectByteAtOffset(0, inTextMode);
                // Optionally focus the byteEditInput if it's the primary way to edit empty files
                if(byteEditInput) byteEditInput.focus();
                return;
            }

            // If no explicit mode is provided, maintain current mode
            if (inTextMode === undefined) {
                inTextMode = isEditingTextMode;
            }
            selectByteAtOffset(offset, inTextMode);
        }
    }

    // Handle input in the byte edit field - kept for compatibility but now secondary
    if (byteEditInput) {
        byteEditInput.addEventListener('input', (e) => {
            if (inhibitPostMessage) return;

            const inputValue = e.target.value.toUpperCase();
            let validHex = /^[0-9A-F]*$/.test(inputValue) && inputValue.length <= 2;

            if (!validHex) {
                if (currentSelectedOffset !== -1 && currentFileBytes && currentSelectedOffset < currentFileBytes.length) {
                    e.target.value = currentFileBytes[currentSelectedOffset].toString(16).padStart(2, '0').toUpperCase();
                } else {
                    e.target.value = "";
                }
                return;
            }
            
            if (inputValue.length === 2 && currentSelectedOffset !== -1) {
                const newValue = parseInt(inputValue, 16);
                if (!isNaN(newValue)) {
                    if (isOverwriteMode) {
                        // Update the display immediately for overwrite
                        updateCellValue(currentSelectedOffset, newValue);
                        vscode.postMessage({
                            type: 'editByte',
                            offset: currentSelectedOffset,
                            value: newValue,
                            singleByteUpdate: true
                        });
                        setTimeout(() => navigateToOffset(currentSelectedOffset + 1), 50);
                    } else {
                        // Insert mode: use handleByteEdit which sends 'insertBytes'
                        handleByteEdit(currentSelectedOffset, newValue, false /* isOverwriteMode=false */); 
                        // Clear input after insert, cursor will be handled by full update
                        e.target.value = ""; 
                    }
                }
            }
        });
    }
    
    // Helper function to update a cell's value in the UI
    function updateCellValue(offset, newValue) {
        if (!currentFileBytes || offset >= currentFileBytes.length) return;
        
        // Update our local copy of the data
        currentFileBytes[offset] = newValue;
        
        // Update the hex cell
        const hexCell = container.querySelector(`.hex-byte[data-offset='${offset}']`);
        if (hexCell) {
            hexCell.textContent = newValue.toString(16).padStart(2, '0').toUpperCase();
            
            // Clear any edit buffer
            hexCell.editBuffer = '';
        }
        
        // Update the decoded text character
        const charSpan = container.querySelector(`.decoded-char[data-offset='${offset}']`);
        if (charSpan) {
            charSpan.textContent = newValue >= 32 && newValue <= 126 ? String.fromCharCode(newValue) : '.';
        }
        
        // Also update the input field in the header, but don't focus it
        if (byteEditInput) {
            inhibitPostMessage = true;
            byteEditInput.value = newValue.toString(16).padStart(2, '0').toUpperCase();
            inhibitPostMessage = false;
        }
    }
    
    // Add a function to scroll to a specific offset
    function scrollToOffset(offset) {
        if (offset < 0 || !currentFileBytes || offset >= currentFileBytes.length) {
            return;
        }
        
        const rowIndex = Math.floor(offset / 16);
        console.log(`Scrolling to row ${rowIndex} for offset ${offset}`);
        
        // Find the row element
        const row = container.querySelector(`tr[data-row-index='${rowIndex}']`);
        if (row) {
            // Scroll the row into view
            row.scrollIntoView({ block: 'center' });
            
            // Select the byte after scrolling
            setTimeout(() => selectByteAtOffset(offset), 50);
        }
    }

    // Event listeners for buttons
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'save' });
        });
    }

    const saveAsButton = document.getElementById('save-as-button');
    if (saveAsButton) {
        saveAsButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'saveAs' });
        });
    }

    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'reload' });
        });
    }

    // Toggle hex/dec offset display
    const offsetToggleButton = document.getElementById('offset-toggle-button');
    if (offsetToggleButton) {
        offsetToggleButton.addEventListener('click', () => {
            isOffsetHex = !isOffsetHex;
            
            // Re-render with the new offset format
            if (currentFileBytes) {
                displayHexData(currentFileBytes, currentFileBytes.length);
            }
            
            // Update the currently selected byte's offset display if any
            if (currentSelectedOffset !== -1) {
                const offsetDisplayValue = isOffsetHex 
                    ? currentSelectedOffset.toString(16).padStart(8, '0').toUpperCase() 
                    : currentSelectedOffset.toString(10);
                editOffsetDisplay.textContent = offsetDisplayValue;
                currentOffsetSpan.textContent = offsetDisplayValue;

                // Re-select the byte to update selection info
                selectByteAtOffset(currentSelectedOffset);
            }
            
            // Update selection length display if there's an active selection
            if (selectionStartOffset >= 0 && selectionEndOffset >= 0) {
                updateSelectionLength();
            }
        });
    }

    // Toggle insert/overwrite mode
    if (editModeSpan) {
        editModeSpan.addEventListener('click', () => {
            isOverwriteMode = !isOverwriteMode;
            editModeSpan.textContent = isOverwriteMode ? 'Overwrite' : 'Insert';
            // For now this is just visual - full insert mode would be implemented later
            vscode.postMessage({ 
                type: 'log', 
                message: `Mode toggled to ${isOverwriteMode ? 'Overwrite' : 'Insert'}.`
            });
        });
        
        // Make it visually clickable
        editModeSpan.style.cursor = 'pointer';
        editModeSpan.title = 'Click to toggle Insert/Overwrite mode';
    }
    
    // Add keyboard shortcuts for selecting all
    document.addEventListener('keydown', (e) => {
        // Prevent multiple key handlers from firing simultaneously
        let processed = false;
        
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            vscode.postMessage({ type: 'save' });
            e.preventDefault();
            return;
        }
        
        // Ctrl+R to reload
        if (e.ctrlKey && e.key === 'r') {
            vscode.postMessage({ type: 'reload' });
            e.preventDefault();
            return;
        }
        
        // Ctrl+O to toggle offset display
        if (e.ctrlKey && e.key === 'o') {
            offsetToggleButton.click();
            e.preventDefault();
            return;
        }
        
        // Ctrl+I to toggle insert/overwrite mode
        if (e.ctrlKey && e.key === 'i') {
            editModeSpan.click();
            e.preventDefault();
            return;
        }
        
        // Ctrl+F for search
        if (e.ctrlKey && e.key === 'f') {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                // If we had a large selection active, clear it first to avoid UI freeze
                if (selectionEndOffset - selectionStartOffset > 1000) {
                    // Just clear highlight visuals but keep selection state for search references
                    clearSelectionVisuals();
                }
                
                // Then focus search with a small delay
                setTimeout(() => {
                    searchInput.focus();
                    searchInput.select();
                }, 10);
                
                e.preventDefault();
            }
        }
        
        // Only process Ctrl+A if we haven't processed another command
        if (!processed && e.ctrlKey && e.key === 'a' && currentFileBytes) {
            if (currentFileBytes.length > 0) {
                // Clear existing selection visuals first to prevent performance issues
                clearSelectionVisuals();
                
                // Set the selection state for the entire file
                selectionStartOffset = 0;
                selectionEndOffset = currentFileBytes.length - 1;
                currentSelectedOffset = selectionEndOffset;
                
                // Update selection info in status bar
                updateSelectionLength();
                
                // Update offset display
                const offsetDisplayValue = isOffsetHex 
                    ? currentSelectedOffset.toString(16).padStart(8, '0').toUpperCase() 
                    : currentSelectedOffset.toString(10);
                editOffsetDisplay.textContent = offsetDisplayValue;
                currentOffsetSpan.textContent = offsetDisplayValue;
                
                // Only highlight cells in currently visible rows
                const visibleRows = document.querySelectorAll('tr[data-row-index]');
                if (visibleRows.length > 0) {
                    // Highlight visible cells in the current viewport
                    visibleRows.forEach(row => {
                        const rowIndex = parseInt(row.dataset.rowIndex, 10);
                        const rowStart = rowIndex * 16;
                        const rowEnd = Math.min(rowStart + 15, currentFileBytes.length - 1);
                        
                        // Highlight all cells in this visible row
                        for (let offset = rowStart; offset <= rowEnd; offset++) {
                            const hexCell = row.querySelector(`.hex-byte[data-offset='${offset}']`);
                            if (hexCell) {
                                hexCell.classList.add('selected');
                            }
                            
                            const charSpan = row.querySelector(`.decoded-char[data-offset='${offset}']`);
                            if (charSpan) {
                                charSpan.classList.add('selected');
                            }
                        }
                    });
                    
                    // Highlight active row based on current view
                    const lastVisibleRow = visibleRows[visibleRows.length - 1];
                    if (lastVisibleRow) {
                        lastVisibleRow.classList.add('active-row');
                        activeRow = parseInt(lastVisibleRow.dataset.rowIndex, 10);
                    }
                }
                
                e.preventDefault();
            }
            return;
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            clearSelection();
            currentSelectedOffset = -1;
            e.preventDefault();
            return;
        }
        
        // Basic cursor movement without an active selection
        if (currentFileBytes && currentSelectedOffset === -1) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Start at the beginning or a reasonable point
                navigateToOffset(0);
                e.preventDefault();
            }
        }
    });

    // Helper function to clear selection visuals only, without changing selection state
    function clearSelectionVisuals() {
        // Clear hex selection
        const selectedHexCells = container.querySelectorAll('.hex-byte.selected');
        selectedHexCells.forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Clear text selection
        const selectedChars = container.querySelectorAll('.decoded-char.selected');
        selectedChars.forEach(char => {
            char.classList.remove('selected');
        });
        
        // Clear active row
        if (activeRow >= 0) {
            const activeRowElement = container.querySelector(`tr[data-row-index='${activeRow}']`);
            if (activeRowElement) {
                activeRowElement.classList.remove('active-row');
            }
        }
    }

    // Add a "Go to Offset" button in the header
    document.addEventListener('DOMContentLoaded', () => {
        const headerDiv = document.querySelector('.header div');
        if (headerDiv) {
            const goToButton = document.createElement('button');
            goToButton.id = 'goto-button';
            goToButton.textContent = 'GO TO';
            goToButton.addEventListener('click', () => {
                showGoToDialog();
            });
            
            // Insert after the offset-toggle button
            const offsetToggleButton = document.getElementById('offset-toggle-button');
            if (offsetToggleButton) {
                headerDiv.insertBefore(goToButton, offsetToggleButton.nextSibling);
            } else {
                headerDiv.appendChild(goToButton);
            }
        }
    });

    // Add an edit mode type indicator
    document.addEventListener('DOMContentLoaded', () => {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const lastSpan = statusBar.querySelector('span:last-child');
            if (lastSpan) {
                const editModeType = document.createElement('span');
                editModeType.innerHTML = 'Edit: <span id="edit-mode-type">Hex</span>';
                statusBar.insertBefore(editModeType, lastSpan);
            }
        }
    });

    // Optimize byte editing to send single byte updates or insert messages
    function handleByteEdit(offset, newValue, overwrite = true, inTextMode = false) {
        if (overwrite) {
            // Overwrite mode: update UI immediately and send optimized update message
            updateCellValue(offset, newValue);
            vscode.postMessage({
                type: 'editByte',
                offset: offset,
                value: newValue,
                singleByteUpdate: true 
            });
            targetOffsetAfterEdit = offset + 1; // Expect to move to the next byte
        } else {
            // Insert mode: send insert message, UI will be updated on full refresh
            vscode.postMessage({
                type: 'insertBytes',
                offset: offset,
                bytes: [newValue] // Send as an array of bytes
            });
            targetOffsetAfterEdit = offset + 1; // Expect cursor to be after the inserted byte
        }
    }

    // Function to show the Go To dialog
    function showGoToDialog() {
        // Create a custom dialog
        const dialog = document.createElement('div');
        dialog.className = 'goto-dialog';
        
        // Update input placeholder to reflect current mode
        const placeholder = isOffsetHex 
            ? 'e.g. 7B or $7B or 0x7B' 
            : 'e.g. 123 or $7B (hex)';
        
        const dialogContent = `
            <div class="goto-dialog-content">
                <h3>Go to Offset</h3>
                <div class="goto-input-group">
                    <label for="goto-offset">Enter offset ${isOffsetHex ? '(hex or decimal)' : '(decimal or $hex)'}:</label>
                    <input type="text" id="goto-offset" placeholder="${placeholder}">
                </div>
                <div class="goto-buttons">
                    <button id="goto-cancel">Cancel</button>
                    <button id="goto-ok">Go</button>
                </div>
            </div>
        `;
        
        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);
        
        // Focus the input
        const input = dialog.querySelector('#goto-offset');
        input.focus();
        
        // Add event listeners
        const okButton = dialog.querySelector('#goto-ok');
        const cancelButton = dialog.querySelector('#goto-cancel');
        
        // Handle Enter key in input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                processGoToInput();
            } else if (e.key === 'Escape') {
                closeDialog();
            }
        });
        
        okButton.addEventListener('click', processGoToInput);
        cancelButton.addEventListener('click', closeDialog);
        
        // Process the input and navigate
        function processGoToInput() {
            const offsetText = input.value.trim();
            let offset;
            
            // Always try to parse as hex if $ or 0x prefix is used
            if (offsetText.startsWith('$') || offsetText.toLowerCase().startsWith('0x')) {
                const hexValue = offsetText.startsWith('$') 
                    ? offsetText.substring(1) 
                    : offsetText.substring(2);
                offset = parseInt(hexValue, 16);
            } else {
                // Otherwise, parse as decimal. Invalid characters will result in NaN.
                offset = parseInt(offsetText, 10);
            }
            
            if (!isNaN(offset) && offset >= 0 && currentFileBytes && offset < currentFileBytes.length) {
                closeDialog();
                // Call displayHexData to re-render around the target offset
                displayHexData(currentFileBytes, currentFileBytes.length, offset);
            } else {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 500);
            }
        }
        
        // Close the dialog
        function closeDialog() {
            document.body.removeChild(dialog);
        }
    }

    // Add document ready event listeners for search
    document.addEventListener('DOMContentLoaded', () => {
        // Search button click handler
        const searchButton = document.getElementById('search-button');
        const searchInput = document.getElementById('search-input');
        
        if (searchButton && searchInput) {
            searchButton.addEventListener('click', () => {
                performSearch(searchInput.value);
            });
            
            // Also trigger search on Enter key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    performSearch(searchInput.value);
                }
            });
        }
    });

    /**
     * Performs a search in the hex data
     * @param {string} searchText - The text to search for (can be hex or text)
     */
    function performSearch(searchText) {
        if (!searchText || !currentFileBytes || currentFileBytes.length === 0) return;
        
        // Clear any visual highlighting that might cause performance issues
        if (selectionEndOffset - selectionStartOffset > 1000) {
            clearSelectionVisuals();
        }
        
        let pattern = [];
        let searchType = '';
        searchText = searchText.trim();
        
        // Check if it's a hex pattern (like "FF 00 AB")
        if (/^([0-9A-Fa-f]{2}[ ]*)+$/.test(searchText)) {
            searchType = 'hex';
            // Convert hex string to byte array
            pattern = searchText.split(/\s+/).map(hex => parseInt(hex, 16));
        } 
        // Or text pattern
        else {
            searchType = 'text';
            // Convert string to byte array (ASCII)
            for (let i = 0; i < searchText.length; i++) {
                pattern.push(searchText.charCodeAt(i));
            }
        }
        
        if (pattern.length === 0) return;
        
        console.log(`Searching for ${searchType} pattern:`, pattern);
        
        // If we're dealing with a large file, show a searching indicator
        const isLargeFile = currentFileBytes.length > 100000;
        if (isLargeFile) {
            vscode.postMessage({ 
                type: 'log', 
                message: `Searching for "${searchText}"...`
            });
        }
        
        // Defer search to avoid UI blocking
        setTimeout(() => {
            // Perform the actual search
            const matches = findPattern(currentFileBytes, pattern);
            
            if (matches.length > 0) {
                // We found matches! Select the first one
                const firstMatch = matches[0];
                
                // First, manually clear any existing selection to avoid interference
                clearSelection();
                
                // Set up the selection range
                selectionStartOffset = firstMatch;
                selectionEndOffset = firstMatch + pattern.length - 1;
                currentSelectedOffset = selectionEndOffset; // Set cursor at end of selection
                
                // Scroll to the match - do this first to ensure the elements are in viewport
                scrollToOffset(firstMatch);
                
                // Wait for the scrolling to complete before highlighting
                setTimeout(() => {
                    // Directly highlight the range
                    highlightSearchResult(firstMatch, pattern.length);
                    
                    // Update the selection info in the status bar
                    updateSelectionLength();
                    
                    // Update the current offset display
                    const offsetDisplayValue = isOffsetHex 
                        ? selectionEndOffset.toString(16).padStart(8, '0').toUpperCase() 
                        : selectionEndOffset.toString(10);
                    editOffsetDisplay.textContent = offsetDisplayValue;
                    currentOffsetSpan.textContent = offsetDisplayValue;
                }, 50);
                
                // Show info in status with first match offset in current format
                const firstMatchFormatted = isOffsetHex 
                    ? '0x' + firstMatch.toString(16).toUpperCase() 
                    : firstMatch.toString();
                vscode.postMessage({ 
                    type: 'log', 
                    message: `Found ${matches.length} matches for "${searchText}" - first match at ${firstMatchFormatted}`
                });
            } else {
                // No matches found
                vscode.postMessage({ 
                    type: 'log', 
                    message: `No matches found for "${searchText}"`
                });
            }
        }, 0);
    }
    
    /**
     * Directly highlight a search result without going through the selection machinery
     * that might reset the selection
     */
    function highlightSearchResult(startOffset, length) {
        // Calculate start and end offsets
        const start = startOffset;
        const end = startOffset + length - 1;
        
        // Check if this is a large selection
        const isLargeSelection = length > 1000;
        
        if (isLargeSelection) {
            // For large selections, only highlight visible cells
            const visibleRows = document.querySelectorAll(`tr[data-row-index]`);
            
            visibleRows.forEach(row => {
                const rowIndex = parseInt(row.dataset.rowIndex, 10);
                const rowStart = rowIndex * 16;
                const rowEnd = rowStart + 15;
                
                // If this row overlaps with our selection range
                if (rowEnd >= start && rowStart <= end) {
                    // Determine which cells in this row are part of the selection
                    const cellStart = Math.max(start, rowStart);
                    const cellEnd = Math.min(end, rowEnd);
                    
                    // Highlight only the cells in this row that are part of the selection
                    for (let offset = cellStart; offset <= cellEnd; offset++) {
                        const hexCell = row.querySelector(`.hex-byte[data-offset='${offset}']`);
                        if (hexCell) {
                            hexCell.classList.add('selected');
                        }
                        
                        const charSpan = row.querySelector(`.decoded-char[data-offset='${offset}']`);
                        if (charSpan) {
                            charSpan.classList.add('selected');
                        }
                    }
                }
            });
        } else {
            // For smaller selections, highlight each byte
            for (let offset = start; offset <= end; offset++) {
                const hexCell = container.querySelector(`.hex-byte[data-offset='${offset}']`);
                if (hexCell) {
                    hexCell.classList.add('selected');
                }
                
                const charSpan = container.querySelector(`.decoded-char[data-offset='${offset}']`);
                if (charSpan) {
                    charSpan.classList.add('selected');
                }
            }
        }
        
        // Highlight the active row
        highlightActiveRow(end);
        
        // Focus the current cell in the appropriate mode
        if (isEditingTextMode) {
            const charSpan = container.querySelector(`.decoded-char[data-offset='${end}']`);
            if (charSpan) {
                charSpan.focus();
            }
        } else {
            const hexCell = container.querySelector(`.hex-byte[data-offset='${end}']`);
            if (hexCell) {
                hexCell.focus();
            }
        }
    }

    /**
     * Find all occurrences of a pattern in a byte array
     * @param {Uint8Array} data - The data to search in
     * @param {Array<number>} pattern - The pattern to search for
     * @returns {Array<number>} - Array of offsets where matches were found
     */
    function findPattern(data, pattern) {
        const matches = [];
        const dataLength = data.length;
        const patternLength = pattern.length;
        
        // Simple pattern matching algorithm
        for (let i = 0; i <= dataLength - patternLength; i++) {
            let found = true;
            
            for (let j = 0; j < patternLength; j++) {
                if (data[i + j] !== pattern[j]) {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                matches.push(i);
            }
        }
        
        return matches;
    }

    // Prevent default text selection behavior but keep our custom selection
    document.addEventListener('selectstart', (e) => {
        // Only prevent default if not in input or search
        const target = e.target;
        const isInput = target.tagName === 'INPUT' || target.id === 'search-input';
        
        if (!isInput) {
            e.preventDefault();
        }
    });
    
    // Track mouse state for range selection
    let isMouseDown = false;
    let mouseSelectionStartOffset = -1;
    
    // Event listeners for mouse selection in table cells
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mousedown', (e) => {
            // Check if clicked on a hex cell or decoded char
            const hexCell = e.target.closest('.hex-byte:not(.empty)');
            const charSpan = e.target.closest('.decoded-char');
            
            if (!hexCell && !charSpan) {
                // Not clicking on a byte or text, ignore
                return;
            }
            
            // Start the mouse selection
            isMouseDown = true;
            
            if (hexCell) {
                const offset = parseInt(hexCell.dataset.offset, 10);
                mouseSelectionStartOffset = offset;
                
                // If not shift key, start a new selection
                if (!e.shiftKey) {
                    selectionStartOffset = offset;
                    selectionEndOffset = offset;
                    clearSelection();
                    selectByteAtOffset(offset, false);
                } else {
                    // Shift+click extends the selection
                    selectionEndOffset = offset;
                    isRangeSelectionMode = true;
                    selectByteAtOffset(offset, false);
                    isRangeSelectionMode = false;
                }
            } else if (charSpan) {
                const offset = parseInt(charSpan.dataset.offset, 10);
                mouseSelectionStartOffset = offset;
                
                // If not shift key, start a new selection
                if (!e.shiftKey) {
                    selectionStartOffset = offset;
                    selectionEndOffset = offset;
                    clearSelection();
                    selectByteAtOffset(offset, true);
                } else {
                    // Shift+click extends the selection
                    selectionEndOffset = offset;
                    isRangeSelectionMode = true;
                    selectByteAtOffset(offset, true);
                    isRangeSelectionMode = false;
                }
            }
        });
        
        // Handle mouse move for range selection
        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown || mouseSelectionStartOffset < 0) return;
            
            // Check if over a byte or text cell
            const hexCell = e.target.closest('.hex-byte:not(.empty)');
            const charSpan = e.target.closest('.decoded-char');
            
            if (hexCell) {
                const offset = parseInt(hexCell.dataset.offset, 10);
                if (offset !== selectionEndOffset) {
                    // Update selection range
                    selectionEndOffset = offset;
                    isRangeSelectionMode = true;
                    selectByteAtOffset(offset, false);
                    isRangeSelectionMode = false;
                }
            } else if (charSpan) {
                const offset = parseInt(charSpan.dataset.offset, 10);
                if (offset !== selectionEndOffset) {
                    // Update selection range
                    selectionEndOffset = offset;
                    isRangeSelectionMode = true;
                    selectByteAtOffset(offset, true);
                    isRangeSelectionMode = false;
                }
            }
        });
        
        // End mouse selection
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
            mouseSelectionStartOffset = -1;
        });
    });
})(); 