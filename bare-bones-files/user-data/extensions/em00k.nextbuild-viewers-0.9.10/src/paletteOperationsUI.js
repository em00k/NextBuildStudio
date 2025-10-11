"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaletteOperationMessage = handlePaletteOperationMessage;
exports.initPaletteHistory = initPaletteHistory;
/**
 * UI Integration for Palette Operations
 *
 * This file provides UI integration between the paletteManipulation core functions
 * and the webview interface for the palette viewer.
 */
const vscode = __importStar(require("vscode"));
const paletteManipulation_1 = require("./paletteManipulation");
/**
 * Handles messages from the webview for palette operations
 */
function handlePaletteOperationMessage(message, document, webviewPanel, paletteHistory) {
    const command = message.command;
    switch (command) {
        case 'sortPalette':
            handleSortPalette(message, document, webviewPanel, paletteHistory);
            break;
        case 'generateGradient':
            handleGenerateGradient(message, document, webviewPanel, paletteHistory);
            break;
        case 'generateHarmonies':
            handleGenerateHarmonies(message, document, webviewPanel, paletteHistory);
            break;
        case 'reducePalette':
            handleReducePalette(message, document, webviewPanel, paletteHistory);
            break;
        case 'undoPaletteOperation':
            handleUndoPaletteOperation(document, webviewPanel, paletteHistory);
            break;
        case 'redoPaletteOperation':
            handleRedoPaletteOperation(document, webviewPanel, paletteHistory);
            break;
        case 'updatePriorityVisualization':
            handleUpdatePriorityVisualization(document, webviewPanel);
            break;
        case 'requestConfirmResetPalette':
            handleRequestConfirmResetPalette(document, webviewPanel);
            break;
    }
}
/**
 * Initialize palette history if not already created
 */
