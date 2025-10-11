
// --- Copied from paletteUtils.ts for local default palette generation ---
const rgb3to8Map = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];

// --- Helper Functions (9-bit color conversions) - RESTORED
function val9bitTo8bit(val9) {
  //return Math.round((val9 / 7) * 255);
  const Clamped = Math.max(0, Math.min(7, Math.round(val9)));
  return rgb3to8Map[Clamped];

}

function val8bitTo9bit(val8) {
  return Math.round((val8 / 256) * 7);
}
// copyied from paletteWebview.js
function hexToRgb9(hex) {
    hex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r8 = parseInt(hex.substring(0, 2), 16);
    const g8 = parseInt(hex.substring(2, 4), 16);
    const b8 = parseInt(hex.substring(4, 6), 16);
    return {
        r9: val8bitTo9bit(r8),
        g9: val8bitTo9bit(g8),
        b9: val8bitTo9bit(b8)
    };
}

function rgb9ToHex(r9, g9, b9) {
    const r8 = val9bitTo8bit(r9);
    const g8 = val9bitTo8bit(g9);
    const b8 = val9bitTo8bit(b9);
    return `#${r8.toString(16).padStart(2, '0')}${g8.toString(16).padStart(2, '0')}${b8.toString(16).padStart(2, '0')}`;
}

function rgb9ToBytes(r9, g9, b9) {
    r9 = Math.max(0, Math.min(7, Math.round(r9)));
    g9 = Math.max(0, Math.min(7, Math.round(g9)));
    b9 = Math.max(0, Math.min(7, Math.round(b9)));
    const byte1 = (r9 << 5) | (g9 << 2) | (b9 >> 1);
    const byte2 = (b9 & 0x01);
    return { byte1, byte2 };
}

function bytesToRgb9(byte1, byte2) {
    const r9 = (byte1 & 0xE0) >> 5;
    const g9 = (byte1 & 0x1C) >> 2;
    const b9 = ((byte1 & 0x03) << 1) | (byte2 & 0x01);
    return { r9, g9, b9 };
}

function rgbStringToHex(rgbString) {
  if (!rgbString || typeof rgbString !== 'string') return '#000000'; // Default for empty or non-string input
  
  // If it's already a hex color
  if (rgbString.startsWith('#')) {
    return rgbString.length === 7 ? rgbString : '#000000';
  }
  
  // Handle rgb(r,g,b) format
  if (rgbString.startsWith('rgb')) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    
    try {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      
      // Validate RGB values are in range
      if (isNaN(r) || isNaN(g) || isNaN(b) || 
          r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        return '#000000';
      }
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
      console.error("Error parsing RGB string:", e);
      return '#000000';
    }
  }
  
  // If format is unrecognized, return black
  return '#000000';
}

function localRgb9ToHex(r9, g9, b9) { // Renamed to avoid conflict if utils were ever bundled
    const rClamped = Math.max(0, Math.min(7, Math.round(r9)));
    const gClamped = Math.max(0, Math.min(7, Math.round(g9)));
    const bClamped = Math.max(0, Math.min(7, Math.round(b9)));
    const r = rgb3to8Map[rClamped];
    const g = rgb3to8Map[gClamped];
    const b = rgb3to8Map[bClamped];
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`;
}
// RRRGGGBB 
function localGenerateDefaultPalette() { // Renamed
    const palette = [];
    for (let i = 0; i < 256; i++) {
        const rrr = (i >> 5) & 0b111;
        const ggg = (i >> 2) & 0b111;
        const bbb = ((i & 0x03) << 1) | ((i & 0x03) > 0 ? 1 : 0);
        const hex = localRgb9ToHex(rrr, ggg, bbb);
        palette.push({ hex, priority: false }); // Create PaletteColor objects
    }
    return palette;
}
// --- End copied functions ---