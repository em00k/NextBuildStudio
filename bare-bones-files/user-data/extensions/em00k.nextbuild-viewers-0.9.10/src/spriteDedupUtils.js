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
exports.defaultOptions = exports.MatchType = void 0;
exports.generateSpriteHash = generateSpriteHash;
exports.generateFlippedHorizontalHash = generateFlippedHorizontalHash;
exports.generateFlippedVerticalHash = generateFlippedVerticalHash;
exports.generateRotated180Hash = generateRotated180Hash;
exports.detectDuplicates = detectDuplicates;
exports.groupDuplicates = groupDuplicates;
exports.removeDuplicates = removeDuplicates;
exports.createSpriteMapping = createSpriteMapping;
exports.applySpriteMappingToBlockData = applySpriteMappingToBlockData;
exports.findBlockFilesThatReferenceSprite = findBlockFilesThatReferenceSprite;
const vscode = __importStar(require("vscode"));
// Defines how sprites match
var MatchType;
(function (MatchType) {
    MatchType["Exact"] = "exact";
    MatchType["FlippedHorizontal"] = "flippedH";
    MatchType["FlippedVertical"] = "flippedV";
    MatchType["Rotated180"] = "rotated180"; // Same as both flips
})(MatchType || (exports.MatchType = MatchType = {}));
// Default options
exports.defaultOptions = {
    detectFlippedHorizontal: true,
    detectFlippedVertical: true,
    detectRotated: true,
    compareAcrossTypes: false
};
/**
 * Generates a hash for a sprite to enable quick comparison
 * @param sprite The sprite to hash
 * @returns A string hash representing the sprite's pixel content
 */
function generateSpriteHash(sprite) {
    return sprite.pixels.join(',');
}
/**
 * Generates a hash for a horizontally flipped version of the sprite
 * @param sprite The sprite to hash
 * @returns A string hash of the sprite if it were horizontally flipped
 */
function generateFlippedHorizontalHash(sprite) {
    const { width, height } = sprite;
    const flippedPixels = [];
    for (let y = 0; y < height; y++) {
        for (let x = width - 1; x >= 0; x--) {
            const originalIndex = y * width + x;
            flippedPixels.push(sprite.pixels[originalIndex]);
        }
    }
    return flippedPixels.join(',');
}
/**
 * Generates a hash for a vertically flipped version of the sprite
 * @param sprite The sprite to hash
 * @returns A string hash of the sprite if it were vertically flipped
 */
function generateFlippedVerticalHash(sprite) {
    const { width, height } = sprite;
    const flippedPixels = [];
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            flippedPixels.push(sprite.pixels[originalIndex]);
        }
    }
    return flippedPixels.join(',');
}
/**
 * Generates a hash for a 180° rotated version of the sprite (both flips)
 * @param sprite The sprite to hash
 * @returns A string hash of the sprite if it were rotated 180°
 */
function generateRotated180Hash(sprite) {
    const { width, height } = sprite;
    const rotatedPixels = [];
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const originalIndex = y * width + x;
            rotatedPixels.push(sprite.pixels[originalIndex]);
        }
    }
    return rotatedPixels.join(',');
}
/**
 * Detects duplicates in a sprite collection according to the provided options
 * @param spriteData The sprite data to analyze
 * @param options Options for detection behavior
 * @returns An array of detected duplicates
 */
function detectDuplicates(spriteData, options = exports.defaultOptions) {
    const duplicates = [];
    const spriteHashes = new Map();
    const flippedHHashes = new Map();
    const flippedVHashes = new Map();
    const rotated180Hashes = new Map();
    // First pass: generate hashes for all sprites
    for (let i = 0; i < spriteData.sprites.length; i++) {
        const sprite = spriteData.sprites[i];
        const hash = generateSpriteHash(sprite);
        // Check for exact match with previous sprites
        if (spriteHashes.has(hash)) {
            duplicates.push({
                originalIndex: spriteHashes.get(hash),
                duplicateIndex: i,
                matchType: MatchType.Exact
            });
            continue; // Skip other checks for this sprite
        }
        // Check for flipped horizontal match if enabled
        if (options.detectFlippedHorizontal) {
            const flippedHHash = generateFlippedHorizontalHash(sprite);
            if (spriteHashes.has(flippedHHash)) {
                duplicates.push({
                    originalIndex: spriteHashes.get(flippedHHash),
                    duplicateIndex: i,
                    matchType: MatchType.FlippedHorizontal
                });
                continue;
            }
            flippedHHashes.set(hash, i);
        }
        // Check for flipped vertical match if enabled
        if (options.detectFlippedVertical) {
            const flippedVHash = generateFlippedVerticalHash(sprite);
            if (spriteHashes.has(flippedVHash)) {
                duplicates.push({
                    originalIndex: spriteHashes.get(flippedVHash),
                    duplicateIndex: i,
                    matchType: MatchType.FlippedVertical
                });
                continue;
            }
            flippedVHashes.set(hash, i);
        }
        // Check for rotated match if enabled
        if (options.detectRotated) {
            const rotatedHash = generateRotated180Hash(sprite);
            if (spriteHashes.has(rotatedHash)) {
                duplicates.push({
                    originalIndex: spriteHashes.get(rotatedHash),
                    duplicateIndex: i,
                    matchType: MatchType.Rotated180
                });
                continue;
            }
            rotated180Hashes.set(hash, i);
        }
        // Store hash for this sprite for future comparisons
        spriteHashes.set(hash, i);
    }
    return duplicates;
}
/**
 * Groups duplicate sprites for easier analysis
 * @param duplicates The raw duplicates array
 * @returns An array of duplicate groups, each with one original and its duplicates
 */
