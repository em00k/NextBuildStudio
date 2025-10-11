"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOptimizedBlockFormat = createOptimizedBlockFormat;
exports.serializeOptimizedBlockFile = serializeOptimizedBlockFile;
exports.deserializeOptimizedBlockFile = deserializeOptimizedBlockFile;
exports.convertToTraditionalFormat = convertToTraditionalFormat;
const buffer_1 = require("buffer");
/**
 * Converts a traditional block file to the optimized format
 *
 * @param blockData The raw block data bytes
 * @param spriteIndices The mapped sprite indices after deduplication
 * @param blockWidth Width of each block in sprites (typically 1)
 * @param blockHeight Height of each block in sprites (typically 1)
 * @param spriteWidth Width of each sprite in pixels
 * @param spriteHeight Height of each sprite in pixels
 * @returns The optimized block file data
 */
function createOptimizedBlockFormat(blockData, spriteIndices, blockWidth, blockHeight, spriteWidth, spriteHeight) {
    console.log(`[DEBUG] Creating optimized block format: ${blockWidth}x${blockHeight} blocks`);
    // Log the range of sprite indices for debugging
    if (spriteIndices && spriteIndices.length > 0) {
        const minIndex = Math.min(...spriteIndices);
        const maxIndex = Math.max(...spriteIndices);
        console.log(`[DEBUG] Sprite index mapping range: ${minIndex}-${maxIndex} (length: ${spriteIndices.length})`);
    }
    const blocks = [];
    const spritesPerBlock = blockWidth * blockHeight;
    const blockCount = Math.floor(blockData.length / spritesPerBlock);
    console.log(`[DEBUG] Block count: ${blockCount}, sprites per block: ${spritesPerBlock}`);
    console.log(`[DEBUG] Sprite dimensions: ${spriteWidth}x${spriteHeight} pixels`);
    // Process each block
    for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
        const spritePositions = [];
        // Process each sprite position within this block
        for (let posY = 0; posY < blockHeight; posY++) {
            for (let posX = 0; posX < blockWidth; posX++) {
                const positionIndex = (blockIndex * spritesPerBlock) + (posY * blockWidth) + posX;
                // Ensure position index is valid
                if (positionIndex >= blockData.length) {
                    console.warn(`[WARNING] Position index ${positionIndex} is out of range for block data length ${blockData.length}`);
                    continue;
                }
                // Get the original sprite index
                const originalSpriteIndex = blockData[positionIndex];
                // Skip empty sprites (index 0) - this is the key optimization
                if (originalSpriteIndex === 0) {
                    console.log(`[DEBUG] Skipping empty sprite at block ${blockIndex}, position (${posX},${posY})`);
                    continue;
                }
                // Validate against sprite indices array
                if (originalSpriteIndex >= spriteIndices.length) {
                    console.warn(`[WARNING] Original sprite index ${originalSpriteIndex} is out of range for sprite mapping length ${spriteIndices.length}`);
                    continue;
                }
                // Use the mapped sprite index if available
                const spriteIndex = spriteIndices[originalSpriteIndex];
                // Calculate the pixel position using the sprite dimensions
                const pixelX = posX * spriteWidth;
                const pixelY = posY * spriteHeight;
                spritePositions.push({
                    x: pixelX,
                    y: pixelY,
                    spriteIndex
                });
                console.log(`[DEBUG] Block ${blockIndex}, adding sprite index ${spriteIndex} at position (${posX},${posY}) / pixel (${pixelX},${pixelY})`);
            }
        }
        // Add the block even if it has no sprites
        blocks.push({ spritePositions });
    }
    // Log some statistics about the optimized format
    let totalPositions = 0;
    let usedSpriteIndices = new Set();
    for (const block of blocks) {
        totalPositions += block.spritePositions.length;
        for (const pos of block.spritePositions) {
            usedSpriteIndices.add(pos.spriteIndex);
        }
    }
    console.log(`[DEBUG] Optimized format created: ${blocks.length} blocks, ${totalPositions} sprite positions`);
    console.log(`[DEBUG] Unique sprite indices used: ${usedSpriteIndices.size}, max index: ${Math.max(...usedSpriteIndices) || 0}`);
    return {
        blocks,
        originalWidth: blockWidth,
        originalHeight: blockHeight
    };
}
/**
 * Serialize an optimized block file to binary format
 *
 * Format:
 * [2 bytes] - Magic number "OB" (Optimized Blocks)
 * [1 byte] - Version (currently 1)
 * [1 byte] - Original block width (in sprites)
 * [1 byte] - Original block height (in sprites)
 * [2 bytes] - Number of blocks (UInt16LE)
 *
 * For each block:
 *   [1 byte] - Number of sprite positions (UInt8)
 *   For each sprite position:
 *     [1 byte] - X offset (pixel, UInt8)
 *     [1 byte] - Y offset (pixel, UInt8)
 *     [2 bytes] - Sprite index (UInt16LE)
 *
 * @param optimizedBlockFile The optimized block file data
 * @returns Binary buffer containing the serialized data
 */
