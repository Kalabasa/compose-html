import { compile } from "compiler/compiler";
import { toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";

describe("renderer", () => {
  it("on plain HTML", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      compile(
        "test",
        "test.html",
        `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
      )
    );

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("on unknown HTML", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      compile(
        "test",
        "test.html",
        `<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`
      )
    );

    expect(toHTML(output)).toBe(
      `<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`
    );
  });

  it("on <template>", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      compile("test", "test.html", `<template>Quintessece</template>`)
    );

    expect(toHTML(output)).toBe(`<template>Quintessece</template>`);
  });

  it("with dynamic attribute", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      compile(
        "test",
        "test.html",
        `<img :class="a" src="{b}" alt="Test"><script static>const a = "va"; const b = "vb";</script>`
      )
    );

    expect(toHTML(output)).toBe(`<img class="va" src="vb" alt="Test">`);
  });
});
