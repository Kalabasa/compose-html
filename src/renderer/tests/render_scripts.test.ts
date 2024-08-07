import { compile, compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { parse, toHTML } from "dom/dom";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { evaluateScripts } from "renderer/render_scripts";

describe("render_scripts", () => {
  let component: Component;

  const renderList = (nodes: Iterable<Node>) => {
    const nestTestComponent = compile(
      "nest-test",
      "nest-test.html",
      ":<slot />:"
    );

    const renderer = new Renderer(new Map([["nest-test", nestTestComponent]]));
    return renderer.renderList(nodes);
  };

  beforeEach(() => {
    component = compile(
      "test",
      "test.html",
      `<script static="">const foo = 42;</script>`
    );
  });

  it("independent expression", async () => {
    const content = parse(
      `<div>One plus one is <script render="expr">1 + 1</script>.</div>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("<div>One plus one is 2.</div>");
  });

  it("renders return value of a func type", async () => {
    const content = parse(`<script render="func">return "foo"</script>`);

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("foo");
  });

  it("renders async value of a func type", async () => {
    const content = parse(
      `<script render="func">return await Promise.resolve("foo")</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("foo");
  });

  it("renders yielded values of a gen type", async () => {
    const content = parse(
      `<script render="gen">yield "foo"; yield "bar";</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("foobar");
  });

  it("reads script local variable", async () => {
    const content = parse(
      `<div>Foo? <script render="expr">foo</script>.</div>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("<div>Foo? 42.</div>");
  });

  it("executes a script local function", async () => {
    const content = parse(`<script render="expr">bar()</script>`);
    const component = compile(
      "test",
      "test.html",
      `<script static>function bar() { return "Hey!"; }</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("Hey!");
  });

  it("imports a node module", async () => {
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

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("a/b");
  });

  it("imports a relative module", async () => {
    const filePath = path.resolve(__dirname, "data/root.html");
    const content = parse(`<script render="expr">bar</script>`);
    const component = compileFile(filePath);

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe("88");
  });

  it("renders dynamic attributes", async () => {
    const content = parse(`<img class="{a}" src="{b}" alt="Test">`);
    const component = compile(
      "test",
      "test.html",
      `<script static>const a = "va"; const b = "vb";</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<img class="va" src="vb" alt="Test">`);
  });

  it("renders async dynamic attributes", async () => {
    const content = parse(`<img src="{await foo()}">`);
    const component = compile(
      "test",
      "test.html",
      `<script static>async function foo() { return "foo"; }</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<img src="foo">`);
  });

  it("does not render null attributes", async () => {
    const content = parse(
      `<div data-foo="{null}" data-bar="{undefined}"></div>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<div></div>`);
  });

  it("renders nested HTML tags", async () => {
    const content = parse(
      '<script render="expr">html`<div>${renderInner()}</div>`</script>'
    );
    const component = compile(
      "test",
      "test.html",
      "<script static>function renderInner() { return html`<span>foo</span>`; }</script>"
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`<div><span>foo</span></div>`);
  });

  it("renders nested components", async () => {
    const content = parse(
      '<script render="gen">yield html`<nest-test>foo</nest-test>`; yield html`<nest-test>bar</nest-test>`</script>'
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(`:foo::bar:`);
  });

  it("renders arbitrary objects spreaded as attributes", async () => {
    const content = parse(`\
<script render="func">
  return html\`<div {...map}>My content</div>\`;
</script>`);

    const component = compile(
      "test",
      "test.html",
      `\
<script static="">
  const map = {
    'class': 'foo',
    ariaLabel: 'My label',
    hideMe: null,
  };
</script>`
    );

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(
      '<div class="foo" aria-label="My label">My content</div>'
    );
  });

  it("renders spreadAttrs function", async () => {
    const content = parse(`\
<script render="func">
  const map = {
    'class': 'foo',
    ariaLabel: 'My label',
    hideMe: null,
  };
  return html\`<div \${spreadAttrs(map)}>My content</div>\`;
</script>`);

    await evaluateScripts(content, component, {}, [], renderList);

    expect(toHTML(content)).toBe(
      '<div class="foo" aria-label="My label">My content</div>'
    );
  });
});
