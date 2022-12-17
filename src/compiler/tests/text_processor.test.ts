import { TextProcessor } from "compiler/text_processor";
import { JSDOM } from "jsdom";

describe("TextProcessor", () => {
  const { document } = new JSDOM("", { contentType: "text/html" }).window;

  let processor: TextProcessor;
  let root: Element;

  beforeEach(() => {
    root = document.createElement("div");
    root.innerHTML = "Text node 1<div>Non-text node</div>Text node 2";

    processor = new TextProcessor(root);
  });

  it("processes text nodes correctly", () => {
    const read = processor.readUntil(5);
    expect(read).toEqual(["Text "]);
  });

  it("processes non-text nodes correctly", () => {
    const read = processor.readUntil(16);
    expect(read).toEqual(["Text node 1", root.querySelector("div")!, "Text "]);
  });

  it("remembers the last read index", () => {
    const read1 = processor.readUntil(3);
    const read2 = processor.readUntil(6);
    const read3 = processor.readUntil(9);
    expect(read1).toEqual(["Tex"]);
    expect(read2).toEqual(["t n"]);
    expect(read3).toEqual(["ode"]);
  });

  it("returns an empty array when all text has been processed", () => {
    processor.readUntil(16);
    const read = processor.readUntil(16);
    expect(read).toEqual([]);
  });
});
