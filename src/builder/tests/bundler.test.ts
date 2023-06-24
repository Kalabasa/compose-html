import { Page, extractScriptBundles } from "builder/bundler";
import { compile } from "compiler/compiler";
import { toHTML } from "dom/dom";
import { Renderer } from "renderer/renderer";

describe("extractScriptBundles", () => {
  const externalScriptComponent = compile(
    "external",
    "external.html",
    `<script src="https://external.cdn/script.js"></script>`
  );
  const fooComponent = compile(
    "foo",
    "foo.html",
    `<script client>console.log("foo");</script>`
  );
  const asyncScriptComponent = compile(
    "async",
    "async.html",
    `<script client async>console.log("world hello");</script>`
  );
  const deferScriptComponent = compile(
    "defer",
    "defer.html",
    `<script client defer>console.log("the end");</script>`
  );

  const components = new Set([
    externalScriptComponent,
    fooComponent,
    asyncScriptComponent,
    deferScriptComponent,
  ]);

  const createPageWithExternal = () =>
    createPage("pageWithExternal", `<html><external/></html>`);
  const createPageWithFoo = () =>
    createPage("pageWithFoo", `<html><foo/></html>`);
  const createPageWithFooAsync = () =>
    createPage("pageWithFooAsync", `<html><foo/><async/></html>`);
  const createPageWithFooDefer = () =>
    createPage("pageWithFooDefer", `<html><foo/><defer/></html>`);
    const createPageWithScript = () =>
      createPage("pageWithScript", `<html><script client defer>alert("hey")</script></html>`);

  it("keeps external scripts", async () => {
    const pageWithExternal = await createPageWithExternal();

    const bundles = extractScriptBundles([pageWithExternal], 0, "", components);

    expect(bundles).toHaveLength(0);
    expect(toHTML(pageWithExternal.nodes)).toBe(
      `<html><head><script src="https://external.cdn/script.js"></script></head><body></body></html>`
    );
  });

  it("keeps inline scripts", async () => {
    const pageWithScript = await createPageWithScript();

    const bundles = extractScriptBundles([pageWithScript], 0, "", components);

    expect(bundles).toHaveLength(0);
    expect(toHTML(pageWithScript.nodes)).toBe(
      `<html><head></head><body><script defer="">alert("hey")</script></body></html>`
    );
  });

  it("extracts async scripts", async () => {
    const pageWithFooAsync = await createPageWithFooAsync();

    const bundles = extractScriptBundles(
      [pageWithFooAsync],
      Infinity,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(
      `<script async="">console.log("world hello");</script>`
    );
    expect(toHTML(pageWithFooAsync.nodes)).toBe(
      `<html><head><script async="" src="${bundles[0].src}"></script><script>console.log("foo");</script></head><body></body></html>`
    );
  });

  it("bundles common scripts", async () => {
    const pageWithFoo = await createPageWithFoo();
    const pageWithFooDefer = await createPageWithFooDefer();

    const bundles = extractScriptBundles(
      [pageWithFoo, pageWithFooDefer],
      2,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`<script>console.log("foo");</script>`);
    expect(toHTML(pageWithFoo.nodes)).toBe(
      `<html><head><script src="${bundles[0].src}"></script></head><body></body></html>`
    );
    expect(toHTML(pageWithFooDefer.nodes)).toBe(
      `<html><head><script src="${bundles[0].src}"></script></head><body><script defer="">console.log("the end");</script></body></html>`
    );
  });

  async function createPage(name: string, html: string): Promise<Page> {
    const pageComponent = compile(name, `${name}.html`, html);

    const nodes = await new Renderer(
      new Map(
        [...components.values()].map((component) => [component.name, component])
      )
    ).render(pageComponent);

    return {
      pagePath: pageComponent.filePath,
      nodes,
    };
  }
});
