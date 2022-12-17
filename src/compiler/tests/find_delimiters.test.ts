import { findDelimiters } from "compiler/find_delimiters";
import { createElement, createTextNode } from "dom/dom";

describe("findDelimiters", () => {
  it("finds delimiters in a text node", () => {
    const node = createTextNode("foo[[bar]]baz");
    const delimiters = findDelimiters("[[", "]]", node);
    expect(delimiters).toEqual([
      { index: 3, levelInside: 1, type: "[[" },
      { index: 8, levelInside: 1, type: "]]" },
    ]);
  });

  it("finds no delimiters if there are no delimiters", () => {
    const node = createTextNode("foobar");
    const delimiters = findDelimiters("[[", "]]", node);
    expect(delimiters).toEqual([]);
  });

  it("ignores escaped delimiters", () => {
    const node = createTextNode("foo\\[[bar]]baz");
    const delimiters = findDelimiters("[[", "]]", node);
    expect(delimiters).toEqual([{ index: 9, levelInside: 0, type: "]]" }]);
  });

  it("returns correct levels of nested delimiters", () => {
    const div = createElement("div");
    div.innerHTML = "foo[[bar[[baz]]qux]]fizz";
    const delimiters = findDelimiters("[[", "]]", div);
    expect(delimiters).toEqual([
      { index: 3, levelInside: 1, type: "[[" },
      { index: 8, levelInside: 2, type: "[[" },
      { index: 13, levelInside: 2, type: "]]" },
      { index: 18, levelInside: 1, type: "]]" },
    ]);
  });

  it("finds delimiters in child text nodes only", () => {
    const div = createElement("div");
    div.innerHTML = "foo[[bar<div>[[baz]]</div>qux]]fizz";
    const delimiters = findDelimiters("[[", "]]", div);
    expect(delimiters).toEqual([
      { index: 3, levelInside: 1, type: "[[" },
      { index: 11, levelInside: 1, type: "]]" },
    ]);
  });
});
