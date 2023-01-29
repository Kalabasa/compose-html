import { compile } from "compiler/compiler";
import { childNodesOf, parse, toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";
import { renderComponent } from "renderer/render_component";

describe("render_component", () => {
  const renderList = (nodes: Iterable<Node>) => {
    const renderer = new Renderer();
    return renderer.renderList(nodes);
  };

  it("simple", async () => {
    const component = compile(
      "welcome-banner",
      "test.html",
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
    const output = await renderComponent(component, [], [], renderList);

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("with slots", async () => {
    const component = compile(
      "welcome-banner",
      "test.html",
      `<div class="header"><h1><slot name="header"/></h1></div><p><slot /></p>`
    );
    const output = await renderComponent(
      component,
      [],
      [
        ...childNodesOf(
          parse(`<template slot="header">Hello</template>What's up?`)
        ),
      ],
      renderList
    );

    expect(toHTML(output)).toBe(
      `<div class="header"><h1>Hello</h1></div><p>What's up?</p>`
    );
  });

  it("with slot fallbacks", async () => {
    const component = compile(
      "test",
      "test.html",
      `<p><slot name="content">Uh oh</slot></p>`
    );
    const output = await renderComponent(component, [], [], renderList);

    expect(toHTML(output)).toBe(`<p>Uh oh</p>`);
  });

  it("override attributes via spread attributes", async () => {
    const renderer = new Renderer(
      new Map([
        [
          "inner",
          compile(
            "inner",
            "inner.html",
            `<div data-pre="pre" ...attrs data-post="post">inner</div>`
          ),
        ],
      ])
    );
    const output = await renderer.render(
      compile("test", "test.html", `<inner data-pre="foo" data-post="foo"/>`)
    );

    expect(toHTML(output)).toBe(
      `<div data-pre="foo" data-post="post">inner</div>`
    );
  });
});
