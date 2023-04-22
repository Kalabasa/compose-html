"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decreaseLogIndent = exports.increaseLogIndent = exports.installLogGrouper = void 0;
const format_1 = require("./format");
let currentIndent = 0;
let currentIndentStr = "";
function installLogGrouper(logger) {
    const originalFactory = logger.methodFactory;
    logger.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);
        return (...msg) => {
            if (currentIndent === 0) {
                originalMethod(...msg);
            }
            else {
                const text = currentIndentStr +
                    msg
                        .map((item) => (0, format_1.format)(item))
                        .join(" ")
                        .replace(/\n/gm, "\n" + currentIndentStr);
                originalMethod(text);
            }
        };
    };
}
exports.installLogGrouper = installLogGrouper;
function increaseLogIndent() {
    currentIndent++;
    currentIndentStr = currentIndentStr.padEnd(indentLength(), " ");
}
exports.increaseLogIndent = increaseLogIndent;
function decreaseLogIndent() {
    currentIndent--;
    if (currentIndent < 0)
        throw new Error("invalid state");
    currentIndentStr = currentIndentStr.substring(0, indentLength());
}
exports.decreaseLogIndent = decreaseLogIndent;
function indentLength() {
    return currentIndent * 2;
}