function initPaletteHistory(document) {
    return new paletteManipulation_1.PaletteHistory(document.state.palette);
}
// Handler functions for each operation type
function handleSortPalette(message, document, webviewPanel, paletteHistory) {
    try {
        const { sortMode: mode, referenceColor } = message;
        const currentPalette = document.state.palette;
        // Apply the sort operation
        const sortedPalette = (0, paletteManipulation_1.sortPalette)(currentPalette, mode, referenceColor);
        // Update document state
        document.state.palette = sortedPalette;
        document.state.isDirty = true;
        // Add to history if available
        if (paletteHistory) {
            paletteHistory.pushState(sortedPalette, `Sort by ${mode}`);
        }
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'sort',
            palette: sortedPalette,
            canUndo: paletteHistory?.canUndo() || false,
            canRedo: paletteHistory?.canRedo() || false
        });
        // Notify document changed
        vscode.window.showInformationMessage(`Palette sorted by ${mode}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error sorting palette: ${error.message}`);
    }
}
function handleGenerateGradient(message, document, webviewPanel, paletteHistory) {
    try {
        const { startColor, endColor, steps, targetIndex } = message;
        const currentPalette = document.state.palette;
        if (!startColor || !endColor) {
            throw new Error('Start and end colors are required');
        }
        // Create palette color objects from hex strings
        const startColorObj = {
            hex: startColor,
            priority: false
        };
        const endColorObj = {
            hex: endColor,
            priority: false
        };
        // Generate gradient
        const gradient = (0, paletteManipulation_1.generateGradient)(startColorObj, endColorObj, steps);
        // Make a copy of the current palette
        const newPalette = [...currentPalette];
        // Insert gradient at target index
        for (let i = 0; i < gradient.length && i + targetIndex < newPalette.length; i++) {
            newPalette[targetIndex + i] = gradient[i];
        }
        // Update document state
        document.state.palette = newPalette;
        document.state.isDirty = true;
        // Add to history if available
        if (paletteHistory) {
            paletteHistory.pushState(newPalette, `Generate gradient with ${steps} steps`);
        }
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'gradient',
            palette: newPalette,
            canUndo: paletteHistory?.canUndo() || false,
            canRedo: paletteHistory?.canRedo() || false
        });
        vscode.window.showInformationMessage(`Generated gradient with ${steps} steps`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error generating gradient: ${error.message}`);
    }
}
function handleGenerateHarmonies(message, document, webviewPanel, paletteHistory) {
    try {
        const { baseColor, harmonyMode, targetIndex } = message;
        const currentPalette = document.state.palette;
        if (!baseColor) {
            throw new Error('Base color is required');
        }
        // Create palette color object from hex string
        const baseColorObj = {
            hex: baseColor,
            priority: false
        };
        // Generate harmonies
        const harmonies = (0, paletteManipulation_1.generateHarmonies)(baseColorObj, harmonyMode);
        // Make a copy of the current palette
        const newPalette = [...currentPalette];
        // Insert harmonies at target index
        for (let i = 0; i < harmonies.length && i + targetIndex < newPalette.length; i++) {
            newPalette[targetIndex + i] = harmonies[i];
        }
        // Update document state
        document.state.palette = newPalette;
        document.state.isDirty = true;
        // Add to history if available
        if (paletteHistory) {
            paletteHistory.pushState(newPalette, `Generate ${harmonyMode} harmonies`);
        }
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'harmonies',
            palette: newPalette,
            canUndo: paletteHistory?.canUndo() || false,
            canRedo: paletteHistory?.canRedo() || false
        });
        vscode.window.showInformationMessage(`Generated ${harmonyMode} harmony colors`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error generating harmonies: ${error.message}`);
    }
}
function handleReducePalette(message, document, webviewPanel, paletteHistory) {
    try {
        const { targetCount, startIndex, endIndex } = message;
        const currentPalette = document.state.palette;
        // Get the region to reduce
        const region = currentPalette.slice(startIndex, endIndex + 1);
        // Reduce the region
        const reducedRegion = (0, paletteManipulation_1.reducePalette)(region, targetCount);
        // Make a copy of the current palette
        const newPalette = [...currentPalette];
        // Replace the region with the reduced palette
        for (let i = 0; i < reducedRegion.length && i + startIndex < newPalette.length; i++) {
            newPalette[startIndex + i] = reducedRegion[i];
        }
        // If the reduced palette is smaller, fill the rest with black
        for (let i = startIndex + reducedRegion.length; i <= endIndex; i++) {
            if (i < newPalette.length) {
                newPalette[i] = { hex: '#000000', priority: false };
            }
        }
        // Update document state
        document.state.palette = newPalette;
        document.state.isDirty = true;
        // Add to history if available
        if (paletteHistory) {
            paletteHistory.pushState(newPalette, `Reduce palette from ${endIndex - startIndex + 1} to ${targetCount} colors`);
        }
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'reduce',
            palette: newPalette,
            canUndo: paletteHistory?.canUndo() || false,
            canRedo: paletteHistory?.canRedo() || false
        });
        vscode.window.showInformationMessage(`Reduced palette region to ${targetCount} colors`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error reducing palette: ${error.message}`);
    }
}
function handleUndoPaletteOperation(document, webviewPanel, paletteHistory) {
    if (!paletteHistory || !paletteHistory.canUndo()) {
        vscode.window.showInformationMessage('Nothing to undo');
        return;
    }
    try {
        // Get previous state
        const undoResult = paletteHistory.undo();
        if (!undoResult)
            return;
        // Update document state
        document.state.palette = undoResult.palette;
        document.state.isDirty = true;
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'undo',
            palette: undoResult.palette,
            canUndo: paletteHistory.canUndo(),
            canRedo: paletteHistory.canRedo()
        });
        vscode.window.showInformationMessage(undoResult.description);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error during undo: ${error.message}`);
    }
}
function handleRedoPaletteOperation(document, webviewPanel, paletteHistory) {
    if (!paletteHistory || !paletteHistory.canRedo()) {
        vscode.window.showInformationMessage('Nothing to redo');
        return;
    }
    try {
        // Get next state
        const redoResult = paletteHistory.redo();
        if (!redoResult)
            return;
        // Update document state
        document.state.palette = redoResult.palette;
        document.state.isDirty = true;
        // Send updated palette back to webview
        webviewPanel.webview.postMessage({
            command: 'paletteOperationResult',
            operation: 'redo',
            palette: redoResult.palette,
            canUndo: paletteHistory.canUndo(),
            canRedo: paletteHistory.canRedo()
        });
        vscode.window.showInformationMessage(redoResult.description);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error during redo: ${error.message}`);
    }
}
function handleUpdatePriorityVisualization(document, webviewPanel) {
    try {
        const currentPalette = document.state.palette;
        // Generate visualization data for each color
        const visualizationData = currentPalette.map((color, index) => {
            return {
                index,
                ...(0, paletteManipulation_1.getPriorityBitVisual)(color.priority)
            };
        });
        // Send visualization data to webview
        webviewPanel.webview.postMessage({
            command: 'updatePriorityVisualization',
            visualizationData
        });
    }
    catch (error) {
        console.error('Error updating priority visualization:', error);
    }
}
// Handler for requesting palette reset confirmation
function handleRequestConfirmResetPalette(document, webviewPanel) {
    console.log("[PaletteOperations] Received request to confirm palette reset.");
    // Call the provider's method directly - this uses VS Code's notification API
    if (document._provider && typeof document._provider._handleRequestConfirmResetPalette === 'function') {
        document._provider._handleRequestConfirmResetPalette(document, webviewPanel);
    }
    else {
        // Fallback if we can't access the provider directly
        console.error("[PaletteOperations] Could not access provider's _handleRequestConfirmResetPalette method.");
        vscode.window.showErrorMessage("Failed to show palette reset confirmation dialog.");
    }
}
//# sourceMappingURL=paletteOperationsUI.js.map