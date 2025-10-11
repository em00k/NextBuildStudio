"use strict";
/**
 * Utility functions for manipulating 1D pixel arrays representing 2D sprites.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flipVertical = flipVertical;
exports.flipHorizontal = flipHorizontal;
exports.scrollVertical = scrollVertical;
exports.scrollHorizontal = scrollHorizontal;
exports.rotateClockwise = rotateClockwise;
exports.rotateCounterClockwise = rotateCounterClockwise;
exports.floodFill = floodFill;
/**
 * Flips a sprite vertically (top to bottom).
 * @param pixels The 1D array of pixel values.
 * @param width The width of the sprite.
 * @param height The height of the sprite.
 * @returns A new array with the flipped pixel data.
 */
function flipVertical(pixels, width, height) {
    const newPixels = new Array(pixels.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            const newIndex = (height - 1 - y) * width + x;
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return newPixels;
}
/**
 * Flips a sprite horizontally (left to right).
 * @param pixels The 1D array of pixel values.
 * @param width The width of the sprite.
 * @param height The height of the sprite.
 * @returns A new array with the flipped pixel data.
 */
function flipHorizontal(pixels, width, height) {
    const newPixels = new Array(pixels.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            const newIndex = y * width + (width - 1 - x);
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return newPixels;
}
/**
 * Scrolls a sprite vertically, wrapping pixels around.
 * @param pixels The 1D array of pixel values.
 * @param width The width of the sprite.
 * @param height The height of the sprite.
 * @param amount The number of pixels to scroll (positive for down, negative for up).
 * @returns A new array with the scrolled pixel data.
 */
function scrollVertical(pixels, width, height, amount) {
    const newPixels = new Array(pixels.length);
    const actualAmount = amount % height; // Ensure amount is within height bounds
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            // Calculate new Y with wrapping (handle negative modulo correctly)
            const newY = (y + actualAmount + height) % height;
            const newIndex = newY * width + x;
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return newPixels;
}
/**
 * Scrolls a sprite horizontally, wrapping pixels around.
 * @param pixels The 1D array of pixel values.
 * @param width The width of the sprite.
 * @param height The height of the sprite.
 * @param amount The number of pixels to scroll (positive for right, negative for left).
 * @returns A new array with the scrolled pixel data.
 */
function scrollHorizontal(pixels, width, height, amount) {
    const newPixels = new Array(pixels.length);
    const actualAmount = amount % width; // Ensure amount is within width bounds
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            // Calculate new X with wrapping (handle negative modulo correctly)
            const newX = (x + actualAmount + width) % width;
            const newIndex = y * width + newX;
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return newPixels;
}
/**
 * Rotates a sprite 90 degrees clockwise.
 * Note: This changes the dimensions of the sprite.
 * @param pixels The 1D array of pixel values.
 * @param width The original width of the sprite.
 * @param height The original height of the sprite.
 * @returns An object containing the new pixel array, new width, and new height.
 */
function rotateClockwise(pixels, width, height) {
    const newWidth = height;
    const newHeight = width;
    const newPixels = new Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            // New position is (y, width - 1 - x) in the new grid
            const newX = y;
            const newY = width - 1 - x;
            const newIndex = newY * newWidth + newX;
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return { newPixels, newWidth, newHeight };
}
/**
 * Rotates a sprite 90 degrees counter-clockwise.
 * Note: This changes the dimensions of the sprite.
 * @param pixels The 1D array of pixel values.
 * @param width The original width of the sprite.
 * @param height The original height of the sprite.
 * @returns An object containing the new pixel array, new width, and new height.
 */
function rotateCounterClockwise(pixels, width, height) {
    const newWidth = height;
    const newHeight = width;
    const newPixels = new Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = y * width + x;
            // New position is (height - 1 - y, x) in the new grid
            const newX = height - 1 - y;
            const newY = x;
            const newIndex = newY * newWidth + newX;
            newPixels[newIndex] = pixels[originalIndex];
        }
    }
    return { newPixels, newWidth, newHeight };
}
/**
 * Fills a contiguous area of the same color with a new color.
 * Uses a queue-based iterative approach.
 * Modifies the input pixel array directly.
 * @param pixels The 1D array of pixel values (will be modified).
 * @param width The width of the sprite.
 * @param height The height of the sprite.
 * @param startX The starting X coordinate for the fill.
 * @param startY The starting Y coordinate for the fill.
 * @param fillColor The new color index to fill with.
 * @returns boolean True if any pixels were changed, false otherwise.
 */
function floodFill(pixels, width, height, startX, startY, fillColor) {
    const startIndex = startY * width + startX;
    // Basic bounds check for start point
    if (startX < 0 || startX >= width || startY < 0 || startY >= height || startIndex < 0 || startIndex >= pixels.length) {
        console.error(`[floodFill] Invalid start coordinates (${startX}, ${startY}) for dimensions ${width}x${height}.`);
        return false;
    }
    const targetColor = pixels[startIndex];
    if (targetColor === fillColor) {
        // console.log('[floodFill] Target color is same as fill color.');
        return false; // Nothing to fill
    }
    const queue = [[startX, startY]];
    pixels[startIndex] = fillColor; // Fill starting pixel
    let processedPixels = 0;
    const maxProcess = width * height * 2; // Safety limit to prevent infinite loops
    let changed = true; // Already changed the starting pixel
    while (queue.length > 0) {
        if (processedPixels++ > maxProcess) { // Check safety limit first
            console.error("[floodFill] Processed too many pixels, aborting.");
            return changed; // Return whether pixels were changed before aborting
        }
        const [cx, cy] = queue.shift();
        // Check neighbors (Up, Down, Left, Right)
        const neighbors = [
            [cx, cy - 1], // Up
            [cx, cy + 1], // Down
            [cx - 1, cy], // Left
            [cx + 1, cy] // Right
        ];
        for (const [nx, ny] of neighbors) {
            // Check bounds
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIndex = ny * width + nx;
                // Check if neighbor has the target color
                if (pixels[nIndex] === targetColor) {
                    pixels[nIndex] = fillColor; // Fill neighbor
                    queue.push([nx, ny]); // Add neighbor to queue
                    changed = true;
                }
            }
        }
    }
    // console.log(`[floodFill] Completed. Processed approx ${processedPixels} pixels.`);
    return changed; // Indicate if any pixels were changed
}
//# sourceMappingURL=drawingUtils.js.map