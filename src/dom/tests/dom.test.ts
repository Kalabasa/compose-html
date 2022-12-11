import { toHTML } from "dom/dom";
import { JSDOM } from "jsdom";

describe("dom", () => {
  it("toHTML", () => {
    const fragment = JSDOM.fragment("<div>Hello</div>");
    expect(toHTML(fragment)).toBe("<div>Hello</div>");
  });
});
