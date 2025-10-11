"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaletteHistory = exports.HarmonyMode = exports.SortMode = void 0;
exports.rgb9ToHsv = rgb9ToHsv;
exports.hsvToRgb9 = hsvToRgb9;
exports.colorDistance = colorDistance;
exports.sortPalette = sortPalette;
exports.generateGradient = generateGradient;
exports.generateHarmonies = generateHarmonies;
exports.reducePalette = reducePalette;
exports.extractColorsFromImage = extractColorsFromImage;
exports.getPriorityBitVisual = getPriorityBitVisual;
/* eslint-disable curly */
/**
 * Advanced palette manipulation functions for ZX Next palette editing
 */
const paletteUtils_1 = require("./paletteUtils");
/**
 * Types for color sorting, harmonization, and operations
 */
var SortMode;
(function (SortMode) {
    SortMode["Hue"] = "hue";
    SortMode["Saturation"] = "saturation";
    SortMode["Brightness"] = "brightness";
    SortMode["Similarity"] = "similarity";
})(SortMode || (exports.SortMode = SortMode = {}));
var HarmonyMode;
(function (HarmonyMode) {
    HarmonyMode["Complementary"] = "complementary";
    HarmonyMode["Analogous"] = "analogous";
    HarmonyMode["Triadic"] = "triadic";
    HarmonyMode["Tetradic"] = "tetradic";
    HarmonyMode["Monochromatic"] = "monochromatic";
})(HarmonyMode || (exports.HarmonyMode = HarmonyMode = {}));
class PaletteHistory {
    undoStack = [];
    redoStack = [];
    currentState = [];
    constructor(initialState) {
        this.currentState = this.deepCopyPalette(initialState);
    }
    /**
     * Deep copy a palette to avoid reference issues
     */
    deepCopyPalette(palette) {
        return palette.map(color => ({ ...color }));
    }
    /**
     * Add an operation to the history
     * @param operation The operation to add
     */
    addOperation(operation) {
        let description = 'Color operation';
        switch (operation.type) {
            case 'colorEdit':
                description = `Edit color at index ${operation.index}`;
                break;
            case 'reorder':
                description = 'Reorder palette';
                break;
            case 'fullUpdate':
                description = 'Update full palette';
                break;
            case 'priorityChange':
                description = `Change priority bit at index ${operation.index}`;
                break;
            case 'swap':
                description = `Swap colors at indices ${operation.indexA} and ${operation.indexB}`;
                break;
            default:
                description = `${operation.type} operation`;
        }
        // Push the current state to the undo stack
        this.undoStack.push({
            palette: this.deepCopyPalette(this.currentState),
            description
        });
        // Clear redo stack when a new action is performed
        this.redoStack = [];
        // Don't update currentState here - that will be done by the caller
    }
    /**
     * Push a new state to the undo stack
     */
    pushState(palette, description) {
        // Save the current state to the undo stack before updating
        this.undoStack.push({
            palette: this.deepCopyPalette(this.currentState),
            description
        });
        // Clear redo stack when a new action is performed
        this.redoStack = [];
        // Update current state
        this.currentState = this.deepCopyPalette(palette);
    }
    /**
     * Undo the last operation
     */
    undo() {
        if (this.undoStack.length === 0) {
            return null;
        }
        // Get the last state from undo stack
        const lastState = this.undoStack.pop();
        // Push current state to redo stack
        this.redoStack.push({
            palette: this.deepCopyPalette(this.currentState),
            description: lastState.description
        });
        // Update current state
        this.currentState = this.deepCopyPalette(lastState.palette);
        return {
            palette: this.currentState,
            description: `Undo: ${lastState.description}`
        };
    }
    /**
     * Redo the last undone operation
     */
    redo() {
        if (this.redoStack.length === 0) {
            return null;
        }
        // Get the last state from redo stack
        const nextState = this.redoStack.pop();
        // Push current state to undo stack
        this.undoStack.push({
            palette: this.deepCopyPalette(this.currentState),
            description: nextState.description
        });
        // Update current state
        this.currentState = this.deepCopyPalette(nextState.palette);
        return {
            palette: this.currentState,
            description: `Redo: ${nextState.description}`
        };
    }
    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    /**
     * Get the current state
     */
    getCurrentState() {
        return this.deepCopyPalette(this.currentState);
    }
}
exports.PaletteHistory = PaletteHistory;
/**
 * Helper functions for color conversions and comparisons
 */
/**
 * Convert RGB9 to HSV (Hue, Saturation, Value) color space
 */
