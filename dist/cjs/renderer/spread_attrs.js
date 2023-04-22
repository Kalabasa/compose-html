"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spreadAttrs = void 0;
const dom_1 = require("dom/dom");
const SPREAD_ATTR_NAME = "{...attrs}";
function spreadAttrs(root, attrs) {
    if ((0, dom_1.isElement)(root))
        spreadAttrsForElement(root, attrs);
    for (const node of (0, dom_1.childNodesOf)(root)) {
        spreadAttrs(node, attrs);
    }
}
exports.spreadAttrs = spreadAttrs;
function spreadAttrsForElement(element, attrs) {
    for (const [name, value] of Array.from(element.attributes).map((attr) => [
        attr.name,
        attr.value,
    ])) {
        if (name === SPREAD_ATTR_NAME) {
            element.removeAttribute(SPREAD_ATTR_NAME);
            for (const [inName, inValue] of Object.entries(attrs)) {
                element.setAttribute(inName, inValue);
            }
        }
        else {
            // re-set to keep order
            element.setAttribute(name, value);
        }
    }
}
