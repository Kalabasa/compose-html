import { compile } from "component/compiler";
import { Component } from "component/component";
import { childNodesOf, isElement, isText, parse, toHTML } from "dom/dom";
import glob from "glob";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { createLogger } from "util/log";

type Example = {
  component: Component;
};
type ExampleWithExpectation = Example & {
  expected: Node[];
  skip: boolean;
};

const logger = createLogger(path.basename(__filename));

// dirName -> componentName -> Component
const componentDir = new Map<string, Map<string, Component>>();

const examples = glob
  .sync(path.resolve(__dirname, "**/*.html"))
  .map((filePath) => compileExample(filePath));

for (const example of examples) {
  const dirName = getDirName(example.component.filePath);

  let componentMap = componentDir.get(dirName);
  if (!componentMap) componentDir.set(dirName, (componentMap = new Map()));
  componentMap.set(example.component.name, example.component);

  logger.debug(`Loaded component in ${dirName}: <${example.component.name}>`);

  const isIndexHtml = example.component.filePath.endsWith("/index.html");

  if (isIndexHtml && !hasExpectation(example)) {
    logger.warn(
      "Example has no <expect>:",
      path.relative(__dirname, example.component.filePath)
    );
  }
}

describe("Examples", () => {
  for (const example of examples) {
    const { filePath } = example.component;
    const isIndexHtml = filePath.endsWith("/index.html");

    if (!hasExpectation(example)) continue;

    const dirName = getDirName(filePath);

    const testName = isIndexHtml
      ? dirName
      : `${dirName} ${path.basename(filePath, ".html")}`;

    const testFunc = example.skip ? test.skip : test;

    testFunc(testName, () => {
      const { component, expected } = example;
      const renderer = new Renderer(componentDir.get(dirName));
      const output = renderer.render(component);
      expect(toHTML(output).trim()).toBe(toHTML(expected!).trim());
    });
  }
});

function compileExample(filePath: string): Example | ExampleWithExpectation {
  const sourceText = readFileSync(filePath);
  const sourceNodes = [...childNodesOf(parse(sourceText.toString()))];

  let expected = undefined;
  let skip = undefined;

  for (let i = sourceNodes.length - 1; i--; i >= 0) {
    const node = sourceNodes[i];

    if (isElement(node) && node.tagName === "EXPECT") {
      if (expected) throw new Error("Only one <expect> is expected.");

      expected = extractExpectedNodes(node);
      skip = node.hasAttribute("skip");

      node.remove();
      sourceNodes.splice(i, 1);
    }
  }

  const component = compile(
    path.basename(filePath, ".html"),
    filePath,
    toHTML(sourceNodes)
  );

  return {
    component,
    expected,
    skip,
  };
}

function extractExpectedNodes(expectedElement: Element): Node[] {
  const children = Array.from(childNodesOf(expectedElement));
  if (!children.length) return [];

  // immediate child element, assume one-liner, no indent
  if (!isText(children[0])) return children;

  // detect indentation
  const indentation =
    /^([ \t]+)/gm.exec(children[0].textContent ?? "")?.[1] ?? "";
  const indentRegExp = new RegExp("^" + indentation, "gm");

  return children.map((node) => deindent(node, indentRegExp, false));
}

function deindent(node: Node, indentRegExp: RegExp, mutate: boolean): Node {
  const deindented = mutate ? node : node.cloneNode(true);

  if (isText(node)) {
    deindented.textContent =
      node.textContent?.replace(indentRegExp, "") ?? null;
  } else {
    for (const child of childNodesOf(deindented)) {
      deindent(child, indentRegExp, true);
    }
  }

  return deindented;
}

function getDirName(filePath: string) {
  return path.relative(__dirname, path.dirname(filePath));
}

function hasExpectation(example: Example): example is ExampleWithExpectation {
  return (example as Partial<ExampleWithExpectation>).expected != undefined;
}
