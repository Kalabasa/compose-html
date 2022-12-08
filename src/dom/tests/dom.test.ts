import { createElement, createFragment, toHTML } from "dom/dom";

describe("dom", () => {
  it("toHTML", () => {
    const fragment = createFragment();
    const el = createElement("div");
    el.textContent = "Hello";
    fragment.appendChild(el);

    expect(toHTML(fragment)).toBe("<div>Hello</div>");
  });
});
