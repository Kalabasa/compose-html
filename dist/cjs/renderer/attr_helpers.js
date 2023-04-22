"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAttrs = void 0;
function mapAttrs(attributes) {
    const attrs = {};
    for (const attr of attributes) {
        attrs[toCamelCase(attr.name)] = attr.value;
    }
    return attrs;
}
exports.mapAttrs = mapAttrs;
function toCamelCase(kebab) {
    return kebab.replace(/-./g, (x) => x[1].toUpperCase());
}
