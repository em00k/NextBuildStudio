"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
function activate() {
    const statusBar = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
    statusBar.text = `Reload`;
    statusBar.command = `workbench.action.reloadWindow`;
    statusBar.tooltip = `Reload window`;
    statusBar.show();
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map