import { compile } from "compiler/compiler";
import { childNodesOf, parse, toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";
import { renderComponent } from "renderer/render_component";

describe("render_component", () => {
  it("simple", () => {
    const component = compile(
      "welcome-banner",
      "test.html",
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
    const output = renderComponent(component, [], [], new Renderer());

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("with slots", () => {
    const component = compile(
      "welcome-banner",
      "test.html",
      `<div class="header"><h1><slot name="header"/></h1></div><p><slot /></p>`
    );
    const output = renderComponent(
      component,
      [],
      [
        ...childNodesOf(
          parse(`<template slot="header">Hello</template>What's up?`)
        ),
      ],
      new Renderer()
    );

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Hello</h1></div><p>What's up?</p>`
    );
  });

  it("with slot fallbacks", () => {
    const component = compile(
      "test",
      "test.html",
      `<p><slot name="content">Uh oh</slot></p>`
    );
    const output = renderComponent(
      component,
      [],
      [],
      new Renderer()
    );

    expect(toHTML(output)).toBe(
      `<p>Uh oh</p>`
    );
  });
});
