"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfigFromPackageJson = exports.getPackageJson = void 0;
const vscode_1 = require("vscode");
const getPackageJson = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        const cwd = vscode_1.workspace.rootPath;
        try {
            const packageJson = require(`${cwd}/package.json`);
            resolve(packageJson);
        }
        catch (e) {
            resolve(undefined);
        }
    });
});
exports.getPackageJson = getPackageJson;
const buildConfigFromPackageJson = (defaultColor) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = yield (0, exports.getPackageJson)();
    if (!pkg) {
        return [];
    }
    const { scripts } = pkg;
    return Object.keys(scripts).map(key => ({
        command: `npm run ${key}`,
        color: defaultColor || 'white',
        name: key,
        singleInstance: true
    }));
});
exports.buildConfigFromPackageJson = buildConfigFromPackageJson;
//# sourceMappingURL=packageJson.js.map