import { childNodesOf, createFragment, isElement, parse } from "dom/dom";

// todo: props type generic
export interface Component {
  name: string;
  source: Node[];
  content: Node[];
  scripts: HTMLScriptElement[];
  styles: HTMLStyleElement[];
}

export function compile(name: string, source: Node[] | string): Component {
  const sourceNodes = parse(source);

  const content = childNodesOf(createFragment(sourceNodes));
  const scripts: HTMLScriptElement[] = [];
  const styles: HTMLStyleElement[] = [];
  process(content, scripts, styles);

  return Object.assign(Object.create(null), {
    name,
    source: sourceNodes,
    content: Array.from(content),
    scripts,
    styles,
  });
}

function process(
  inOutContent: NodeList,
  outScripts: HTMLScriptElement[],
  outStyles: HTMLStyleElement[]
): void {
  let index = 0;
  for (const node of inOutContent) {
    if (isElement(node)) {
      switch (node.tagName) {
        case "SCRIPT":
          outScripts.push(node as HTMLScriptElement);
          node.remove();
          break;
        case "STYLE":
          outStyles.push(node as HTMLStyleElement);
          node.remove();
          break;
      }
    }

    index++;
    process(childNodesOf(node), outScripts, outStyles);
  }
}
