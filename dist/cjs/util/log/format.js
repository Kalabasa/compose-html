"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatJSValue = exports.formatHTMLValue = exports.format = exports.installFormatter = void 0;
const node_util_1 = __importDefault(require("node:util"));
const cli_highlight_1 = require("cli-highlight");
const dom_1 = require("dom/dom");
const raw_html_1 = require("renderer/raw_html");
const LANG_JSON = { language: "json" };
const LANG_HTML = { language: "html" };
const LANG_JSX = { language: "jsx" };
function installFormatter(logger) {
    const originalFactory = logger.methodFactory;
    logger.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);
        return (...msg) => {
            return originalMethod(...msg.map((item) => format(item)));
        };
    };
}
exports.installFormatter = installFormatter;
function format(thing, depth = 2) {
    if (!thing)
        return thing;
    if ((0, dom_1.isDocumentFragment)(thing)) {
        return asIs(`DocumentFragment(${shortHTML((0, dom_1.toHTML)(thing))})`);
    }
    else if ((0, dom_1.isElement)(thing)) {
        return asIs(`Element(${shortHTML((0, dom_1.toHTML)(thing))})`);
    }
    else if ((0, dom_1.isText)(thing)) {
        const text = (0, cli_highlight_1.highlight)(JSON.stringify(thing.textContent), LANG_JSON);
        return asIs(`Text(${text})`);
    }
    else if ((0, raw_html_1.isRawHTML)(thing)) {
        return asIs(`html(${shortHTML(thing.html)})`);
    }
    else if (depth > 0 &&
        typeof thing === "object" &&
        Symbol.iterator in thing) {
        return formatIterable(thing, depth);
    }
    else if (typeof thing === "object") {
        return asIs(toString(thing));
    }
    return thing;
}
exports.format = format;
function shortHTML(html) {
    html = html.trim();
    let truncated = false;
    if (html.includes("\n")) {
        const lines = html.split(/\s*\n\s*/g);
        if (lines.length > 3) {
            lines.length = 3;
            lines[2] = "<!--..-->";
            truncated = true;
        }
        html = lines.join(" ");
    }
    html = formatHTMLValue(html);
    if (truncated) {
        const commentOpen = html.lastIndexOf("<!--");
        const commentClose = html.lastIndexOf("-->");
        html =
            html.substring(0, commentOpen) +
                html.substring(commentOpen + 4, commentClose) +
                html.substring(commentClose + 3);
    }
    return html;
}
function formatHTMLValue(html) {
    return (0, cli_highlight_1.highlight)(html.trim(), LANG_HTML);
}
exports.formatHTMLValue = formatHTMLValue;
function formatJSValue(js) {
    return (0, cli_highlight_1.highlight)(js.trim(), LANG_JSX);
}
exports.formatJSValue = formatJSValue;
function formatIterable(ite, depth) {
    const arrayString = toString([...ite].map((item) => format(item, depth - 1)));
    if (Array.isArray(ite)) {
        return asIs(arrayString);
    }
    else {
        return asIs("{" + arrayString.substring(1, arrayString.length - 1) + "}");
    }
}
function asIs(str) {
    const newStr = new String(str);
    newStr[node_util_1.default.inspect.custom] = () => str;
    return newStr;
}
function toString(thing) {
    return node_util_1.default.inspect(thing);
}
