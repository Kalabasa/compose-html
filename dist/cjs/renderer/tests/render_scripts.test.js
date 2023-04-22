"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const node_path_1 = __importDefault(require("node:path"));
const renderer_1 = require("renderer/renderer");
const render_scripts_1 = require("renderer/render_scripts");
describe("render_scripts", () => {
    let component;
    const renderList = (nodes) => {
        const renderer = new renderer_1.Renderer();
        return renderer.renderList(nodes);
    };
    beforeEach(() => {
        component = (0, compiler_1.compile)("test", "test.html", `<script static="">const foo = 42;</script>`);
    });
    it("independent expression", async () => {
        const content = (0, dom_1.parse)(`<div>One plus one is <script render="expr">1 + 1</script>.</div>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("<div>One plus one is 2.</div>");
    });
    it("renders return value of a func type", async () => {
        const content = (0, dom_1.parse)(`<script render="func">return "foo"</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("foo");
    });
    it("renders async value of a func type", async () => {
        const content = (0, dom_1.parse)(`<script render="func">return await Promise.resolve("foo")</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("foo");
    });
    it("renders yielded values of a gen type", async () => {
        const content = (0, dom_1.parse)(`<script render="gen">yield "foo"; yield "bar";</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("foobar");
    });
    it("reads script local variable", async () => {
        const content = (0, dom_1.parse)(`<div>Foo? <script render="expr">foo</script>.</div>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("<div>Foo? 42.</div>");
    });
    it("executes a script local function", async () => {
        const content = (0, dom_1.parse)(`<script render="expr">bar()</script>`);
        const component = (0, compiler_1.compile)("test", "test.html", `<script static>function bar() { return "Hey!"; }</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("Hey!");
    });
    it("imports a node module", async () => {
        const content = (0, dom_1.parse)(`<script render="expr">bar('a', 'b')</script>`);
        const component = (0, compiler_1.compile)("test", "test.html", `\
<script static>
  const path = require("node:path");
  function bar(a, b) {
    return path.join(a, b);
  }
</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("a/b");
    });
    it("imports a relative module", async () => {
        const filePath = node_path_1.default.resolve(__dirname, "data/root.html");
        const content = (0, dom_1.parse)(`<script render="expr">bar</script>`);
        const component = (0, compiler_1.compileFile)(filePath);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe("88");
    });
    it("renders dynamic attributes", async () => {
        const content = (0, dom_1.parse)(`<img class="{a}" src="{b}" alt="Test">`);
        const component = (0, compiler_1.compile)("test", "test.html", `<script static>const a = "va"; const b = "vb";</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe(`<img class="va" src="vb" alt="Test">`);
    });
    it("renders async dynamic attributes", async () => {
        const content = (0, dom_1.parse)(`<img src="{await foo()}">`);
        const component = (0, compiler_1.compile)("test", "test.html", `<script static>async function foo() { return "foo"; }</script>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe(`<img src="foo">`);
    });
    it("does not render null attributes", async () => {
        const content = (0, dom_1.parse)(`<div data-foo="{null}" data-bar="{undefined}"></div>`);
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe(`<div></div>`);
    });
    it("renders nested HTML tags", async () => {
        const content = (0, dom_1.parse)('<script render="expr">html`<div>${renderInner()}</div>`</script>');
        const component = (0, compiler_1.compile)("test", "test.html", "<script static>function renderInner() { return html`<span>foo</span>`; }</script>");
        await (0, render_scripts_1.evaluateScripts)(content, component, {}, [], renderList);
        expect((0, dom_1.toHTML)(content)).toBe(`<div><span>foo</span></div>`);
    });
});
