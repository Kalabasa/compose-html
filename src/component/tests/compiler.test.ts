import { compile } from "component/compiler";
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
      `<div>Hi {name}</div><script>const name = "Foo";</script><script client>console.log(name);</script>`
    );

    expect(component.name).toBe("test");
    expect(toHTML(component.source)).toBe(
      `<div>Hi {name}</div><script>const name = "Foo";</script><script client="">console.log(name);</script>`
    );
    expect(toHTML(component.content)).toBe(`<div>Hi {name}</div>`);
    expect(toHTML(component.scripts)).toBe(
      `<script>const name = "Foo";</script>`
    );
    expect(toHTML(component.clientScripts)).toBe(
      `<script client="">console.log(name);</script>`
    );
  });
});
