import { compile } from "compiler/compiler";
import { Component } from "compiler/component";
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
const componentDir = new Map<string, Map<string, () => Component>>();

const stubs = glob
  .sync(path.resolve(__dirname, "**/*.html"))
  .map((filePath) => {
    const dirName = path.relative(__dirname, path.dirname(filePath));
    const fileName = path.basename(filePath, ".html");

    const sourceText = readFileSync(filePath).toString();

    // quick parse only
    const expectTag = sourceText.match(
      /^(<expect\s*(?:\s+\w+(?:\s*=\s*\S+)?)*>)/gm
    )?.[0];

    // defer full compilation for when test is run
    let cache: ReturnType<typeof compileExample> | undefined;
    const compiled = () => {
      if (!cache) {
        cache = compileExample(filePath);
        logger.debug(`Compiled component in ${dirName}: ${fileName}`);
      }
      return cache;
    };

    return {
      fileName,
      dirName,
      filePath,
      expectTag,
      compiled,
    };
  });

for (const stub of stubs) {
  let componentMap = componentDir.get(stub.dirName);
  if (!componentMap) componentDir.set(stub.dirName, (componentMap = new Map()));
  componentMap.set(stub.fileName, () => stub.compiled().component);

  logger.debug(`Loaded stub in ${stub.dirName}: ${stub.fileName}`);

  const isIndexHtml = stub.filePath.endsWith("/index.html");

  if (isIndexHtml && !stub.expectTag) {
    logger.warn(
      "Example has no <expect>:",
      path.relative(__dirname, stub.filePath)
    );
  }
}

describe("Examples", () => {
  for (const stub of stubs) {
    const isIndexHtml = stub.filePath.endsWith("/index.html");

    if (!stub.expectTag) continue;

    const testName = isIndexHtml
      ? stub.dirName
      : `${stub.dirName} ${stub.fileName}`;

    const skip = !!stub.expectTag.match(/\bskip\b/);
    const testFunc = skip ? test.skip : test;
    testFunc(testName, () => {
      const example = stub.compiled();

      if (!hasExpectation(example)) return;

      const { component, expected } = example;
      const renderer = new Renderer(
        compiledComponentDir(componentDir.get(stub.dirName)!)
      );
      const output = renderer.render(component);
      expect(toHTML(output).trim()).toBe(toHTML(expected!).trim());
    });
  }
});

function compileExample(filePath: string): Example | ExampleWithExpectation {
  const sourceText = readFileSync(filePath);

  const fragment = parse(sourceText.toString());

  const sourceNodes = Array.from(childNodesOf(fragment));

  let expected = undefined;
  let skip = undefined;

  for (let i = sourceNodes.length - 1; i--; i >= 0) {
    const node = sourceNodes[i];

    if (isElement(node) && node.tagName.toLowerCase() === "expect") {
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

function hasExpectation(example: Example): example is ExampleWithExpectation {
  return (example as Partial<ExampleWithExpectation>).expected != undefined;
}

function compiledComponentDir(
  componentDir: Map<string, () => Component>
): Map<string, Component> {
  return new Map(
    Array.from(componentDir.entries()).map(([name, getComponent]) => [
      name,
      getComponent(),
    ])
  );
}