function rgb9ToHsv(rgb9) {
    // Convert 3-bit per channel to 0-1 range
    const r = rgb9.r9 / 7;
    const g = rgb9.g9 / 7;
    const b = rgb9.b9 / 7;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    // Calculate hue (0-360)
    let h = 0;
    if (delta === 0) {
        h = 0; // No color, grayscale
    }
    else if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
    }
    else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
    }
    else {
        h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0)
        h += 360;
    // Calculate saturation (0-1)
    const s = max === 0 ? 0 : delta / max;
    // Value is just the max (0-1)
    const v = max;
    return { h, s, v };
}
/**
 * Convert HSV to RGB9 color space
 */
function hsvToRgb9(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    // Convert 0-1 range back to 0-7 range (3-bit per channel)
    return {
        r9: Math.round(r * 7),
        g9: Math.round(g * 7),
        b9: Math.round(b * 7)
    };
}
/**
 * Calculate perceptual color difference (weighted Euclidean distance)
 */
function colorDistance(color1, color2) {
    // Convert 0-7 range to 0-255 range for better perceptual scaling
    const r1 = (color1.r9 / 7) * 255;
    const g1 = (color1.g9 / 7) * 255;
    const b1 = (color1.b9 / 7) * 255;
    const r2 = (color2.r9 / 7) * 255;
    const g2 = (color2.g9 / 7) * 255;
    const b2 = (color2.b9 / 7) * 255;
    // Use weighted Euclidean distance to match human perception
    // Human eyes are more sensitive to green, less to blue
    const rDiff = (r1 - r2) * 0.3;
    const gDiff = (g1 - g2) * 0.59;
    const bDiff = (b1 - b2) * 0.11;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}
/**
 * Core palette manipulation functions
 */
/**
 * Sort palette by different criteria
 */
function sortPalette(palette, mode, referenceColor) {
    // Create a deep copy to avoid modifying the original
    const result = palette.map(color => ({ ...color }));
    switch (mode) {
        case SortMode.Hue:
            return sortByHue(result);
        case SortMode.Saturation:
            return sortBySaturation(result);
        case SortMode.Brightness:
            return sortByBrightness(result);
        case SortMode.Similarity:
            if (!referenceColor) {
                throw new Error('Reference color is required for similarity sorting');
            }
            return sortBySimilarity(result, referenceColor);
        default:
            return result;
    }
}
/**
 * Sort palette by hue
 */
function sortByHue(palette) {
    return palette.sort((a, b) => {
        const hsvA = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(a.hex));
        const hsvB = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(b.hex));
        // First sort by hue
        if (hsvA.h !== hsvB.h) {
            return hsvA.h - hsvB.h;
        }
        // For same hue, sort by saturation
        if (hsvA.s !== hsvB.s) {
            return hsvB.s - hsvA.s;
        }
        // For same saturation, sort by brightness
        return hsvB.v - hsvA.v;
    });
}
/**
 * Sort palette by saturation
 */
function sortBySaturation(palette) {
    return palette.sort((a, b) => {
        const hsvA = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(a.hex));
        const hsvB = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(b.hex));
        // First sort by saturation (descending)
        if (hsvA.s !== hsvB.s) {
            return hsvB.s - hsvA.s;
        }
        // For same saturation, sort by hue
        if (hsvA.h !== hsvB.h) {
            return hsvA.h - hsvB.h;
        }
        // For same hue, sort by brightness
        return hsvB.v - hsvA.v;
    });
}
/**
 * Sort palette by brightness
 */
function sortByBrightness(palette) {
    return palette.sort((a, b) => {
        const hsvA = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(a.hex));
        const hsvB = rgb9ToHsv((0, paletteUtils_1.hexToRgb9)(b.hex));
        // Sort by brightness (descending)
        return hsvB.v - hsvA.v;
    });
}
/**
 * Sort palette by similarity to a reference color
 */
function sortBySimilarity(palette, referenceHex) {
    const referenceColor = (0, paletteUtils_1.hexToRgb9)(referenceHex);
    return palette.sort((a, b) => {
        const colorA = (0, paletteUtils_1.hexToRgb9)(a.hex);
        const colorB = (0, paletteUtils_1.hexToRgb9)(b.hex);
        const distanceA = colorDistance(colorA, referenceColor);
        const distanceB = colorDistance(colorB, referenceColor);
        return distanceA - distanceB;
    });
}
/**
 * Generate a gradient between two colors
 */