function groupDuplicates(duplicates) {
    const groups = new Map();
    duplicates.forEach(dupe => {
        if (!groups.has(dupe.originalIndex)) {
            groups.set(dupe.originalIndex, []);
        }
        groups.get(dupe.originalIndex).push({
            index: dupe.duplicateIndex,
            matchType: dupe.matchType
        });
    });
    return Array.from(groups.entries()).map(([originalIndex, duplicates]) => ({
        originalIndex,
        duplicates
    }));
}
/**
 * Removes duplicates from the sprite data, keeping only the first occurrence
 * @param spriteData The sprite data to modify
 * @param duplicates The duplicates to remove
 * @returns A new sprite data object without the duplicates
 */
function removeDuplicates(spriteData, duplicates) {
    // Get indices to remove (sorted high to low to not disrupt indices)
    const indicesToRemove = duplicates
        .map(dupe => dupe.duplicateIndex)
        .sort((a, b) => b - a);
    // Clone sprites array
    const newSprites = [...spriteData.sprites];
    // Remove duplicates
    for (const index of indicesToRemove) {
        newSprites.splice(index, 1);
    }
    // Re-index sprites
    for (let i = 0; i < newSprites.length; i++) {
        newSprites[i].index = i;
    }
    // Return new sprite data
    return {
        ...spriteData,
        sprites: newSprites,
        count: newSprites.length
    };
}
/**
 * Creates a mapping list that can be used to reference the original sprites
 * This is useful for preserving references when duplicates are removed
 * @param originalCount The original number of sprites
 * @param duplicates The duplicates that were removed
 * @returns An array mapping from original indices to new indices
 */
function createSpriteMapping(originalCount, duplicates) {
    // Start with 1:1 mapping
    const mapping = Array.from({ length: originalCount }, (_, i) => i);
    // Sort duplicates by duplicateIndex (high to low)
    const sortedDuplicates = [...duplicates].sort((a, b) => b.duplicateIndex - a.duplicateIndex);
    // For each duplicate, update the mapping
    for (const dupe of sortedDuplicates) {
        // Map the duplicate to its original
        mapping[dupe.duplicateIndex] = mapping[dupe.originalIndex];
        // Adjust all indices greater than the removed one
        for (let i = dupe.duplicateIndex + 1; i < mapping.length; i++) {
            mapping[i]--;
        }
    }
    return mapping;
}
/**
 * Applies a sprite mapping to block or map data
 * @param blockData The block or map data as Uint8Array
 * @param spriteMapping The mapping array from original sprite indices to new indices
 * @param isMapFile Whether the data is from a map file
 * @returns A new Uint8Array with updated sprite references
 */
function applySpriteMappingToBlockData(blockData, spriteMapping, isMapFile) {
    // Create a new array to avoid modifying the original data
    const updatedData = new Uint8Array(blockData.length);
    // For both block and map files, each byte is a sprite index reference
    for (let i = 0; i < blockData.length; i++) {
        const originalIndex = blockData[i];
        // Only remap if the index is within our mapping's range
        if (originalIndex < spriteMapping.length) {
            updatedData[i] = spriteMapping[originalIndex];
        }
        else {
            // Keep the original value if it's out of range
            updatedData[i] = originalIndex;
        }
    }
    return updatedData;
}
/**
 * Find all block or map files that reference a specific sprite file
 * This performs a workspace search for .nxb and .nxm files and analyzes
 * each file for references to the sprite file
 * @param spriteFilePath The path to the sprite file
 * @returns Promise resolving to an array of block/map file URIs
 */
async function findBlockFilesThatReferenceSprite(spriteFilePath) {
    // First, list all potential block/map files in the workspace
    const blockFiles = await vscode.workspace.findFiles('**/*.{nxb,nxm}');
    const referencingFiles = [];
    const spriteFileName = vscode.Uri.file(spriteFilePath).fsPath;
    // Examine each potential file
    for (const fileUri of blockFiles) {
        try {
            // Read the file content
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            // Check if this file references our sprite file
            // For simplicity, we'll check if the sprite filename appears in the same directory
            // More sophisticated checks could involve parsing a config file or header
            const blockDirPath = vscode.Uri.file(fileUri.fsPath).with({ path: vscode.Uri.file(fileUri.fsPath).path.substring(0, vscode.Uri.file(fileUri.fsPath).path.lastIndexOf('/')) }).fsPath;
            const spriteDirPath = vscode.Uri.file(spriteFileName).with({ path: vscode.Uri.file(spriteFileName).path.substring(0, vscode.Uri.file(spriteFileName).path.lastIndexOf('/')) }).fsPath;
            // If the files are in the same directory, assume they're related
            if (blockDirPath === spriteDirPath) {
                referencingFiles.push(fileUri);
            }
        }
        catch (err) {
            console.error(`Error checking file ${fileUri.fsPath}:`, err);
            // Continue with the next file
        }
    }
    return referencingFiles;
}
//# sourceMappingURL=spriteDedupUtils.js.map