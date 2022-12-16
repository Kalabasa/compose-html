import { parse, toHTML } from "dom/dom";
import { format } from "util/log/format";

describe("dom", () => {
  it("parse then toHTML", () => {
    const fragment = parse("<div>Hello</div>");
    expect(toHTML(fragment)).toBe("<div>Hello</div>");
  });

  it("parse attribute without value", () => {
    const fragment = parse("<div disabled>Oy</div>");
    expect(toHTML(fragment)).toBe(`<div disabled="">Oy</div>`);
  });

  it("parse tag without closing tag", () => {
    const fragment = parse(`<img src="x">`);
    expect(toHTML(fragment)).toBe(`<img src="x">`);
  });

  it("parse html document", () => {
    const fragment = parse("<html><body>Yo</body></html>");
    console.log(format(fragment.childNodes));
    expect(toHTML(fragment)).toBe("<html><body>Yo</body></html>");
  });
});
