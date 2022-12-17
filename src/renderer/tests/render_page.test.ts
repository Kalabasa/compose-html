import { toHTML } from "dom/dom";
import { JSDOM } from "jsdom";
import { renderPage } from "renderer/render_page";

describe("renderPage", () => {
  const { document } = new JSDOM("", { contentType: "text/html" }).window;

  it("should render a page with the given body content", () => {
    const bodyContent = [document.createTextNode("body content")];
    const data = {
      metadata: [],
      clientScripts: [],
      styles: [],
    };

    const result = renderPage(bodyContent, data);

    expect(toHTML(result)).toEqual(
      "<html><head></head><body>body content</body></html>"
    );
  });

  it("should render a page with the given metadata", () => {
    const meta = document.createElement("meta");
    meta.name = "origin";
    meta.content = "local";
    const title = document.createElement("title");
    title.innerHTML = "foo";

    const data = {
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
    const style = document.createElement("style");
    style.innerHTML = "body { margin: 0; }";

    const data = {
      metadata: [title],
      clientScripts: [script],
      styles: [style],
    };

    const result = renderPage([], data);

    expect(toHTML(result)).toEqual(
      `<html><head><title>foo</title><style>body { margin: 0; }</style><script>console.log(1);</script></head><body></body></html>`
    );
  });
});
