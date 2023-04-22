"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("dom/dom");
describe("parse", () => {
    it("parses an HTML string with one element", () => {
        const source = "<div>Hello world</div>";
        const result = (0, dom_1.parse)(source);
        expect(result.childNodes).toHaveLength(1);
        expect((0, dom_1.isElement)(result.childNodes[0])).toBeTruthy();
        expect(result.firstElementChild.tagName).toBe("DIV");
        expect(result.firstElementChild.innerHTML).toBe("Hello world");
    });
    it("handles an empty string", () => {
        const source = "";
        const result = (0, dom_1.parse)(source);
        expect(result.childNodes).toHaveLength(0);
    });
    it("handles multiple elements and nested elements", () => {
        const source = "<div><span>Hello</span> <span>world</span></div>";
        const result = (0, dom_1.parse)(source);
        expect(result.childNodes).toHaveLength(1);
        expect((0, dom_1.isElement)(result.childNodes[0])).toBeTruthy();
        expect(result.firstElementChild.tagName).toBe("DIV");
        expect(result.firstElementChild.children).toHaveLength(2);
        expect(result.firstElementChild.firstElementChild.tagName).toBe("SPAN");
        expect(result.firstElementChild.firstElementChild.innerHTML).toBe("Hello");
        expect(result.firstElementChild.lastElementChild.tagName).toBe("SPAN");
        expect(result.firstElementChild.lastElementChild.innerHTML).toBe("world");
    });
});
