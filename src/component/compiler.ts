import { childNodesOf, createFragment, isElement, parse } from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { Component } from "component/component";
import { readFileSync } from "node:fs";

const logger = createLogger(path.basename(__filename, ".ts"));

export function compileFile(filePath: string): Component {
  return compile(
    path.basename(filePath),
    filePath,
    readFileSync(filePath).toString()
  );
}

export function compile(
  name: string,
  filePath: string,
  source: Node[] | string
): Component {
  const sourceNodes = parse(source);

  const content = childNodesOf(createFragment(sourceNodes));
  const { scripts, clientScripts, styles } = process(content);

  return Object.assign(Object.create(null), {
    name,
    filePath,
    source: sourceNodes,
    content: Array.from(content),
    scripts,
    clientScripts,
    styles,
  });
}

function process(
  inOutContent: NodeList,
  scripts: HTMLScriptElement[] = [],
  clientScripts: HTMLScriptElement[] = [],
  styles: HTMLStyleElement[] = []
) {
  for (const node of [...inOutContent]) {
    let removed = false;

    if (isElement(node)) {
      switch (node.tagName) {
        case "SCRIPT":
          if (node.hasAttribute("client")) {
            clientScripts.push(node as HTMLScriptElement);
          } else {
            scripts.push(node as HTMLScriptElement);
          }
          node.remove();
          removed = true;
          break;
        case "STYLE":
          styles.push(node as HTMLStyleElement);
          node.remove();
          removed = true;
          break;
      }
    }

    if (!removed) {
      process(childNodesOf(node), scripts, clientScripts, styles);
    }
  }

  return {
    scripts,
    clientScripts,
    styles,
  };
}
