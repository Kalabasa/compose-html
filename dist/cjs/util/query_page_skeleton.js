"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryPageSkeleton = void 0;
const desensitize_1 = require("dom/desensitize");
const dom_1 = require("dom/dom");
function queryPageSkeleton(root) {
    return {
        html: (0, dom_1.isElement)(root) && root.matches(`${desensitize_1.DZ_PREFIX}html`)
            ? root
            : root.querySelector(`${desensitize_1.DZ_PREFIX}html`),
        head: root.querySelector(`${desensitize_1.DZ_PREFIX}head`),
        body: root.querySelector(`${desensitize_1.DZ_PREFIX}body`),
    };
}
exports.queryPageSkeleton = queryPageSkeleton;
