"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHTML = exports.isDocumentFragment = exports.isText = exports.isElement = exports.isNode = exports.isInlineJavaScriptElement = exports.isTemplateElement = exports.stableChildNodesOf = exports.childNodesOf = exports.appendChild = exports.createTextNode = exports.createElement = exports.createDocumentFragment = exports.parse = void 0;
const jsdom_1 = require("jsdom");
const is_iterable_1 = require("util/is_iterable");
const desensitize_1 = require("./desensitize");
const expand_self_closing_1 = require("./expand_self_closing");
const sharedAPI = new jsdom_1.JSDOM("", { contentType: "text/html" }).window.document;
function parse(source) {
    const template = sharedAPI.createElement("template");
    template.innerHTML = (0, expand_self_closing_1.expandSelfClosing)((0, desensitize_1.desensitizeHTML)(source));
    return template.content;
}
exports.parse = parse;
exports.createDocumentFragment = exportAPI(sharedAPI.createDocumentFragment);
exports.createElement = exportAPI(sharedAPI.createElement);
exports.createTextNode = exportAPI(sharedAPI.createTextNode);
function appendChild(parent, child) {
    if (isTemplateElement(parent)) {
        return parent.content.appendChild(child);
    }
    return parent.appendChild(child);
}
exports.appendChild = appendChild;
function childNodesOf(parent) {
    if (isTemplateElement(parent)) {
        return parent.content.childNodes;
    }
    return parent.childNodes;
}
exports.childNodesOf = childNodesOf;
// Non-live node list
function stableChildNodesOf(parent) {
    // just clone array lol
    return Array.from(childNodesOf(parent));
}
exports.stableChildNodesOf = stableChildNodesOf;
function isTemplateElement(node) {
    return isElement(node) && node.tagName.toLowerCase() === "template";
}
exports.isTemplateElement = isTemplateElement;
function isInlineJavaScriptElement(node) {
    if (!isElement(node))
        return false;
    const src = node.getAttribute("src");
    const type = node.getAttribute("type");
    return (node.tagName.toLowerCase() == "script" &&
        ((!type && !src) || type === "text/javascript"));
}
exports.isInlineJavaScriptElement = isInlineJavaScriptElement;
function isNode(node) {
    return typeof node?.nodeType === "number";
}
exports.isNode = isNode;
function isElement(node) {
    return (node?.nodeType != undefined &&
        node.nodeType === node.ELEMENT_NODE);
}
exports.isElement = isElement;
function isText(node) {
    return (node?.nodeType != undefined &&
        node.nodeType === node.TEXT_NODE);
}
exports.isText = isText;
function isDocumentFragment(node) {
    return (node?.nodeType != undefined &&
        node.nodeType === node.DOCUMENT_FRAGMENT_NODE);
}
exports.isDocumentFragment = isDocumentFragment;
function toHTML(nodes, trim = true) {
    let html = "";
    if (isDocumentFragment(nodes)) {
        return toHTML(childNodesOf(nodes), trim);
    }
    else if ((0, is_iterable_1.isIterable)(nodes)) {
        for (const item of nodes) {
            html += toHTML(item, false);
        }
    }
    else {
        html = isElement(nodes)
            ? (0, desensitize_1.undesensitizeHTML)(nodes.outerHTML)
            : nodes.textContent ?? "";
    }
    return trim ? html.trim() : html;
}
exports.toHTML = toHTML;
function exportAPI(func) {
    return func.bind(sharedAPI);
}
