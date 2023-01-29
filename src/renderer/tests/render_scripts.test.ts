import { compile, compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { createTextNode, parse, toHTML } from "dom/dom";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { renderScripts } from "renderer/render_scripts";

describe("render_scripts", () => {
  let component: Component;
  const renderList = (nodes: Iterable<Node>) => {
    const renderer = new Renderer();
    return renderer.renderList(nodes);
  };

  beforeEach(() => {
    component = compile(
      "test",
      "test.html",
      `<script static="">const foo = 42;</script>`
    );
  });

  it("independent expression", () => {
    const content = parse(
      `<div>One plus one is <script render="expr">1 + 1</script>.</div>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("<div>One plus one is 2.</div>");
  });

  it("renders return value of a func type", () => {
    const content = parse(
      `<script render="func">return "foo"</script>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("foo");
  });

  it("renders yielded values of a gen type", () => {
    const content = parse(
      `<script render="gen">yield "foo"; yield "bar";</script>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("foobar");
  });

  it("reads script local variable", () => {
    const content = parse(
      `<div>Foo? <script render="expr">foo</script>.</div>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("<div>Foo? 42.</div>");
  });

  it("reads attribute", () => {
    const content = parse(
      `<div>Yeah? <script render="expr">attrs.yeah</script>.</div>`
    );

    renderScripts(content, component, { yeah: "Nah" }, [], renderList);

    expect(toHTML(content)).toBe("<div>Yeah? Nah.</div>");
  });

  it("reads children", () => {
    const content = parse(`<script render="expr">children[0]</script>`);

    renderScripts(content, component, {}, [createTextNode("foo")], renderList);

    expect(toHTML(content)).toBe("foo");
  });

  it("renders html template literal", () => {
    const content = parse(
      '<script render="expr">html`<p>literally ${foo}</p>`</script>'
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("<p>literally 42</p>");
  });

  it("executes a script local function", () => {
    const content = parse(`<script render="expr">bar()</script>`);
    const component = compile(
      "test",
      "test.html",
      `<script static>function bar() { return "Hey!"; }</script>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("Hey!");
  });

  it("imports a node module", () => {
    const content = parse(`<script render="expr">bar('a', 'b')</script>`);
    const component = compile(
      "test",
      "test.html",
      `\
<script static>
  const path = require("node:path");
  function bar(a, b) {
    return path.join(a, b);
  }
</script>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("a/b");
  });

  it("imports a relative module", () => {
    const filePath = path.resolve(__dirname, "data/root.html");
    const content = parse(`<script render="expr">bar</script>`);
    const component = compileFile(filePath);

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("88");
  });

  it("renders dynamic attributes", () => {
    const content = parse(`<img class="{a}" src="{b}" alt="Test">`);
    const component = compile(
      "test",
      "test.html",
      `<script static>const a = "va"; const b = "vb";</script>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<img class="va" src="vb" alt="Test">`);
  });

  it("does not render null attributes", () => {
    const content = parse(
      `<div data-foo="{null}" data-bar="{undefined}"></div>`
    );

    renderScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<div></div>`);
  });
});
