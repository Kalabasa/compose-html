import { Page, extractScriptBundles } from "builder/bundler";
import { compile } from "compiler/compiler";
import { Component } from "compiler/component";
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
  const barComponent = compile(
    "bar",
    "bar.html",
    `<script client>console.log("bar");</script>`
  );
  const bazComponent = compile(
    "baz",
    "baz.html",
    `<script client>console.log("baz");</script>`
  );
  const asyncScriptComponent = compile(
    "async",
    "async.html",
    `<script client async>console.log("async");</script>`
  );
  const moduleScriptComponent = compile(
    "module",
    "module.html",
    `<script client type="module">console.log("module");</script>`
  );
  const deferScriptComponent = compile(
    "defer",
    "defer.html",
    `<script client defer>console.log("defer");</script>`
  );

  const components = new Set([
    externalScriptComponent,
    fooComponent,
    barComponent,
    bazComponent,
    moduleScriptComponent,
    asyncScriptComponent,
    deferScriptComponent,
  ]);

  it("keeps external scripts", async () => {
    const pageWithExternal = await createPage([externalScriptComponent]);

    const bundles = extractScriptBundles([pageWithExternal], 0, "", components);

    expect(bundles).toHaveLength(0);
    expect(toHTML(pageWithExternal.nodes)).toBe(
      `<html><head><script src="https://external.cdn/script.js"></script></head><body></body></html>`
    );
  });

  it("extracts async scripts", async () => {
    const pageWithFooAsync = await createPage([
      fooComponent,
      asyncScriptComponent,
    ]);

    const bundles = extractScriptBundles(
      [pageWithFooAsync],
      Infinity,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`console.log("async");`);
    expect(toHTML(pageWithFooAsync.nodes)).toBe(
      `<html><head><script async="" src="${bundles[0].src}"></script><script>console.log("foo");</script></head><body></body></html>`
    );
  });

  it("bundles common scripts", async () => {
    const pageWithFoo = await createPage([fooComponent]);
    const pageWithFooBar = await createPage([fooComponent, barComponent]);

    const bundles = extractScriptBundles(
      [pageWithFoo, pageWithFooBar],
      2,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`console.log("foo");`);
    expect(toHTML(pageWithFoo.nodes)).toBe(
      `<html><head><script src="${bundles[0].src}"></script></head><body></body></html>`
    );
    expect(toHTML(pageWithFooBar.nodes)).toBe(
      `<html><head><script>console.log("bar");</script><script src="${bundles[0].src}"></script></head><body></body></html>`
    );
  });

  it("bundles common module scripts", async () => {
    const pageWithModule = await createPage([moduleScriptComponent]);
    const pageWithModuleBar = await createPage([moduleScriptComponent, barComponent]);

    const bundles = extractScriptBundles(
      [pageWithModule, pageWithModuleBar],
      2,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`console.log("module");`);
    expect(toHTML(pageWithModule.nodes)).toBe(
      `<html><head><script type="module" src="${bundles[0].src}"></script></head><body></body></html>`
    );
    expect(toHTML(pageWithModuleBar.nodes)).toBe(
      `<html><head><script>console.log("bar");</script><script type="module" src="${bundles[0].src}"></script></head><body></body></html>`
    );
  });

  it("merges common scripts", async () => {
    const pageWithFooBar = await createPage([fooComponent, barComponent]);
    const pageWithFooBarBaz = await createPage([
      fooComponent,
      barComponent,
      bazComponent,
    ]);

    const bundles = extractScriptBundles(
      [pageWithFooBar, pageWithFooBarBaz],
      2,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`console.log("bar");\nconsole.log("foo");`);
    expect(toHTML(pageWithFooBar.nodes)).toBe(
      `<html><head><script src="${bundles[0].src}"></script></head><body></body></html>`
    );
    expect(toHTML(pageWithFooBarBaz.nodes)).toBe(
      `<html><head><script>console.log("baz");</script><script src="${bundles[0].src}"></script></head><body></body></html>`
    );
  });

  it("doesn't merge scripts with different loading attributes", async () => {
    const pageWithFooAsync = await createPage([
      fooComponent,
      asyncScriptComponent,
    ]);
    const pageWithFooAsyncDefer = await createPage([
      fooComponent,
      asyncScriptComponent,
      deferScriptComponent,
    ]);

    const bundles = extractScriptBundles(
      [pageWithFooAsync, pageWithFooAsyncDefer],
      2,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(2);
    expect(bundles.map((bundle) => bundle.src).sort()).toEqual([
      "scripts/async.js",
      "scripts/foo.js",
    ]);
  });

  it("extracts inline async scripts from page", async () => {
    const pageComponent = compile(
      "pageWithInlineAsync",
      `pageWithInlineAsync.html`,
      `<html><head><script async>console.log("page");</script></head></html>`
    );

    const nodes = await new Renderer(new Map()).render(pageComponent);

    const bundles = extractScriptBundles(
      [
        {
          pagePath: pageComponent.filePath,
          nodes,
        },
      ],
      Infinity,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(1);
    expect(bundles[0].code).toBe(`console.log("page");`);
    expect(toHTML(nodes)).toBe(
      `<html><head><script async="" src="${bundles[0].src}"></script></head><body></body></html>`
    );
  });

  it("extracts inline async module scripts in page", async () => {
    const pageComponent = compile(
      "pageWithInlineAsync",
      `pageWithInlineAsync.html`,
      `<html><head><script type="module" async>console.log("page1");</script><script type="module" async>console.log("page2");</script></head></html>`
    );

    const nodes = await new Renderer(new Map()).render(pageComponent);

    const bundles = extractScriptBundles(
      [
        {
          pagePath: pageComponent.filePath,
          nodes,
        },
      ],
      Infinity,
      "scripts/",
      components
    );

    expect(bundles).toHaveLength(2);
    expect(bundles[0].code).toBe(`console.log("page1");`);
    expect(bundles[1].code).toBe(`console.log("page2");`);
    expect(toHTML(nodes)).toBe(
      `<html><head><script type="module" async="" src="${bundles[0].src}"></script><script type="module" async="" src="${bundles[1].src}"></script></head><body></body></html>`
    );
  });

  async function createPage(components: Component[]): Promise<Page> {
    const componentsHTML = components
      .map((component) => `<${component.name}/>`)
      .join("");

    const name =
      "pageWith" +
      components.map((component) => component.name.toUpperCase()).join("");

    const pageComponent = compile(
      name,
      `${name}.html`,
      `<html>${componentsHTML}</html>`
    );

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
