"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextProcessor = void 0;
const dom_1 = require("dom/dom");
const preconditions_1 = require("util/preconditions");
// Tool for iterating over top-level text contents of a node
class TextProcessor {
    totalScannedLength = 0;
    currentNodeIndex;
    currentNodeTextOffset = 0;
    sourceNodes;
    constructor(sourceNode) {
        this.sourceNodes = (0, dom_1.isText)(sourceNode)
            ? [sourceNode]
            : Array.from((0, dom_1.childNodesOf)(sourceNode));
        this.currentNodeIndex = 0;
        while (!(0, dom_1.isText)(this.sourceNodes[this.currentNodeIndex]) &&
            this.currentNodeIndex < this.sourceNodes.length) {
            this.currentNodeIndex++;
        }
    }
    readUntil(targetIndex) {
        (0, preconditions_1.check)(targetIndex >= this.totalScannedLength);
        if (this.currentNodeIndex >= this.sourceNodes.length)
            return [];
        let read = [];
        let localText;
        let localTargetIndex;
        while (true) {
            const currentNode = this.sourceNodes[this.currentNodeIndex];
            (0, preconditions_1.check)((0, dom_1.isText)(currentNode));
            localText = currentNode.textContent ?? "";
            localTargetIndex = targetIndex - this.currentNodeTextOffset;
            const substring = localText.substring(this.totalScannedLength - this.currentNodeTextOffset, localTargetIndex);
            if (substring) {
                read.push(substring);
            }
            if (localTargetIndex <= localText.length) {
                // target index is within current node
                this.totalScannedLength = targetIndex;
                return read;
            }
            else {
                // target index is beyond current node
                // find next text node
                while (true) {
                    this.currentNodeIndex++;
                    if (this.currentNodeIndex >= this.sourceNodes.length)
                        return read;
                    if ((0, dom_1.isText)(this.sourceNodes[this.currentNodeIndex])) {
                        break;
                    }
                    else {
                        read.push(this.sourceNodes[this.currentNodeIndex]);
                    }
                }
                this.currentNodeTextOffset =
                    this.currentNodeTextOffset + localText.length;
                this.totalScannedLength = this.currentNodeTextOffset;
                if (this.currentNodeIndex >= this.sourceNodes.length)
                    return read;
            }
        }
    }
}
exports.TextProcessor = TextProcessor;
