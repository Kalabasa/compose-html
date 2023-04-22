"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const find_delimiters_1 = require("compiler/find_delimiters");
const dom_1 = require("dom/dom");
describe("findDelimiters", () => {
    it("finds delimiters in a text node", () => {
        const node = (0, dom_1.createTextNode)("foo[[bar]]baz");
        const delimiters = (0, find_delimiters_1.findDelimiters)("[[", "]]", node);
        expect(delimiters).toEqual([
            { index: 3, levelInside: 1, type: "[[" },
            { index: 8, levelInside: 1, type: "]]" },
        ]);
    });
    it("finds no delimiters if there are no delimiters", () => {
        const node = (0, dom_1.createTextNode)("foobar");
        const delimiters = (0, find_delimiters_1.findDelimiters)("[[", "]]", node);
        expect(delimiters).toEqual([]);
    });
    it("ignores escaped delimiters", () => {
        const node = (0, dom_1.createTextNode)("foo\\[[bar]]baz");
        const delimiters = (0, find_delimiters_1.findDelimiters)("[[", "]]", node);
        expect(delimiters).toEqual([{ index: 9, levelInside: 0, type: "]]" }]);
    });
    it("returns correct levels of nested delimiters", () => {
        const div = (0, dom_1.createElement)("div");
        div.innerHTML = "foo[[bar[[baz]]qux]]fizz";
        const delimiters = (0, find_delimiters_1.findDelimiters)("[[", "]]", div);
        expect(delimiters).toEqual([
            { index: 3, levelInside: 1, type: "[[" },
            { index: 8, levelInside: 2, type: "[[" },
            { index: 13, levelInside: 2, type: "]]" },
            { index: 18, levelInside: 1, type: "]]" },
        ]);
    });
    it("finds delimiters in child text nodes only", () => {
        const div = (0, dom_1.createElement)("div");
        div.innerHTML = "foo[[bar<div>[[baz]]</div>qux]]fizz";
        const delimiters = (0, find_delimiters_1.findDelimiters)("[[", "]]", div);
        expect(delimiters).toEqual([
            { index: 3, levelInside: 1, type: "[[" },
            { index: 11, levelInside: 1, type: "]]" },
        ]);
    });
});
