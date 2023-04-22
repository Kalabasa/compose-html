"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVM = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_vm_1 = require("node:vm");
function createVM(component, context, jsContext) {
    const fullJsContext = (0, node_vm_1.createContext)({
        require: wrapRequire(require, component.filePath),
        console,
        process: { env: process.env },
        url: makeURLFunc(context, component.filePath),
        __rootDir: context.rootDir,
        __outputDir: context.outputDir,
        ...jsContext,
    });
    const runCode = (code) => (0, node_vm_1.runInContext)(code, fullJsContext, { filename: component.filePath });
    return { runCode };
}
exports.createVM = createVM;
function wrapRequire(require, filePath) {
    const wrappedRequire = (id) => {
        if (id.startsWith(".")) {
            id = node_path_1.default.resolve(node_path_1.default.dirname(filePath), id);
        }
        return require(id);
    };
    const newRequire = Object.assign(wrappedRequire, require);
    return newRequire;
}
// todo: unit test this
function makeURLFunc(context, componentFilePath) {
    return (localUrlPath) => {
        const filePath = node_path_1.default.resolve(node_path_1.default.dirname(componentFilePath), localUrlPath);
        const siteUrlPath = node_path_1.default.relative(context.rootDir, filePath);
        return node_path_1.default.join("/", siteUrlPath);
    };
}
