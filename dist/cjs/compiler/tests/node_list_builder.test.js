"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_list_builder_1 = require("compiler/node_list_builder");
const dom_1 = require("dom/dom");
describe("NodeListBuilder", () => {
    it("appends nodes and text to the list", () => {
        const builder = new node_list_builder_1.NodeListBuilder();
        const div = (0, dom_1.createElement)("div");
        div.textContent = "Hello";
        const text = (0, dom_1.createTextNode)(" world");
        builder.append(div, text);
        const nodes = builder.collect();
        expect(nodes).toHaveLength(2);
        expect(nodes[0]).toBe(div);
        expect(nodes[1]).toEqual(text);
    });
    it("concatenates adjacent text nodes", () => {
        const builder = new node_list_builder_1.NodeListBuilder();
        const text1 = (0, dom_1.createTextNode)("Hello");
        const text2 = (0, dom_1.createTextNode)(" world");
        builder.append(text1, text2);
        const nodes = builder.collect();
        expect(nodes).toHaveLength(1);
        expect((0, dom_1.isText)(nodes[0])).toBeTruthy();
        expect(nodes[0].textContent).toBe("Hello world");
    });
    it("ignores empty strings", () => {
        const builder = new node_list_builder_1.NodeListBuilder();
        const text = (0, dom_1.createTextNode)("Hello");
        builder.append(text, "", "world");
        const nodes = builder.collect();
        expect(nodes).toHaveLength(1);
        expect((0, dom_1.isText)(nodes[0])).toBeTruthy();
        expect(nodes[0].textContent).toBe("Helloworld");
    });
});