function serializeOptimizedBlockFile(optimizedBlockFile) {
    // Calculate buffer size
    let size = 7; // Header: magic(2) + version(1) + width(1) + height(1) + blockCount(2)
    // Add space for each block
    for (const block of optimizedBlockFile.blocks) {
        size += 1; // Sprite count (UInt8)
        // Each position: x(1) + y(1) + index(2) = 4 bytes
        size += block.spritePositions.length * 4;
    }
    const buffer = buffer_1.Buffer.alloc(size);
    let offset = 0;
    // Write header
    buffer.write("OB", offset); // Magic number
    offset += 2;
    buffer.writeUInt8(1, offset); // Version
    offset += 1;
    buffer.writeUInt8(optimizedBlockFile.originalWidth, offset);
    offset += 1;
    buffer.writeUInt8(optimizedBlockFile.originalHeight, offset);
    offset += 1;
    buffer.writeUInt16LE(optimizedBlockFile.blocks.length, offset);
    offset += 2;
    // Write each block
    for (const block of optimizedBlockFile.blocks) {
        buffer.writeUInt8(block.spritePositions.length, offset); // Sprite count
        offset += 1;
        // Write each sprite position
        for (const position of block.spritePositions) {
            // Validate and clamp X/Y values to valid UInt8 range
            const validX = Math.min(255, Math.max(0, position.x));
            const validY = Math.min(255, Math.max(0, position.y));
            // Sprite index can now be up to 65535, covering the Next's 0-511 range.
            const validSpriteIndex = Math.max(0, position.spriteIndex);
            // Check if X/Y values were clamped and log a warning
            if (position.x !== validX || position.y !== validY) {
                console.warn(`[WARNING] X/Y Offset had to be clamped: original(x=${position.x}, y=${position.y}), clamped(x=${validX}, y=${validY}) for sprite index ${position.spriteIndex}`);
            }
            // Check if spriteIndex was negative (shouldn't happen, but good practice)
            if (position.spriteIndex !== validSpriteIndex) {
                console.warn(`[WARNING] Sprite index was negative, clamped to 0: original(${position.spriteIndex})`);
            }
            buffer.writeUInt8(validX, offset); // X position (1 byte)
            offset += 1;
            buffer.writeUInt8(validY, offset); // Y position (1 byte)
            offset += 1;
            buffer.writeUInt16LE(validSpriteIndex, offset); // Sprite index (2 bytes, Little Endian)
            offset += 2;
        }
    }
    return buffer;
}
/**
 * Deserialize a binary buffer into an optimized block file
 *
 * @param buffer Binary buffer containing the serialized data
 * @returns The deserialized optimized block file data
 */
