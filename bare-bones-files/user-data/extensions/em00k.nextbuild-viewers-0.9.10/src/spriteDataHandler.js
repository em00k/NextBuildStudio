"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse8BitSprites = parse8BitSprites;
exports.parse4BitSprites = parse4BitSprites;
exports.parse8x8Font = parse8x8Font;
exports.parse8x8Tiles = parse8x8Tiles;
exports.encodeSpriteData = encodeSpriteData;
exports.getSpriteByOriginalIndex = getSpriteByOriginalIndex;
// --- Parsing Functions ---
function parse8BitSprites(data, preserveIndices) {
    if (preserveIndices === void 0) { preserveIndices = false; }
    var sprites = [];
    var spriteSize = 256; // 16x16 pixels, 1 byte per pixel
    var maxSprites = Math.floor(data.length / spriteSize);
    var numSprites = Math.min(maxSprites, 512); // Increased limit to 512
    // Create hash map for quick sprite comparison if preserveIndices is enabled
    var spriteHashes = new Map();
    // Original to deduplicated mapping (index = original position, value = deduplicated position)
    var originalToDeduplicatedMap = new Array(numSprites).fill(-1);
    // Deduplicated to original mapping (index = deduplicated position, value = original position)
    var deduplicatedToOriginalMap = [];
    console.log("[DEBUG] parse8BitSprites: Processing ".concat(numSprites, " sprites with preserveIndices=").concat(preserveIndices));
    for (var i = 0; i < numSprites; i++) {
        var spritePixels = [];
        var offset = i * spriteSize;
        // Read 16x16 pixels (1 byte per pixel)
        for (var y = 0; y < 16; y++) {
            for (var x = 0; x < 16; x++) {
                var pixelOffset = offset + (y * 16) + x;
                if (pixelOffset < data.length) {
                    var colorIndex = data[pixelOffset];
                    spritePixels.push(colorIndex);
                }
                else {
                    spritePixels.push(0); // Default to 0 for missing data
                }
            }
        }
        // If preserveIndices is enabled, we'll check for duplicates
        if (preserveIndices) {
            // Generate a hash for quick comparison
            var hash = spritePixels.join(',');
            // Check if we've seen this sprite before
            if (spriteHashes.has(hash)) {
                // This is a duplicate - map it to the existing sprite
                var existingIndex = spriteHashes.get(hash);
                originalToDeduplicatedMap[i] = existingIndex;
                console.log("[DEBUG] Sprite ".concat(i, " is a duplicate of sprite ").concat(existingIndex));
                continue; // Skip adding this duplicate
            }
            else {
                // This is a new unique sprite
                var newIndex = sprites.length;
                spriteHashes.set(hash, newIndex);
                originalToDeduplicatedMap[i] = newIndex;
                deduplicatedToOriginalMap.push(i);
            }
        }
        sprites.push({
            index: sprites.length, // Use the current length as the index
            pixels: spritePixels,
            width: 16,
            height: 16
        });
    }
    console.log("[DEBUG] Deduplicated sprites: ".concat(sprites.length, " unique sprites from ").concat(numSprites, " total"));
    return {
        type: 'sprite8',
        sprites: sprites,
        width: 16,
        height: 16,
        description: "8-bit sprites (16\u00D716 pixels, 256 colors)",
        count: sprites.length,
        // Add mapping data if using preserveIndices
        originalToDeduplicatedMap: preserveIndices ? originalToDeduplicatedMap : undefined,
        deduplicatedToOriginalMap: preserveIndices ? deduplicatedToOriginalMap : undefined,
        originalCount: preserveIndices ? numSprites : undefined
    };
}
function parse4BitSprites(data, paletteOffset, preserveIndices) {
    if (preserveIndices === void 0) { preserveIndices = false; }
    var sprites = [];
    var spriteSize = 128; // 16x16 pixels, 4 bits per pixel (2 pixels per byte)
    var maxSprites = Math.floor(data.length / spriteSize);
    var numSprites = Math.min(maxSprites, 512); // Increased limit to 512
    // Create hash map for quick sprite comparison if preserveIndices is enabled
    var spriteHashes = new Map();
    // Original to deduplicated mapping (index = original position, value = deduplicated position)
    var originalToDeduplicatedMap = new Array(numSprites).fill(-1);
    // Deduplicated to original mapping (index = deduplicated position, value = original position)
    var deduplicatedToOriginalMap = [];
    console.log("[DEBUG] parse4BitSprites: Processing ".concat(numSprites, " sprites with preserveIndices=").concat(preserveIndices));
    for (var i = 0; i < numSprites; i++) {
        var spritePixels = [];
        var offset = i * spriteSize;
        // Read 16x16 pixels (4 bits per pixel, 2 pixels per byte)
        for (var y = 0; y < 16; y++) {
            for (var x = 0; x < 16; x += 2) {
                var byteOffset = offset + (y * 8) + (x / 2);
                if (byteOffset < data.length) {
                    var byte = data[byteOffset];
                    var pixel1 = (byte >> 4) & 0x0F; // High nibble
                    var pixel2 = byte & 0x0F; // Low nibble
                    spritePixels.push(pixel1 + paletteOffset);
                    if (x + 1 < 16) {
                        spritePixels.push(pixel2 + paletteOffset);
                    }
                }
                else {
                    spritePixels.push(0); // Default to 0 for missing data
                    if (x + 1 < 16) {
                        spritePixels.push(0);
                    }
                }
            }
        }
        // If preserveIndices is enabled, we'll check for duplicates
        if (preserveIndices) {
            // Generate a hash for quick comparison
            var hash = spritePixels.join(',');
            // Check if we've seen this sprite before
            if (spriteHashes.has(hash)) {
                // This is a duplicate - map it to the existing sprite
                var existingIndex = spriteHashes.get(hash);
                originalToDeduplicatedMap[i] = existingIndex;
                console.log("[DEBUG] Sprite ".concat(i, " is a duplicate of sprite ").concat(existingIndex));
                continue; // Skip adding this duplicate
            }
            else {
                // This is a new unique sprite
                var newIndex = sprites.length;
                spriteHashes.set(hash, newIndex);
                originalToDeduplicatedMap[i] = newIndex;
                deduplicatedToOriginalMap.push(i);
            }
        }
        sprites.push({
            index: sprites.length, // Use the current length as the index
            pixels: spritePixels,
            width: 16,
            height: 16
        });
    }
    console.log("[DEBUG] Deduplicated sprites: ".concat(sprites.length, " unique sprites from ").concat(numSprites, " total"));
    return {
        type: 'sprite4',
        sprites: sprites,
        width: 16,
        height: 16,
        description: "4-bit sprites (16\u00D716 pixels, 16 colors, palette offset: ".concat(paletteOffset, ")"),
        count: sprites.length,
        paletteOffset: paletteOffset, // Store the offset used for parsing
        // Add mapping data if using preserveIndices
        originalToDeduplicatedMap: preserveIndices ? originalToDeduplicatedMap : undefined,
        deduplicatedToOriginalMap: preserveIndices ? deduplicatedToOriginalMap : undefined,
        originalCount: preserveIndices ? numSprites : undefined
    };
}
function parse8x8Font(data) {
    var chars = [];
    var charSize = 64; // 8x8 pixels, 1 byte per pixel
    var maxChars = Math.floor(data.length / charSize);
    var numChars = Math.min(maxChars, 256); // Max 256 characters
    for (var i = 0; i < numChars; i++) {
        var charPixels = [];
        var offset = i * charSize;
        // Read 8x8 pixels (1 byte per pixel)
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                var pixelOffset = offset + (y * 8) + x;
                if (pixelOffset < data.length) {
                    var colorIndex = data[pixelOffset];
                    charPixels.push(colorIndex);
                }
                else {
                    charPixels.push(0); // Default to 0 for missing data
                }
            }
        }
        chars.push({
            index: i,
            pixels: charPixels,
            width: 8,
            height: 8
        });
    }
    return {
        type: 'font8x8',
        sprites: chars,
        width: 8,
        height: 8,
        description: "8\u00D78 font (256 colors)",
        count: numChars
    };
}
function parse8x8Tiles(data, paletteOffset) {
    var tiles = [];
    var tileSize = 32; // 8x8 pixels, 4 bits per pixel (2 pixels per byte)
    var maxTiles = Math.floor(data.length / tileSize);
    var numTiles = Math.min(maxTiles, 512); // Reasonable limit
    for (var i = 0; i < numTiles; i++) {
        var tilePixels = [];
        var offset = i * tileSize;
        // Read 8x8 pixels (4 bits per pixel, 2 pixels per byte)
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x += 2) {
                var byteOffset = offset + (y * 4) + (x / 2);
                if (byteOffset < data.length) {
                    var byte = data[byteOffset];
                    var pixel1 = (byte >> 4) & 0x0F; // High nibble
                    var pixel2 = byte & 0x0F; // Low nibble
                    tilePixels.push(pixel1 + paletteOffset);
                    if (x + 1 < 8) {
                        tilePixels.push(pixel2 + paletteOffset);
                    }
                }
                else {
                    tilePixels.push(0); // Default to 0 for missing data
                    if (x + 1 < 8) {
                        tilePixels.push(0);
                    }
                }
            }
        }
        tiles.push({
            index: i,
            pixels: tilePixels,
            width: 8,
            height: 8
        });
    }
    return {
        type: 'tile8x8',
        sprites: tiles,
        width: 8,
        height: 8,
        description: "8\u00D78 tiles (16 colors, palette offset: ".concat(paletteOffset, ")"),
        count: numTiles,
        paletteOffset: paletteOffset // Store the offset used for parsing
    };
}
// --- Encoding Functions ---
function encodeSpriteData(spriteData) {
    var _a, _b;
    switch (spriteData.type) {
        case 'sprite8':
            return encode8BitSpriteData(spriteData, 16, 16);
        case 'sprite4':
            var offset4 = (_a = spriteData.paletteOffset) !== null && _a !== void 0 ? _a : 0; // Use stored or default offset
            console.log("Encoding 4-bit sprite data with offset: ".concat(offset4));
            return encode4BitSpriteData(spriteData, 16, 16, offset4);
        case 'font8x8':
            return encode8BitSpriteData(spriteData, 8, 8);
        case 'tile8x8':
            var offsetTile = (_b = spriteData.paletteOffset) !== null && _b !== void 0 ? _b : 0; // Use stored or default offset
            console.log("Encoding 4-bit tile data with offset: ".concat(offsetTile));
            return encode4BitSpriteData(spriteData, 8, 8, offsetTile);
        default:
            // Ensure exhaustive check (TypeScript will warn if a type is missed)
            var _exhaustiveCheck = spriteData.type;
            throw new Error("Unsupported sprite type for encoding: ".concat(_exhaustiveCheck));
    }
}
function encode8BitSpriteData(spriteData, width, height) {
    var spriteSize = width * height;
    var numSprites = spriteData.sprites.length;
    var bufferSize = numSprites * spriteSize;
    var buffer = Buffer.alloc(bufferSize);
    for (var i = 0; i < numSprites; i++) {
        var sprite = spriteData.sprites[i];
        var offset = i * spriteSize;
        if (!sprite || !sprite.pixels || sprite.pixels.length !== spriteSize) {
            console.warn("Skipping invalid sprite data at index ".concat(i, " during 8-bit encoding"));
            // Fill with 0s to maintain buffer size
            for (var p = 0; p < spriteSize; p++) {
                buffer[offset + p] = 0;
            }
            continue; // Skip if sprite data is invalid
        }
        for (var p = 0; p < spriteSize; p++) {
            buffer[offset + p] = sprite.pixels[p] & 0xFF; // Ensure it's a byte
        }
    }
    return buffer;
}
function encode4BitSpriteData(spriteData, width, height, paletteOffset) {
    var _a, _b;
    var pixelsPerSprite = width * height;
    var bytesPerSprite = pixelsPerSprite / 2;
    var numSprites = spriteData.sprites.length;
    var bufferSize = numSprites * bytesPerSprite;
    var buffer = Buffer.alloc(bufferSize);
    for (var i = 0; i < numSprites; i++) {
        var sprite = spriteData.sprites[i];
        var spriteOffsetBytes = i * bytesPerSprite;
        if (!sprite || !sprite.pixels || sprite.pixels.length !== pixelsPerSprite) {
            console.warn("Skipping invalid 4-bit sprite data at index ".concat(i, " during encoding"));
            // Fill with 0s to maintain buffer size
            for (var b = 0; b < bytesPerSprite; b++) {
                buffer[spriteOffsetBytes + b] = 0;
            }
            continue; // Skip if sprite data is invalid
        }
        for (var p = 0; p < pixelsPerSprite; p += 2) {
            // Calculate the byte index within the overall buffer
            var byteIndex = spriteOffsetBytes + (p / 2);
            // Get the two pixel indices, subtract the offset, ensure they are within 0-15 range
            var pixelValue1 = (_a = sprite.pixels[p]) !== null && _a !== void 0 ? _a : 0; // Default to 0 if somehow undefined
            var pixelValue2 = (p + 1 < pixelsPerSprite) ? ((_b = sprite.pixels[p + 1]) !== null && _b !== void 0 ? _b : 0) : 0;
            var pixelIndex1 = Math.max(0, Math.min(15, pixelValue1 - paletteOffset)) & 0x0F;
            var pixelIndex2 = Math.max(0, Math.min(15, pixelValue2 - paletteOffset)) & 0x0F;
            // Combine into one byte (pixel1 in high nibble, pixel2 in low nibble)
            var byteValue = (pixelIndex1 << 4) | pixelIndex2;
            buffer[byteIndex] = byteValue;
        }
    }
    return buffer;
}
// Helper function to get a sprite by its original index
function getSpriteByOriginalIndex(spriteData, originalIndex) {
    if (!spriteData.originalToDeduplicatedMap) {
        // If no mapping exists, assume 1:1 correspondence
        return originalIndex < spriteData.sprites.length ? spriteData.sprites[originalIndex] : null;
    }
    // Check if the original index is valid
    if (originalIndex < 0 || originalIndex >= spriteData.originalToDeduplicatedMap.length) {
        return null;
    }
    // Get the deduplicated index
    var deduplicatedIndex = spriteData.originalToDeduplicatedMap[originalIndex];
    // Check if the deduplicated index is valid
    if (deduplicatedIndex < 0 || deduplicatedIndex >= spriteData.sprites.length) {
        return null;
    }
    return spriteData.sprites[deduplicatedIndex];
}
