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
Object.defineProperty(exports, "__esModule", { value: true });
exports.undesensitizeHTML = exports.desensitizeHTML = exports.DZ_PREFIX = void 0;
const text_processor_1 = require("compiler/text_processor");
const xml_zero_lexer_1 = __importStar(require("xml-zero-lexer"));
const cast_string_array_1 = require("../util/cast_string_array");
const dom_1 = require("./dom");
// prefix to allow nesting that would be illegal in valid HTML
exports.DZ_PREFIX = "dz-";
const ELEMENTS = new Set(["html", "head", "body"]);
const DESEN_MAP = new Map(Array.from(ELEMENTS.values()).map((item) => [item, exports.DZ_PREFIX + item]));
const UNDESEN_MAP = new Map(Array.from(DESEN_MAP.entries()).map(([from, to]) => [to, from]));
// replace parse-sensitive elements to be more resilient for general processing
function desensitizeHTML(html) {
    return replaceTags(html, DESEN_MAP);
}
exports.desensitizeHTML = desensitizeHTML;
// undo
function undesensitizeHTML(html) {
    return replaceTags(html, UNDESEN_MAP);
}
exports.undesensitizeHTML = undesensitizeHTML;
function replaceTags(html, map) {
    let result = [];
    const textProcessor = new text_processor_1.TextProcessor((0, dom_1.createTextNode)(html));
    for (const token of (0, xml_zero_lexer_1.default)(html)) {
        const nodeType = token[0];
        if ((nodeType !== xml_zero_lexer_1.NodeTypes.ELEMENT_NODE &&
            nodeType !== xml_zero_lexer_1.NodeTypes.CLOSE_ELEMENT) ||
            !token[1] ||
            !token[2]) {
            continue;
        }
        result.push(...(0, cast_string_array_1.castStrArr)(textProcessor.readUntil(token[1])));
        const tagName = (0, cast_string_array_1.castStrArr)(textProcessor.readUntil(token[2])).join("");
        result.push(map.get(tagName) ?? tagName);
    }
    result.push(...(0, cast_string_array_1.castStrArr)(textProcessor.readUntil(Infinity)));
    return result.join("");
}
