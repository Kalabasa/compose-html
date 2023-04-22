"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const dom_1 = require("dom/dom");
describe("is", () => {
    const { document } = new jsdom_1.JSDOM("", { contentType: "text/html" }).window;
    const allTests = [
        dom_1.isText,
        dom_1.isNode,
        dom_1.isElement,
        dom_1.isTemplateElement,
        dom_1.isInlineJavaScriptElement,
        dom_1.isDocumentFragment,
    ];
    const cases = [
        {
            value: document.createDocumentFragment(),
            tests: [dom_1.isNode, dom_1.isDocumentFragment],
        },
        {
            value: document.createElement("div"),
            tests: [dom_1.isNode, dom_1.isElement],
        },
        {
            value: document.createTextNode("Hello, world!"),
            tests: [dom_1.isNode, dom_1.isText],
        },
        {
            value: document.createElement("template"),
            tests: [dom_1.isNode, dom_1.isElement, dom_1.isTemplateElement],
        },
        {
            value: (0, dom_1.parse)("<script>console.log(0)</script>").firstElementChild,
            tests: [dom_1.isNode, dom_1.isElement, dom_1.isInlineJavaScriptElement],
        },
        {
            value: (0, dom_1.parse)(`<script src="foo.js"></script>`).firstElementChild,
            tests: [dom_1.isNode, dom_1.isElement],
        },
        {
            value: (0, dom_1.parse)(`<script type="text/javascript">console.log(0)</script>`).firstElementChild,
            tests: [dom_1.isNode, dom_1.isElement, dom_1.isInlineJavaScriptElement],
        },
        {
            value: (0, dom_1.parse)(`<script type="text/plain">foo</script>`).firstElementChild,
            tests: [dom_1.isNode, dom_1.isElement],
        },
        {
            value: null,
            tests: [],
        },
        {
            value: undefined,
            tests: [],
        },
        {
            value: "string",
            tests: [],
        },
        {
            value: 123,
            tests: [],
        },
        {
            value: {},
            tests: [],
        },
    ];
    it.each(cases.map((item) => ({
        desc: `${item.value} is (${item.tests.map((f) => f.name.startsWith("is") ? f.name.substring(2) : f.name)})`,
        ...item,
    })))("$desc", ({ value, tests }) => {
        for (const isIt of tests) {
            expect(isIt(value)).toBe(true);
        }
        for (const isOther of allTests) {
            if (tests.includes(isOther))
                continue;
            expect(isOther(value)).toBe(false);
        }
    });
});
