"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const preconditions_1 = require("util/preconditions");
describe("compiler", () => {
    it("returns the same source", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<div class="foo"><span>bar</span></div><p>baz</p>`);
        expect((0, dom_1.toHTML)(component.source)).toBe(`<div class="foo"><span>bar</span></div><p>baz</p>`);
    });
    it("returns a component with correct contents", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<div class="foo"><span>bar</span></div><p>baz</p>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`<div class="foo"><span>bar</span></div><p>baz</p>`);
    });
    it("returns correct content with a template element", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<template>foo</template>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`<template>foo</template>`);
    });
    it("separates non-content scripts from content", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<div>Hi <script render>name</script></div><script static>const name = "Foo";</script><script client>console.log(name);</script>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`<div>Hi <script render="expr">name</script></div>`);
        expect((0, dom_1.toHTML)(component.staticScripts)).toBe(`<script>const name = "Foo";</script>`);
        expect((0, dom_1.toHTML)(component.clientScripts)).toBe(`<script>console.log(name);</script>`);
    });
    it("converts render shorthands into render scripts", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `Hello, {getName()}. Today is {getWeather({ format: "short" })}.`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`Hello, <script render="expr">getName()</script>. Today is <script render="expr">getWeather({ format: "short" })</script>.`);
    });
    it("converts dynamic attribute shorthand into dynamic attribute format", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<span :class="getClass()">Chameleon</span>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`<span class="{getClass()}">Chameleon</span>`);
    });
    it("correctly detects render script with return", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `Best color: <script render>return "Orange"</script>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`Best color: <script render="func">return "Orange"</script>`);
    });
    it("correctly detects render script with yield", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `Plants: <script render>yield "Acacia"</script>`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`Plants: <script render="gen">yield "Acacia"</script>`);
    });
    it("correctly detects render script with delegating yield", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `Primes: {yield* computePrimes(5)}`);
        expect((0, dom_1.toHTML)(component.content)).toBe(`Primes: <script render="gen">yield* computePrimes(5)</script>`);
    });
    it("separates metadata from the content", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `<title>foo</title><link rel="stylesheet" href="foo.css"><script src="foo.js"></script>bar`);
        expect((0, dom_1.toHTML)(component.metadata)).toBe(`<title>foo</title><link rel="stylesheet" href="foo.css"><script src="foo.js"></script>`);
        expect((0, dom_1.toHTML)(component.content)).toBe("bar");
    });
    it("detects a page component", () => {
        const component = (0, compiler_1.compile)("test", "test.html", "<html><head><title>foo</title></head><body>bar</body></html>");
        expect(component.page).toBeTruthy();
        expect((0, dom_1.toHTML)(component.metadata)).toBe("<title>foo</title>");
        expect((0, dom_1.toHTML)(component.content)).toBe("bar");
    });
    it("detects a non-page component", () => {
        const component = (0, compiler_1.compile)("test", "test.html", "<head><title>foo</title></head>bar");
        expect(component.page).toBeFalsy();
        expect((0, dom_1.toHTML)(component.metadata)).toBe("<title>foo</title>");
        expect((0, dom_1.toHTML)(component.content)).toBe("bar");
    });
    it("extracts page skeleton", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `\
<html>
    <head></head>
    
    <body>foo</body>

</html>`);
        expect(component.page).toBeTruthy();
        expect((0, dom_1.toHTML)((0, preconditions_1.checkNotNull)(component.page).skeleton)).toBe(`\
<html>
    <head></head>
    
    <body></body>

</html>`);
    });
    it("removes illegal nodes from the page skeleton", () => {
        const component = (0, compiler_1.compile)("test", "test.html", `\
<html>
    <head></head>
    <body>foo</body>
    bar
    <div>baz</div>
</html>`);
        expect(component.page).toBeTruthy();
        expect((0, dom_1.toHTML)((0, preconditions_1.checkNotNull)(component.page).skeleton)).toBe(`\
<html>
    <head></head>
    <body></body>
</html>`);
    });
});
