"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPaletteRGB = void 0;
exports.value16BitToRgb9Priority = value16BitToRgb9Priority;
exports.rgb9ToHex = rgb9ToHex;
exports.hexToRgb9 = hexToRgb9;
exports.generateDefaultPalette = generateDefaultPalette;
exports.parsePaletteFile = parsePaletteFile;
exports.encodePaletteFile = encodePaletteFile;
exports.rgbStringToHex = rgbStringToHex;
exports.generateDefaultHexPalette = generateDefaultHexPalette;
exports.rgb9ToBytes = rgb9ToBytes;
exports.bytesToRgb9 = bytesToRgb9;
// Default ZX Next palette - 9-bit RGB format (3 bits per component)
var defaultPaletteRgb = [];
for (var i = 0; i < 256; i++) {
    var r = (i & 0xE0) >> 5; // Extract top 3 bits for red
    var g = (i & 0x1C) >> 2; // Extract middle 3 bits for green
    var b = ((i & 0x03) << 1) | ((i & 0x03) > 0 ? 1 : 0); // Extract bottom 2 bits for blue, duplicate LSB
    defaultPaletteRgb.push([r, g, b]);
}
exports.defaultPaletteRGB = defaultPaletteRgb; // Export the raw RGB values
// --- Constants ---
var DEFAULT_PALETTE_ENTRIES = 256;
var BYTES_PER_COLOR_ENTRY = 2; // RRRGGGBB PIIIIIII (P=Priority, I=Ignored/Intensity?)
// --- Core Conversion Functions ---
/**
 * Converts an RGB9 color object to its 16-bit hardware representation.
 * Format: RRRGGGBB PxxxxxxL
 */
function rgb9To16BitValue(rgb9, priority) {
    var rrr = rgb9.r9 & 7; // 3 bits for red (0-7)
    var ggg = rgb9.g9 & 7; // 3 bits for green (0-7)
    var b3bit = rgb9.b9 & 7; // 3 bits for blue (0-7)
    // Extract components for the RRRGGGBB PxxxxxxL format
    var bb_high = (b3bit >> 1) & 3; // Top 2 bits of Blue (B2, B1)
    var b_low = b3bit & 1; // Least significant bit of Blue (B0 or L)
    var p = priority ? 1 : 0;
    // Construct the bytes
    var byte1 = (rrr << 5) | (ggg << 2) | bb_high; // RRRGGGBB
    var byte2 = (p << 7) | b_low; // P000000L
    return (byte1 << 8) | byte2; // Combine into 16-bit value (big-endian)
}
/**
 * Converts a 16-bit hardware palette value to RGB9 and priority.
 * Format: RRRGGGBB PxxxxxxL
 */
function value16BitToRgb9Priority(value) {
    var byte1 = (value >> 8) & 0xFF; // RRRGGGBB
    var byte2 = value & 0xFF; // PxxxxxxL
    // Extract components from byte1
    var rrr = (byte1 >> 5) & 7; // Extract top 3 bits (7-5) for red
    var ggg = (byte1 >> 2) & 7; // Extract middle 3 bits (4-2) for green
    var bb_high = byte1 & 3; // Extract bottom 2 bits (1-0) for Blue High (B2, B1)
    // Extract components from byte2
    var priority = ((byte2 >> 7) & 1) === 1; // Extract Priority bit (P)
    var b_low = byte2 & 1; // Extract Blue LSB (L or B0)
    // Reconstruct the 3-bit Blue value
    var bbb3bit = (bb_high << 1) | b_low;
    return { rgb9: { r9: rrr, g9: ggg, b9: bbb3bit }, priority: priority };
}
// Specific mapping from 3-bit component (0-7) to 8-bit component value
var rgb3to8Map = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
/**
 * Converts 3-bit RGB components (0-7) to a standard hex string (#RRGGBB)
 * using the specific ZX Next hardware mapping.
 */
