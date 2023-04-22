"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const glob_1 = __importDefault(require("glob"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const renderer_1 = require("renderer/renderer");
const log_1 = require("util/log");
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename));
// dirName -> componentName -> Component
const componentDir = new Map();
const stubs = glob_1.default
    .sync(node_path_1.default.resolve(__dirname, "**/*.html"))
    .map((filePath) => {
    const dirName = node_path_1.default.relative(__dirname, node_path_1.default.dirname(filePath));
    const fileName = node_path_1.default.basename(filePath, ".html");
    const sourceText = (0, node_fs_1.readFileSync)(filePath).toString();
    // quick parse only
    const expectTag = sourceText.match(/^(<expect\s*(?:\s+\w+(?:\s*=\s*\S+)?)*>)/gm)?.[0];
    // defer full compilation for when test is run
    let cache;
    const compiled = () => {
        if (!cache) {
            cache = compileExample(filePath);
            logger.debug(`Compiled component in ${dirName}: ${fileName}`);
        }
        return cache;
    };
    return {
        fileName,
        dirName,
        filePath,
        expectTag,
        compiled,
    };
});
for (const stub of stubs) {
    let componentMap = componentDir.get(stub.dirName);
    if (!componentMap)
        componentDir.set(stub.dirName, (componentMap = new Map()));
    componentMap.set(stub.fileName, () => stub.compiled().component);
    logger.debug(`Loaded stub in ${stub.dirName}: ${stub.fileName}`);
    const isIndexHtml = stub.filePath.endsWith("/index.html");
    if (isIndexHtml && !stub.expectTag) {
        logger.warn("Example has no <expect>:", node_path_1.default.relative(__dirname, stub.filePath));
    }
}
describe("Examples", () => {
    for (const stub of stubs) {
        const isIndexHtml = stub.filePath.endsWith("/index.html");
        if (!stub.expectTag)
            continue;
        const testName = isIndexHtml
            ? stub.dirName
            : `${stub.dirName} ${stub.fileName}`;
        const skip = !!stub.expectTag.match(/\bskip\b/);
        const testFunc = skip ? test.skip : test;
        testFunc(testName, async () => {
            const example = stub.compiled();
            if (!hasExpectation(example))
                return;
            const { component, expected } = example;
            const renderer = new renderer_1.Renderer(compiledComponentDir(componentDir.get(stub.dirName)));
            const output = await renderer.render(component);
            expect((0, dom_1.toHTML)(output).trim()).toBe((0, dom_1.toHTML)(expected).trim());
        });
    }
});
function compileExample(filePath) {
    const sourceText = (0, node_fs_1.readFileSync)(filePath);
    const fragment = (0, dom_1.parse)(sourceText.toString());
    const sourceNodes = Array.from((0, dom_1.childNodesOf)(fragment));
    let expected = undefined;
    let skip = undefined;
    for (let i = sourceNodes.length - 1; i--; i >= 0) {
        const node = sourceNodes[i];
        if ((0, dom_1.isElement)(node) && node.tagName.toLowerCase() === "expect") {
            if (expected)
                throw new Error("Only one <expect> is expected.");
            expected = extractExpectedNodes(node);
            skip = node.hasAttribute("skip");
            node.remove();
            sourceNodes.splice(i, 1);
        }
    }
    const component = (0, compiler_1.compile)(node_path_1.default.basename(filePath, ".html"), filePath, (0, dom_1.toHTML)(sourceNodes));
    return {
        component,
        expected,
        skip,
    };
}
function extractExpectedNodes(expectedElement) {
    const children = Array.from((0, dom_1.childNodesOf)(expectedElement));
    if (!children.length)
        return [];
    // immediate child element, assume one-liner, no indent
    if (!(0, dom_1.isText)(children[0]))
        return children;
    // detect indentation
    const indentation = /^([ \t]+)/gm.exec(children[0].textContent ?? "")?.[1] ?? "";
    const indentRegExp = new RegExp("^" + indentation, "gm");
    return children.map((node) => deindent(node, indentRegExp, false));
}
function deindent(node, indentRegExp, mutate) {
    const deindented = mutate ? node : node.cloneNode(true);
    if ((0, dom_1.isText)(node)) {
        deindented.textContent =
            node.textContent?.replace(indentRegExp, "") ?? null;
    }
    else {
        for (const child of (0, dom_1.childNodesOf)(deindented)) {
            deindent(child, indentRegExp, true);
        }
    }
    return deindented;
}
function hasExpectation(example) {
    return example.expected != undefined;
}
function compiledComponentDir(componentDir) {
    return new Map(Array.from(componentDir.entries()).map(([name, getComponent]) => [
        name,
        getComponent(),
    ]));
}
