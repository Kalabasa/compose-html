"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawHTMLTag = exports.rawHTML = exports.isRawHTML = exports.rawHTMLSymbol = void 0;
const dom_1 = require("dom/dom");
const is_iterable_1 = require("util/is_iterable");
exports.rawHTMLSymbol = Symbol("rawHTML");
function isRawHTML(thing) {
    return typeof thing === "object" && exports.rawHTMLSymbol in thing;
}
exports.isRawHTML = isRawHTML;
function rawHTML(html) {
    return { [exports.rawHTMLSymbol]: true, html: html };
}
exports.rawHTML = rawHTML;
async function rawHTMLTag(segments, ...expressions) {
    const parts = [];
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i + 1 === segments.length) {
            parts.push(segment);
        }
        else {
            parts.push(segment, await stringifyHTMLTagExpression(expressions[i]));
        }
    }
    return rawHTML(parts.join(""));
}
exports.rawHTMLTag = rawHTMLTag;
async function stringifyHTMLTagExpression(expression) {
    if (expression != null)
        expression = await expression;
    if (expression == null)
        return "";
    if (typeof expression === "string" || expression instanceof String) {
        return String(expression);
    }
    else if ((0, dom_1.isElement)(expression)) {
        return expression.outerHTML;
    }
    else if ((0, dom_1.isText)(expression)) {
        return expression.textContent ?? "";
    }
    else if ((0, is_iterable_1.isIterable)(expression)) {
        let joined = "";
        for (const item of expression) {
            joined += await stringifyHTMLTagExpression(item);
        }
        return joined;
    }
    else {
        return String(expression);
    }
}
