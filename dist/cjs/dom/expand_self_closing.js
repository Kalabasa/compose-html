"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandSelfClosing = void 0;
const text_processor_1 = require("compiler/text_processor");
const html_tags_1 = __importDefault(require("html-tags"));
const cast_string_array_1 = require("util/cast_string_array");
const xml_zero_lexer_1 = __importStar(require("xml-zero-lexer"));
const dom_1 = require("./dom");
const HTML_ELEMENTS = new Set(html_tags_1.default);
// Tags which are technically HTML tags, but is used in a custom way by the framework, so it's now a "foreign" element
const CUSTOM_ELEMENTS = new Set(["slot"]);
function expandSelfClosing(html) {
    let result = [];
    const textProcessor = new text_processor_1.TextProcessor((0, dom_1.createTextNode)(html));
    let openTag;
    let openTagKey;
    for (const token of (0, xml_zero_lexer_1.default)(html)) {
        const nodeType = token[0];
        if (nodeType === xml_zero_lexer_1.NodeTypes.ELEMENT_NODE && token[1] && token[2]) {
            // open tag
            openTag = html.substring(token[1], token[2]);
            openTagKey = openTag.toLowerCase();
        }
        else if (nodeType === xml_zero_lexer_1.NodeTypes.CLOSE_ELEMENT &&
            token[1] === token[2] &&
            openTag &&
            (!HTML_ELEMENTS.has(openTagKey) || CUSTOM_ELEMENTS.has(openTagKey))) {
            // self-closed, the slash is at token[1] + 1
            result.push(...(0, cast_string_array_1.castStrArr)(textProcessor.readUntil(token[1] - 1)));
            result.push(`></${openTag}>`);
            textProcessor.readUntil(token[1] + 1);
        }
    }
    result.push(...(0, cast_string_array_1.castStrArr)(textProcessor.readUntil(Infinity)));
    return result.join("");
}
exports.expandSelfClosing = expandSelfClosing;
