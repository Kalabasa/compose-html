import { appendChild, childNodesOf, stableChildNodesOf } from "dom/dom";
import { JSDOM } from "jsdom";

const { document } = new JSDOM("", { contentType: "text/html" }).window;

describe("appendChild", () => {
  it("appends a child node to a parent node", () => {
    const parent = document.createElement("div");
    const child = document.createElement("p");

    appendChild(parent, child);

    expect(parent.childNodes).toContain(child);
  });

  it("appends a child node to a template element", () => {
    const parent = document.createElement("template");
    const child = document.createElement("p");

    appendChild(parent, child);

    expect(parent.content.childNodes).toContain(child);
  });
});

describe("childNodesOf", () => {
  it("returns the child nodes of a parent node", () => {
    const parent = document.createElement("div");
    const child1 = document.createElement("p");
    const child2 = document.createElement("span");

    parent.appendChild(child1);
    parent.appendChild(child2);

    expect(childNodesOf(parent)).toEqual(parent.childNodes);
  });

  it("returns the child nodes of a template element", () => {
    const parent = document.createElement("template");
    const child1 = document.createElement("p");
    const child2 = document.createElement("span");

    parent.content.appendChild(child1);
    parent.content.appendChild(child2);

    expect(childNodesOf(parent)).toEqual(parent.content.childNodes);
  });
});

describe("stableChildNodesOf", () => {
  it("returns a stable iterable of the child nodes of a parent node", () => {
    const parent = document.createElement("div");
    const child1 = document.createElement("p");
    const child2 = document.createElement("span");

    parent.appendChild(child1);
    parent.appendChild(child2);

    const childNodes = stableChildNodesOf(parent);

    parent.removeChild(child1);

    expect(childNodes).toEqual([child1, child2]);
  });
});
