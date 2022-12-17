import { JSDOM } from "jsdom";
import {
  isDocumentFragment,
  isElement,
  isNode,
  isTemplateElement,
  isText,
} from "dom/dom";

describe("is", () => {
  const { document } = new JSDOM("", { contentType: "text/html" }).window;

  const allTests = [
    isText,
    isNode,
    isElement,
    isTemplateElement,
    isDocumentFragment,
  ];

  const cases: Array<{ value: any; tests: Array<(value: any) => boolean> }> = [
    {
      value: document.createDocumentFragment(),
      tests: [isNode, isDocumentFragment],
    },
    {
      value: document.createElement("div"),
      tests: [isNode, isElement],
    },
    {
      value: document.createTextNode("Hello, world!"),
      tests: [isNode, isText],
    },
    {
      value: document.createElement("template"),
      tests: [isNode, isElement, isTemplateElement],
    },
    {
      value: null,
      tests: [],
    },
    {
      value: undefined,
      tests: [],
    },
    {
      value: "string",
      tests: [],
    },
    {
      value: 123,
      tests: [],
    },
    {
      value: {},
      tests: [],
    },
  ];

  it.each(
    cases.map((item) => ({
      desc: `${item.value} to be (${item.tests.map((f) => f.name)})`,
      ...item,
    }))
  )("$desc", ({ value, tests }) => {
    for (const isIt of tests) {
      expect(isIt(value)).toBe(true);
    }
    for (const isOther of allTests) {
      if (tests.includes(isOther)) continue;
      expect(isOther(value)).toBe(false);
    }
  });
});
