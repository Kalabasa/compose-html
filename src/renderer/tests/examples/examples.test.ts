import { compile } from "component/compiler";
import { Component } from "component/component";
import { childNodesOf, isElement, isText, parse, toHTML } from "dom/dom";
import glob from "glob";
import { dir } from "node:console";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Renderer } from "renderer/renderer";

type Example = {
  component: Component;
};
type ExampleWithExpectation = Example & {
  expected: Node[];
};

// beforeAll() doesn't work with async setup & dynamic tests
const files = glob.sync(path.resolve(__dirname, "**/*.html"));

// dirName -> componentName -> Component
const componentDir = new Map<string, Map<string, Component>>();

const compileExamples = files.map((filePath) => {
  const result = compileExample(filePath).then((example) => {
    const dirName = getDirName(filePath);
    let componentMap = componentDir.get(dirName);
    if (!componentMap) componentDir.set(dirName, (componentMap = new Map()));
    componentMap.set(example.component.name, example.component);

    console.log(`Loaded component in ${dirName}: <${example.component.name}>`);

    return example;
  });
  return { filePath, result };
});

const completeSetup = Promise.all(compileExamples.map(({ result }) => result));

describe("Examples", () => {
  for (const compEx of compileExamples) {
    const { filePath } = compEx;
    const dirName = getDirName(filePath);

    const testName = filePath.endsWith("/index.html")
      ? dirName
      : `${dirName} ${path.basename(filePath, ".html")}`;

    test(testName, async () => {
      await completeSetup;

      const example = await compEx.result;
      if (!hasExpectation(example)) return;

      const { component, expected } = example;
      const renderer = new Renderer(componentDir.get(dirName));
      const output = renderer.render(component.source);
      expect(toHTML(output)).toBe(toHTML(expected!));
    });
  }
});

function getDirName(filePath: string) {
  return path.relative(__dirname, path.dirname(filePath));
}

function hasExpectation(example: Example): example is ExampleWithExpectation {
  return (example as Partial<ExampleWithExpectation>).expected != undefined;
}

async function compileExample(
  filePath: string
): Promise<Example | ExampleWithExpectation> {
  const sourceText = await readFile(filePath);
  const sourceNodes = parse(sourceText.toString());

  let expected = undefined;

  for (let i = sourceNodes.length - 1; i--; i >= 0) {
    const node = sourceNodes[i];

    if (isElement(node) && node.tagName === "EXPECT") {
      if (expected) throw new Error("Only one <expect> is expected.");

      expected = extractExpectedNodes(node);

      node.remove();
      sourceNodes.splice(i, 1);
    }
  }

  const component = compile(
    path.basename(filePath, ".html"),
    filePath,
    sourceNodes
  );

  return {
    component,
    expected,
  };
}

function extractExpectedNodes(expectedElement: Element): Node[] {
  const children = Array.from(childNodesOf(expectedElement));
  if (children.length === 0) return children;

  // immediate child element, no need to de-indent
  if (!isText(children[0])) return children;

  // detect indentation
  const indentation =
    /^([ \t]+)/gm.exec(children[0].textContent ?? "")?.[1] ?? "";
  const indentRegExp = new RegExp("^" + indentation, "gm");

  return children.map((node) => {
    if (!isText(node)) return node;

    // remove indent due to nesting
    const mapped = node.cloneNode(true);
    mapped.textContent = node.textContent?.replace(indentRegExp, "") ?? null;
    return mapped;
  });
}
