"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAsyncIterable = exports.isIterable = void 0;
function isIterable(obj) {
    return typeof obj[Symbol.iterator] === "function";
}
exports.isIterable = isIterable;
function isAsyncIterable(obj) {
    return typeof obj[Symbol.asyncIterator] === "function";
}
exports.isAsyncIterable = isAsyncIterable;
