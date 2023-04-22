"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const renderer_1 = require("renderer/renderer");
describe("renderer", () => {
    it("renders plain HTML", async () => {
        const renderer = new renderer_1.Renderer();
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`);
    });
    it("renders unknown HTML elements as is", async () => {
        const renderer = new renderer_1.Renderer();
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`);
    });
    it("renders <template> correctly", async () => {
        const renderer = new renderer_1.Renderer();
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<template>Quintessece</template>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<template>Quintessece</template>`);
    });
    it("renders dynamic attributes", async () => {
        const renderer = new renderer_1.Renderer();
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<img :class="a" src="{b}" alt="Test"><script static>const a = "va"; const b = "vb";</script>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<img class="va" src="vb" alt="Test">`);
    });
    it("renders spread attributes", async () => {
        const renderer = new renderer_1.Renderer(new Map([
            ["inner", (0, compiler_1.compile)("inner", "inner.html", "<div {...attrs}>inner</div>")],
        ]));
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<inner class="foo" data-bar="x"/>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<div class="foo" data-bar="x">inner</div>`);
    });
    it("renders a page component", async () => {
        const renderer = new renderer_1.Renderer();
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<html><head><title>foo</title></head><body>bar</body></html>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<html><head><title>foo</title></head><body>bar</body></html>`);
    });
    it("renders combined metadata in a page", async () => {
        const myMeta = (0, compiler_1.compile)("my-meta", "my-meta.html", `<head><meta name="origin" content="local"></head>`);
        const renderer = new renderer_1.Renderer(new Map([["my-meta", myMeta]]));
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<html><head><title>foo</title></head><body><my-meta/>bar</body></html>`));
        expect((0, dom_1.toHTML)(output)).toBe(`<html><head><title>foo</title><meta name="origin" content="local"></head><body>bar</body></html>`);
    });
    it("orders script dependencies correctly", async () => {
        const componentA = (0, compiler_1.compile)("a", "a.html", "<b/><c/><script client>a</script>");
        const componentB = (0, compiler_1.compile)("b", "b.html", "<c/><d/><script client>b</script>");
        const componentC = (0, compiler_1.compile)("c", "c.html", "<d/><script client>c</script>");
        const componentD = (0, compiler_1.compile)("d", "d.html", "<script client>d</script>");
        const renderer = new renderer_1.Renderer(new Map([
            ["a", componentA],
            ["b", componentB],
            ["c", componentC],
            ["d", componentD],
        ]));
        const output = await renderer.render((0, compiler_1.compile)("test", "test.html", `<html><a/></html>`));
        expect(output).toHaveLength(1);
        expect(Array.from(output[0].querySelectorAll("script")).map((script) => script.innerHTML)).toEqual(["d", "c", "b", "a"]);
    });
});
