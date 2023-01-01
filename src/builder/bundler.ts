import { isInlineJavaScriptElement } from "dom/dom";
import path from "node:path";

type Page = {
  pagePath: string;
  nodes: Node[];
};

type Bundle = {
  relPath: string;
  code: string;
};

export function extractScriptBundles(pages: Page[]): Array<Bundle> {
  // todo
  return [];
}

function* findScripts(nodes: Iterable<Node>): Generator<HTMLScriptElement> {
  for (const node of nodes) {
    if (isInlineJavaScriptElement(node)) yield node;
    yield* findScripts(node.childNodes);
  }
}

function commonBundleName(rename: number): string {
  return `common${rename ? rename : ""}.js`;
}
