"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockDocument = void 0;
// Wrapper class implementing CustomDocument
class BlockDocument {
    _state;
    constructor(state) {
        this._state = state;
    }
    get uri() { return this._state.uri; }
    get state() { return this._state; }
    // Return the raw byte data for saving/backup
    get documentData() {
        // For maps, reconstruct the byte array from indices if necessary
        if (this._state.isMapFile && this._state.mapIndices) {
            const expectedSize = (this._state.mapWidth ?? 0) * (this._state.mapHeight ?? 0);
            const mapData = new Uint8Array(expectedSize);
            const indicesLength = this._state.mapIndices.length;
            for (let i = 0; i < expectedSize; i++) {
                mapData[i] = (i < indicesLength) ? (this._state.mapIndices[i] ?? 0) : 0;
            }
            return mapData;
        }
        // For blocks or if map indices are missing, return the stored bytes
        return this._state.blockDataBytes;
    }
    dispose() {
        console.log("Disposing document:", this.uri.toString());
        // Provider should handle removing from its map if necessary
    }
}
exports.BlockDocument = BlockDocument;
//# sourceMappingURL=blockDocument.js.map