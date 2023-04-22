"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const desensitize_1 = require("dom/desensitize");
const dom_1 = require("dom/dom");
const jsdom_1 = require("jsdom");
const render_page_1 = require("renderer/render_page");
describe("renderPage", () => {
    const { document } = new jsdom_1.JSDOM("", { contentType: "text/html" }).window;
    let testSkeleton;
    beforeEach(() => {
        testSkeleton = document.createElement(`${desensitize_1.DZ_PREFIX}html`);
        testSkeleton.appendChild(document.createElement(`${desensitize_1.DZ_PREFIX}head`));
        testSkeleton.appendChild(document.createElement(`${desensitize_1.DZ_PREFIX}body`));
    });
    it("should render a page with the given body content", () => {
        const bodyContent = [document.createTextNode("body content")];
        const data = {
            page: {
                skeleton: testSkeleton,
            },
            metadata: [],
            clientScripts: [],
            styles: [],
        };
        const result = (0, render_page_1.renderPage)(bodyContent, data);
        expect((0, dom_1.toHTML)(result)).toEqual("<html><head></head><body>body content</body></html>");
    });
    it("should render a page with the given skeleton", () => {
        const skeleton = document.createElement(`${desensitize_1.DZ_PREFIX}html`);
        skeleton.innerHTML = `
  <${desensitize_1.DZ_PREFIX}head></${desensitize_1.DZ_PREFIX}head>
  <${desensitize_1.DZ_PREFIX}body></${desensitize_1.DZ_PREFIX}body>
`;
        const bodyContent = [document.createTextNode("body content")];
        const data = {
            page: {
                skeleton,
            },
            metadata: [],
            clientScripts: [],
            styles: [],
        };
        const result = (0, render_page_1.renderPage)(bodyContent, data);
        expect((0, dom_1.toHTML)(result)).toEqual(`\
<html>
  <head></head>
  <body>body content</body>
</html>`);
    });
    it("should render a page with the given metadata", () => {
        const meta = document.createElement("meta");
        meta.name = "origin";
        meta.content = "local";
        const title = document.createElement("title");
        title.innerHTML = "foo";
        const data = {
            page: {
                skeleton: testSkeleton,
            },
            metadata: [title, meta],
            clientScripts: [],
            styles: [],
        };
        const result = (0, render_page_1.renderPage)([], data);
        expect((0, dom_1.toHTML)(result)).toEqual(`<html><head><title>foo</title><meta name="origin" content="local"></head><body></body></html>`);
    });
    it("should render a page with the given page data", () => {
        const title = document.createElement("title");
        title.innerHTML = "foo";
        const script = document.createElement("script");
        script.innerHTML = "console.log(1);";
        const deferredScript = document.createElement("script");
        deferredScript.defer = true;
        deferredScript.innerHTML = "document.querySelector('*');";
        const style = document.createElement("style");
        style.innerHTML = "body { margin: 0; }";
        const data = {
            page: {
                skeleton: testSkeleton,
            },
            metadata: [title],
            clientScripts: [script, deferredScript],
            styles: [style],
        };
        const result = (0, render_page_1.renderPage)([], data);
        expect((0, dom_1.toHTML)(result)).toEqual(`<html><head><title>foo</title><style>body { margin: 0; }</style><script>console.log(1);</script></head><body><script>document.querySelector('*');</script></body></html>`);
    });
});