function rgb9ToHex(r9, g9, b9) {
    // Ensure inputs are within the valid 0-7 range
    var rClamped = Math.max(0, Math.min(7, Math.round(r9)));
    var gClamped = Math.max(0, Math.min(7, Math.round(g9)));
    var bClamped = Math.max(0, Math.min(7, Math.round(b9)));
    // Use the lookup table for conversion
    var r = rgb3to8Map[rClamped];
    var g = rgb3to8Map[gClamped];
    var b = rgb3to8Map[bClamped];
    // Convert to hex and pad
    var rHex = r.toString(16).padStart(2, '0');
    var gHex = g.toString(16).padStart(2, '0');
    var bHex = b.toString(16).padStart(2, '0');
    return "#".concat(rHex).concat(gHex).concat(bHex);
}
/**
 * Finds the closest 3-bit value (0-7) for a given 8-bit value (0-255)
 * based on the specific ZX Next hardware mapping.
 */
function findClosest3BitValue(value8bit) {
    var closestValue = 0;
    var minDifference = Infinity;
    for (var i = 0; i < rgb3to8Map.length; i++) {
        var difference = Math.abs(value8bit - rgb3to8Map[i]);
        if (difference < minDifference) {
            minDifference = difference;
            closestValue = i;
        }
        // If the difference is the same, prefer the lower index (matches hardware?)
        // or stick with the first one found (arbitrary choice)
    }
    return closestValue;
}
/**
 * Converts a standard hex color string (#RRGGBB) to the nearest RGB9 object
 * using the specific ZX Next hardware mapping.
 */
function hexToRgb9(hexColor) {
    var hexClean = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
    if (hexClean.length !== 6) {
        return { r9: 0, g9: 0, b9: 0 };
    } // Invalid format
    var r8 = parseInt(hexClean.substring(0, 2), 16);
    var g8 = parseInt(hexClean.substring(2, 4), 16);
    var b8 = parseInt(hexClean.substring(4, 6), 16);
    // Find the closest 3-bit value for each component
    var r9 = findClosest3BitValue(r8);
    var g9 = findClosest3BitValue(g8);
    var b9 = findClosest3BitValue(b8);
    return { r9: r9, g9: g9, b9: b9 };
}
// --- Palette File Handling ---
/**
 * Generates the standard ZX Next 256-color default palette.
 * Returns an array of PaletteColor objects.
 */
function generateDefaultPalette() {
    var palette = [];
    for (var i = 0; i < DEFAULT_PALETTE_ENTRIES; i++) {
        // Formula for default palette: bits 7-5 are R, 4-2 are G, 1-0 are B
        // The lowest blue bit (bit 0 of the 9-bit value) is an OR of the two blue bits present (bits 1 and 0 of the 8-bit value)
        var rrr = (i >> 5) & 7;
        var ggg = (i >> 2) & 7;
        // Original formula seems correct for deriving 9-bit Blue from 8-bit RRRGGGBB byte i
        // B2 = original B1, B1 = original B0, B0 = original B1 | original B0
        var bbb = ((i & 0x03) << 1) | ((i & 0x03) > 0 ? 1 : 0);
        // Convert the 3-bit components using the specific hardware mapping
        var hex = rgb9ToHex(rrr, ggg, bbb);
        palette.push({ hex: hex, priority: false });
    }
    // Add Logging
    console.log("[paletteUtils] Generated default palette. First 5 entries: ".concat(JSON.stringify(palette.slice(0, 5))));
    return palette;
}
/**
 * Parses palette data (expects .nxp or .pal format - 512 bytes).
 * Returns an array of PaletteColor objects.
 */
