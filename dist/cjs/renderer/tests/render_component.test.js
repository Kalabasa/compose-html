"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const renderer_1 = require("renderer/renderer");
const render_component_1 = require("renderer/render_component");
describe("render_component", () => {
    const renderList = (nodes) => {
        const renderer = new renderer_1.Renderer();
        return renderer.renderList(nodes);
    };
    it("simple", async () => {
        const component = (0, compiler_1.compile)("welcome-banner", "test.html", `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`);
        const output = await (0, render_component_1.renderComponent)(component, {}, [], renderList);
        expect((0, dom_1.toHTML)(output)).toBe(`<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`);
    });
    it("with slots", async () => {
        const component = (0, compiler_1.compile)("welcome-banner", "test.html", `<div class="header"><h1><slot name="header"/></h1></div><p><slot /></p>`);
        const output = await (0, render_component_1.renderComponent)(component, {}, [
            ...(0, dom_1.childNodesOf)((0, dom_1.parse)(`<template slot="header">Hello</template>What's up?`)),
        ], renderList);
        expect((0, dom_1.toHTML)(output)).toBe(`<div class="header"><h1>Hello</h1></div><p>What's up?</p>`);
    });
    it("with slot fallbacks", async () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<p><slot name="content">Uh oh</slot></p>`);
        const output = await (0, render_component_1.renderComponent)(component, {}, [], renderList);
        expect((0, dom_1.toHTML)(output)).toBe(`<p>Uh oh</p>`);
    });
    it("override attributes via spread attributes", async () => {
        const renderer = new renderer_1.Renderer(new Map([
            [
                "inner",
                (0, compiler_1.compile)("inner", "inner.html", `<div data-pre="pre" {...attrs} data-post="post">inner</div>`),
            ],
        ]));
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<inner data-pre="foo" data-post="foo"/>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<div data-pre="foo" data-post="post">inner</div>`);
    });
    it("reads attribute", async () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<div>Yeah? <script render="expr">attrs.yeah</script>.</div>`);
        const output = await (0, render_component_1.renderComponent)(component, { yeah: "Nah" }, [], renderList);
        expect((0, dom_1.toHTML)(output)).toBe("<div>Yeah? Nah.</div>");
    });
    it("reads children", async () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<script render="expr">children[0]</script>`);
        const output = await (0, render_component_1.renderComponent)(component, {}, [(0, dom_1.createTextNode)("foo")], renderList);
        expect((0, dom_1.toHTML)(output)).toBe("foo");
    });
});
