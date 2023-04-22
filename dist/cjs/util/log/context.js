"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTag = exports.setLogContext = exports.setLogGlobalContext = exports.installContextWrapper = void 0;
const format_1 = require("./format");
let currentGlobalContext = undefined;
let currentContext = undefined;
function installContextWrapper(logger) {
    const originalFactory = logger.methodFactory;
    logger.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);
        return (...msg) => {
            const context = [
                formatTag(currentGlobalContext),
                formatTag(currentContext),
                " ",
            ]
                .filter((s) => s)
                .join(" ")
                .padStart(45, " ");
            const continuation = context.replace(/./g, " ").slice(0, -3) + "~  ";
            const text = context +
                msg
                    .map((item) => (0, format_1.format)(item))
                    .join(" ")
                    .replace(/\n/gm, "\n" + continuation);
            const ret = originalMethod(text);
            currentContext = undefined;
            return ret;
        };
    };
}
exports.installContextWrapper = installContextWrapper;
function setLogGlobalContext(context) {
    currentGlobalContext = context;
}
exports.setLogGlobalContext = setLogGlobalContext;
function setLogContext(context) {
    currentContext = context;
}
exports.setLogContext = setLogContext;
function formatTag(tag) {
    if (!tag)
        return undefined;
    const max = 30; // max length
    // ellipsize
    tag =
        tag.length > max
            ? tag.length > 5
                ? tag.substring(0, max - 9) +
                    "..." +
                    tag.substring(tag.length - 6, tag.length)
                : tag.substring(0, max - 3) + "..."
            : tag;
    tag = `[${tag}]`;
    return tag;
}
exports.formatTag = formatTag;
