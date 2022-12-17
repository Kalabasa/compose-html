import { compile } from "compiler/compiler";
import { toHTML } from "dom/dom";

describe("compiler", () => {
  it("returns the same source", () => {
    const component = compile(
      "test",
      "test.html",
      `<div class="foo"><span>bar</span></div><p>baz</p>`
    );

    expect(toHTML(component.source)).toBe(
      `<div class="foo"><span>bar</span></div><p>baz</p>`
    );
  });

  it("returns a component with correct contents", () => {
    const component = compile(
      "test",
      "test.html",
      `<div class="foo"><span>bar</span></div><p>baz</p>`
    );

    expect(toHTML(component.content)).toBe(
      `<div class="foo"><span>bar</span></div><p>baz</p>`
    );
  });

  it("returns correct content with a template element", () => {
    const component = compile("test", "test.html", `<template>foo</template>`);

    expect(toHTML(component.content)).toBe(`<template>foo</template>`);
  });

  it("separates non-content scripts from content", () => {
    const component = compile(
      "test",
      "test.html",
      `<div>Hi <script render>name</script></div><script static>const name = "Foo";</script><script client>console.log(name);</script>`
    );

    expect(toHTML(component.content)).toBe(
      `<div>Hi <script render="expr">name</script></div>`
    );
    expect(toHTML(component.staticScripts)).toBe(
      `<script static="">const name = "Foo";</script>`
    );
    expect(toHTML(component.clientScripts)).toBe(
      `<script client="">console.log(name);</script>`
    );
  });

  it("converts render shorthands into render scripts", () => {
    const component = compile(
      "test",
      "test.html",
      `Hello, {getName()}. Today is {getWeather({ format: "short" })}.`
    );

    expect(toHTML(component.content)).toBe(
      `Hello, <script render="expr">getName()</script>. Today is <script render="expr">getWeather({ format: "short" })</script>.`
    );
  });

  it("converts dynamic attribute shorthand into dynamic attribute format", () => {
    const component = compile(
      "test",
      "test.html",
      `<span :class="getClass()">Chameleon</span>`
    );

    expect(toHTML(component.content)).toBe(
      `<span class="{getClass()}">Chameleon</span>`
    );
  });

  it("correctly detects render script with return", () => {
    const component = compile(
      "test",
      "test.html",
      `Best color: <script render>return "Orange"</script>`
    );

    expect(toHTML(component.content)).toBe(
      `Best color: <script render="func">return "Orange"</script>`
    );
  });

  it("correctly detects render script with yield", () => {
    const component = compile(
      "test",
      "test.html",
      `Plants: <script render>yield "Acacia"</script>`
    );

    expect(toHTML(component.content)).toBe(
      `Plants: <script render="gen">yield "Acacia"</script>`
    );
  });

  it("correctly detects render script with delegating yield", () => {
    const component = compile(
      "test",
      "test.html",
      `Primes: {yield* computePrimes(5)}`
    );

    expect(toHTML(component.content)).toBe(
      `Primes: <script render="gen">yield* computePrimes(5)</script>`
    );
  });

  it("converts HTML literals inside a render script", () => {
    const component = compile(
      "test",
      "test.html",
      `12:00 <script render>canEdit ? (<button>Edit</button>) : ""</script>`
    );

    expect(component.htmlLiterals).toHaveLength(1);
    expect(toHTML(component.htmlLiterals[0])).toBe("<button>Edit</button>");
    expect(toHTML(component.content)).toBe(
      `12:00 <script render="expr">canEdit ?  (__renderHTMLLiteral__(0))  : ""</script>`
    );
  });

  it("converts HTML literals inside a render shorthand", () => {
    const component = compile(
      "test",
      "test.html",
      `12:00 {canEdit ? (<button>Edit</button>) : ""}`
    );

    expect(component.htmlLiterals).toHaveLength(1);
    expect(toHTML(component.htmlLiterals[0])).toBe("<button>Edit</button>");
    expect(toHTML(component.content)).toBe(
      `12:00 <script render="expr">canEdit ?  (__renderHTMLLiteral__(0))  : ""</script>`
    );
  });

  it("converts nested shorthands and HTML literals", () => {
    const component = compile(
      "test",
      "test.html",
      `{"Here " + (<b>we {"go " + (<i>again!</i>)}</b>)}`
    );

    expect(component.htmlLiterals).toHaveLength(2);
    expect(toHTML(component.htmlLiterals[0])).toBe(
      `<b>we <script render="expr">"go " +  (__renderHTMLLiteral__(1)) </script></b>`
    );
    expect(toHTML(component.htmlLiterals[1])).toBe(`<i>again!</i>`);
    expect(toHTML(component.content)).toBe(
      `<script render="expr">"Here " +  (__renderHTMLLiteral__(0)) </script>`
    );
  });

  it("separates metadata from the content", () => {
    const component = compile("test", "test.html", "<title>foo</title>bar");

    expect(toHTML(component.metadata)).toBe("<title>foo</title>");
    expect(toHTML(component.content)).toBe("bar");
  });

  it("detects a page component", () => {
    const component = compile(
      "test",
      "test.html",
      "<html><head><title>foo</title></head><body>bar</body></html>"
    );

    expect(component.isPage).toBeTruthy();
    expect(toHTML(component.metadata)).toBe("<title>foo</title>");
    expect(toHTML(component.content)).toBe("bar");
  });

  it("detects a non-page component", () => {
    const component = compile(
      "test",
      "test.html",
      "<head><title>foo</title></head>bar"
    );

    expect(component.isPage).toBeFalsy();
    expect(toHTML(component.metadata)).toBe("<title>foo</title>");
    expect(toHTML(component.content)).toBe("bar");
  });
});
