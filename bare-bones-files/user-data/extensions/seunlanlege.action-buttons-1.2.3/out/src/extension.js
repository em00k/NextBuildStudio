'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const init_1 = require("./init");
function activate(context) {
    (0, init_1.default)(context);
    let disposable = vscode.commands.registerCommand('extension.refreshButtons', () => (0, init_1.default)(context));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map