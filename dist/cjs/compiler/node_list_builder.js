"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeListBuilder = void 0;
const dom_1 = require("dom/dom");
class NodeListBuilder {
    nodes = [];
    collect() {
        return this.nodes;
    }
    append(...content) {
        for (let item of content) {
            if ((0, dom_1.isText)(item)) {
                item = item.textContent ?? "";
            }
            if (typeof item === "string") {
                if (!item)
                    continue;
                const lastNode = this.nodes[this.nodes.length - 1];
                if ((0, dom_1.isText)(lastNode)) {
                    lastNode.textContent += item;
                }
                else {
                    this.nodes.push((0, dom_1.createTextNode)(item));
                }
            }
            else {
                this.nodes.push(item);
            }
        }
    }
}
exports.NodeListBuilder = NodeListBuilder;
