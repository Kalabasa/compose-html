"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAttrsForScript = exports.mapAttrs = void 0;
function mapAttrs(attributes) {
    const attrs = {};
    for (const attr of attributes) {
        attrs[attr.name] = attr.value;
    }
    return attrs;
}
exports.mapAttrs = mapAttrs;
function mapAttrsForScript(attributes) {
    const attrs = {};
    for (const [name, value] of Object.entries(attributes)) {
        attrs[toCamelCase(name)] = value;
    }
    return attrs;
}
exports.mapAttrsForScript = mapAttrsForScript;
function toCamelCase(kebab) {
    return kebab.replace(/-./g, (x) => x[1].toUpperCase());
}
