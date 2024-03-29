import { expandSelfClosing } from "dom/expand_self_closing";

describe("expandSelfClosing", () => {
  const cases = [
    ["expands self-closing tags", "<x-marker/>", "<x-marker></x-marker>"],
    [
      "expands self-closing tags with attributes",
      `<x-marker foo/>`,
      `<x-marker foo></x-marker>`,
    ],
    ["expands slot tags", "<slot/>", "<slot></slot>"],
    ["does not expand known HTML tags", "<div/>", "<div/>"],
    ["does not close void elements", "<input>", "<input>"],
    ["does not expand self-closing void elements", "<input/>", "<input/>"],
    [
      "handles nesting correctly",
      "<div><x-marker/></div>",
      "<div><x-marker></x-marker></div>",
    ],
  ];

  it.each(cases)("%s", (_, input, output) =>
    expect(expandSelfClosing(input)).toBe(output)
  );
});
