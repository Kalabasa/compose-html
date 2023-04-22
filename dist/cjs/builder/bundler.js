"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractScriptBundles = void 0;
const dom_1 = require("dom/dom");
function extractScriptBundles(pages) {
    // todo
    return [];
}
exports.extractScriptBundles = extractScriptBundles;
function* findScripts(nodes) {
    for (const node of nodes) {
        if ((0, dom_1.isInlineJavaScriptElement)(node))
            yield node;
        yield* findScripts(node.childNodes);
    }
}
function commonBundleName(rename) {
    return `common${rename ? rename : ""}.js`;
}
