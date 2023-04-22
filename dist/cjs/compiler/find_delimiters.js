"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDelimiters = void 0;
const preconditions_1 = require("util/preconditions");
const text_processor_1 = require("./text_processor");
function findDelimiters(open, close, node) {
    const text = new text_processor_1.TextProcessor(node);
    const openMatcher = new GreedyMatcher(open);
    const closeMatcher = new GreedyMatcher(close);
    let found = [];
    let currentLevel = 0;
    let i = 0;
    while (true) {
        const char = text
            .readUntil(++i)
            .find((item) => typeof item === "string");
        if (!char)
            break;
        (0, preconditions_1.check)(char.length === 1);
        if (char === "\\") {
            text.readUntil(++i);
            continue;
        }
        const matchesOpen = openMatcher.feed(char);
        const matchesClose = closeMatcher.feed(char);
        if (matchesOpen) {
            currentLevel++;
            found.push({
                index: i - open.length,
                levelInside: currentLevel,
                type: open,
            });
        }
        else if (matchesClose) {
            found.push({
                index: i - close.length,
                levelInside: currentLevel,
                type: close,
            });
            currentLevel--;
        }
    }
    return found;
}
exports.findDelimiters = findDelimiters;
class GreedyMatcher {
    target;
    index = 0;
    constructor(target) {
        this.target = target;
    }
    feed(char) {
        if (this.target[this.index] === char) {
            this.index++;
            if (this.index >= this.target.length) {
                this.index = 0;
                return true;
            }
        }
        else {
            this.index = 0;
        }
        return false;
    }
}
