import { compile } from "compiler/compiler";
import { toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";

describe("renderer", () => {
  it("renders plain HTML", async () => {
    const renderer = new Renderer();
    const output = await renderer.render(
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

  it("renders unknown HTML elements as is", async () => {
    const renderer = new Renderer();
    const output = await renderer.render(
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

  it("renders <template> correctly", async () => {
    const renderer = new Renderer();
    const output = await renderer.render(
      compile("test", "test.html", `<template>Quintessece</template>`)
    );

    expect(toHTML(output)).toBe(`<template>Quintessece</template>`);
  });

  it("renders dynamic attributes", async () => {
    const renderer = new Renderer();
    const output = await renderer.render(
      compile(
        "test",
        "test.html",
        `<img :class="a" src="{b}" alt="Test"><script static>const a = "va"; const b = "vb";</script>`
      )
    );

    expect(toHTML(output)).toBe(`<img class="va" src="vb" alt="Test">`);
  });

  it("renders spread attributes", async () => {
    const renderer = new Renderer(
      new Map([
        ["inner", compile("inner", "inner.html", "<div {...attrs}>inner</div>")],
      ])
    );
    const output = await renderer.render(
      compile("test", "test.html", `<inner class="foo" data-bar="x"/>`)
    );

    expect(toHTML(output)).toBe(`<div class="foo" data-bar="x">inner</div>`);
  });

  it("renders a page component", async () => {
    const renderer = new Renderer();
    const output = await renderer.render(
      compile(
        "test",
        "test.html",
        `<html><head><title>foo</title></head><body>bar</body></html>`
      )
    );

    expect(toHTML(output)).toBe(
      `<html><head><title>foo</title></head><body>bar</body></html>`
    );
  });

  it("renders component in named slot", async () => {
    const renderer = new Renderer(
      new Map([
        ["outer", compile("outer", "outer.html", `<div><h1><slot name="target" /></h1><slot /></div>`)],
        ["inner", compile("inner", "inner.html", `<span><slot /></span>`)],
      ])
    );
    const output = await renderer.render(
      compile("test", "test.html", `<outer><inner slot="target">foo</inner>bar</outer>`)
    );

    expect(toHTML(output)).toBe(`<div><h1><span>foo</span></h1>bar</div>`);
  });

  it("renders combined metadata in a page", async () => {
    const myMeta = compile(
      "my-meta",
      "my-meta.html",
      `<head><meta name="origin" content="local"></head>`
    );
    const renderer = new Renderer(new Map([["my-meta", myMeta]]));
    const output = await renderer.render(
      compile(
        "test",
        "test.html",
        `<html><head><title>foo</title></head><body><my-meta/>bar</body></html>`
      )
    );

    expect(toHTML(output)).toBe(
      `<html><head><title>foo</title><meta name="origin" content="local"></head><body>bar</body></html>`
    );
  });

  it("orders script dependencies correctly", async () => {
    const componentA = compile(
      "a",
      "a.html",
      "<b/><c/><script client>a</script>"
    );
    const componentB = compile(
      "b",
      "b.html",
      "<c/><d/><script client>b</script>"
    );
    const componentC = compile("c", "c.html", "<d/><script client>c</script>");
    const componentD = compile("d", "d.html", "<script client>d</script>");
    const renderer = new Renderer(
      new Map([
        ["a", componentA],
        ["b", componentB],
        ["c", componentC],
        ["d", componentD],
      ])
    );
    const output = await renderer.render(
      compile("test", "test.html", `<html><a/></html>`)
    );

    expect(output).toHaveLength(1);
    expect(
      Array.from((output[0] as Element).querySelectorAll("script")).map(
        (script) => script.innerHTML
      )
    ).toEqual(["d", "c", "b", "a"]);
  });
});
