import { compile, compileFile } from "component/compiler";
import { Component } from "component/component";
import { parse, toHTML } from "dom/dom";
import path from "node:path";
import { renderScripts } from "renderer/render_scripts";

describe("render_scripts", () => {
  let component: Component;

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

    renderScripts(content, component);

    expect(toHTML(content)).toBe("<div>One plus one is 2.</div>");
  });

  it("reads script local variable", () => {
    const content = parse(
      `<div>Foo? <script render="expr">foo</script>.</div>`
    );

    renderScripts(content, component);

    expect(toHTML(content)).toBe("<div>Foo? 42.</div>");
  });

  it("renders html template literal", () => {
    const content = parse(
      '<script render="expr">html`<p>literally ${foo}</p>`</script>'
    );

    renderScripts(content, component);

    expect(toHTML(content)).toBe("<p>literally 42</p>");
  });

  it("executes a script local function", () => {
    const content = parse(`<script render="expr">bar()</script>`);
    const component = compile(
      "test",
      "test.html",
      `<script static>function bar() { return "Hey!"; }</script>`
    );

    renderScripts(content, component);

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

    renderScripts(content, component);

    expect(toHTML(content)).toBe("a/b");
  });

  it("imports a relative module", () => {
    const filePath = path.resolve(__dirname, "data/root.html");
    const content = parse(`<script render="expr">bar</script>`);
    const component = compileFile(filePath);

    renderScripts(content, component);

    expect(toHTML(content)).toBe("88");
  });
});
