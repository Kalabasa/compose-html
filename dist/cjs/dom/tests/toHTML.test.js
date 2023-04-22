"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("dom/dom");
describe("toHTML", () => {
    it("should return an empty string if the input is an empty NodeList", () => {
        const nodes = (0, dom_1.createDocumentFragment)().childNodes;
        expect((0, dom_1.toHTML)(nodes)).toBe("");
    });
    it("should return the HTML string representation of a single element node", () => {
        const node = (0, dom_1.createElement)("p");
        node.textContent = "Hello, world!";
        expect((0, dom_1.toHTML)(node)).toBe("<p>Hello, world!</p>");
    });
    it("should return the concatenated HTML string representation of multiple element nodes", () => {
        const node1 = (0, dom_1.createElement)("p");
        node1.textContent = "Hello, world!";
        const node2 = (0, dom_1.createElement)("p");
        node2.textContent = "Goodbye, world!";
        expect((0, dom_1.toHTML)([node1, node2])).toBe("<p>Hello, world!</p><p>Goodbye, world!</p>");
    });
    it("should return the text content of a text node", () => {
        const node = (0, dom_1.createTextNode)("Hello, world!");
        expect((0, dom_1.toHTML)(node)).toBe("Hello, world!");
    });
    it("should return the concatenated text content of multiple text nodes", () => {
        const node1 = (0, dom_1.createTextNode)("Hello, ");
        const node2 = (0, dom_1.createTextNode)("world!");
        expect((0, dom_1.toHTML)([node1, node2])).toBe("Hello, world!");
    });
    it("should return the HTML string representation of a DocumentFragment", () => {
        const fragment = (0, dom_1.createDocumentFragment)();
        const node1 = (0, dom_1.createElement)("p");
        node1.textContent = "Hello, world!";
        fragment.appendChild(node1);
        const node2 = (0, dom_1.createElement)("p");
        node2.textContent = "Goodbye, world!";
        fragment.appendChild(node2);
        expect((0, dom_1.toHTML)(fragment)).toBe("<p>Hello, world!</p><p>Goodbye, world!</p>");
    });
    it("should trim the resulting HTML string if the trim option is set to true", () => {
        const node = (0, dom_1.createTextNode)(" Hello, world! ");
        expect((0, dom_1.toHTML)(node)).toBe("Hello, world!");
    });
    it("should not trim the resulting HTML string if the trim option is set to false", () => {
        const node = (0, dom_1.createTextNode)(" Hello, world! ");
        expect((0, dom_1.toHTML)(node, false)).toBe(" Hello, world! ");
    });
});