function deserializeOptimizedBlockFile(buffer) {
    let offset = 0;
    // Read and verify magic number
    const magic = buffer.toString('ascii', offset, offset + 2);
    if (magic !== "OB") {
        throw new Error("Invalid file format: Not an optimized block file");
    }
    offset += 2;
    // Read version
    const version = buffer.readUInt8(offset);
    if (version !== 1) {
        throw new Error(`Unsupported version: ${version}`);
    }
    offset += 1;
    // Read original dimensions
    const originalWidth = buffer.readUInt8(offset);
    offset += 1;
    const originalHeight = buffer.readUInt8(offset);
    offset += 1;
    // Read block count
    const blockCount = buffer.readUInt16LE(offset);
    offset += 2;
    console.log(`[DEBUG] Deserializing optimized block file: ${blockCount} blocks, dimensions ${originalWidth}x${originalHeight}`);
    const blocks = [];
    // Read each block
    for (let i = 0; i < blockCount; i++) {
        const spriteCount = buffer.readUInt8(offset);
        offset += 1;
        const spritePositions = [];
        console.log(`[DEBUG] Block ${i}: ${spriteCount} sprite positions`);
        // Read each sprite position
        for (let j = 0; j < spriteCount; j++) {
            const x = buffer.readUInt8(offset);
            offset += 1;
            const y = buffer.readUInt8(offset);
            offset += 1;
            const spriteIndex = buffer.readUInt16LE(offset); // Read UInt16LE (2 bytes)
            offset += 2;
            // Skip empty sprites (index 0) - assuming 0 still means empty
            if (spriteIndex === 0) {
                console.log(`[DEBUG] Skipping sprite at position (${x},${y}) with index 0 (empty)`);
                continue;
            }
            // Calculate logical position for validation
            const posX = Math.floor(x / 16); // Assuming 16px sprites
            const posY = Math.floor(y / 16);
            // Verify position is within block boundaries
            if (posX >= originalWidth || posY >= originalHeight) {
                console.warn(`[WARNING] Position (${posX},${posY}) is outside block dimensions ${originalWidth}x${originalHeight} - adjusting to fit`);
                continue;
            }
            console.log(`[DEBUG] Block ${i}, adding sprite index ${spriteIndex} at position (${x},${y})`);
            spritePositions.push({ x, y, spriteIndex });
        }
        blocks.push({ spritePositions });
    }
    return {
        blocks,
        originalWidth,
        originalHeight
    };
}
/**
 * Convert the optimized block format back to traditional format
 *
 * @param optimizedBlockFile The optimized block file data
 * @returns Traditional block data as Uint8Array
 */
function convertToTraditionalFormat(optimizedBlockFile) {
    const { blocks, originalWidth, originalHeight } = optimizedBlockFile;
    const spritesPerBlock = originalWidth * originalHeight;
    const totalSize = blocks.length * spritesPerBlock;
    console.log(`[DEBUG] Converting to traditional format: ${blocks.length} blocks, ${spritesPerBlock} sprites per block`);
    console.log(`[DEBUG] Original dimensions: ${originalWidth}x${originalHeight}, total size: ${totalSize} bytes`);
    // Create output buffer filled with zeros (empty sprite index)
    const result = new Uint8Array(totalSize);
    // Process each block
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex];
        // Fill in sprites at their positions
        for (const position of block.spritePositions) {
            // Calculate the position within the block, using the actual sprite dimensions
            const spriteWidth = 16; // Standard ZX Next sprite width
            const spriteHeight = 16; // Standard ZX Next sprite height
            const posX = Math.floor(position.x / spriteWidth);
            const posY = Math.floor(position.y / spriteHeight);
            // Make sure the position is within the block's dimensions
            if (posX >= 0 && posX < originalWidth && posY >= 0 && posY < originalHeight) {
                // Calculate the index in the output buffer
                const index = (blockIndex * spritesPerBlock) + (posY * originalWidth) + posX;
                // Set the sprite index
                if (index >= 0 && index < result.length && position.spriteIndex > 0) {
                    result[index] = position.spriteIndex;
                    console.log(`[DEBUG] Block ${blockIndex}, position (${posX},${posY}) set to sprite index ${position.spriteIndex}`);
                }
                else {
                    console.warn(`[WARNING] Invalid index ${index} for output buffer of length ${result.length} or sprite index ${position.spriteIndex} is 0`);
                }
            }
            else {
                console.warn(`[WARNING] Position (${posX},${posY}) is outside block dimensions ${originalWidth}x${originalHeight}`);
            }
        }
    }
    return result;
}
//# sourceMappingURL=optimizedBlockUtils.js.map