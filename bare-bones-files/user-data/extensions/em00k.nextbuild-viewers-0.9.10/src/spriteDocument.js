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
exports.SpriteDocument = void 0;
const vscode = __importStar(require("vscode"));
const spriteDataHandler_1 = require("./spriteDataHandler");
// Wrapper class implementing CustomDocument for Sprites
class SpriteDocument {
    _state;
    constructor(state) {
        this._state = state;
    }
    get uri() { return this._state.uri; }
    get state() { return this._state; }
    // Helper to get the bytes to be saved/backed up
    get documentData() {
        if (this._state.currentSpriteData) {
            try {
                // Re-encode the current sprite data state
                return (0, spriteDataHandler_1.encodeSpriteData)(this._state.currentSpriteData);
            }
            catch (e) {
                console.error("Error encoding sprite data for save:", e);
                // Fallback to initial data on encoding error?
                vscode.window.showErrorMessage("Failed to encode sprite data for saving. Reverting to original data might occur.");
                return this._state.initialFileData;
            }
        }
        // If no parsed data, return initial bytes
        return this._state.initialFileData;
    }
    dispose() {
        console.log("Disposing sprite document:", this.uri.toString());
        // Add any specific sprite document cleanup if needed
    }
}
exports.SpriteDocument = SpriteDocument;
//# sourceMappingURL=spriteDocument.js.map