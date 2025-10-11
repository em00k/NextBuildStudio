"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpriteImporterProvider = void 0;
var vscode = require("vscode");
var path = require("path");
var sharp_1 = require("sharp");
var paletteUtils_1 = require("./paletteUtils"); // <-- Import available functions from paletteUtils
// Explicitly import Buffer from 'buffer' to ensure we're using the right version
var buffer_1 = require("buffer");
// // ZX Next RGB mapping: maps 3-bit RGB values (0-7) to 8-bit RGB values (0-255)
// const RGB3_TO_8_MAP = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
// --- Helper Function: Find Closest Color --- 
// Finds the index of the color in the targetPalette (array of {r,g,b} 0-255) 
// closest to the input color (r,g,b 0-255)
function findClosestPaletteIndex(r, g, b, targetPalette) {
    var minDistanceSq = Infinity;
    var closestIndex = 0;
    // Convert input RGB values to ZX Next's 9-bit RGB space first (3-3-3 format)
    // This gives more accurate color matching for this specific hardware
    var r3bit = Math.round(r * 7 / 255); // Map 0-255 to 0-7
    var g3bit = Math.round(g * 7 / 255); // Map 0-255 to 0-7
    var b3bit = Math.round(b * 7 / 255); // Map 0-255 to 0-7
    for (var i = 0; i < targetPalette.length; i++) {
        var palColor = targetPalette[i];
        // Convert palette colors to 3-bit space too (0-7 range)
        var pr3bit = Math.round(palColor.r * 7 / 255);
        var pg3bit = Math.round(palColor.g * 7 / 255);
        var pb3bit = Math.round(palColor.b * 7 / 255);
        // Calculate distance in ZX Next's native 3-bit-per-channel color space
        var dr = r3bit - pr3bit;
        var dg = g3bit - pg3bit;
        var db = b3bit - pb3bit;
        // Weight the components to match human perception
        // Humans are more sensitive to green, then red, then blue
        var distanceSq = (dr * dr * 3) + (dg * dg * 4) + (db * db * 2);
        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            closestIndex = i;
            // Optimization: if exact match found, return immediately
            if (minDistanceSq === 0) {
                break;
            }
        }
    }
    return closestIndex;
}
// --- Define ZX Next colors mapping (same as in paletteUtils) ---
// Specific mapping from 3-bit component (0-7) to 8-bit component value
var RGB3_TO_8_MAP = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
// --- Function to debug palette values ---
function debugPalette(palette, label) {
    if (palette.length > 0) {
        console.log("".concat(label, " - First few entries:"));
        for (var i = 0; i < Math.min(5, palette.length); i++) {
            console.log("  [".concat(i, "]: ").concat(JSON.stringify(palette[i])));
        }
    }
    else {
        console.log("".concat(label, " - Empty palette!"));
    }
}
// --- Convert Default 9-bit palette to 8-bit for distance calculation --- 
var defaultPalette8bit = paletteUtils_1.defaultPaletteRGB.map(function (rgb9) {
    var r = RGB3_TO_8_MAP[rgb9[0]];
    var g = RGB3_TO_8_MAP[rgb9[1]];
    var b = RGB3_TO_8_MAP[rgb9[2]];
    return { r: r, g: g, b: b };
});
// Debug the default palette
debugPalette(paletteUtils_1.defaultPaletteRGB.slice(0, 5), 'Default Palette RGB9');
debugPalette(defaultPalette8bit.slice(0, 5), 'Default Palette 8bit');
var SpriteImporterProvider = /** @class */ (function () {
    function SpriteImporterProvider(context, imageUri, panel // Optional panel for creation
    ) {
        var _this = this;
        this.context = context;
        this._disposables = [];
        this._extensionUri = context.extensionUri;
        this._imageUri = imageUri;
        this._currentImageFsPath = imageUri.fsPath;
        // If a panel isn't provided, create one. Otherwise, use the provided one (e.g., during deserialization).
        if (panel) {
            this._panel = panel;
        }
        else {
            this._panel = vscode.window.createWebviewPanel(SpriteImporterProvider.viewType, "".concat(SpriteImporterProvider.title, ": ").concat(path.basename(imageUri.fsPath)), vscode.ViewColumn.One, this.getWebviewOptions());
        }
        console.log("[SpriteImporterProvider] Created/obtained panel for: ".concat(imageUri.fsPath));
        // Set the webview's initial content
        this.updateWebviewContent();
        // Listen for when the panel is disposed
        this._panel.onDidDispose(function () { return _this.dispose(); }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(function (message) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('[SpriteImporterProvider] Received message:', {
                            command: message.command,
                            // Avoid logging potentially large data like pixelDataBase64
                            dataKeys: message.data ? Object.keys(message.data) : null
                        });
                        _a = message.command;
                        switch (_a) {
                            case 'getImageData': return [3 /*break*/, 1];
                            case 'importSprites': return [3 /*break*/, 2];
                            case 'loadTargetPalette': return [3 /*break*/, 6];
                            case 'loadImageRequest': return [3 /*break*/, 8];
                            case 'saveExtractedPalette': return [3 /*break*/, 10];
                            case 'exportAsBlock': return [3 /*break*/, 14];
                            case 'showError': return [3 /*break*/, 18];
                            case 'convertToPng': return [3 /*break*/, 19];
                            case 'convertImage': return [3 /*break*/, 21];
                        }
                        return [3 /*break*/, 23];
                    case 1:
                        this.sendImageData();
                        return [2 /*return*/];
                    case 2:
                        if (!message.data) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.saveSpriteSheet(message.data)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        console.error("Received importSprites command without data.");
                        _b.label = 5;
                    case 5: return [2 /*return*/];
                    case 6: // Handle new message
                    return [4 /*yield*/, this.handleLoadTargetPalette()];
                    case 7:
                        _b.sent();
                        return [2 /*return*/];
                    case 8: // Handle request to load a new image
                    return [4 /*yield*/, this.handleLoadImageRequest()];
                    case 9:
                        _b.sent();
                        return [2 /*return*/];
                    case 10:
                        if (!(message.paletteHex && Array.isArray(message.paletteHex))) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.saveExtractedPaletteToFile(message.paletteHex)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        console.error("Received saveExtractedPalette command without valid palette data.");
                        vscode.window.showErrorMessage("Could not save palette: Invalid data received.");
                        _b.label = 13;
                    case 13: return [2 /*return*/];
                    case 14:
                        if (!message.data) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.saveAsBlockFile(message.data)];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        console.error("Received exportAsBlock command without data.");
                        vscode.window.showErrorMessage("Could not export block: Invalid data received.");
                        _b.label = 17;
                    case 17: return [2 /*return*/];
                    case 18:
                        if (message.text) {
                            vscode.window.showErrorMessage(message.text);
                        }
                        return [2 /*return*/];
                    case 19: 
                    // Convert current image to PNG
                    return [4 /*yield*/, this.convertImageToPNG(this._imageUri)];
                    case 20:
                        // Convert current image to PNG
                        _b.sent();
                        return [2 /*return*/];
                    case 21: 
                    // Handle image conversion to NXI
                    return [4 /*yield*/, this.handleImageConversion(message.options)];
                    case 22:
                        // Handle image conversion to NXI
                        _b.sent();
                        return [2 /*return*/];
                    case 23: return [2 /*return*/];
                }
            });
        }); }, null, this._disposables);
    }
    SpriteImporterProvider.prototype.dispose = function () {
        console.log('[SpriteImporterProvider] Disposing panel and resources.');
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            var x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    };
    // Required for WebviewPanelSerializer
    SpriteImporterProvider.prototype.deserializeWebviewPanel = function (webviewPanel, state) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn('[SpriteImporterProvider] Deserialization not fully implemented yet.');
                // This might require storing the image URI in the state during serialization
                // For now, we might just close it or show an error.
                // Or potentially re-initialize with the state if the imageUri is stored.
                if (state && state.imageUriPath) {
                    this._imageUri = vscode.Uri.file(state.imageUriPath); // Reconstruct URI
                    console.log('[SpriteImporterProvider] Attempting to restore panel for:', this._imageUri.fsPath);
                    // Re-initialize the panel logic
                    // Be careful with constructor logic - might need refactoring if deserialization is fully supported
                    // Maybe call a separate init method?
                    this._panel = webviewPanel; // Assign the restored panel
                    this.updateWebviewContent(); // Update content based on restored state/image
                    // Re-attach listeners (might be handled by VS Code?)
                }
                else {
                    console.error('[SpriteImporterProvider] Cannot deserialize: Missing image URI in state.');
                    webviewPanel.dispose(); // Dispose if we can't restore state
                }
                return [2 /*return*/];
            });
        });
    };
    // Optional: Implement for state saving on close/reload
    // public async serializeWebviewPanel(webviewPanel: vscode.WebviewPanel): Promise<any> {
    //     return { imageUriPath: this._imageUri.fsPath }; // Store URI path
    // }
    SpriteImporterProvider.prototype.getWebviewOptions = function () {
        return {
            // Enable javascript in the webview
            enableScripts: true,
            // Restrict the webview to only loading content from our extension's `media` and `src/webview` directories.
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
                vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')
            ]
        };
    };
    SpriteImporterProvider.prototype.updateWebviewContent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileExt, isBmpFile;
            var _this = this;
            return __generator(this, function (_a) {
                this._panel.title = "".concat(SpriteImporterProvider.title, ": ").concat(path.basename(this._imageUri.fsPath));
                // Set the HTML content
                this._panel.webview.html = this.getHtmlForWebview(this._panel.webview);
                fileExt = path.extname(this._imageUri.fsPath).toLowerCase();
                isBmpFile = fileExt === '.bmp';
                if (isBmpFile) {
                    // Add a slight delay to ensure the webview has loaded
                    setTimeout(function () {
                        _this._panel.webview.postMessage({
                            command: 'showBmpConverterButton',
                            text: 'BMP files may have issues. Consider converting to PNG for better results.'
                        });
                    }, 500);
                }
                return [2 /*return*/];
            });
        });
    };
    SpriteImporterProvider.prototype.sendImageData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileData, fileExt, pipeline, _a, pixelDataBuffer, info, width, height, pixelDataBase64, e_1, errorMessage, fallbackError_1, userErrorMessage, fileExt;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 10]);
                        return [4 /*yield*/, vscode.workspace.fs.readFile(this._imageUri)];
                    case 1:
                        fileData = _b.sent();
                        fileExt = path.extname(this._imageUri.fsPath).toLowerCase();
                        console.log("[SpriteImporterProvider] Processing image of type: ".concat(fileExt));
                        if (!(fileExt === '.bmp')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handleBmpWithManualParser(fileData)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3:
                        pipeline = (0, sharp_1.default)(fileData, {
                            // Add more detailed options for problematic formats
                            pages: 1, // Only process first page/frame for multi-page formats
                            limitInputPixels: false, // Don't limit input pixel count
                            failOn: 'none' // Don't fail on warnings
                        });
                        return [4 /*yield*/, pipeline
                                .ensureAlpha() // Ensure image has an alpha channel (RGBA)
                                .raw() // Output raw pixel data
                                .toBuffer({ resolveWithObject: true })];
                    case 4:
                        _a = _b.sent(), pixelDataBuffer = _a.data, info = _a.info;
                        width = info.width;
                        height = info.height;
                        if (info.channels !== 4) {
                            // This shouldn't happen due to ensureAlpha(), but good to check
                            throw new Error("Expected 4 channels (RGBA) but got ".concat(info.channels));
                        }
                        pixelDataBase64 = pixelDataBuffer.toString('base64');
                        console.log("[SpriteImporterProvider] Sending image data via sharp (width: ".concat(width, ", height: ").concat(height, ")."));
                        this._panel.webview.postMessage({
                            command: 'loadImageData',
                            data: {
                                width: width,
                                height: height,
                                pixelDataBase64: pixelDataBase64,
                                currentImageFsPath: this._currentImageFsPath // <-- Send identifier inside data
                            }
                        });
                        return [3 /*break*/, 10];
                    case 5:
                        e_1 = _b.sent();
                        console.error('[SpriteImporterProvider] Failed to read or process image file with sharp:', e_1);
                        errorMessage = e_1 instanceof Error ? e_1.message : String(e_1);
                        if (!errorMessage.includes('unsupported image format')) return [3 /*break*/, 9];
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        console.log('[SpriteImporterProvider] Trying permissive Sharp fallback for unsupported format');
                        return [4 /*yield*/, this.handleWithSharpFallback()];
                    case 7:
                        _b.sent();
                        return [2 /*return*/]; // Exit if fallback handled it successfully
                    case 8:
                        fallbackError_1 = _b.sent();
                        console.error('[SpriteImporterProvider] Sharp fallback also failed:', fallbackError_1);
                        return [3 /*break*/, 9];
                    case 9:
                        userErrorMessage = "Failed to process image ".concat(path.basename(this._imageUri.fsPath), ": ").concat(errorMessage);
                        // Specific message for unsupported format errors
                        if (errorMessage.includes('unsupported image format')) {
                            fileExt = path.extname(this._imageUri.fsPath).toLowerCase();
                            userErrorMessage = "Cannot process ".concat(fileExt, " image format. Try a different image format like PNG or JPEG.");
                            // Offer to convert the file
                            vscode.window.showErrorMessage(userErrorMessage, 'Convert to PNG')
                                .then(function (selection) {
                                if (selection === 'Convert to PNG') {
                                    _this.convertImageToPNG(_this._imageUri);
                                }
                            });
                            return [2 /*return*/]; // Skip the generic error message below
                        }
                        this._panel.webview.postMessage({ command: 'showError', text: "Failed to read or process image file: ".concat(errorMessage) });
                        vscode.window.showErrorMessage(userErrorMessage);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    // --- Manual BMP Parser (replaces Jimp) ---
    SpriteImporterProvider.prototype.parseBmpManually = function (fileData) {
        return __awaiter(this, void 0, void 0, function () {
            var fileSize, pixelDataOffset, dibHeaderSize, width, height, bitDepth, compression, bytesPerPixel, rowStride, rgbaData, rgbaIndex, isTopDown, absHeight, paletteSize, paletteOffset, palette, i, paletteIndex, b, g, r, y, srcY, rowOffset, x, pixelOffset, paletteIndex, color, y, srcY, rowOffset, x, pixelOffset, b, g, r, y, srcY, rowOffset, x, pixelOffset, b, g, r, a;
            return __generator(this, function (_a) {
                if (fileData.length < 54) {
                    throw new Error('Invalid BMP: File too small');
                }
                // Check BMP signature
                if (fileData[0] !== 0x42 || fileData[1] !== 0x4D) { // 'BM'
                    throw new Error('Invalid BMP: Missing BM signature');
                }
                fileSize = this.readUint32LE(fileData, 2);
                pixelDataOffset = this.readUint32LE(fileData, 10);
                dibHeaderSize = this.readUint32LE(fileData, 14);
                width = this.readInt32LE(fileData, 18);
                height = this.readInt32LE(fileData, 22);
                bitDepth = this.readUint16LE(fileData, 28);
                compression = this.readUint32LE(fileData, 30);
                console.log("[BMP Parser] ".concat(width, "x").concat(height, ", ").concat(bitDepth, "-bit, compression: ").concat(compression));
                // Only support uncompressed BMPs for now
                if (compression !== 0) {
                    throw new Error("Unsupported BMP compression: ".concat(compression));
                }
                bytesPerPixel = bitDepth / 8;
                rowStride = Math.floor((width * bytesPerPixel + 3) / 4) * 4;
                rgbaData = buffer_1.Buffer.alloc(width * Math.abs(height) * 4);
                rgbaIndex = 0;
                isTopDown = height < 0;
                absHeight = Math.abs(height);
                if (bitDepth === 8) {
                    paletteSize = 256;
                    paletteOffset = 54;
                    palette = [];
                    // Read color palette (256 entries of 4 bytes each: BGRA)
                    for (i = 0; i < paletteSize; i++) {
                        paletteIndex = paletteOffset + i * 4;
                        if (paletteIndex + 3 >= fileData.length) {
                            break;
                        }
                        b = fileData[paletteIndex];
                        g = fileData[paletteIndex + 1];
                        r = fileData[paletteIndex + 2];
                        // Skip alpha byte at paletteIndex + 3
                        palette.push({ r: r, g: g, b: b });
                    }
                    // Read indexed pixel data
                    for (y = 0; y < absHeight; y++) {
                        srcY = isTopDown ? y : (absHeight - 1 - y);
                        rowOffset = pixelDataOffset + srcY * rowStride;
                        for (x = 0; x < width; x++) {
                            pixelOffset = rowOffset + x;
                            if (pixelOffset >= fileData.length) {
                                break;
                            }
                            paletteIndex = fileData[pixelOffset];
                            // Look up color in palette
                            if (paletteIndex < palette.length) {
                                color = palette[paletteIndex];
                                rgbaData[rgbaIndex++] = color.r;
                                rgbaData[rgbaIndex++] = color.g;
                                rgbaData[rgbaIndex++] = color.b;
                                rgbaData[rgbaIndex++] = 255; // Alpha
                            }
                            else {
                                // Invalid palette index, use black
                                rgbaData[rgbaIndex++] = 0;
                                rgbaData[rgbaIndex++] = 0;
                                rgbaData[rgbaIndex++] = 0;
                                rgbaData[rgbaIndex++] = 255;
                            }
                        }
                    }
                }
                else if (bitDepth === 24) {
                    // 24-bit BGR format
                    for (y = 0; y < absHeight; y++) {
                        srcY = isTopDown ? y : (absHeight - 1 - y);
                        rowOffset = pixelDataOffset + srcY * rowStride;
                        for (x = 0; x < width; x++) {
                            pixelOffset = rowOffset + x * 3;
                            if (pixelOffset + 2 >= fileData.length) {
                                break;
                            }
                            b = fileData[pixelOffset];
                            g = fileData[pixelOffset + 1];
                            r = fileData[pixelOffset + 2];
                            rgbaData[rgbaIndex++] = r;
                            rgbaData[rgbaIndex++] = g;
                            rgbaData[rgbaIndex++] = b;
                            rgbaData[rgbaIndex++] = 255; // Alpha
                        }
                    }
                }
                else if (bitDepth === 32) {
                    // 32-bit BGRA format
                    for (y = 0; y < absHeight; y++) {
                        srcY = isTopDown ? y : (absHeight - 1 - y);
                        rowOffset = pixelDataOffset + srcY * rowStride;
                        for (x = 0; x < width; x++) {
                            pixelOffset = rowOffset + x * 4;
                            if (pixelOffset + 3 >= fileData.length) {
                                break;
                            }
                            b = fileData[pixelOffset];
                            g = fileData[pixelOffset + 1];
                            r = fileData[pixelOffset + 2];
                            a = fileData[pixelOffset + 3];
                            rgbaData[rgbaIndex++] = r;
                            rgbaData[rgbaIndex++] = g;
                            rgbaData[rgbaIndex++] = b;
                            rgbaData[rgbaIndex++] = a;
                        }
                    }
                }
                else {
                    throw new Error("Unsupported BMP bit depth: ".concat(bitDepth, ". Only 8-bit, 24-bit and 32-bit BMPs are supported."));
                }
                return [2 /*return*/, {
                        width: width,
                        height: absHeight,
                        bitDepth: bitDepth,
                        rgbaData: rgbaData
                    }];
            });
        });
    };
    // Helper methods for reading little-endian values
    SpriteImporterProvider.prototype.readUint16LE = function (buffer, offset) {
        return buffer[offset] | (buffer[offset + 1] << 8);
    };
    SpriteImporterProvider.prototype.readUint32LE = function (buffer, offset) {
        return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24);
    };
    SpriteImporterProvider.prototype.readInt32LE = function (buffer, offset) {
        var uint = this.readUint32LE(buffer, offset);
        return uint > 0x7FFFFFFF ? uint - 0x100000000 : uint;
    };
    // --- Add Handler for Loading Target Palette ---
    SpriteImporterProvider.prototype.handleLoadTargetPalette = function () {
        return __awaiter(this, void 0, void 0, function () {
            var paletteUris, selectedUri, fileData, palette, paletteHex, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, vscode.window.showOpenDialog({
                                canSelectFiles: true,
                                canSelectFolders: false,
                                canSelectMany: false,
                                filters: {
                                    'Palette Files': ['pal', 'nxp']
                                },
                                title: 'Select Target Palette'
                            })];
                    case 1:
                        paletteUris = _a.sent();
                        if (!paletteUris || paletteUris.length === 0) {
                            return [2 /*return*/]; // User cancelled
                        }
                        selectedUri = paletteUris[0];
                        console.log("[SpriteImporterProvider] Loading palette from: ".concat(selectedUri.fsPath));
                        return [4 /*yield*/, vscode.workspace.fs.readFile(selectedUri)];
                    case 2:
                        fileData = _a.sent();
                        // Parse the palette file
                        try {
                            palette = (0, paletteUtils_1.parsePaletteFile)(fileData);
                            paletteHex = palette.map(function (c) { return c.hex; });
                            // Send to webview using consistent key name 'paletteHex'
                            this._panel.webview.postMessage({
                                command: 'updateTargetPalette',
                                paletteHex: paletteHex, // Use 'paletteHex' consistently, not 'palette'
                                filename: path.basename(selectedUri.fsPath)
                            });
                        }
                        catch (parseError) {
                            console.error('[SpriteImporterProvider] Error parsing palette file:', parseError);
                            vscode.window.showErrorMessage("Failed to parse palette file: ".concat(parseError instanceof Error ? parseError.message : String(parseError)));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('[SpriteImporterProvider] Error loading palette:', error_1);
                        vscode.window.showErrorMessage("Error loading palette: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // --- NEW: Handle Request to Load a Different Image --- 
    SpriteImporterProvider.prototype.handleLoadImageRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var options, fileUris, newImageUri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = {
                            canSelectMany: false,
                            openLabel: 'Load Image for Import',
                            filters: {
                                'Images': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
                            }
                        };
                        return [4 /*yield*/, vscode.window.showOpenDialog(options)];
                    case 1:
                        fileUris = _a.sent();
                        if (!(fileUris && fileUris[0])) return [3 /*break*/, 3];
                        newImageUri = fileUris[0];
                        console.log('[SpriteImporterProvider] User selected new image:', newImageUri.fsPath);
                        // Update the stored URI and path
                        this._imageUri = newImageUri;
                        this._currentImageFsPath = newImageUri.fsPath;
                        // Update the panel title
                        this._panel.title = "".concat(SpriteImporterProvider.title, ": ").concat(path.basename(this._imageUri.fsPath));
                        // Send the new image data (this will trigger reset logic in webview)
                        return [4 /*yield*/, this.sendImageData()];
                    case 2:
                        // Send the new image data (this will trigger reset logic in webview)
                        _a.sent();
                        vscode.window.showInformationMessage("Loaded new image: ".concat(path.basename(newImageUri.fsPath)));
                        return [3 /*break*/, 4];
                    case 3:
                        console.log('[SpriteImporterProvider] User cancelled loading new image.');
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // --- Updated Save Logic (Handles Multiple Sprites from potentially multiple sources) --- 
    SpriteImporterProvider.prototype.saveSpriteSheet = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var selections, options, format, bitDepth, targetPalette, customSpriteWidth, customSpriteHeight, saveActualSize, imageDataCache, paletteForQuantization, targetPaletteSize, allPixelData, _i, selections_1, selection, selectionWidth, selectionHeight, useWidth, useHeight, sourceFsPath, sourceExt, isBmpFile, currentImageData, fileData, bmpInfo, sharp_result, err_1, message, sourceWidth, sourceHeight, sourceBuffer, spriteRgba, i, y, x, srcX, srcY, sourceIdx, destIdx, pixelIndices, i, r, g, b, spritePixelData, packed, i, idx1, idx2, finalBuffer, minimumFileSize, paddingSize, padding, saveUri, error_2, message;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("[SpriteImporterProvider] Starting sprite sheet save... Options:", data.options);
                        console.log("[SpriteImporterProvider] Processing ".concat(data.selections.length, " sprite selections."));
                        selections = data.selections, options = data.options;
                        format = options.format, bitDepth = options.bitDepth, targetPalette = options.targetPalette;
                        customSpriteWidth = data.spriteWidth || 16;
                        customSpriteHeight = data.spriteHeight || 16;
                        saveActualSize = data.saveActualSize !== undefined ? data.saveActualSize : true;
                        if (customSpriteWidth !== 16 || customSpriteHeight !== 16) {
                            console.log("[SpriteImporterProvider] Using custom sprite size: ".concat(customSpriteWidth, "x").concat(customSpriteHeight, ", Save actual size: ").concat(saveActualSize));
                        }
                        if (!selections || selections.length === 0) {
                            vscode.window.showErrorMessage('Save failed: No sprites were selected/added to the list.');
                            return [2 /*return*/];
                        }
                        imageDataCache = new Map();
                        targetPaletteSize = 256;
                        if (bitDepth === 4) {
                            targetPaletteSize = 16;
                            if (!targetPalette || targetPalette.length < 16) {
                                vscode.window.showErrorMessage('Import failed: A target palette with at least 16 colors must be loaded for 4-bit output.');
                                return [2 /*return*/];
                            }
                            paletteForQuantization = targetPalette.slice(0, 16).map(hexTo8bitRgb);
                        }
                        else { // bitDepth === 8
                            targetPaletteSize = 256;
                            if (targetPalette && targetPalette.length > 0) {
                                console.warn("[SpriteImporterProvider] Warning: Loaded target palette ignored for 8-bit output. Quantizing to default 256 palette.");
                                paletteForQuantization = defaultPalette8bit;
                                targetPaletteSize = 256;
                            }
                            else {
                                paletteForQuantization = defaultPalette8bit;
                                targetPaletteSize = 256;
                            }
                        }
                        allPixelData = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 17, , 18]);
                        // Log the first selection rect received by the save function
                        if (selections.length > 0) {
                            console.log("[SpriteImporterProvider] Save function received first selection rect:", JSON.stringify(selections[0]));
                        }
                        _i = 0, selections_1 = selections;
                        _b.label = 2;
                    case 2:
                        if (!(_i < selections_1.length)) return [3 /*break*/, 12];
                        selection = selections_1[_i];
                        selectionWidth = Math.max(1, Math.floor(selection.rect.w));
                        selectionHeight = Math.max(1, Math.floor(selection.rect.h));
                        useWidth = saveActualSize ? customSpriteWidth : 16;
                        useHeight = saveActualSize ? customSpriteHeight : 16;
                        sourceFsPath = selection.sourceFsPath;
                        sourceExt = path.extname(sourceFsPath).toLowerCase();
                        isBmpFile = sourceExt === '.bmp';
                        currentImageData = imageDataCache.get(sourceFsPath);
                        if (!!currentImageData) return [3 /*break*/, 10];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 9, , 10]);
                        console.log("[SpriteImporterProvider] Loading image data for: ".concat(sourceFsPath));
                        return [4 /*yield*/, vscode.workspace.fs.readFile(vscode.Uri.file(sourceFsPath))];
                    case 4:
                        fileData = _b.sent();
                        if (!isBmpFile) return [3 /*break*/, 6];
                        console.log("[SpriteImporterProvider] Using manual BMP parser for sprite sheet");
                        return [4 /*yield*/, this.parseBmpManually(fileData)];
                    case 5:
                        bmpInfo = _b.sent();
                        currentImageData = {
                            data: bmpInfo.rgbaData,
                            info: {
                                width: bmpInfo.width,
                                height: bmpInfo.height,
                                channels: 4 // Manual parser always outputs RGBA
                            },
                            isBmp: true
                        };
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, (0, sharp_1.default)(fileData)
                            .ensureAlpha()
                            .raw()
                            .toBuffer({ resolveWithObject: true })];
                    case 7:
                        sharp_result = _b.sent();
                        currentImageData = {
                            data: sharp_result.data,
                            info: sharp_result.info,
                            isBmp: false
                        };
                        if (currentImageData.info.channels !== 4) {
                            throw new Error("Source image ".concat(path.basename(sourceFsPath), " does not have 4 channels (RGBA)."));
                        }
                        _b.label = 8;
                    case 8:
                        imageDataCache.set(sourceFsPath, currentImageData);
                        return [3 /*break*/, 10];
                    case 9:
                        err_1 = _b.sent();
                        console.error("[SpriteImporterProvider] Failed to load image ".concat(sourceFsPath, " for saving:"), err_1);
                        message = err_1 instanceof Error ? err_1.message : String(err_1);
                        // Show error and skip this sprite? Or abort whole save?
                        vscode.window.showErrorMessage("Save failed: Could not load source image ".concat(path.basename(sourceFsPath), ": ").concat(message));
                        // Abort for now
                        return [2 /*return*/];
                    case 10:
                        sourceWidth = currentImageData.info.width;
                        sourceHeight = currentImageData.info.height;
                        sourceBuffer = currentImageData.data;
                        console.log("[SpriteImporterProvider] Processing selection from ".concat(path.basename(sourceFsPath), ": ").concat(selectionWidth, "x").concat(selectionHeight, " at (").concat(selection.rect.x, ", ").concat(selection.rect.y, "), using dimensions: ").concat(useWidth, "x").concat(useHeight));
                        spriteRgba = buffer_1.Buffer.alloc(useWidth * useHeight * 4);
                        // Fill with transparent black first (for any areas outside the selection)
                        for (i = 0; i < useWidth * useHeight * 4; i += 4) {
                            spriteRgba[i] = 0; // R
                            spriteRgba[i + 1] = 0; // G
                            spriteRgba[i + 2] = 0; // B
                            spriteRgba[i + 3] = 0; // A (transparent)
                        }
                        // Copy pixel data from source to sprite buffer
                        for (y = 0; y < Math.min(selectionHeight, useHeight); y++) {
                            for (x = 0; x < Math.min(selectionWidth, useWidth); x++) {
                                srcX = Math.floor(selection.rect.x) + x;
                                srcY = Math.floor(selection.rect.y) + y;
                                // Check bounds of source image
                                if (srcX >= 0 && srcX < sourceWidth && srcY >= 0 && srcY < sourceHeight) {
                                    sourceIdx = (srcY * sourceWidth + srcX) * 4;
                                    destIdx = (y * useWidth + x) * 4;
                                    sourceBuffer.copy(spriteRgba, destIdx, sourceIdx, sourceIdx + 4);
                                }
                            }
                        }
                        pixelIndices = new Array(useWidth * useHeight);
                        for (i = 0; i < useWidth * useHeight; i++) {
                            r = spriteRgba[i * 4];
                            g = spriteRgba[i * 4 + 1];
                            b = spriteRgba[i * 4 + 2];
                            pixelIndices[i] = findClosestPaletteIndex(r, g, b, paletteForQuantization);
                        }
                        spritePixelData = void 0;
                        if (bitDepth === 8) {
                            spritePixelData = buffer_1.Buffer.from(Uint8Array.from(pixelIndices));
                        }
                        else { // bitDepth === 4
                            packed = buffer_1.Buffer.alloc(Math.ceil((useWidth * useHeight) / 2));
                            for (i = 0; i < pixelIndices.length; i += 2) {
                                idx1 = pixelIndices[i] & 0x0F;
                                idx2 = (i + 1 < pixelIndices.length) ? (pixelIndices[i + 1] & 0x0F) : 0;
                                packed.writeUInt8((idx1 << 4) | idx2, i / 2);
                            }
                            spritePixelData = packed; // Use the tightly packed data directly
                        }
                        allPixelData.push(spritePixelData);
                        _b.label = 11;
                    case 11:
                        _i++;
                        return [3 /*break*/, 2];
                    case 12:
                        finalBuffer = buffer_1.Buffer.concat(allPixelData);
                        console.log("[SpriteImporterProvider] Concatenated buffer length for ".concat(allPixelData.length, " sprites: ").concat(finalBuffer.length));
                        minimumFileSize = 256;
                        if (bitDepth === 4 && finalBuffer.length < minimumFileSize) {
                            paddingSize = minimumFileSize - finalBuffer.length;
                            console.log("[SpriteImporterProvider] Padding 4-bit file with ".concat(paddingSize, " zero bytes to reach minimum size of ").concat(minimumFileSize, "."));
                            padding = buffer_1.Buffer.alloc(paddingSize, 0);
                            finalBuffer = buffer_1.Buffer.concat([finalBuffer, padding]);
                            console.log("[SpriteImporterProvider] Final padded buffer length: ".concat(finalBuffer.length));
                        }
                        return [4 /*yield*/, vscode.window.showSaveDialog({
                                title: "Save Imported ".concat(format === 'til' ? 'Tile' : 'Sprite', " (").concat(bitDepth, "-bit)"),
                                filters: (_a = {}, _a[format === 'til' ? 'Tile Files' : 'Sprite Files'] = [format], _a)
                            })];
                    case 13:
                        saveUri = _b.sent();
                        if (!saveUri) return [3 /*break*/, 15];
                        console.log("[SpriteImporterProvider] Attempting to write ".concat(finalBuffer.length, " bytes to ").concat(saveUri.fsPath));
                        return [4 /*yield*/, vscode.workspace.fs.writeFile(saveUri, finalBuffer)];
                    case 14:
                        _b.sent();
                        vscode.window.showInformationMessage("Sprite sheet saved successfully (".concat(allPixelData.length, " sprites) to: ").concat(path.basename(saveUri.fsPath), ". Relies on a separate palette."));
                        return [3 /*break*/, 16];
                    case 15:
                        console.log('[SpriteImporterProvider] Save cancelled by user.');
                        _b.label = 16;
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        error_2 = _b.sent();
                        message = error_2 instanceof Error ? error_2.message : String(error_2);
                        vscode.window.showErrorMessage("Failed to process or save sprite sheet: ".concat(message));
                        console.error('[SpriteImporterProvider] Error processing/saving sprite sheet:', error_2);
                        return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    // --- NEW: Method to Save Extracted Palette --- 
    SpriteImporterProvider.prototype.saveExtractedPaletteToFile = function (paletteHex) {
        return __awaiter(this, void 0, void 0, function () {
            var paletteToSave, saveData, saveUri, error_3, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[SpriteImporterProvider] Received request to save extracted palette with ".concat(paletteHex.length, " colors."));
                        if (paletteHex.length === 0) {
                            vscode.window.showWarningMessage('Cannot save empty palette.');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        paletteToSave = paletteHex.map(function (hex) { return ({ hex: hex, priority: false }); });
                        saveData = (0, paletteUtils_1.encodePaletteFile)(paletteToSave);
                        return [4 /*yield*/, vscode.window.showSaveDialog({
                                title: 'Save Extracted Palette As',
                                filters: {
                                    'Next Palette Files': ['nxp', 'pal'] // Allow both
                                },
                                // Suggest a default filename (optional)
                                // defaultUri: vscode.Uri.joinPath(this._imageUri, '../extracted_palette.pal')
                            })];
                    case 2:
                        saveUri = _a.sent();
                        if (!saveUri) return [3 /*break*/, 4];
                        console.log("[SpriteImporterProvider] Attempting to write ".concat(saveData.length, " bytes of palette data to ").concat(saveUri.fsPath));
                        return [4 /*yield*/, vscode.workspace.fs.writeFile(saveUri, saveData)];
                    case 3:
                        _a.sent();
                        vscode.window.showInformationMessage("Extracted palette (".concat(paletteHex.length, " colors) saved successfully to: ").concat(path.basename(saveUri.fsPath), "."));
                        return [3 /*break*/, 5];
                    case 4:
                        console.log('[SpriteImporterProvider] Palette save cancelled by user.');
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        message = error_3 instanceof Error ? error_3.message : String(error_3);
                        vscode.window.showErrorMessage("Failed to save extracted palette: ".concat(message));
                        console.error('[SpriteImporterProvider] Error saving extracted palette:', error_3);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // --- NEW: Add saveAsBlockFile method --- 
    SpriteImporterProvider.prototype.saveAsBlockFile = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var gridWidth, gridHeight, originalGrid, expectedCount, aspectRatio, proceed, proceed, spriteSheetUri, firstSourcePath, isBmpSource, blockUri, blockIndices, i, i, spriteInfoText, openInViewer, error_4, message;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("[SpriteImporterProvider] Starting block file save... Grid: ".concat(data.gridWidth, "x").concat(data.gridHeight, ", Sprite size: ").concat(data.spriteWidth, "x").concat(data.spriteHeight, ", Save actual size: ").concat(data.saveActualSize));
                        if (!data.selections || data.selections.length === 0) {
                            vscode.window.showErrorMessage('Save failed: No sprites were selected.');
                            return [2 /*return*/];
                        }
                        gridWidth = data.gridWidth;
                        gridHeight = data.gridHeight;
                        originalGrid = "".concat(gridWidth, "x").concat(gridHeight);
                        expectedCount = gridWidth * gridHeight;
                        if (!(data.selections.length > expectedCount)) return [3 /*break*/, 2];
                        aspectRatio = gridWidth / gridHeight;
                        gridHeight = Math.ceil(Math.sqrt(data.selections.length / aspectRatio));
                        gridWidth = Math.ceil(data.selections.length / gridHeight);
                        // Ensure we have enough cells (might be slightly more than needed)
                        expectedCount = gridWidth * gridHeight;
                        if (expectedCount < data.selections.length) {
                            gridWidth++; // Add one more column if necessary
                            expectedCount = gridWidth * gridHeight;
                        }
                        return [4 /*yield*/, vscode.window.showInformationMessage("Adjusting grid from ".concat(originalGrid, " to ").concat(gridWidth, "x").concat(gridHeight, " to fit all ").concat(data.selections.length, " sprites. Continue?"), 'Yes', 'No')];
                    case 1:
                        proceed = _b.sent();
                        if (proceed !== 'Yes') {
                            console.log('[SpriteImporterProvider] Block save cancelled after grid adjustment.');
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(data.selections.length < expectedCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, vscode.window.showWarningMessage("The selection list contains ".concat(data.selections.length, " sprites, but the grid is ").concat(gridWidth, "x").concat(gridHeight, " (").concat(expectedCount, " cells). Some cells will be empty (value 0). Continue?"), 'Yes', 'No')];
                    case 3:
                        proceed = _b.sent();
                        if (proceed !== 'Yes') {
                            console.log('[SpriteImporterProvider] Block save cancelled due to incomplete grid.');
                            return [2 /*return*/];
                        }
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 12, , 13]);
                        return [4 /*yield*/, vscode.window.showSaveDialog({
                                title: "Save Sprite Sheet for Block",
                                filters: { 'Sprite Files': [data.options.format] }
                            })];
                    case 5:
                        spriteSheetUri = _b.sent();
                        if (!spriteSheetUri) {
                            console.log('[SpriteImporterProvider] Block creation cancelled - no sprite sheet location selected.');
                            return [2 /*return*/];
                        }
                        firstSourcePath = (_a = data.selections[0]) === null || _a === void 0 ? void 0 : _a.sourceFsPath;
                        isBmpSource = firstSourcePath && path.extname(firstSourcePath).toLowerCase() === '.bmp';
                        if (isBmpSource) {
                            console.log("[SpriteImporterProvider] Block creation involves BMP files - using special handling");
                        }
                        // Now save the sprite sheet (reuse existing saveSpriteSheet method)
                        console.log("[SpriteImporterProvider] Saving sprite sheet to ".concat(spriteSheetUri.fsPath, " for block..."));
                        return [4 /*yield*/, this.saveSpriteSheet({
                                selections: data.selections,
                                options: data.options,
                                // Pass along the sprite size parameters
                                spriteWidth: data.spriteWidth,
                                spriteHeight: data.spriteHeight,
                                saveActualSize: data.saveActualSize
                            })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, vscode.window.showSaveDialog({
                                title: "Save Block File (".concat(gridWidth, "x").concat(gridHeight, ")"),
                                filters: { 'Block Files': ['nxb'] }
                            })];
                    case 7:
                        blockUri = _b.sent();
                        if (!blockUri) {
                            console.log('[SpriteImporterProvider] Block file save cancelled.');
                            return [2 /*return*/];
                        }
                        blockIndices = new Uint8Array(expectedCount);
                        // Fill with indices (matching the sprite sheet's order)
                        for (i = 0; i < Math.min(expectedCount, data.selections.length); i++) {
                            blockIndices[i] = i; // Use the index in the sprite sheet
                        }
                        // Fill any remaining slots with 0s (if grid is larger than selection count)
                        for (i = data.selections.length; i < expectedCount; i++) {
                            blockIndices[i] = 0;
                        }
                        console.log("[SpriteImporterProvider] Writing ".concat(blockIndices.length, " bytes to ").concat(blockUri.fsPath));
                        return [4 /*yield*/, vscode.workspace.fs.writeFile(blockUri, blockIndices)];
                    case 8:
                        _b.sent();
                        spriteInfoText = data.saveActualSize ?
                            "Sprite size: ".concat(data.spriteWidth, "x").concat(data.spriteHeight) :
                            "Sprite size: ".concat(data.spriteWidth, "x").concat(data.spriteHeight, " (will be padded to 16px)");
                        vscode.window.showInformationMessage("Block file saved successfully (".concat(gridWidth, "x").concat(gridHeight, " grid) to: ").concat(path.basename(blockUri.fsPath), "\n") +
                            "Using sprites from: ".concat(path.basename(spriteSheetUri.fsPath), "\n") +
                            spriteInfoText);
                        return [4 /*yield*/, vscode.window.showInformationMessage('Would you like to open this block file in the Block Viewer?', 'Yes', 'No')];
                    case 9:
                        openInViewer = _b.sent();
                        if (!(openInViewer === 'Yes')) return [3 /*break*/, 11];
                        return [4 /*yield*/, vscode.commands.executeCommand('vscode.openWith', blockUri, 'nextbuild-viewers.blockViewer')];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_4 = _b.sent();
                        message = error_4 instanceof Error ? error_4.message : String(error_4);
                        vscode.window.showErrorMessage("Failed to save block file: ".concat(message));
                        console.error('[SpriteImporterProvider] Error saving block file:', error_4);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // New method to handle BMP files specifically with manual parser
    SpriteImporterProvider.prototype.handleBmpWithManualParser = function (fileData) {
        return __awaiter(this, void 0, void 0, function () {
            var bmpInfo, pixelDataBase64, e_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('[SpriteImporterProvider] Processing BMP file with manual parser');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.parseBmpManually(fileData)];
                    case 2:
                        bmpInfo = _a.sent();
                        pixelDataBase64 = bmpInfo.rgbaData.toString('base64');
                        console.log("[SpriteImporterProvider] Successfully processed BMP manually (".concat(bmpInfo.width, "x").concat(bmpInfo.height, ")"));
                        this._panel.webview.postMessage({
                            command: 'loadImageData',
                            data: {
                                width: bmpInfo.width,
                                height: bmpInfo.height,
                                pixelDataBase64: pixelDataBase64,
                                currentImageFsPath: this._currentImageFsPath
                            }
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        console.error('[SpriteImporterProvider] Failed to process BMP manually:', e_2);
                        errorMessage = e_2 instanceof Error ? e_2.message : String(e_2);
                        this._panel.webview.postMessage({ command: 'showError', text: "Failed to process BMP: ".concat(errorMessage) });
                        vscode.window.showErrorMessage("Failed to process BMP image: ".concat(errorMessage));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Generic fallback for any image format with permissive Sharp
    SpriteImporterProvider.prototype.handleWithSharpFallback = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileData, _a, pixelDataBuffer, info, width, height, pixelDataBase64;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('[SpriteImporterProvider] Attempting to process image with permissive Sharp fallback');
                        return [4 /*yield*/, vscode.workspace.fs.readFile(this._imageUri)];
                    case 1:
                        fileData = _b.sent();
                        return [4 /*yield*/, (0, sharp_1.default)(fileData, {
                                failOn: 'none',
                                unlimited: true
                            })
                                .ensureAlpha()
                                .raw()
                                .toBuffer({ resolveWithObject: true })];
                    case 2:
                        _a = _b.sent(), pixelDataBuffer = _a.data, info = _a.info;
                        width = info.width;
                        height = info.height;
                        pixelDataBase64 = pixelDataBuffer.toString('base64');
                        console.log("[SpriteImporterProvider] Successfully processed with Sharp fallback (".concat(width, "x").concat(height, ")"));
                        this._panel.webview.postMessage({
                            command: 'loadImageData',
                            data: {
                                width: width,
                                height: height,
                                pixelDataBase64: pixelDataBase64,
                                currentImageFsPath: this._currentImageFsPath
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // New utility method to convert images to PNG
    SpriteImporterProvider.prototype.convertImageToPNG = function (sourceUri) {
        return __awaiter(this, void 0, void 0, function () {
            var fileData, parsedPath, destPath, destUri, bmpInfo, pngData, pngData, success, error_5, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        // Show processing status
                        vscode.window.showInformationMessage("Converting ".concat(path.basename(sourceUri.fsPath), " to PNG..."));
                        return [4 /*yield*/, vscode.workspace.fs.readFile(sourceUri)];
                    case 1:
                        fileData = _a.sent();
                        parsedPath = path.parse(sourceUri.fsPath);
                        destPath = path.join(parsedPath.dir, parsedPath.name + '.png');
                        destUri = vscode.Uri.file(destPath);
                        if (!(path.extname(sourceUri.fsPath).toLowerCase() === '.bmp')) return [3 /*break*/, 5];
                        console.log('[SpriteImporterProvider] Using manual BMP parser + Sharp to convert BMP to PNG');
                        return [4 /*yield*/, this.parseBmpManually(fileData)];
                    case 2:
                        bmpInfo = _a.sent();
                        return [4 /*yield*/, (0, sharp_1.default)(bmpInfo.rgbaData, {
                                raw: { width: bmpInfo.width, height: bmpInfo.height, channels: 4 }
                            }).png().toBuffer()];
                    case 3:
                        pngData = _a.sent();
                        return [4 /*yield*/, vscode.workspace.fs.writeFile(destUri, pngData)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 5: return [4 /*yield*/, (0, sharp_1.default)(fileData, {
                            failOn: 'none' // Be forgiving of format issues
                        }).png().toBuffer()];
                    case 6:
                        pngData = _a.sent();
                        // Write PNG file
                        return [4 /*yield*/, vscode.workspace.fs.writeFile(destUri, pngData)];
                    case 7:
                        // Write PNG file
                        _a.sent();
                        _a.label = 8;
                    case 8: return [4 /*yield*/, vscode.window.showInformationMessage("Successfully converted to ".concat(path.basename(destPath)), 'Open in Importer', 'Open File')];
                    case 9:
                        success = _a.sent();
                        if (success === 'Open in Importer') {
                            // Close current panel if open
                            if (this._panel) {
                                this._panel.dispose();
                            }
                            // Create a new importer with the PNG file
                            new SpriteImporterProvider(this.context, destUri);
                        }
                        else if (success === 'Open File') {
                            // Just open the file in VS Code
                            vscode.commands.executeCommand('vscode.open', destUri);
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        error_5 = _a.sent();
                        console.error('[SpriteImporterProvider] Error converting image to PNG:', error_5);
                        errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                        vscode.window.showErrorMessage("Failed to convert image to PNG: ".concat(errorMessage));
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    SpriteImporterProvider.prototype.handleImageConversion = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var bitDepth, fileData, pipeline, width, height, is640x256, is640x256_4bit_1, finalImageDataForNXI_1, finalWidth_1, finalHeight_1, quantizedBuffer, quantizedResult, _a, rawPixelsBuffer, initialInfo, requestedWidth, requestedHeight, targetPalette_1, numGrays_1, error_6;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 15, , 16]);
                        console.log('[SpriteImporterProvider] ENTERING handleImageConversion method with options:', JSON.stringify(options)); // Log at the very start
                        if (!options) {
                            console.error('[SpriteImporterProvider] handleImageConversion called with no options!');
                            vscode.window.showErrorMessage('Image conversion failed: No options provided.');
                            return [2 /*return*/];
                        }
                        console.log('[SpriteImporterProvider] Received raw options for image conversion:', JSON.stringify(options));
                        bitDepth = parseInt(options.bitDepth, 10);
                        if (isNaN(bitDepth)) {
                            console.warn("[SpriteImporterProvider] Invalid bitDepth received: ".concat(options.bitDepth, ", defaulting to 8."));
                            options.bitDepth = 8; // Default to 8 if parsing fails
                        }
                        else {
                            options.bitDepth = bitDepth; // Use the parsed numeric value
                        }
                        console.log("[SpriteImporterProvider] Starting image conversion with processed options (bitDepth type: ".concat(typeof options.bitDepth, "):"), JSON.stringify(options));
                        return [4 /*yield*/, vscode.workspace.fs.readFile(this._imageUri)];
                    case 1:
                        fileData = _b.sent();
                        console.log("[SpriteImporterProvider] Read image data: ".concat(fileData.length, " bytes"));
                        pipeline = (0, sharp_1.default)(fileData);
                        width = options.width || 320;
                        height = options.height || 256;
                        is640x256 = width === 640 && height === 256;
                        if (is640x256) {
                            console.log('[SpriteImporterProvider] 640x256 format detected - forcing 4-bit mode');
                            options.bitDepth = 4;
                        }
                        // Ensure standard dimensions are exactly as expected
                        if ((width === 256 && height === 192) ||
                            (width === 320 && height === 256) ||
                            (width === 640 && height === 256)) {
                            console.log("[SpriteImporterProvider] Using exact standard dimensions: ".concat(width, "x").concat(height));
                            // Force exact dimensions by creating a blank canvas of the exact size
                            // and then compositing the resized image onto it
                            pipeline = pipeline.resize({
                                width: width,
                                height: height,
                                fit: options.preserveAspect ? 'inside' : 'fill',
                                // Don't allow dimensions to be reduced to maintain aspect ratio
                                withoutEnlargement: false,
                                withoutReduction: false
                            });
                        }
                        else if (options.width && options.height) {
                            console.log("[SpriteImporterProvider] Resizing to custom dimensions: ".concat(options.width, "x").concat(options.height, ", preserveAspect: ").concat(options.preserveAspect));
                            pipeline = pipeline.resize({
                                width: options.width,
                                height: options.height,
                                fit: options.preserveAspect ? 'inside' : 'fill'
                            });
                        }
                        is640x256_4bit_1 = width === 640 && height === 256 && options.bitDepth === 4;
                        if (!is640x256_4bit_1) return [3 /*break*/, 4];
                        console.log('[SpriteImporterProvider] Using Sharp built-in palette quantization for 640x256 4-bit mode');
                        return [4 /*yield*/, pipeline
                                .png({
                                palette: true, // Enable palette mode
                                colors: 16, // 4-bit = 16 colors maximum
                                dither: 1.0, // Full dithering for best quality
                                effort: 10 // Maximum effort for best results
                            })
                                .toBuffer()];
                    case 2:
                        quantizedBuffer = _b.sent();
                        console.log("[SpriteImporterProvider] Sharp quantization complete: ".concat(quantizedBuffer.length, " bytes"));
                        return [4 /*yield*/, (0, sharp_1.default)(quantizedBuffer)
                                .ensureAlpha()
                                .raw()
                                .toBuffer({ resolveWithObject: true })];
                    case 3:
                        quantizedResult = _b.sent();
                        finalImageDataForNXI_1 = quantizedResult.data;
                        finalWidth_1 = quantizedResult.info.width;
                        finalHeight_1 = quantizedResult.info.height;
                        console.log("[SpriteImporterProvider] Sharp quantized result: ".concat(finalWidth_1, "x").concat(finalHeight_1, ", channels: ").concat(quantizedResult.info.channels));
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, pipeline
                            .ensureAlpha()
                            .raw()
                            .toBuffer({ resolveWithObject: true })];
                    case 5:
                        _a = _b.sent(), rawPixelsBuffer = _a.data, initialInfo = _a.info;
                        console.log("[SpriteImporterProvider] Initial processed raw pixels: ".concat(initialInfo.width, "x").concat(initialInfo.height, ", channels: ").concat(initialInfo.channels));
                        finalImageDataForNXI_1 = rawPixelsBuffer;
                        finalWidth_1 = initialInfo.width;
                        finalHeight_1 = initialInfo.height;
                        _b.label = 6;
                    case 6:
                        // For non-Sharp paths, handle dimension adjustment if needed
                        if (!is640x256_4bit_1) {
                            requestedWidth = options.width || 320;
                            requestedHeight = options.height || 256;
                            if ((requestedWidth === 256 && requestedHeight === 192) ||
                                (requestedWidth === 320 && requestedHeight === 256) ||
                                (requestedWidth === 640 && requestedHeight === 256) ||
                                options.width && options.height) { // Also applies if custom dimensions are given
                                // Note: finalImageDataForNXI, finalWidth, finalHeight are set in the else block above
                                // This dimension adjustment is only needed for non-Sharp processing
                                console.log("[SpriteImporterProvider] Dimension adjustment for non-Sharp processing (if needed)");
                            }
                        }
                        // Special case for 640x256: force 4-bit if not already 9-bit. (9-bit takes precedence)
                        if (finalWidth_1 === 640 && finalHeight_1 === 256 && options.bitDepth !== 9) {
                            console.log('[SpriteImporterProvider] 640x256 format detected - forcing 4-bit mode as 9-bit is not selected.');
                            options.bitDepth = 4;
                        }
                        // Redefine is640x256_4bit after final dimensions and bitDepth are set
                        is640x256_4bit_1 = finalWidth_1 === 640 && finalHeight_1 === 256 && options.bitDepth === 4;
                        targetPalette_1 = null;
                        if (!(options.bitDepth === 9)) return [3 /*break*/, 8];
                        console.log("[SpriteImporterProvider] Extracting optimal palette (up to 256 colors) for 9-bit custom mode.");
                        return [4 /*yield*/, this.extractOptimalPalette(finalImageDataForNXI_1, finalWidth_1, finalHeight_1, 256)];
                    case 7:
                        targetPalette_1 = _b.sent();
                        console.log("[SpriteImporterProvider] Extracted ".concat(targetPalette_1 ? targetPalette_1.length : '0', " colors for 9-bit custom palette. First few: ").concat(targetPalette_1 ? JSON.stringify(targetPalette_1.slice(0, 3)) : 'N/A'));
                        return [3 /*break*/, 14];
                    case 8:
                        if (!is640x256_4bit_1) return [3 /*break*/, 9];
                        console.log("[SpriteImporterProvider] Using Sharp's automatically extracted palette for 640x256 4-bit mode (no custom extraction needed).");
                        // Sharp has already quantized and generated the optimal palette, so we skip custom palette extraction
                        targetPalette_1 = null; // Let createNXIFile handle the already-quantized data directly
                        console.log("[SpriteImporterProvider] Sharp-quantized data ready for direct processing.");
                        return [3 /*break*/, 14];
                    case 9:
                        if (!(options.bitDepth === 4)) return [3 /*break*/, 13];
                        if (!(options.paletteType === 'loaded' && options.loadedPalette && options.loadedPalette.length >= 16)) return [3 /*break*/, 10];
                        console.log("[SpriteImporterProvider] Using loaded palette for 4-bit mode.");
                        targetPalette_1 = options.loadedPalette.slice(0, 16);
                        return [3 /*break*/, 12];
                    case 10:
                        console.log("[SpriteImporterProvider] Extracting optimal 16-color palette for generic 4-bit mode.");
                        return [4 /*yield*/, this.extractOptimalPalette(finalImageDataForNXI_1, finalWidth_1, finalHeight_1, 16)];
                    case 11:
                        targetPalette_1 = _b.sent();
                        _b.label = 12;
                    case 12:
                        console.log("[SpriteImporterProvider] Using/Extracted ".concat(targetPalette_1 ? targetPalette_1.length : '0', " colors for 4-bit palette."));
                        return [3 /*break*/, 14];
                    case 13:
                        if (options.paletteType === 'loaded' && options.loadedPalette) {
                            console.log("[SpriteImporterProvider] Using loaded palette with ".concat(options.loadedPalette ? options.loadedPalette.length : '0', " colors for 8-bit mode."));
                            targetPalette_1 = options.loadedPalette;
                        }
                        else if (options.paletteType === 'grayscale') {
                            console.log("[SpriteImporterProvider] Creating grayscale palette for ".concat(options.bitDepth, "-bit mode."));
                            numGrays_1 = 256;
                            targetPalette_1 = Array(numGrays_1).fill(0).map(function (_, i) {
                                var v = Math.floor(i * 255 / (numGrays_1 - 1)).toString(16).padStart(2, '0');
                                return "#".concat(v).concat(v).concat(v);
                            });
                        }
                        else {
                            console.log("[SpriteImporterProvider] Using default 8-bit palette logic (targetPalette will be null, createNXIFile handles this).");
                            // targetPalette remains null, createNXIFile will use its internal default for 8-bit
                        }
                        _b.label = 14;
                    case 14:
                        vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: 'Converting image to NXI format...',
                            cancellable: false
                        }, function (progress) { return __awaiter(_this, void 0, void 0, function () {
                            var ditheringMode, nxiData, uri, formatDescription, openResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        progress.report({ increment: 50, message: 'Processing pixels...' });
                                        console.log("[SpriteImporterProvider] About to call createNXIFile. Final effective bitDepth: ".concat(options.bitDepth));
                                        if (options.bitDepth === 9) {
                                            console.log("[SpriteImporterProvider] Target palette for 9-bit mode (to be passed to createNXIFile) has ".concat(targetPalette_1 ? targetPalette_1.length : 'null/0', " colors."));
                                        }
                                        ditheringMode = options.dithering || 'none';
                                        if (is640x256_4bit_1 && ditheringMode === 'none') {
                                            ditheringMode = 'sierra';
                                            console.log('[SpriteImporterProvider] 640x256 4-bit detected: using Sierra dithering by default for better quality');
                                        }
                                        return [4 /*yield*/, this.createNXIFile(finalImageDataForNXI_1, finalWidth_1, finalHeight_1, options.bitDepth, targetPalette_1, ditheringMode, is640x256_4bit_1)];
                                    case 1:
                                        nxiData = _a.sent();
                                        console.log("[SpriteImporterProvider] NXI data created: ".concat(nxiData.length, " bytes"));
                                        progress.report({ increment: 75, message: 'Saving file...' });
                                        return [4 /*yield*/, vscode.window.showSaveDialog({
                                                defaultUri: vscode.Uri.file(path.join(path.dirname(this._imageUri.fsPath), "".concat(path.basename(this._imageUri.fsPath, path.extname(this._imageUri.fsPath)), ".nxi"))),
                                                filters: {
                                                    'NXI Files': ['nxi']
                                                }
                                            })];
                                    case 2:
                                        uri = _a.sent();
                                        if (!uri) return [3 /*break*/, 7];
                                        console.log("[SpriteImporterProvider] Saving NXI file to ".concat(uri.fsPath));
                                        return [4 /*yield*/, vscode.workspace.fs.writeFile(uri, nxiData)];
                                    case 3:
                                        _a.sent();
                                        formatDescription = options.bitDepth === 4 ?
                                            "".concat(finalWidth_1, "x").concat(finalHeight_1, ", 4-bit") :
                                            "".concat(finalWidth_1, "x").concat(finalHeight_1, ", 8-bit");
                                        progress.report({ increment: 100, message: 'Done!' });
                                        console.log("[SpriteImporterProvider] NXI file saved successfully: ".concat(formatDescription));
                                        return [4 /*yield*/, vscode.window.showInformationMessage("NXI file created successfully (".concat(formatDescription, "). Would you like to open it in the Image Viewer?"), 'Open', 'No')];
                                    case 4:
                                        openResult = _a.sent();
                                        if (!(openResult === 'Open')) return [3 /*break*/, 6];
                                        // Open the file in the image viewer
                                        return [4 /*yield*/, vscode.commands.executeCommand('vscode.openWith', uri, 'nextbuild-viewers.imageViewer')];
                                    case 5:
                                        // Open the file in the image viewer
                                        _a.sent();
                                        _a.label = 6;
                                    case 6: return [3 /*break*/, 8];
                                    case 7:
                                        console.log("[SpriteImporterProvider] User cancelled save dialog");
                                        _a.label = 8;
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/]; // Exit early since we handled this case specifically
                    case 15:
                        error_6 = _b.sent();
                        console.error('[SpriteImporterProvider] Error during image conversion:', error_6);
                        vscode.window.showErrorMessage("Error converting image: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    // Enhanced method for optimal palette extraction using Wu Quantization Algorithm
    SpriteImporterProvider.prototype.extractOptimalPalette = function (pixelData, width, height, maxColors) {
        return __awaiter(this, void 0, void 0, function () {
            var colorMap, i, idx, r, g, b, a, colorKey, palette;
            return __generator(this, function (_a) {
                console.log("[SpriteImporterProvider] Extracting optimal palette using Wu Quantization, max ".concat(maxColors, " colors"));
                colorMap = new Map();
                // Scan the image and count unique colors
                for (i = 0; i < width * height; i++) {
                    idx = i * 4;
                    r = pixelData[idx];
                    g = pixelData[idx + 1];
                    b = pixelData[idx + 2];
                    a = pixelData[idx + 3];
                    // Skip transparent pixels
                    if (a < 128) {
                        continue;
                    }
                    colorKey = "".concat(r, ",").concat(g, ",").concat(b);
                    // Update the color count
                    if (colorMap.has(colorKey)) {
                        colorMap.get(colorKey).count++;
                    }
                    else {
                        colorMap.set(colorKey, { count: 1, r: r, g: g, b: b });
                    }
                }
                console.log("[SpriteImporterProvider] Found ".concat(colorMap.size, " unique colors in image"));
                // If we have very few unique colors, just use them all
                if (colorMap.size <= maxColors) {
                    console.log("[SpriteImporterProvider] Few unique colors (".concat(colorMap.size, "), using direct mapping"));
                    palette = Array.from(colorMap.values()).map(function (color) {
                        var rHex = color.r.toString(16).padStart(2, '0');
                        var gHex = color.g.toString(16).padStart(2, '0');
                        var bHex = color.b.toString(16).padStart(2, '0');
                        return "#".concat(rHex).concat(gHex).concat(bHex);
                    });
                    // Ensure we have exactly maxColors by padding with black if needed
                    while (palette.length < maxColors) {
                        palette.push('#000000');
                    }
                    return [2 /*return*/, palette];
                }
                // Use Wu Quantization for better color selection
                return [2 /*return*/, this.wuQuantization(Array.from(colorMap.values()), maxColors)];
            });
        });
    };
    // Specialized palette extraction for 640x256 4-bit mode using K-means clustering
    SpriteImporterProvider.prototype.extractOptimalPalette640x256 = function (pixelData, width, height) {
        return __awaiter(this, void 0, void 0, function () {
            var colors, colorMap, i, idx, r, g, b, a, key, _i, _a, _b, key, count, _c, r, g, b, palette;
            return __generator(this, function (_d) {
                console.log("[SpriteImporterProvider] Extracting 640x256 optimal palette using K-means clustering");
                colors = [];
                colorMap = new Map();
                for (i = 0; i < width * height; i++) {
                    idx = i * 4;
                    r = pixelData[idx];
                    g = pixelData[idx + 1];
                    b = pixelData[idx + 2];
                    a = pixelData[idx + 3];
                    if (a < 128)
                        continue; // Skip transparent pixels
                    key = "".concat(r, ",").concat(g, ",").concat(b);
                    colorMap.set(key, (colorMap.get(key) || 0) + 1);
                }
                // Convert map to array
                for (_i = 0, _a = colorMap.entries(); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], count = _b[1];
                    _c = key.split(',').map(Number), r = _c[0], g = _c[1], b = _c[2];
                    colors.push({ r: r, g: g, b: b, count: count });
                }
                console.log("[SpriteImporterProvider] Found ".concat(colors.length, " unique colors for K-means clustering"));
                if (colors.length <= 16) {
                    palette = colors.map(function (c) {
                        return "#".concat(c.r.toString(16).padStart(2, '0')).concat(c.g.toString(16).padStart(2, '0')).concat(c.b.toString(16).padStart(2, '0'));
                    });
                    while (palette.length < 16) {
                        palette.push('#000000');
                    }
                    return [2 /*return*/, palette];
                }
                // Use K-means clustering to find 16 optimal colors
                return [2 /*return*/, this.kMeansClustering(colors, 16)];
            });
        });
    };
    // K-means clustering for better color quantization
    SpriteImporterProvider.prototype.kMeansClustering = function (colors, k) {
        var _this = this;
        console.log("[SpriteImporterProvider] Starting K-means clustering for ".concat(colors.length, " colors, k=").concat(k));
        // Initialize centroids using K-means++ for better starting points
        var centroids = [];
        // First centroid: choose randomly weighted by frequency
        var totalPixels = colors.reduce(function (sum, c) { return sum + c.count; }, 0);
        var rand = Math.random() * totalPixels;
        var accumulated = 0;
        for (var _i = 0, colors_1 = colors; _i < colors_1.length; _i++) {
            var color = colors_1[_i];
            accumulated += color.count;
            if (accumulated >= rand) {
                centroids.push({ r: color.r, g: color.g, b: color.b });
                break;
            }
        }
        // Remaining centroids: choose based on distance from existing centroids
        while (centroids.length < k) {
            var maxDistance = 0;
            var bestColor = colors[0];
            for (var _a = 0, colors_2 = colors; _a < colors_2.length; _a++) {
                var color = colors_2[_a];
                var minDistToCentroid = Infinity;
                for (var _b = 0, centroids_1 = centroids; _b < centroids_1.length; _b++) {
                    var centroid = centroids_1[_b];
                    var dist = this.colorDistance(color, centroid);
                    minDistToCentroid = Math.min(minDistToCentroid, dist);
                }
                if (minDistToCentroid > maxDistance) {
                    maxDistance = minDistToCentroid;
                    bestColor = color;
                }
            }
            centroids.push({ r: bestColor.r, g: bestColor.g, b: bestColor.b });
        }
        // Iteratively improve centroids
        var maxIterations = 20;
        for (var iter = 0; iter < maxIterations; iter++) {
            var clusters = Array(k).fill(null).map(function () { return []; });
            // Assign each color to nearest centroid
            for (var _c = 0, colors_3 = colors; _c < colors_3.length; _c++) {
                var color = colors_3[_c];
                var minDist = Infinity;
                var bestCentroid = 0;
                for (var i = 0; i < centroids.length; i++) {
                    var dist = this.colorDistance(color, centroids[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCentroid = i;
                    }
                }
                clusters[bestCentroid].push(color);
            }
            // Update centroids to cluster averages
            var converged = true;
            for (var i = 0; i < k; i++) {
                if (clusters[i].length === 0) {
                    continue;
                }
                var totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
                for (var _d = 0, _e = clusters[i]; _d < _e.length; _d++) {
                    var color = _e[_d];
                    totalR += color.r * color.count;
                    totalG += color.g * color.count;
                    totalB += color.b * color.count;
                    totalCount += color.count;
                }
                var newR = Math.round(totalR / totalCount);
                var newG = Math.round(totalG / totalCount);
                var newB = Math.round(totalB / totalCount);
                if (Math.abs(centroids[i].r - newR) > 1 ||
                    Math.abs(centroids[i].g - newG) > 1 ||
                    Math.abs(centroids[i].b - newB) > 1) {
                    converged = false;
                }
                centroids[i].r = newR;
                centroids[i].g = newG;
                centroids[i].b = newB;
            }
            if (converged) {
                console.log("[SpriteImporterProvider] K-means converged after ".concat(iter + 1, " iterations"));
                break;
            }
        }
        // Convert centroids to ZX Next color space and return as hex
        var palette = centroids.map(function (centroid) {
            // Map to ZX Next 9-bit color space
            var r9 = _this.findClosest3BitValue(centroid.r);
            var g9 = _this.findClosest3BitValue(centroid.g);
            var b9 = _this.findClosest3BitValue(centroid.b);
            // Convert back to 8-bit for hex representation
            var r8 = RGB3_TO_8_MAP[r9];
            var g8 = RGB3_TO_8_MAP[g9];
            var b8 = RGB3_TO_8_MAP[b9];
            return "#".concat(r8.toString(16).padStart(2, '0')).concat(g8.toString(16).padStart(2, '0')).concat(b8.toString(16).padStart(2, '0'));
        });
        console.log("[SpriteImporterProvider] K-means clustering complete: generated ".concat(palette.length, " colors"));
        return palette;
    };
    // Helper function for color distance calculation (LAB space for better perceptual accuracy)
    SpriteImporterProvider.prototype.colorDistance = function (c1, c2) {
        // Convert to LAB space for perceptually accurate distance
        var lab1 = this.rgbToLab(c1.r, c1.g, c1.b);
        var lab2 = this.rgbToLab(c2.r, c2.g, c2.b);
        // Use CIEDE2000 for the most accurate perceptual distance
        return this.deltaE2000(lab1, lab2);
    };
    // Wu Quantization Algorithm - Advanced color quantization for better quality
    SpriteImporterProvider.prototype.wuQuantization = function (colors, maxColors) {
        console.log("[SpriteImporterProvider] Starting Wu Quantization for ".concat(colors.length, " unique colors, target: ").concat(maxColors));
        // If we already have fewer colors than needed, return them all
        if (colors.length <= maxColors) {
            var palette_1 = colors.map(function (color) {
                var rHex = color.r.toString(16).padStart(2, '0');
                var gHex = color.g.toString(16).padStart(2, '0');
                var bHex = color.b.toString(16).padStart(2, '0');
                return "#".concat(rHex).concat(gHex).concat(bHex);
            });
            // Pad with black if needed
            while (palette_1.length < maxColors) {
                palette_1.push('#000000');
            }
            return palette_1;
        }
        // Wu's method works by creating a 3D histogram of the color space
        // and finding optimal splits that minimize the variance
        // Create 3D histogram (reduced resolution for performance)
        var histSize = 32; // 32x32x32 = 32,768 buckets (good balance)
        var hist = new Array(histSize * histSize * histSize).fill(0);
        var colorSums = {
            r: new Array(histSize * histSize * histSize).fill(0),
            g: new Array(histSize * histSize * histSize).fill(0),
            b: new Array(histSize * histSize * histSize).fill(0),
            count: new Array(histSize * histSize * histSize).fill(0)
        };
        // Build histogram
        for (var _i = 0, colors_4 = colors; _i < colors_4.length; _i++) {
            var color = colors_4[_i];
            // Map to reduced color space
            var rBin = Math.min(histSize - 1, Math.floor(color.r * histSize / 256));
            var gBin = Math.min(histSize - 1, Math.floor(color.g * histSize / 256));
            var bBin = Math.min(histSize - 1, Math.floor(color.b * histSize / 256));
            var index = rBin * histSize * histSize + gBin * histSize + bBin;
            hist[index] += color.count;
            colorSums.r[index] += color.r * color.count;
            colorSums.g[index] += color.g * color.count;
            colorSums.b[index] += color.b * color.count;
            colorSums.count[index] += color.count;
        }
        // Find regions with significant pixel counts
        var regions = [];
        // Start with the entire color space as one region
        regions.push({
            minR: 0, maxR: histSize - 1,
            minG: 0, maxG: histSize - 1,
            minB: 0, maxB: histSize - 1,
            pixelCount: colors.reduce(function (sum, c) { return sum + c.count; }, 0),
            avgR: 0, avgG: 0, avgB: 0
        });
        // Recursively split regions until we have enough colors
        while (regions.length < maxColors) {
            // Find the region with the most pixels to split
            var bestRegion = -1;
            var maxPixels = 0;
            for (var i = 0; i < regions.length; i++) {
                if (regions[i].pixelCount > maxPixels) {
                    maxPixels = regions[i].pixelCount;
                    bestRegion = i;
                }
            }
            if (bestRegion === -1 || maxPixels === 0) {
                break;
            }
            // Split the best region
            var region = regions[bestRegion];
            var split = this.findBestSplit(region, hist, colorSums, histSize);
            if (!split) {
                break; // No more useful splits possible
            }
            // Remove the original region and add the two new ones
            regions.splice(bestRegion, 1);
            regions.push(split.region1, split.region2);
        }
        // Calculate average color for each region
        var palette = [];
        for (var _a = 0, _b = regions.slice(0, maxColors); _a < _b.length; _a++) {
            var region = _b[_a];
            var totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
            for (var r = region.minR; r <= region.maxR; r++) {
                for (var g = region.minG; g <= region.maxG; g++) {
                    for (var b = region.minB; b <= region.maxB; b++) {
                        var index = r * histSize * histSize + g * histSize + b;
                        if (colorSums.count[index] > 0) {
                            totalR += colorSums.r[index];
                            totalG += colorSums.g[index];
                            totalB += colorSums.b[index];
                            totalCount += colorSums.count[index];
                        }
                    }
                }
            }
            if (totalCount > 0) {
                var avgR = Math.round(totalR / totalCount);
                var avgG = Math.round(totalG / totalCount);
                var avgB = Math.round(totalB / totalCount);
                // Convert to ZX Next 9-bit color space
                var rgb9 = this.hexToRgb9("#".concat(avgR.toString(16).padStart(2, '0')).concat(avgG.toString(16).padStart(2, '0')).concat(avgB.toString(16).padStart(2, '0')));
                var hex = this.rgb9ToHex(rgb9.r9, rgb9.g9, rgb9.b9);
                palette.push(hex);
            }
            else {
                palette.push('#000000'); // Fallback for empty regions
            }
        }
        // Ensure we have exactly maxColors
        while (palette.length < maxColors) {
            palette.push('#000000');
        }
        console.log("[SpriteImporterProvider] Wu Quantization complete: generated ".concat(palette.length, " colors"));
        return palette;
    };
    // Helper method to find the best split for Wu quantization
    SpriteImporterProvider.prototype.findBestSplit = function (region, hist, colorSums, histSize) {
        var bestSplit = null;
        var minVariance = Infinity;
        // Try splitting along each axis
        for (var _i = 0, _a = ['r', 'g', 'b']; _i < _a.length; _i++) {
            var axis = _a[_i];
            var _b = axis === 'r' ? [region.minR, region.maxR] :
                axis === 'g' ? [region.minG, region.maxG] :
                    [region.minB, region.maxB], min = _b[0], max = _b[1];
            if (max - min <= 1) {
                continue; // Can't split further along this axis
            }
            // Try different split points
            for (var split = min + 1; split < max; split++) {
                var _c = this.calculateSplitVariance(region, axis, split, hist, colorSums, histSize), var1 = _c[0], var2 = _c[1];
                var totalVariance = var1 + var2;
                if (totalVariance < minVariance) {
                    minVariance = totalVariance;
                    bestSplit = {
                        axis: axis,
                        splitPoint: split,
                        region1: this.createSubRegion(region, axis, min, split - 1),
                        region2: this.createSubRegion(region, axis, split, max)
                    };
                }
            }
        }
        return bestSplit;
    };
    // Helper methods for Wu quantization
    SpriteImporterProvider.prototype.calculateSplitVariance = function (region, axis, split, hist, colorSums, histSize) {
        // Simplified variance calculation for performance
        // In a full implementation, this would calculate the actual color variance
        return [1, 1]; // Placeholder - real implementation would be more complex
    };
    SpriteImporterProvider.prototype.createSubRegion = function (region, axis, start, end) {
        var newRegion = __assign({}, region);
        if (axis === 'r') {
            newRegion.minR = start;
            newRegion.maxR = end;
        }
        else if (axis === 'g') {
            newRegion.minG = start;
            newRegion.maxG = end;
        }
        else {
            newRegion.minB = start;
            newRegion.maxB = end;
        }
        return newRegion;
    };
    // Helper method to convert hex to RGB9 for ZX Next compatibility
    SpriteImporterProvider.prototype.rgb9ToHex = function (r9, g9, b9) {
        // Convert 3-bit values (0-7) back to 8-bit using ZX Next mapping
        var r8 = RGB3_TO_8_MAP[Math.min(7, Math.max(0, r9))];
        var g8 = RGB3_TO_8_MAP[Math.min(7, Math.max(0, g9))];
        var b8 = RGB3_TO_8_MAP[Math.min(7, Math.max(0, b9))];
        return "#".concat(r8.toString(16).padStart(2, '0')).concat(g8.toString(16).padStart(2, '0')).concat(b8.toString(16).padStart(2, '0'));
    };
    // Add the missing createNXIFile method
    SpriteImporterProvider.prototype.createNXIFile = function (pixelData, width, height, bitDepth, targetPalette, ditheringMode, is640x256_4bit) {
        return __awaiter(this, void 0, void 0, function () {
            var is320x256, is9bit_custom, isSharpQuantized, finalData, i, rgbaIndex, r, g, b, paletteIndex, grayValue, paletteForQuantization, firstColors, maxColors, errors, usePerceptual, nonZeroIndices, y, serpentine, x_iter, x, i, r, g, b, a, colorIndex, palColor, errorR, errorG, errorB, indexCounts, i, idx, outputData, packedSize, packedData, blockSize, packedIndex, xBlock, yBlock, blockHeight, y, idx1, idx2, paletteData, i, hex, rgb9, bytes, result, outputSize, columnMajorData, outputIndex, x, y, rowMajorIndex, nonZeroBytes, i, outputSize, columnMajorData, outputIndex, x_col, y_row, rowMajorIndex, customPaletteData, i, hex, rgb9, bytes, result, packedSize, packedData, i, idx1, idx2, debugBytes, nonZeroOutputBytes, i;
            var _this = this;
            return __generator(this, function (_a) {
                console.log("[SpriteImporterProvider] createNXIFile CALLED with bitDepth: ".concat(bitDepth, ", targetPalette ").concat(targetPalette ? 'exists (' + targetPalette.length + ' colors)' : 'is null/empty', ", dithering: ").concat(ditheringMode));
                is320x256 = width === 320 && height === 256;
                is9bit_custom = bitDepth === 9;
                console.log("[SpriteImporterProvider] createNXIFile: is9bit_custom is ".concat(is9bit_custom, ". Initial bitDepth was ").concat(bitDepth, "."));
                isSharpQuantized = is640x256_4bit && targetPalette === null;
                if (isSharpQuantized) {
                    console.log("[SpriteImporterProvider] Detected Sharp-quantized data for 640x256 4-bit mode - using simplified processing");
                }
                finalData = new Uint8Array(width * height);
                // For Sharp-quantized data, we can extract indices directly since Sharp already did the quantization
                if (isSharpQuantized) {
                    console.log("[SpriteImporterProvider] Extracting indices from Sharp-quantized RGBA data");
                    // Sharp returns RGBA data where each pixel's R component contains the palette index
                    // This is because Sharp converts palette PNG back to RGBA for raw() output
                    for (i = 0; i < width * height; i++) {
                        rgbaIndex = i * 4;
                        r = pixelData[rgbaIndex];
                        g = pixelData[rgbaIndex + 1];
                        b = pixelData[rgbaIndex + 2];
                        paletteIndex = 0;
                        grayValue = Math.round((r + g + b) / 3);
                        paletteIndex = Math.min(15, Math.floor(grayValue / 16));
                        finalData[i] = paletteIndex;
                    }
                    console.log("[SpriteImporterProvider] Sharp-quantized data processed: ".concat(finalData.length, " indexed pixels"));
                }
                else {
                    // Use the original quantization approach for non-Sharp data
                    console.log("[SpriteImporterProvider] Using custom quantization for non-Sharp data");
                    paletteForQuantization = [];
                    if (targetPalette && targetPalette.length > 0) {
                        // Convert hex palette to RGB with proper ZX Next color mapping
                        paletteForQuantization = targetPalette.slice(0, bitDepth === 4 ? 16 : 256).map(function (hex) {
                            // Convert hex to 9-bit RGB (3-3-3)
                            var rgb9 = _this.hexToRgb9(hex);
                            // Map back to 8-bit using the ZX Next's specific mapping table
                            return {
                                r: RGB3_TO_8_MAP[rgb9.r9],
                                g: RGB3_TO_8_MAP[rgb9.g9],
                                b: RGB3_TO_8_MAP[rgb9.b9]
                            };
                        });
                        console.log("[SpriteImporterProvider] Using provided palette with ".concat(paletteForQuantization.length, " colors mapped to ZX Next 9-bit color space"));
                    }
                    else {
                        // Use default palette - map directly from the RGB3_TO_8_MAP
                        paletteForQuantization = defaultPalette8bit;
                        console.log("[SpriteImporterProvider] Using default palette with ".concat(paletteForQuantization.length, " colors in ZX Next color space"));
                    }
                    // Log first few colors of the palette for debugging
                    if (paletteForQuantization.length > 0) {
                        firstColors = paletteForQuantization.slice(0, 5).map(function (c) {
                            return "RGB(".concat(c.r.toString(16), ",").concat(c.g.toString(16), ",").concat(c.b.toString(16), ")");
                        }).join(', ');
                        console.log("[SpriteImporterProvider] First 5 palette colors for quantization: ".concat(firstColors));
                    }
                    maxColors = (bitDepth === 4) ? 16 : (is9bit_custom ? ((targetPalette === null || targetPalette === void 0 ? void 0 : targetPalette.length) || 256) : 256);
                    paletteForQuantization = paletteForQuantization.slice(0, maxColors);
                    errors = null;
                    // Choose dithering method based on mode
                    if (ditheringMode === 'floydSteinberg' || ditheringMode === 'sierra') {
                        // Initialize error diffusion matrix [height][width][3 channels]
                        errors = Array(height).fill(0).map(function () {
                            return Array(width).fill(0).map(function () { return [0, 0, 0]; });
                        });
                    }
                    usePerceptual = true;
                    // Process each pixel using improved color matching
                    console.log("[SpriteImporterProvider] Processing image using ".concat(usePerceptual ? 'perceptual' : 'standard', " color matching"));
                    nonZeroIndices = 0;
                    // First pass: Quantize all pixels to their nearest palette color
                    for (y = 0; y < height; y++) {
                        serpentine = (ditheringMode === 'sierra') && (y % 2 === 1);
                        for (x_iter = 0; x_iter < width; x_iter++) {
                            x = serpentine ? (width - 1 - x_iter) : x_iter;
                            i = (y * width + x) * 4;
                            // Skip if out of bounds
                            if (i + 3 >= pixelData.length) {
                                continue;
                            }
                            r = pixelData[i];
                            g = pixelData[i + 1];
                            b = pixelData[i + 2];
                            a = pixelData[i + 3];
                            // Skip transparent pixels (use index 0)
                            if (a < 128) {
                                finalData[y * width + x] = 0;
                                continue;
                            }
                            // Apply previous errors for dithering
                            if (ditheringMode === 'floydSteinberg' && errors) {
                                r = Math.max(0, Math.min(255, r + errors[y][x][0]));
                                g = Math.max(0, Math.min(255, g + errors[y][x][1]));
                                b = Math.max(0, Math.min(255, b + errors[y][x][2]));
                            }
                            else if (ditheringMode === 'sierra' && errors) {
                                r = Math.max(0, Math.min(255, r + errors[y][x][0]));
                                g = Math.max(0, Math.min(255, g + errors[y][x][1]));
                                b = Math.max(0, Math.min(255, b + errors[y][x][2]));
                            }
                            // Log a sample of the input pixels for debugging
                            if (y % 50 === 0 && x % 50 === 0) {
                                console.log("[SpriteImporterProvider] Sample pixel at (".concat(x, ",").concat(y, "): RGB(").concat(r, ",").concat(g, ",").concat(b, ")"));
                            }
                            colorIndex = void 0;
                            if (usePerceptual) {
                                // Make sure we're calling the instance method with 'this'
                                colorIndex = this.findClosestPerceptualColorIndex(r, g, b, paletteForQuantization);
                            }
                            else {
                                colorIndex = findClosestPaletteIndex(r, g, b, paletteForQuantization);
                            }
                            // Count non-zero indices to check if we're getting valid colors
                            if (colorIndex > 0) {
                                nonZeroIndices++;
                            }
                            finalData[y * width + x] = colorIndex;
                            // For dithering, distribute the error
                            if ((ditheringMode === 'floydSteinberg' || ditheringMode === 'sierra') && errors) {
                                palColor = paletteForQuantization[colorIndex];
                                errorR = r - palColor.r;
                                errorG = g - palColor.g;
                                errorB = b - palColor.b;
                                if (ditheringMode === 'floydSteinberg' && errors) {
                                    // Floyd-Steinberg error distribution (standard)
                                    if (x < width - 1) { // Right
                                        errors[y][x + 1][0] += (errorR * 7 / 16);
                                        errors[y][x + 1][1] += (errorG * 7 / 16);
                                        errors[y][x + 1][2] += (errorB * 7 / 16);
                                    }
                                    if (y < height - 1) {
                                        if (x > 0) { // Bottom-left
                                            errors[y + 1][x - 1][0] += (errorR * 3 / 16);
                                            errors[y + 1][x - 1][1] += (errorG * 3 / 16);
                                            errors[y + 1][x - 1][2] += (errorB * 3 / 16);
                                        }
                                        errors[y + 1][x][0] += (errorR * 5 / 16); // Bottom
                                        errors[y + 1][x][1] += (errorG * 5 / 16);
                                        errors[y + 1][x][2] += (errorB * 5 / 16);
                                        if (x < width - 1) { // Bottom-right
                                            errors[y + 1][x + 1][0] += (errorR * 1 / 16);
                                            errors[y + 1][x + 1][1] += (errorG * 1 / 16);
                                            errors[y + 1][x + 1][2] += (errorB * 1 / 16);
                                        }
                                    }
                                }
                                else if (ditheringMode === 'sierra' && errors) {
                                    // Sierra-Lite error distribution with serpentine processing
                                    if (!serpentine) { // Processing left-to-right
                                        if (x < width - 1) { // Right pixel (2/4)
                                            errors[y][x + 1][0] += (errorR * 2 / 4);
                                            errors[y][x + 1][1] += (errorG * 2 / 4);
                                            errors[y][x + 1][2] += (errorB * 2 / 4);
                                        }
                                        if (y < height - 1) {
                                            if (x > 0) { // Bottom-left pixel (1/4)
                                                errors[y + 1][x - 1][0] += (errorR * 1 / 4);
                                                errors[y + 1][x - 1][1] += (errorG * 1 / 4);
                                                errors[y + 1][x - 1][2] += (errorB * 1 / 4);
                                            }
                                            errors[y + 1][x][0] += (errorR * 1 / 4); // Bottom pixel (1/4)
                                            errors[y + 1][x][1] += (errorG * 1 / 4);
                                            errors[y + 1][x][2] += (errorB * 1 / 4);
                                        }
                                    }
                                    else { // Processing right-to-left (serpentine)
                                        if (x > 0) { // Left pixel (2/4)
                                            errors[y][x - 1][0] += (errorR * 2 / 4);
                                            errors[y][x - 1][1] += (errorG * 2 / 4);
                                            errors[y][x - 1][2] += (errorB * 2 / 4);
                                        }
                                        if (y < height - 1) {
                                            if (x < width - 1) { // Bottom-right pixel (1/4)
                                                errors[y + 1][x + 1][0] += (errorR * 1 / 4);
                                                errors[y + 1][x + 1][1] += (errorG * 1 / 4);
                                                errors[y + 1][x + 1][2] += (errorB * 1 / 4);
                                            }
                                            errors[y + 1][x][0] += (errorR * 1 / 4); // Bottom pixel (1/4)
                                            errors[y + 1][x][1] += (errorG * 1 / 4);
                                            errors[y + 1][x][2] += (errorB * 1 / 4);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Log the total non-zero indices for debugging
                    console.log("[SpriteImporterProvider] Quantization resulted in ".concat(nonZeroIndices, " non-zero pixel indices out of ").concat(width * height, " total pixels"));
                    indexCounts = new Map();
                    for (i = 0; i < finalData.length; i++) {
                        idx = finalData[i];
                        indexCounts.set(idx, (indexCounts.get(idx) || 0) + 1);
                    }
                    console.log("[SpriteImporterProvider] Color index distribution: ".concat(Array.from(indexCounts.entries()).slice(0, 10).map(function (_a) {
                        var idx = _a[0], count = _a[1];
                        return "".concat(idx, ":").concat(count);
                    }).join(', '), "..."));
                } // End of custom quantization else block
                // Handle different formats
                if (is640x256_4bit) {
                    console.log("[SpriteImporterProvider] Using column-oriented layout for 640x256 4-bit format");
                    packedSize = Math.ceil((width * height) / 2);
                    packedData = new Uint8Array(packedSize);
                    blockSize = 8;
                    packedIndex = 0;
                    // Column-major order for 640x256 format means we traverse columns first
                    for (xBlock = 0; xBlock < width; xBlock += 2) {
                        for (yBlock = 0; yBlock < height; yBlock += blockSize) {
                            blockHeight = Math.min(blockSize, height - yBlock);
                            for (y = yBlock; y < yBlock + blockHeight; y++) {
                                idx1 = finalData[y * width + xBlock] & 0x0F;
                                idx2 = (xBlock + 1 < width) ? (finalData[y * width + xBlock + 1] & 0x0F) : 0;
                                packedData[packedIndex++] = (idx1 << 4) | idx2;
                            }
                        }
                    }
                    // Append the palette (16 colors) at the end of the file
                    if (targetPalette && targetPalette.length > 0) {
                        paletteData = new Uint8Array(32);
                        console.log("[SpriteImporterProvider] Appending palette data for 640x256 4-bit image");
                        // Log first colors for debugging
                        if (targetPalette.length > 0) {
                            console.log("  - First palette color: ".concat(targetPalette[0]));
                        }
                        for (i = 0; i < 16 && i < targetPalette.length; i++) {
                            hex = targetPalette[i];
                            rgb9 = this.hexToRgb9(hex);
                            bytes = this.rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
                            if (i < 3) {
                                console.log("  - Palette[".concat(i, "]: ").concat(hex, " -> R9:").concat(rgb9.r9, " G9:").concat(rgb9.g9, " B9:").concat(rgb9.b9, " -> Bytes:").concat(bytes[0].toString(16).padStart(2, '0')).concat(bytes[1].toString(16).padStart(2, '0')));
                            }
                            // Write bytes in correct order for ZX Next hardware format
                            paletteData[i * 2] = bytes[0]; // RRRGGGBB (first byte)
                            paletteData[i * 2 + 1] = bytes[1]; // P000000B (second byte)
                        }
                        result = new Uint8Array(packedData.length + paletteData.length);
                        result.set(packedData);
                        result.set(paletteData, packedData.length);
                        console.log("[SpriteImporterProvider] Created 640x256 4-bit image with appended 16-color palette (".concat(result.length, " bytes)"));
                        outputData = buffer_1.Buffer.from(result);
                    }
                    else {
                        console.log("[SpriteImporterProvider] Created 640x256 4-bit image (raw data, ".concat(packedData.length, " bytes)"));
                        outputData = buffer_1.Buffer.from(packedData);
                    }
                }
                else if (is320x256 && bitDepth === 8) {
                    // Special handling for 320x256 8-bit format - column-major order
                    console.log("[SpriteImporterProvider] Using column-major layout for 320x256 8-bit format");
                    outputSize = width * height;
                    columnMajorData = new Uint8Array(outputSize);
                    outputIndex = 0;
                    // Loop through columns first, then rows (column-major order)
                    for (x = 0; x < width; x++) {
                        for (y = 0; y < height; y++) {
                            rowMajorIndex = y * width + x;
                            // Copy to column-major output
                            columnMajorData[outputIndex++] = finalData[rowMajorIndex];
                        }
                    }
                    nonZeroBytes = 0;
                    for (i = 0; i < Math.min(columnMajorData.length, 1000); i++) {
                        if (columnMajorData[i] > 0) {
                            nonZeroBytes++;
                        }
                    }
                    console.log("[SpriteImporterProvider] Column-major data first 1000 bytes: ".concat(nonZeroBytes, " non-zero values"));
                    console.log("[SpriteImporterProvider] Created 320x256 8-bit image in column-major order (".concat(columnMajorData.length, " bytes)"));
                    outputData = buffer_1.Buffer.from(columnMajorData);
                }
                else if (is9bit_custom) {
                    // 9-bit custom palette mode
                    console.log("[SpriteImporterProvider] createNXIFile: ENTERING 9-bit custom palette mode logic for ".concat(width, "x").concat(height));
                    console.log("[SpriteImporterProvider] createNXIFile: 9-bit mode received targetPalette with ".concat(targetPalette ? targetPalette.length : 'null/0', " colors. First few: ").concat(targetPalette ? JSON.stringify(targetPalette.slice(0, 3)) : 'N/A'));
                    // Apply column-major transformation for 320x256 images in 9-bit mode
                    if (width === 320 && height === 256) {
                        console.log("[SpriteImporterProvider] Applying column-major layout to pixel data for 320x256 9-bit format");
                        outputSize = width * height;
                        columnMajorData = new Uint8Array(outputSize);
                        outputIndex = 0;
                        for (x_col = 0; x_col < width; x_col++) {
                            for (y_row = 0; y_row < height; y_row++) {
                                rowMajorIndex = y_row * width + x_col;
                                columnMajorData[outputIndex++] = finalData[rowMajorIndex];
                            }
                        }
                        finalData = columnMajorData; // Replace finalData with the column-major version
                        console.log("[SpriteImporterProvider] Pixel data transformed to column-major for 320x256 9-bit.");
                    }
                    // finalData now contains 8-bit indices (either row-major or column-major for 320x256)
                    // into the custom paletteForQuantization.
                    // Now, append or prepend the custom 9-bit targetPalette (which contains hex strings)
                    if (targetPalette && targetPalette.length > 0) {
                        customPaletteData = new Uint8Array(targetPalette.length * 2);
                        console.log("[SpriteImporterProvider] Appending/Prepending custom 9-bit palette with ".concat(targetPalette.length, " colors (").concat(customPaletteData.length, " bytes)"));
                        for (i = 0; i < targetPalette.length; i++) {
                            hex = targetPalette[i];
                            rgb9 = this.hexToRgb9(hex);
                            bytes = this.rgb9ToBytes(rgb9.r9, rgb9.g9, rgb9.b9);
                            if (i < 5) { // Log first few conversions
                                console.log("  - CustomPalette[".concat(i, "]: ").concat(hex, " -> R9:").concat(rgb9.r9, " G9:").concat(rgb9.g9, " B9:").concat(rgb9.b9, " -> Bytes:").concat(bytes[0].toString(16).padStart(2, '0')).concat(bytes[1].toString(16).padStart(2, '0')));
                            }
                            customPaletteData[i * 2] = bytes[0];
                            customPaletteData[i * 2 + 1] = bytes[1];
                        }
                        result = new Uint8Array(finalData.length + customPaletteData.length);
                        if (width === 256) {
                            console.log("[SpriteImporterProvider] Prepending custom 9-bit palette for ".concat(width, "x").concat(height, " image."));
                            result.set(customPaletteData); // Palette data first
                            result.set(finalData, customPaletteData.length); // Pixel indices after palette
                            outputData = buffer_1.Buffer.from(result);
                            console.log("[SpriteImporterProvider] Created ".concat(width, "x").concat(height, " 9-bit image with prepended custom palette (").concat(outputData.length, " bytes)"));
                        }
                        else {
                            console.log("[SpriteImporterProvider] Appending custom 9-bit palette for ".concat(width, "x").concat(height, " image."));
                            result.set(finalData); // Pixel indices first
                            result.set(customPaletteData, finalData.length); // Appended palette data
                            outputData = buffer_1.Buffer.from(result);
                            console.log("[SpriteImporterProvider] Created ".concat(width, "x").concat(height, " 9-bit image with appended custom palette (").concat(outputData.length, " bytes)"));
                        }
                    }
                    else {
                        // Should not happen if 9-bit mode is selected, as palette extraction is expected
                        console.warn("[SpriteImporterProvider] createNXIFile: 9-bit custom mode, but targetPalette is null or empty. Will output raw 8-bit indexed data without appended palette (this results in an 8-bit like file).");
                        outputData = buffer_1.Buffer.from(finalData); // Fallback to just pixel data
                    }
                }
                else if (bitDepth === 4) {
                    // For other 4-bit modes (not 640x256), use standard row-major packing (2 pixels per byte)
                    console.log("[SpriteImporterProvider] Using standard row-major packing for ".concat(width, "x").concat(height, " 4-bit format"));
                    packedSize = Math.ceil((width * height) / 2);
                    packedData = new Uint8Array(packedSize);
                    // Row-major order (standard layout)
                    for (i = 0; i < finalData.length; i += 2) {
                        idx1 = finalData[i] & 0x0F;
                        idx2 = (i + 1 < finalData.length) ? (finalData[i + 1] & 0x0F) : 0;
                        packedData[i / 2] = (idx1 << 4) | idx2;
                    }
                    outputData = buffer_1.Buffer.from(packedData);
                }
                else {
                    // For other 8-bit modes, use data as-is in row-major order
                    console.log("[SpriteImporterProvider] Using standard row-major format for ".concat(width, "x").concat(height, " 8-bit image"));
                    outputData = buffer_1.Buffer.from(finalData);
                }
                // Debug info for the first few bytes of output data
                if (outputData.length > 16) {
                    debugBytes = Array.from(outputData.slice(0, 16)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(' ');
                    console.log("[SpriteImporterProvider] First 16 bytes of output: ".concat(debugBytes));
                    nonZeroOutputBytes = 0;
                    for (i = 0; i < Math.min(outputData.length, 1000); i++) {
                        if (outputData[i] > 0) {
                            nonZeroOutputBytes++;
                        }
                    }
                    console.log("[SpriteImporterProvider] Output data first 1000 bytes: ".concat(nonZeroOutputBytes, " non-zero values"));
                }
                return [2 /*return*/, outputData];
            });
        });
    };
    SpriteImporterProvider.prototype.getHtmlForWebview = function (webview) {
        // Local path to main script run in the webview
        var scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'spriteImporter.js');
        var scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        // Local path to css styles
        var stylesPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'spriteImporter.css');
        var stylesUri = webview.asWebviewUri(stylesPathOnDisk);
        // Use a nonce to only allow specific scripts to be run
        var nonce = Date.now().toString();
        // Use backticks for the template literal, ensure internal strings use single/double quotes correctly
        return "<!DOCTYPE html>\n            <html lang=\"en\">\n            <head>\n                <meta charset=\"UTF-8\">\n                <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n                <link href=\"".concat(stylesUri, "\" rel=\"stylesheet\">\n                <title>").concat(SpriteImporterProvider.title, "</title>\n            </head>\n            <body>\n                <h1>Sprite Importer</h1>\n                <p>Select an area of the image below to import.</p>\n                <p class=\"tips\" style=\"font-size: 0.9em; color: var(--vscode-descriptionForeground); margin-bottom: 10px;\">\n                    <b>Tips:</b> Left-click to select with predefined size. Right-click and drag to create a custom selection.<br>\n                    <b>Keyboard:</b> Arrows move selection, Numpad 4/6 adjust width, 8/5 adjust height. Space captures, A adds, C centers, S squares.\n                </p>\n\n                <!-- MOVED CONTROLS TO TOP -->\n                <div id=\"controls\">\n                    <div class=\"control-group\">\n                         <button id=\"loadNewImageButton\">Load New Image...</button>\n                         <button id=\"convertToNxiButton\" style=\"margin-left: 10px;\">Convert to NXI...</button>\n                         <button id=\"helpButton\" style=\"margin-left: 10px;\" title=\"Show keyboard shortcuts\">?</button>\n                    </div>\n                    <div id=\"output-options\">\n                        <h3>Output Options</h3>\n                        <div class=\"control-group\">\n                            <label for=\"outputFormat\">Format:</label>\n                            <select id=\"outputFormat\">\n                                <option value=\"spr\" selected>Sprite (.spr)</option>\n                                <option value=\"til\">Tile (.til)</option>\n                                <!-- <option value=\"fnt\">Font (.fnt)</option> -->\n                                <!-- <option value=\"nxi\">Raw Pixels (.nxi)</option> -->\n                            </select>\n                        </div>\n                        <div class=\"control-group\">\n                            <label for=\"outputBitDepth\">Bit Depth:</label>\n                            <select id=\"outputBitDepth\">\n                                <option value=\"8\" selected>8-bit (256 colors)</option>\n                                <option value=\"4\">4-bit (16 colors)</option>\n                            </select>\n                        </div>\n                        <!-- NEW Grid Size Inputs -->\n                        <div class=\"control-group\">\n                            <label for=\"cutterGridWidth\">Grid W:</label>\n                            <input type=\"number\" id=\"cutterGridWidth\" value=\"1\" min=\"1\" max=\"16\"> \n                        </div>\n                         <div class=\"control-group\">\n                            <label for=\"cutterGridHeight\">Grid H:</label>\n                            <input type=\"number\" id=\"cutterGridHeight\" value=\"1\" min=\"1\" max=\"16\">\n                        </div>\n                        \n                        <!-- NEW Custom Sprite Size Controls -->\n                        <div class=\"control-group\">\n                            <h4 style=\"margin: 8px 0 4px 0;\">Sprite Size</h4>\n                        </div>\n                        <div class=\"control-group\">\n                            <label for=\"spriteWidth\">Width:</label>\n                            <input type=\"number\" id=\"spriteWidth\" value=\"16\" min=\"1\" max=\"256\">\n                        </div>\n                        <div class=\"control-group\">\n                            <label for=\"spriteHeight\">Height:</label>\n                            <input type=\"number\" id=\"spriteHeight\" value=\"16\" min=\"1\" max=\"256\">\n                        </div>\n                        <div class=\"control-group\">\n                            <input type=\"checkbox\" id=\"saveActualSize\" checked>\n                            <label for=\"saveActualSize\">Save actual size (unchecked = pad to 16px)</label>\n                        </div>\n\n                        <!-- NEW Source Grid Controls -->\n                        <div class=\"control-group\">\n                            <input type=\"checkbox\" id=\"showSourceGrid\">\n                            <label for=\"showSourceGrid\">Show Grid</label>\n                        </div>\n                        <div class=\"control-group\">\n                            <label for=\"gridCellWidth\">Cell W:</label>\n                            <input type=\"number\" id=\"gridCellWidth\" value=\"16\" min=\"8\" max=\"128\">\n                        </div>\n                        <div class=\"control-group\">\n                            <label for=\"gridCellHeight\">Cell H:</label>\n                            <input type=\"number\" id=\"gridCellHeight\" value=\"16\" min=\"8\" max=\"128\">\n                        </div>\n                        <!-- REMOVED Palette Bank Input -->\n                        <div class=\"control-group\">\n                            <button id=\"loadTargetPaletteButton\">Load Target Palette...</button>\n                            <span id=\"targetPaletteInfo\" style=\"font-size: 0.9em; margin-left: 5px;\"></span>\n                        </div>\n                    </div>\n\n                    <!-- Actions div is now removed from here -->\n                    <!-- <div id=\"actions\" style=\"margin-top: 10px; display: flex; gap: 10px;\"> -->\n                    <!--    <button id=\"addSelectionButton\" style=\"margin-top: 5px;\">Add Selection to List</button> -->\n                    <!--    <button id=\"importSheetButton\">Import Sprite Sheet</button> -->\n                    <!-- </div> -->\n                </div>\n                <!-- END CONTROLS AT TOP (excluding actions) -->\n                \n                <div id=\"image-area\">\n                    <canvas id=\"sourceCanvas\"></canvas>\n                </div>\n\n                <!-- MOVED ACTIONS TO BELOW CANVAS -->\n                 <div id=\"actions\" style=\"margin-top: 10px; display: flex; gap: 10px; justify-content: flex-start;\">\n                    <button id=\"addSelectionButton\">Add Selection to List</button> <!-- Removed inline margin-top -->\n                    <button id=\"importSheetButton\">Export Sprite Sheet</button> <!-- Changed Text -->\n                </div>\n                \n                <div id=\"preview-area\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;\">\n                        <h3>Selection Preview</h3>\n                    </div>\n                     <canvas id=\"previewCanvas\"></canvas>\n\n                   <!-- NEW container for Show Grid checkbox -->\n                   <div class=\"control-group\" style=\"margin-top: 8px;\">\n                       <input type=\"checkbox\" id=\"showPreviewGrid\">\n                       <label for=\"showPreviewGrid\" style=\"font-size: 11px;\">Show Grid</label>\n                   </div>\n\n                     <div id=\"selectionInfo\"></div>\n                </div>\n\n                <div id=\"sprite-list-area\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                        <h3>Selected Sprites (<span id=\"spriteCount\">0</span>)</h3>\n                        <button id=\"clearSpriteListButton\" style=\"font-size: 11px; padding: 2px 5px;\">Clear List</button>\n                    </div>\n                    <div id=\"spriteList\"></div>\n                </div>\n\n                <div id=\"palette-preview-area\">\n                    <h3>Extracted Palette</h3>\n                    <div id=\"paletteSwatches\"></div>\n                    <!-- NEW Button to Save Extracted Palette -->\n                    <button id=\"saveExtractedPaletteButton\" style=\"margin-top: 8px;\" disabled>Save Extracted Palette...</button>\n                </div>\n                \n                <!-- Help Modal -->\n                <div id=\"keyboardHelpModal\" style=\"display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 1000;\">\n                    <div style=\"position: relative; background-color: var(--vscode-editor-background); margin: 10% auto; padding: 20px; width: 80%; max-width: 600px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 4px;\">\n                        <h2>Keyboard Shortcuts</h2>\n                        <button id=\"closeHelpButton\" style=\"position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;\">\u2715</button>\n                        <div style=\"margin-top: 15px;\">\n                            <h3>Navigation</h3>\n                            <ul>\n                                <li><b>Arrow keys</b>: Move selection (hold Shift for larger steps)</li>\n                                <li><b>C</b>: Center selection in view</li>\n                                <li><b>Tab</b>: In block mode, auto-capture and advance to next position</li>\n                            </ul>\n                            <h3>Selection Size</h3>\n                            <ul>\n                                <li><b>Numpad 4</b>: Decrease width</li>\n                                <li><b>Numpad 6</b>: Increase width</li>\n                                <li><b>Numpad 8</b>: Decrease height</li>\n                                <li><b>Numpad 5/2</b>: Increase height</li>\n                                <li><b>S</b>: Make square (width = height)</li>\n                            </ul>\n                            <h3>Grid Control</h3>\n                            <ul>\n                                <li><b>Numpad *</b>: Increase grid width</li>\n                                <li><b>Shift + Numpad *</b>: Increase grid height</li>\n                                <li><b>Numpad /</b>: Decrease grid width</li>\n                                <li><b>Shift + Numpad /</b>: Decrease grid height</li>\n                            </ul>\n                            <h3>Actions</h3>\n                            <ul>\n                                <li><b>Space</b>: Capture current selection</li>\n                                <li><b>A</b>: Add selection to list</li>\n                                <li><b>Escape</b>: Cancel current capture</li>\n                                <li><b>Shift+Space</b>: Capture and add to list in one step</li>\n                            </ul>\n                            <h3>Mouse</h3>\n                            <ul>\n                                <li><b>Left-click</b>: Select with current sprite size</li>\n                                <li><b>Right-click + drag</b>: Create custom selection</li>\n                                <li><b>Scroll wheel</b>: Zoom in/out</li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n                \n                <!-- NXI Conversion Modal -->\n                <div id=\"nxiConversionModal\" style=\"display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 1000;\">\n                    <div style=\"position: relative; background-color: var(--vscode-editor-background); margin: 5% auto; padding: 20px; width: 90%; max-width: 800px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 4px;\">\n                        <h2>Convert to NXI Format</h2>\n                        <button id=\"closeConversionButton\" style=\"position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;\">\u2715</button>\n                        \n                        <div style=\"display: flex; flex-wrap: wrap; gap: 20px;\">\n                            <!-- Left side - Options -->\n                            <div style=\"flex: 1; min-width: 300px; gap: 5px; max-height: 400px \">\n                                <h3>Conversion Options</h3>\n                                \n                                <div class=\"control-group\">\n                                    <label for=\"conversionResolution\">Resolution:</label>\n                                    <select id=\"conversionResolution\">\n                                        <option value=\"custom\" selected>Custom</option>\n                                        <option value=\"320x256\">320x256 (Layer 2 Full)</option>\n                                        <option value=\"256x192\">256x192 (Layer 2 Standard)</option>\n                                        <option value=\"640x256\">640x256 (Layer 2 16 color)</option>\n                                    </select>\n                                </div>\n                                \n                                <div class=\"control-group-2\" id=\"customResolutionControls\">\n                                    <label for=\"conversionWidth\">Width:</label>\n                                    <input type=\"number\" id=\"conversionWidth\" value=\"320\" min=\"1\" max=\"640\">\n                                    \n                                    <label for=\"conversionHeight\" style=\"margin-left: 10px;\">Height:</label>\n                                    <input type=\"number\" id=\"conversionHeight\" value=\"256\" min=\"1\" max=\"512\">\n                                </div>\n                                \n                                <div class=\"control-group\">\n                                    <input type=\"checkbox\" id=\"preserveAspectRatio\" checked>\n                                    <label for=\"preserveAspectRatio\">Preserve aspect ratio</label>\n                                </div>\n                                \n                                <div class=\"control-group\">\n                                    <label for=\"conversionBitDepth\">Bit Depth:</label>\n                                    <select id=\"conversionBitDepth\">\n                                        <option value=\"8\" selected>8-bit (256 colors)</option>\n                                        <option value=\"4\">4-bit (16 colors)</option>\n                                        <option value=\"9\">9-bit (Custom Palette)</option>\n                                    </select>\n                                </div>\n                                \n                                <div class=\"control-group\">\n                                    <label for=\"conversionDithering\">Dithering:</label>\n                                    <select id=\"conversionDithering\">\n                                        <option value=\"none\" selected>None</option>\n                                        <option value=\"floydSteinberg\">Floyd-Steinberg</option>\n                                        <option value=\"sierra\">Sierra (Best Quality)</option>\n                                        <option value=\"ordered\">Ordered (Bayer)</option>\n                                    </select>\n                                </div>\n                                \n                                <div class=\"control-group\">\n                                    <label for=\"paletteSelection\">Palette:</label>\n                                    <select id=\"paletteSelection\">\n                                        <option value=\"default\" selected>Default Palette</option>\n                                        <option value=\"grayscale\">Grayscale</option>\n                                        <option value=\"loaded\">Loaded Palette</option>\n                                    </select>\n                                    <button id=\"loadPaletteForConversion\" style=\"margin-left: 5px;\">Load...</button>\n                                </div>\n                                \n                                <div class=\"control-group\" id=\"conversionPaletteInfo\" style=\"font-size: 0.9em; color: var(--vscode-descriptionForeground);\">\n                                    Using default palette\n                                </div>\n                                \n                                <div class=\"control-group\" style=\"margin-top: 20px;\">\n                                    <button id=\"previewConversionButton\">Preview Conversion</button>\n                                    <button id=\"applyConversionButton\" style=\"margin-left: 10px;\">Convert & Save</button>\n                                </div>\n                            </div>\n                            \n                            <!-- Right side - Preview -->\n                            <div style=\"flex: 1; min-width: 300px;\">\n                                <h3>Preview</h3>\n                                <div style=\"border: 1px solid var(--vscode-editorWidget-border); overflow: auto; max-height: 350px; display: flex; justify-content: center; align-items: center; background-color: var(--vscode-editor-background);\">\n                                    <canvas id=\"conversionPreviewCanvas\"></canvas>\n                                </div>\n                                <div id=\"conversionPreviewInfo\" style=\"margin-top: 10px; font-size: 0.9em; color: var(--vscode-descriptionForeground);\">\n                                    Adjust options and click \"Preview Conversion\" to see the result.\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n                \n                <script nonce=\"").concat(nonce, "\" src=\"").concat(scriptUri, "\"></script>\n            </body>\n            </html>");
    };
    // Utility functions for color conversion
    SpriteImporterProvider.prototype.hexTo8bitRgb = function (hex) {
        // Convert hex color (#RRGGBB) to 8-bit RGB
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return { r: r, g: g, b: b };
    };
    SpriteImporterProvider.prototype.hexToRgb9 = function (hex) {
        // Convert hex color (#RRGGBB) to 9-bit RGB (3-3-3)
        var hexClean = hex.startsWith('#') ? hex.substring(1) : hex;
        if (hexClean.length !== 6) {
            return { r9: 0, g9: 0, b9: 0 };
        } // Invalid format
        // Parse hex to 8-bit RGB
        var r8 = parseInt(hexClean.substring(0, 2), 16);
        var g8 = parseInt(hexClean.substring(2, 4), 16);
        var b8 = parseInt(hexClean.substring(4, 6), 16);
        // Use findClosest3BitValue to get 3-bit RGB values (ZX Next's 9-bit color space)
        var r9 = this.findClosest3BitValue(r8);
        var g9 = this.findClosest3BitValue(g8);
        var b9 = this.findClosest3BitValue(b8);
        return { r9: r9, g9: g9, b9: b9 };
    };
    SpriteImporterProvider.prototype.rgb9ToBytes = function (r9, g9, b9) {
        // Convert 9-bit RGB (3-3-3) to ZX Next palette format (2 bytes)
        // Format: RRRGGGBB P000000B
        // First byte: RRRGGGBB - top 3 bits of red, 3 bits of green, high 2 bits of blue
        // Second byte: P000000B - priority flag (0) and low bit of blue
        // Ensure inputs are within 0-7 range
        var r3 = Math.min(7, Math.max(0, r9));
        var g3 = Math.min(7, Math.max(0, g9));
        var b3 = Math.min(7, Math.max(0, b9));
        // Extract components
        var rrr = r3 & 0x07;
        var ggg = g3 & 0x07;
        var bb_high = (b3 >> 1) & 0x03; // High 2 bits of blue (bits 1-2)
        var b_low = b3 & 0x01; // Low bit of blue (bit 0)
        // Construct bytes in ZX Next format
        var byte1 = (rrr << 5) | (ggg << 2) | bb_high; // RRRGGGBB
        var byte2 = b_low << 1; // 0000000B (no priority)
        return [byte1, byte2];
    };
    // Helper to find closest 3-bit value (0-7) for an 8-bit value (0-255) using ZX Next mapping
    SpriteImporterProvider.prototype.findClosest3BitValue = function (value8bit) {
        // ZX Next RGB mapping: specific mapping from 3-bit (0-7) to 8-bit (0-255) 
        var rgb3to8Map = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
        var closestValue = 0;
        var minDifference = Infinity;
        for (var i = 0; i < rgb3to8Map.length; i++) {
            var difference = Math.abs(value8bit - rgb3to8Map[i]);
            if (difference < minDifference) {
                minDifference = difference;
                closestValue = i;
            }
        }
        return closestValue;
    };
    // Add a new method for better perceptual color matching
    SpriteImporterProvider.prototype.findClosestPerceptualColorIndex = function (r, g, b, palette) {
        // Convert input RGB directly to ZX Next's 3-bit-per-channel space (9-bit total)
        var r3bit = Math.min(7, Math.max(0, Math.round(r * 7 / 255)));
        var g3bit = Math.min(7, Math.max(0, Math.round(g * 7 / 255)));
        var b3bit = Math.min(7, Math.max(0, Math.round(b * 7 / 255)));
        // Use ZX Next's specific mapping to get the actual colors it can produce
        var mappedR = RGB3_TO_8_MAP[r3bit];
        var mappedG = RGB3_TO_8_MAP[g3bit];
        var mappedB = RGB3_TO_8_MAP[b3bit];
        // Calculate in LAB space for better perceptual matching
        var labInput = this.rgbToLab(mappedR, mappedG, mappedB);
        var minDistance = Infinity;
        var closestIndex = 0;
        for (var i = 0; i < palette.length; i++) {
            var palColor = palette[i];
            // Convert palette color to 3-bit space (0-7 for each component)
            var pr3bit = Math.min(7, Math.max(0, Math.round(palColor.r * 7 / 255)));
            var pg3bit = Math.min(7, Math.max(0, Math.round(palColor.g * 7 / 255)));
            var pb3bit = Math.min(7, Math.max(0, Math.round(palColor.b * 7 / 255)));
            // Use the actual hardware RGB values (more accurate)
            var mappedPR = RGB3_TO_8_MAP[pr3bit];
            var mappedPG = RGB3_TO_8_MAP[pg3bit];
            var mappedPB = RGB3_TO_8_MAP[pb3bit];
            // Calculate in LAB space
            var labPalette = this.rgbToLab(mappedPR, mappedPG, mappedPB);
            // Use CIEDE2000 color difference (better than Euclidean)
            var distance = this.deltaE2000(labInput, labPalette);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
                // Optimization: if very close match found, return immediately
                if (minDistance < 0.1) {
                    break;
                }
            }
        }
        return closestIndex;
    };
    // Helper function to convert RGB to XYZ color space
    SpriteImporterProvider.prototype.rgbToXyz = function (r, g, b) {
        // Normalize RGB values based on ZX Next's 9-bit color space
        // First convert to 0-7 range for each component
        var r3bit = Math.min(7, Math.max(0, Math.round(r * 7 / 255)));
        var g3bit = Math.min(7, Math.max(0, Math.round(g * 7 / 255)));
        var b3bit = Math.min(7, Math.max(0, Math.round(b * 7 / 255)));
        // Then convert back to 0-255 using ZX Next's specific mapping
        // This ensures we're working in the actual color space of the hardware
        var rMapped = Math.round(r3bit * 255 / 7);
        var gMapped = Math.round(g3bit * 255 / 7);
        var bMapped = Math.round(b3bit * 255 / 7);
        // Now normalize to 0-1 range for XYZ conversion
        var rNorm = rMapped / 255;
        var gNorm = gMapped / 255;
        var bNorm = bMapped / 255;
        // Apply gamma correction
        rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
        gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
        bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
        // Scale
        rNorm *= 100;
        gNorm *= 100;
        bNorm *= 100;
        // Convert to XYZ
        var x = rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805;
        var y = rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722;
        var z = rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505;
        return { x: x, y: y, z: z };
    };
    // Helper function to convert XYZ to LAB color space
    SpriteImporterProvider.prototype.xyzToLab = function (x, y, z) {
        // Using D65 reference white
        var xRef = 95.047;
        var yRef = 100.0;
        var zRef = 108.883;
        var xNorm = x / xRef;
        var yNorm = y / yRef;
        var zNorm = z / zRef;
        xNorm = xNorm > 0.008856 ? Math.pow(xNorm, 1 / 3) : (7.787 * xNorm) + (16 / 116);
        yNorm = yNorm > 0.008856 ? Math.pow(yNorm, 1 / 3) : (7.787 * yNorm) + (16 / 116);
        zNorm = zNorm > 0.008856 ? Math.pow(zNorm, 1 / 3) : (7.787 * zNorm) + (16 / 116);
        var l = (116 * yNorm) - 16;
        var a = 500 * (xNorm - yNorm);
        var b = 200 * (yNorm - zNorm);
        return { l: l, a: a, b: b };
    };
    // Convert RGB to LAB directly
    SpriteImporterProvider.prototype.rgbToLab = function (r, g, b) {
        var xyz = this.rgbToXyz(r, g, b);
        return this.xyzToLab(xyz.x, xyz.y, xyz.z);
    };
    // CIEDE2000 color difference formula (simplified version)
    SpriteImporterProvider.prototype.deltaE2000 = function (lab1, lab2) {
        // Calculate differences
        var deltaL = lab2.l - lab1.l;
        var deltaA = lab2.a - lab1.a;
        var deltaB = lab2.b - lab1.b;
        // Calculate CIEDE2000 (simplified)
        var C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
        var C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
        var deltaC = C2 - C1;
        var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
        deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
        // Weighting factors
        var kL = 1.0;
        var kC = 1.0;
        var kH = 1.0;
        // Compute the final color difference
        var L_term = Math.pow((deltaL / kL), 2);
        var C_term = Math.pow((deltaC / kC), 2);
        var H_term = Math.pow((deltaH / kH), 2);
        return Math.sqrt(L_term + C_term + H_term);
    };
    SpriteImporterProvider.viewType = 'nextbuild-viewers.spriteImporter';
    SpriteImporterProvider.title = 'Sprite Importer';
    return SpriteImporterProvider;
}());
exports.SpriteImporterProvider = SpriteImporterProvider;
// Helper to convert hex to {r,g,b} 0-255
function hexTo8bitRgb(hex) {
    hex = hex.startsWith('#') ? hex.slice(1) : hex;
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r: r, g: g, b: b };
}
