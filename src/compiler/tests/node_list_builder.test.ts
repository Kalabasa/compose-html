import { NodeListBuilder } from "compiler/node_list_builder";
import { createElement, createTextNode, isText } from "dom/dom";

describe("NodeListBuilder", () => {
  it("appends nodes and text to the list", () => {
    const builder = new NodeListBuilder();
    const div = createElement("div");
    div.textContent = "Hello";
    const text = createTextNode(" world");

    builder.append(div, text);

    const nodes = builder.collect();

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toBe(div);
    expect(nodes[1]).toEqual(text);
  });

  it("concatenates adjacent text nodes", () => {
    const builder = new NodeListBuilder();
    const text1 = createTextNode("Hello");
    const text2 = createTextNode(" world");

    builder.append(text1, text2);

    const nodes = builder.collect();

    expect(nodes).toHaveLength(1);
    expect(isText(nodes[0])).toBeTruthy();
    expect(nodes[0].textContent).toBe("Hello world");
  });

  it("ignores empty strings", () => {
    const builder = new NodeListBuilder();
    const text = createTextNode("Hello");

    builder.append(text, "", "world");

    const nodes = builder.collect();

    expect(nodes).toHaveLength(1);
    expect(isText(nodes[0])).toBeTruthy();
    expect(nodes[0].textContent).toBe("Helloworld");
  });
});
