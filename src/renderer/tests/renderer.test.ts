import { compile, Component } from "component/compiler";
import { toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";

describe("Renderer", () => {
  it("on plain HTML", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("on unknown HTML", () => {
    const renderer = new Renderer();
    const output = renderer.render(
      `<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`
    );

    expect(toHTML(output)).toBe(
      `<welcome-banner title="Welcome" subtitle="Let's go"></welcome-banner>`
    );
  });

  it("on <template>", () => {
    const renderer = new Renderer();
    const output = renderer.render(`<template>Quintessece</template>`);

    expect(toHTML(output)).toBe(`<template>Quintessece</template>`);
  });

  it("on a component", () => {
    const components = compileComponents({
      "welcome-banner": `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`,
    });
    const renderer = new Renderer(components);
    const output = renderer.render("<welcome-banner />");

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("on a component with slots", () => {
    const components = compileComponents({
      "welcome-banner": `<div class="header"><h1><slot name="header"/></h1></div><p><slot /></p>`,
    });
    const renderer = new Renderer(components);
    const output = renderer.render(
      `<welcome-banner><template slot="header">Hello</template>What's up?</welcome-banner>`
    );

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Hello</h1></div><p>What's up?</p>`
    );
  });
});

function compileComponents(
  dictionary: Record<string, string>
): Map<string, Component> {
  return new Map(
    Object.entries(dictionary).map(([name, source]) => [
      name,
      compile(name, source),
    ])
  );
}
