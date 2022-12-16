import { findDelimiters } from "compiler/find_delimiters";
import { createTextNode, parse } from "dom/dom";

describe("findDelimiters", () => {
  it("finds a pair of parentheses", () => {
    expect(findDelimiters("(", ")", createTextNode("a(b)c"))).toEqual([
      {
        index: 1,
        levelInside: 1,
        type: "(",
      },
      {
        index: 3,
        levelInside: 1,
        type: ")",
      },
    ]);
  });

  it("finds nested parentheses", () => {
    expect(findDelimiters("(", ")", createTextNode("a(b(c))d"))).toEqual([
      {
        index: 1,
        levelInside: 1,
        type: "(",
      },
      {
        index: 3,
        levelInside: 2,
        type: "(",
      },
      {
        index: 5,
        levelInside: 2,
        type: ")",
      },
      {
        index: 6,
        levelInside: 1,
        type: ")",
      },
    ]);
  });

  it("finds a longer patterns", () => {
    expect(findDelimiters("{{", "}}", createTextNode("a}{}{{b}}{}{c"))).toEqual(
      [
        {
          index: 4,
          levelInside: 1,
          type: "{{",
        },
        {
          index: 7,
          levelInside: 1,
          type: "}}",
        },
      ]
    );
  });

  it("finds top-level paretheses only", () => {
    expect(findDelimiters("(", ")", parse("a(b<i>:)</i>)c"))).toEqual([
      {
        index: 1,
        levelInside: 1,
        type: "(",
      },
      {
        index: 3,
        levelInside: 1,
        type: ")",
      },
    ]);
  });
});
