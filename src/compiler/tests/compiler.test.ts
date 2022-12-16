import { compile } from "compiler/compiler";
import { toHTML } from "dom/dom";

describe("compiler", () => {
  it("on plain HTML", () => {
    const component = compile(
      "test",
      "test.html",
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );

    expect(component.name).toBe("test");
    expect(toHTML(component.source)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
    expect(toHTML(component.content)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("on <template>", () => {
    const component = compile(
      "test",
      "test.html",
      `<template>Quintessece</template>`
    );

    expect(toHTML(component.source)).toBe(`<template>Quintessece</template>`);
    expect(toHTML(component.content)).toBe(`<template>Quintessece</template>`);
  });

  it("with scripts", () => {
    const component = compile(
      "test",
      "test.html",
      `<div>Hi <script render>name</script></div><script static>const name = "Foo";</script><script client>console.log(name);</script>`
    );

    expect(component.name).toBe("test");
    expect(toHTML(component.source)).toBe(
      `<div>Hi <script render="">name</script></div><script static="">const name = "Foo";</script><script client="">console.log(name);</script>`
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

  it("on render shorthand", () => {
    const component = compile(
      "test",
      "test.html",
      `Hello, {getName()}. Today is {getWeather({ format: "short" })}.`
    );

    expect(toHTML(component.content)).toBe(
      `Hello, <script render="expr">getName()</script>. Today is <script render="expr">getWeather({ format: "short" })</script>.`
    );
  });

  it("on dynamic attribute shorthand", () => {
    const component = compile(
      "test",
      "test.html",
      `<span :class="getClass()">Chameleon</span>`
    );

    expect(toHTML(component.content)).toBe(
      `<span class="{getClass()}">Chameleon</span>`
    );
  });

  it("on script with return", () => {
    const component = compile(
      "test",
      "test.html",
      `Best color: <script render>return "Orange"</script>`
    );

    expect(toHTML(component.content)).toBe(
      `Best color: <script render="func">return "Orange"</script>`
    );
  });

  it("on script with yield", () => {
    const component = compile(
      "test",
      "test.html",
      `Plants: <script render>yield "Acacia"</script>`
    );

    expect(toHTML(component.content)).toBe(
      `Plants: <script render="gen">yield "Acacia"</script>`
    );
  });

  it("on script with delegating yield", () => {
    const component = compile(
      "test",
      "test.html",
      `Primes: {yield* computePrimes(5)}`
    );

    expect(toHTML(component.content)).toBe(
      `Primes: <script render="gen">yield* computePrimes(5)</script>`
    );
  });
  
  it("on script with HTML literal", () => {
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

  it("on shorthand with HTML literal", () => {
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

  it("on shorthand with HTML literal with shorthand", () => {
    const component = compile(
      "test",
      "test.html",
      `12:00 {canEdit ? (<button>{strings.edit}</button>) : ""}`
    );

    expect(component.htmlLiterals).toHaveLength(1);
    expect(toHTML(component.htmlLiterals[0])).toBe(
      `<button><script render="expr">strings.edit</script></button>`
    );
    expect(toHTML(component.content)).toBe(
      `12:00 <script render="expr">canEdit ?  (__renderHTMLLiteral__(0))  : ""</script>`
    );
  });

  it("on shorthand with HTML literal with shorthand with HTML literal", () => {
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
    expect(toHTML(component.content)).toBe(`<script render="expr">"Here " +  (__renderHTMLLiteral__(0)) </script>`);
  });
});
