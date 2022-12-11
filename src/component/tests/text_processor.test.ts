import { TextProcessor } from "component/text_processor";
import { createElement, createTextNode, parse } from "dom/dom";

describe("TextProcessor", () => {
  it("reads a Text node", () => {
    const node = createTextNode("hello, world");
    const tp = new TextProcessor(node);
    expect(tp.readUntil(5)).toEqual(["hello"]);
    expect(tp.readUntil(7)).toEqual([", "]);
    expect(tp.readUntil(999)).toEqual(["world"]);
  });

  it("reads a fragment with text", () => {
    const fragment = parse("hello, world");
    const tp = new TextProcessor(fragment);
    expect(tp.readUntil(5)).toEqual(["hello"]);
    expect(tp.readUntil(7)).toEqual([", "]);
    expect(tp.readUntil(999)).toEqual(["world"]);
  });

  it("reads content elements", () => {
    const fragment = parse("hello, <b>world</b> again");
    const tp = new TextProcessor(fragment);
    expect(tp.readUntil(5)).toEqual(["hello"]);
    expect(tp.readUntil(7)).toEqual([", "]);
    expect(tp.readUntil(999)).toEqual([
      parse("<b>world</b>").childNodes[0],
      " again",
    ]);
  });

  it("reads an Element node", () => {
    const element = createElement("p");
    element.innerHTML = "hello, <b>world</b> again";
    const tp = new TextProcessor(element);
    expect(tp.readUntil(5)).toEqual(["hello"]);
    expect(tp.readUntil(7)).toEqual([", "]);
    expect(tp.readUntil(999)).toEqual([
      parse("<b>world</b>").childNodes[0],
      " again",
    ]);
  });
});
