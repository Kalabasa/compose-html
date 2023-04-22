"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("dom/dom");
const jsdom_1 = require("jsdom");
const { document } = new jsdom_1.JSDOM("", { contentType: "text/html" }).window;
describe("appendChild", () => {
    it("appends a child node to a parent node", () => {
        const parent = document.createElement("div");
        const child = document.createElement("p");
        (0, dom_1.appendChild)(parent, child);
        expect(parent.childNodes).toContain(child);
    });
    it("appends a child node to a template element", () => {
        const parent = document.createElement("template");
        const child = document.createElement("p");
        (0, dom_1.appendChild)(parent, child);
        expect(parent.content.childNodes).toContain(child);
    });
});
describe("childNodesOf", () => {
    it("returns the child nodes of a parent node", () => {
        const parent = document.createElement("div");
        const child1 = document.createElement("p");
        const child2 = document.createElement("span");
        parent.appendChild(child1);
        parent.appendChild(child2);
        expect((0, dom_1.childNodesOf)(parent)).toEqual(parent.childNodes);
    });
    it("returns the child nodes of a template element", () => {
        const parent = document.createElement("template");
        const child1 = document.createElement("p");
        const child2 = document.createElement("span");
        parent.content.appendChild(child1);
        parent.content.appendChild(child2);
        expect((0, dom_1.childNodesOf)(parent)).toEqual(parent.content.childNodes);
    });
});
describe("stableChildNodesOf", () => {
    it("returns a stable iterable of the child nodes of a parent node", () => {
        const parent = document.createElement("div");
        const child1 = document.createElement("p");
        const child2 = document.createElement("span");
        parent.appendChild(child1);
        parent.appendChild(child2);
        const childNodes = (0, dom_1.stableChildNodesOf)(parent);
        parent.removeChild(child1);
        expect(childNodes).toEqual([child1, child2]);
    });
});