function generateGradient(startColor, endColor, steps) {
    if (steps < 2) {
        throw new Error('Gradient requires at least 2 steps');
    }
    const startRgb9 = (0, paletteUtils_1.hexToRgb9)(startColor.hex);
    const endRgb9 = (0, paletteUtils_1.hexToRgb9)(endColor.hex);
    // Convert to HSV for better gradients
    const startHsv = rgb9ToHsv(startRgb9);
    const endHsv = rgb9ToHsv(endRgb9);
    // Handle hue interpolation special case
    // Find shortest path around the color wheel
    let hueDiff = endHsv.h - startHsv.h;
    if (Math.abs(hueDiff) > 180) {
        if (hueDiff > 0) {
            hueDiff = hueDiff - 360;
        }
        else {
            hueDiff = hueDiff + 360;
        }
    }
    const gradient = [];
    // Generate steps (including start and end)
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1); // 0 to 1
        // Interpolate in HSV space
        const h = (startHsv.h + hueDiff * t + 360) % 360;
        const s = startHsv.s + (endHsv.s - startHsv.s) * t;
        const v = startHsv.v + (endHsv.v - startHsv.v) * t;
        // Convert back to RGB9
        const rgb9 = hsvToRgb9(h, s, v);
        const hex = (0, paletteUtils_1.rgb9ToHex)(rgb9.r9, rgb9.g9, rgb9.b9);
        // Interpolate priority bit from start to end
        // For intermediate steps, use the start color's priority
        const priority = i === steps - 1 ? endColor.priority : startColor.priority;
        gradient.push({ hex, priority });
    }
    return gradient;
}
/**
 * Generate harmonious colors based on color theory
 */
