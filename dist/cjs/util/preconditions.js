"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNotNull = exports.check = void 0;
function check(condition, message) {
    if (!condition) {
        console.error(message);
        throw new Error(message);
    }
}
exports.check = check;
function checkNotNull(value, message) {
    check(value != null, message);
    return value;
}
exports.checkNotNull = checkNotNull;
