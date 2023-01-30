import { DZ_PREFIX } from "dom/desensitize";
import { toHTML } from "dom/dom";
import { JSDOM } from "jsdom";
import { renderPage } from "renderer/render_page";

describe("renderPage", () => {
  const { document } = new JSDOM("", { contentType: "text/html" }).window;

  let testSkeleton: HTMLElement;

  beforeEach(() => {
    testSkeleton = document.createElement(`${DZ_PREFIX}html`);
    testSkeleton.appendChild(document.createElement(`${DZ_PREFIX}head`));
    testSkeleton.appendChild(document.createElement(`${DZ_PREFIX}body`));
  });

  it("should render a page with the given body content", () => {
    const bodyContent = [document.createTextNode("body content")];
    const data = {
      page: {
        skeleton: testSkeleton,
      },
      metadata: [],
      clientScripts: [],
      styles: [],
    };

    const result = renderPage(bodyContent, data);

    expect(toHTML(result)).toEqual(
      "<html><head></head><body>body content</body></html>"
    );
  });

  it("should render a page with the given skeleton", () => {
    const skeleton = document.createElement(`${DZ_PREFIX}html`);
    skeleton.innerHTML = `
  <${DZ_PREFIX}head></${DZ_PREFIX}head>
  <${DZ_PREFIX}body></${DZ_PREFIX}body>
`;

    const bodyContent = [document.createTextNode("body content")];

    const data = {
      page: {
        skeleton,
      },
      metadata: [],
      clientScripts: [],
      styles: [],
    };

    const result = renderPage(bodyContent, data);

    expect(toHTML(result)).toEqual(
      `\
<html>
  <head></head>
  <body>body content</body>
</html>`
    );
  });

  it("should render a page with the given metadata", () => {
    const meta = document.createElement("meta");
    meta.name = "origin";
    meta.content = "local";
    const title = document.createElement("title");
    title.innerHTML = "foo";

    const data = {
      page: {
        skeleton: testSkeleton,
      },
      metadata: [title, meta],
      clientScripts: [],
      styles: [],
    };

    const result = renderPage([], data);

    expect(toHTML(result)).toEqual(
      `<html><head><title>foo</title><meta name="origin" content="local"></head><body></body></html>`
    );
  });

  it("should render a page with the given page data", () => {
    const title = document.createElement("title");
    title.innerHTML = "foo";
    const script = document.createElement("script");
    script.innerHTML = "console.log(1);";
    const deferredScript = document.createElement("script");
    deferredScript.defer = true;
    deferredScript.innerHTML = "document.querySelector('*');";
    const style = document.createElement("style");
    style.innerHTML = "body { margin: 0; }";

    const data = {
      page: {
        skeleton: testSkeleton,
      },
      metadata: [title],
      clientScripts: [script, deferredScript],
      styles: [style],
    };

    const result = renderPage([], data);

    expect(toHTML(result)).toEqual(
      `<html><head><title>foo</title><style>body { margin: 0; }</style><script>console.log(1);</script></head><body><script>document.querySelector('*');</script></body></html>`
    );
  });
});