function generateHarmonies(baseColor, mode) {
    const baseRgb9 = (0, paletteUtils_1.hexToRgb9)(baseColor.hex);
    const baseHsv = rgb9ToHsv(baseRgb9);
    const result = [{ ...baseColor }]; // Include the base color
    switch (mode) {
        case HarmonyMode.Complementary:
            // Add complementary color (opposite on color wheel)
            addHarmonyColor(result, (baseHsv.h + 180) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            break;
        case HarmonyMode.Analogous:
            // Add colors adjacent on the color wheel
            addHarmonyColor(result, (baseHsv.h + 30) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            addHarmonyColor(result, (baseHsv.h - 30 + 360) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            break;
        case HarmonyMode.Triadic:
            // Add colors forming a triangle on the color wheel
            addHarmonyColor(result, (baseHsv.h + 120) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            addHarmonyColor(result, (baseHsv.h + 240) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            break;
        case HarmonyMode.Tetradic:
            // Add colors forming a rectangle on the color wheel
            addHarmonyColor(result, (baseHsv.h + 90) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            addHarmonyColor(result, (baseHsv.h + 180) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            addHarmonyColor(result, (baseHsv.h + 270) % 360, baseHsv.s, baseHsv.v, baseColor.priority);
            break;
        case HarmonyMode.Monochromatic:
            // Same hue, varied saturation and brightness
            addHarmonyColor(result, baseHsv.h, baseHsv.s * 0.6, baseHsv.v, baseColor.priority);
            addHarmonyColor(result, baseHsv.h, baseHsv.s, baseHsv.v * 0.7, baseColor.priority);
            addHarmonyColor(result, baseHsv.h, baseHsv.s * 0.5, baseHsv.v * 0.8, baseColor.priority);
            addHarmonyColor(result, baseHsv.h, baseHsv.s * 0.7, baseHsv.v * 0.6, baseColor.priority);
            break;
    }
    return result;
}
/**
 * Helper for adding harmonious colors
 */
function addHarmonyColor(result, h, s, v, priority) {
    const rgb9 = hsvToRgb9(h, s, v);
    const hex = (0, paletteUtils_1.rgb9ToHex)(rgb9.r9, rgb9.g9, rgb9.b9);
    result.push({ hex, priority });
}
/**
 * Reduce colors in a palette while minimizing visual impact
 * Uses median cut algorithm
 */
function reducePalette(palette, targetCount) {
    if (targetCount >= palette.length) {
        return [...palette]; // Nothing to reduce
    }
    // Extract colours as RGB9 for processing
    const colors = palette.map(c => ({
        rgb9: (0, paletteUtils_1.hexToRgb9)(c.hex),
        priority: c.priority,
        original: c
    }));
    // Apply median cut algorithm
    const colorBuckets = medianCut(colors, targetCount);
    // Extract the average color from each bucket
    const reduced = [];
    for (const bucket of colorBuckets) {
        if (bucket.length === 0)
            continue;
        // Determine representative color for this bucket
        // If bucket has only one color, use it directly
        if (bucket.length === 1) {
            reduced.push({ ...bucket[0].original });
            continue;
        }
        // Otherwise, compute the average color (in RGB space)
        let sumR = 0, sumG = 0, sumB = 0;
        let hasPriority = false;
        for (const color of bucket) {
            sumR += color.rgb9.r9;
            sumG += color.rgb9.g9;
            sumB += color.rgb9.b9;
            hasPriority = hasPriority || color.priority;
        }
        const avgR = Math.round(sumR / bucket.length);
        const avgG = Math.round(sumG / bucket.length);
        const avgB = Math.round(sumB / bucket.length);
        // Convert to hex
        const hex = (0, paletteUtils_1.rgb9ToHex)(avgR, avgG, avgB);
        reduced.push({ hex, priority: hasPriority });
    }
    return reduced;
}
/**
 * Median cut algorithm for color quantization
 */
function medianCut(colors, targetCount) {
    if (colors.length <= targetCount) {
        return colors.map(c => [c]); // Each color in its own bucket
    }
    // Start with all colors in one bucket
    const buckets = [colors];
    // Split buckets until we have enough
    while (buckets.length < targetCount) {
        // Find the bucket with the largest range
        let largestRangeIndex = 0;
        let largestRange = 0;
        for (let i = 0; i < buckets.length; i++) {
            const bucket = buckets[i];
            if (bucket.length <= 1)
                continue; // Can't split further
            // Find the component with the largest range
            let rMin = 7, rMax = 0, gMin = 7, gMax = 0, bMin = 7, bMax = 0;
            for (const color of bucket) {
                const { r9, g9, b9 } = color.rgb9;
                rMin = Math.min(rMin, r9);
                rMax = Math.max(rMax, r9);
                gMin = Math.min(gMin, g9);
                gMax = Math.max(gMax, g9);
                bMin = Math.min(bMin, b9);
                bMax = Math.max(bMax, b9);
            }
            const rRange = rMax - rMin;
            const gRange = gMax - gMin;
            const bRange = bMax - bMin;
            const bucketRange = Math.max(rRange, gRange, bRange);
            if (bucketRange > largestRange) {
                largestRange = bucketRange;
                largestRangeIndex = i;
            }
        }
        // If we can't split any further, break
        if (largestRange === 0)
            break;
        // Split the bucket along the component with the largest range
        const bucketToSplit = buckets[largestRangeIndex];
        // Determine the component to sort by
        let sortComponent;
        let rMin = 7, rMax = 0, gMin = 7, gMax = 0, bMin = 7, bMax = 0;
        for (const color of bucketToSplit) {
            const { r9, g9, b9 } = color.rgb9;
            rMin = Math.min(rMin, r9);
            rMax = Math.max(rMax, r9);
            gMin = Math.min(gMin, g9);
            gMax = Math.max(gMax, g9);
            bMin = Math.min(bMin, b9);
            bMax = Math.max(bMax, b9);
        }
        const rRange = rMax - rMin;
        const gRange = gMax - gMin;
        const bRange = bMax - bMin;
        if (rRange >= gRange && rRange >= bRange) {
            sortComponent = 'r9';
        }
        else if (gRange >= rRange && gRange >= bRange) {
            sortComponent = 'g9';
        }
        else {
            sortComponent = 'b9';
        }
        // Sort by the selected component
        bucketToSplit.sort((a, b) => a.rgb9[sortComponent] - b.rgb9[sortComponent]);
        // Split at median
        const medianIndex = Math.floor(bucketToSplit.length / 2);
        const lowerHalf = bucketToSplit.slice(0, medianIndex);
        const upperHalf = bucketToSplit.slice(medianIndex);
        // Replace the bucket with the two halves
        buckets.splice(largestRangeIndex, 1, lowerHalf, upperHalf);
    }
    return buckets;
}
/**
 * Extract 9-bit RGB colors from an image
 */
async function extractColorsFromImage(imageData) {
    try {
        // This is a stub - actual implementation would depend on image processing library
        // In a full implementation, we would:
        // 1. Parse the image data
        // 2. Extract all unique colors in 8-bit RGB
        // 3. Convert to ZX Next 9-bit format
        // 4. Optionally apply quantization if there are too many colors
        // For now, return a placeholder message
        console.log('Color extraction from images would require additional dependencies');
        throw new Error('Image color extraction requires implementation with an image library');
    }
    catch (error) {
        console.error('Error extracting colors from image:', error);
        throw error;
    }
}
/**
 * Enhance priority bit visualization in the UI
 * Returns CSS classes or styles to apply to color elements
 */
function getPriorityBitVisual(isPriority) {
    if (isPriority) {
        return {
            className: 'priority-bit-active',
            style: {
                'background-image': 'linear-gradient(45deg, transparent calc(50% - 1px), rgba(255,255,255,0.5) calc(50% - 1px), rgba(255,255,255,0.5) calc(50% + 1px), transparent calc(50% + 1px))'
            }
        };
    }
    else {
        return {
            className: '',
            style: {}
        };
    }
}
//# sourceMappingURL=paletteManipulation.js.map