import { compile, compileFile } from "component/compiler";
import { Component } from "component/component";
import { parse, toHTML } from "dom/dom";
import { interpolate } from "renderer/interpolate";
import path from "node:path";

describe("interpolate", () => {
  let component: Component;

  beforeEach(() => {
    component = compile(
      "test",
      "test.html",
      `<script>const foo = 42;</script>`
    );
  });

  it("independent expression", () => {
    const content = parse("<div>One plus one is {1 + 1}.</div>");

    interpolate(content, component);

    expect(toHTML(content)).toBe("<div>One plus one is 2.</div>");
  });

  it("reads script local variable", () => {
    const content = parse("<div>Foo? {foo}.</div>");

    interpolate(content, component);

    expect(toHTML(content)).toBe("<div>Foo? 42.</div>");
  });

  it("executes a script local function", () => {
    const content = parse("{foo()}");
    const component = compile(
      "test",
      "test.html",
      `<script>function foo() { return "Hey!"; }</script>`
    );

    interpolate(content, component);

    expect(toHTML(content)).toBe("Hey!");
  });

  it("imports a node module", () => {
    const content = parse("{foo()}");
    const component = compile(
      "test",
      "test.html",
      `\
<script>
  const path = require("node:path");
  function foo() {
    return path.join("a", "b");
  }
</script>`
    );

    interpolate(content, component);

    expect(toHTML(content)).toBe("a/b");
  });

  it("imports a relative module", () => {
    const filePath = path.resolve(__dirname, "data/root.html");
    const content = parse("{foo}");
    const component = compileFile(filePath);

    interpolate(content, component);

    expect(toHTML(content)).toBe("88");
  });
});
