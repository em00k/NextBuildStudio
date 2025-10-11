"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewHtml = getWebviewHtml;
var vscode = require("vscode");
var fs = require("fs");
var mapWebviewLogic_1 = require("./mapWebviewLogic");
function getNonce() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getWebviewHtml(webview, context, blockMapData, spriteData, blockFileName, spriteFileName, viewState, customPalette, customPaletteName, defaultPalette) {
    var _a, _b;
    var webviewUri = function (relativePath) {
        return webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', relativePath));
    };
    var scriptUri = webviewUri('blockWebview.js');
    var mapRendererScriptUri = webviewUri('mapRenderer.js');
    var blockListRendererScriptUri = webviewUri('blockListRenderer.js');
    var cssUri = webviewUri('blockWebview.css');
    var nonce = getNonce();
    var htmlTemplateUri = vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'blockWebview.html');
    var htmlTemplatePath = htmlTemplateUri.fsPath;
    var html = fs.readFileSync(htmlTemplatePath, 'utf8');
    html = html.replace(/{{cspSource}}/g, webview.cspSource);
    html = html.replace('{{nonce}}', nonce);
    html = html.replace('{{cssUri}}', cssUri.toString());
    var initialState = {
        blockData: blockMapData,
        spriteData: spriteData,
        viewState: viewState,
        customPalette: customPalette,
        customPaletteName: customPaletteName,
        defaultPalette: defaultPalette
    };
    var initialStateHtml = "\n        <script nonce=\"".concat(nonce, "\">\n            const vscode = acquireVsCodeApi();\n            const initialState = ").concat(JSON.stringify(initialState), ";\n            const isMapMode = ").concat(JSON.stringify(blockMapData.isMapFile), ";\n        </script>\n        <script nonce=\"").concat(nonce, "\" src=\"").concat(mapRendererScriptUri, "\"></script>\n        <script nonce=\"").concat(nonce, "\" src=\"").concat(blockListRendererScriptUri, "\"></script>\n    ");
    html = html.replace('<!-- INITIAL_STATE_AND_RENDERER_SCRIPTS -->', initialStateHtml);
    html = html.replace('{{scriptUri}}', scriptUri.toString());
    // --- Inject :root styles --- 
    var defaultSpriteWidth = 16;
    var defaultSpriteHeight = 16;
    var rootStyleContent = "\n        :root {\n            --sprite-width: ".concat((_a = spriteData === null || spriteData === void 0 ? void 0 : spriteData.width) !== null && _a !== void 0 ? _a : defaultSpriteWidth, ";\n            --sprite-height: ").concat((_b = spriteData === null || spriteData === void 0 ? void 0 : spriteData.height) !== null && _b !== void 0 ? _b : defaultSpriteHeight, ";\n            --sprite-scale: ").concat(viewState.scale, ";\n        }\n    ");
    // Find the closing </head> tag
    var headEndTag = '</head>';
    var headEndIndex = html.indexOf(headEndTag);
    if (headEndIndex >= 0) {
        // Inject the new style tag *before* the closing </head> tag
        var styleTag = "\n<style nonce=\"".concat(nonce, "\">").concat(rootStyleContent, "</style>\n");
        html = html.slice(0, headEndIndex) + styleTag + html.slice(headEndIndex);
        console.log("[getWebviewHtml] Successfully injected :root styles into head.");
    }
    else {
        console.error("[getWebviewHtml] Could not find </head> tag to inject :root variables.");
    }
    // --- End Inject :root styles --- 
    var title = "ZX Next ".concat(blockMapData.isMapFile ? 'Map' : 'Block', " Viewer");
    html = html.replace('<!-- TITLE -->', title);
    var blockTypeDescription = blockMapData.isMapFile
        ? "Map (".concat(viewState.mapWidth, "x").concat(viewState.mapHeight, " tiles)")
        : "Blocks (".concat(blockMapData.blocks.length, " defined)");
    var spriteTypeDescription = spriteData ? "".concat(spriteData.width, "x").concat(spriteData.height, " ").concat(viewState.spriteMode) : 'No Sprite Data';
    // Simple file info section - direct HTML
    var fileInfoHtml = "<strong>".concat(blockMapData.isMapFile ? 'Map' : 'Block', " File:</strong> ").concat(blockFileName, " (").concat(blockTypeDescription, ")<br>\n        <strong>Sprite File:</strong> ").concat(spriteFileName, " ").concat(spriteData ? "(".concat(spriteTypeDescription, ")") : '', "<br>\n        <strong>Palette:</strong> ").concat(customPaletteName || 'Default', "\n        ").concat(spriteData && ('paletteOffset' in spriteData || ['sprite4', 'tile8x8', 'font8x8'].includes(viewState.spriteMode)) ? "| Palette Offset: ".concat(viewState.paletteOffset) : '');
    html = html.replace('<!-- FILE_INFO -->', fileInfoHtml);
    var generateBlockToolbarControlsHtml = function (viewState) {
        var blockWidthValue = viewState.blockWidth || 1;
        var blockHeightValue = viewState.blockHeight || 1;
        return "\n           <div class=\"control-group\">\n               <label for=\"blockWidth\">Block Width:</label>\n               <input type=\"number\" id=\"blockWidth\" min=\"1\" max=\"32\" value=\"".concat(blockWidthValue, "\">\n           </div>\n            <div class=\"control-group\">\n               <label for=\"blockHeight\">Block Height:</label>\n               <input type=\"number\" id=\"blockHeight\" min=\"1\" max=\"32\" value=\"").concat(blockHeightValue, "\">\n           </div>\n           ");
    };
    // Generate the toolbar HTML directly
    var toolbarHtml = generateToolbarHtml(viewState, customPaletteName, blockMapData.isMapFile, !!spriteData, generateBlockToolbarControlsHtml);
    html = html.replace('<!-- TOOLBAR_CONTENT -->', toolbarHtml);
    var contentAreaHtml = '';
    if (blockMapData.isMapFile) {
        contentAreaHtml = (0, mapWebviewLogic_1.generateMapCanvasHtml)();
        console.log("[getWebviewHtml] Generated map canvas HTML for map file mode.");
    }
    else {
        contentAreaHtml = "<div id=\"block-list-container\">\n                               <canvas id=\"blockListCanvas\"></canvas>\n                           </div>";
        console.log("[getWebviewHtml] Generated block list HTML for block file mode.");
    }
    html = html.replace('<!-- CONTENT_AREA -->', contentAreaHtml);
    // Simple toggle functionality script
    var toggleScript = "\n        <script nonce=\"".concat(nonce, "\">\n            function toggleSection(id) {\n                const section = document.getElementById(id);\n                if (section) {\n                    if (section.style.display === 'none') {\n                        section.style.display = 'flex';\n                        event.currentTarget.textContent = '\u25BC';\n                    } else {\n                        section.style.display = 'none';\n                        event.currentTarget.textContent = '\u25B6';\n                    }\n                }\n            }\n        </script>\n    ");
    // Insert toggle script before the closing </body> tag
    var bodyEndTag = '</body>';
    var bodyEndIndex = html.indexOf(bodyEndTag);
    if (bodyEndIndex >= 0) {
        html = html.slice(0, bodyEndIndex) + toggleScript + html.slice(bodyEndIndex);
        console.log("[getWebviewHtml] Successfully injected toggle script before body end tag.");
    }
    else {
        console.error("[getWebviewHtml] Could not find </body> tag to inject toggle script.");
        // Append it to the end as a fallback
        html += toggleScript;
    }
    return html;
}
function generateToolbarHtml(viewState, customPaletteName, isMapFile, hasSpriteData, generateBlockControlsFunc) {
    var scale = viewState.scale;
    var paletteStatusText = customPaletteName ? "Using: ".concat(customPaletteName) : 'Using: Default';
    var spriteControlsDisabled = !hasSpriteData;
    var mapControlsHtml = isMapFile ? (0, mapWebviewLogic_1.generateMapToolbarControlsHtml)(viewState) : '';
    var blockControlsHtml = !isMapFile ? generateBlockControlsFunc(viewState) : '';
    return "\n        <div class=\"control-group\">\n            <label for=\"spriteMode\">Sprite Mode:</label>\n            <select id=\"spriteMode\" ".concat(spriteControlsDisabled ? 'disabled' : '', ">\n                <option value=\"sprite8\" ").concat(viewState.spriteMode === 'sprite8' ? 'selected' : '', ">8-bit Sprites (16x16)</option>\n                <option value=\"sprite4\" ").concat(viewState.spriteMode === 'sprite4' ? 'selected' : '', ">4-bit Sprites (16x16)</option>\n                <option value=\"font8x8\" ").concat(viewState.spriteMode === 'font8x8' ? 'selected' : '', ">8x8 Font</option>\n                <option value=\"tile8x8\" ").concat(viewState.spriteMode === 'tile8x8' ? 'selected' : '', ">8x8 Tiles</option>\n            </select>\n        </div>\n        <div class=\"control-group\">\n            <label for=\"paletteOffset\">Offset:</label>\n            <input type=\"number\" id=\"paletteOffset\" min=\"0\" max=\"240\" step=\"16\" value=\"").concat(viewState.paletteOffset, "\" ").concat(spriteControlsDisabled || !['sprite4', 'tile8x8', 'font8x8'].includes(viewState.spriteMode) ? 'disabled' : '', ">\n        </div>\n        <div class=\"control-group\">\n            <label for=\"scaleSlider\">Scale:</label>\n            <input type=\"range\" id=\"scaleSlider\" min=\"1\" max=\"8\" value=\"").concat(scale, "\">\n            <span id=\"scaleValue\">").concat(scale, "x</span>\n        </div>\n        <div class=\"control-group\">\n            <label><input type=\"checkbox\" id=\"showGrid\" ").concat(viewState.showGrid ? 'checked' : '', "> Grid</label>\n        </div>\n        ").concat(mapControlsHtml, "\n        ").concat(blockControlsHtml, "\n        <div class=\"control-group\">\n            <button id=\"loadPalette\">Load Palette</button>\n            <button id=\"useDefaultPalette\">Default</button>\n            <span id=\"paletteStatus\" title=\"").concat(customPaletteName || '', "\">").concat(paletteStatusText, "</span>\n        </div>\n        <div class=\"control-group\">\n            <button id=\"loadSpriteFile\">Load Sprites</button>\n            <button id=\"reloadSpriteButton\" ").concat(!hasSpriteData ? 'disabled' : '', ">Reload</button>\n            <button id=\"saveChangesButton\" ").concat(viewState.isDirty ? '' : 'disabled', ">Save</button>\n        </div>\n        <div class=\"control-group\">\n            <button id=\"analyzeSpritesDuplicatesButton\" ").concat(!hasSpriteData ? 'disabled' : '', ">Analyze Duplicates</button>\n        </div>\n    ");
}