function parsePaletteFile(fileData) {
    // Allow files smaller than 512, but must be multiple of 2 bytes
    if (fileData.length % BYTES_PER_COLOR_ENTRY !== 0) {
        throw new Error("Invalid palette file size. Size (".concat(fileData.length, ") must be a multiple of ").concat(BYTES_PER_COLOR_ENTRY, "."));
    }
    if (fileData.length > DEFAULT_PALETTE_ENTRIES * BYTES_PER_COLOR_ENTRY) {
        console.warn("Palette file size (".concat(fileData.length, ") > ").concat(DEFAULT_PALETTE_ENTRIES * BYTES_PER_COLOR_ENTRY, ". Only the first ").concat(DEFAULT_PALETTE_ENTRIES, " colors will be used."));
    }
    var numColorsInFile = Math.min(DEFAULT_PALETTE_ENTRIES, fileData.length / BYTES_PER_COLOR_ENTRY);
    console.log("Parsing ".concat(numColorsInFile, " colors from palette file (size: ").concat(fileData.length, " bytes)."));
    var dataView = new DataView(fileData.buffer, fileData.byteOffset, fileData.byteLength);
    var palette = [];
    // Read colors present in the file
    for (var i = 0; i < numColorsInFile; i++) {
        var offset = i * BYTES_PER_COLOR_ENTRY;
        var value = dataView.getUint16(offset, false); // false for big-endian
        var _a = value16BitToRgb9Priority(value), rgb9 = _a.rgb9, priority = _a.priority;
        var hex = rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9);
        // --- Log first 8 entries --- 
        if (i < 8) {
            console.log("[parsePaletteFile] Raw[".concat(i, "]: ").concat(value.toString(16).padStart(4, '0'), ", Parsed: { hex: \"").concat(hex, "\", priority: ").concat(priority, " }"));
        }
        // --- End Log ---
        palette.push({ hex: hex, priority: priority });
    }
    // Pad the palette with black up to 256 entries if file was smaller
    while (palette.length < DEFAULT_PALETTE_ENTRIES) {
        palette.push({ hex: '#000000', priority: false });
    }
    return palette; // Always return a 256-color array
}
/**
 * Encodes an array of PaletteColor objects into a buffer (512 bytes, .nxp/.pal format).
 */
function encodePaletteFile(palette) {
    // Use Uint8Array and DataView for platform-independent writing
    var buffer = new ArrayBuffer(DEFAULT_PALETTE_ENTRIES * BYTES_PER_COLOR_ENTRY);
    var dataView = new DataView(buffer);
    var outputArray = new Uint8Array(buffer); // Create Uint8Array view
    if (palette.length !== DEFAULT_PALETTE_ENTRIES) {
        console.warn("Palette array length (".concat(palette.length, ") is not ").concat(DEFAULT_PALETTE_ENTRIES, ". Output buffer might be incomplete or padded."));
    }
    for (var i = 0; i < DEFAULT_PALETTE_ENTRIES; i++) {
        var offset = i * BYTES_PER_COLOR_ENTRY;
        var colorEntry = palette[i] || { hex: '#000000', priority: false }; // Default if missing
        var rgb9 = hexToRgb9(colorEntry.hex);
        var value = rgb9To16BitValue(rgb9, colorEntry.priority);
        // Write the 16-bit value (big-endian to match the parse function)
        dataView.setUint16(offset, value, false); // false for big-endian (RRRGGGBB byte first, then priority byte)
    }
    return outputArray; // Return the Uint8Array
}
// --- Helper for Webview ---
/**
 * Converts an `rgb(r, g, b)` string to a hex string.
 * Assumes standard 0-255 values in the rgb string.
 */
function rgbStringToHex(rgbString) {
    var match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
        return null; // Return null or throw error?
    }
    var r = parseInt(match[1], 10);
    var g = parseInt(match[2], 10);
    var b = parseInt(match[3], 10);
    var rHex = r.toString(16).padStart(2, '0');
    var gHex = g.toString(16).padStart(2, '0');
    var bHex = b.toString(16).padStart(2, '0');
    return "#".concat(rHex).concat(gHex).concat(bHex);
}
// --- Deprecated / To Be Removed ---
/** @deprecated Use generateDefaultPalette() instead */
function generateDefaultHexPalette() {
    return generateDefaultPalette().map(function (c) { return c.hex; });
}
/** deprecated Use rgb9To16BitValue and Buffer.writeUInt16LE instead */
function rgb9ToBytes(r9, g9, b9) {
    var value = rgb9To16BitValue({ r9: r9, g9: g9, b9: b9 }, false); // Assume false priority
    return [(value >> 8) & 0xFF, value & 0xFF];
}
/** @deprecated Use value16BitToRgb9Priority instead */
function bytesToRgb9(byte1, byte2) {
    var value = (byte1 << 8) | byte2;
    var rgb9 = value16BitToRgb9Priority(value).rgb9;
    return rgb9;
}
