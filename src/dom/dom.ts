import { JSDOM } from "jsdom";

export function parse(source: Iterable<Node> | string): Node[] {
  if (typeof source !== "string") {
    source = toHTML(source, false);
  }
  return Array.from(JSDOM.fragment(source).childNodes);
}

export function createFragment(templateNodes?: Node[]): DocumentFragment {
  return JSDOM.fragment(templateNodes ? toHTML(templateNodes, false) : "");
}

export function appendChild(
  parent: Node,
  child: Node
): ReturnType<Node["appendChild"]> {
  if (isTemplateElement(parent)) {
    return parent.content.appendChild(child);
  }

  return parent.appendChild(child);
}

export function childNodesOf(parent: Node): NodeList {
  if (isTemplateElement(parent)) {
    return parent.content.childNodes;
  }

  return parent.childNodes;
}

export function isTemplateElement(node: Node): node is HTMLTemplateElement {
  return isElement(node) && node.tagName === "TEMPLATE";
}

export function isElement(node: Node): node is Element {
  return node.nodeType != undefined && node.nodeType === node.ELEMENT_NODE;
}

export function isText(node: Node): boolean {
  return node.nodeType != undefined && node.nodeType === node.TEXT_NODE;
}

export function toHTML(nodes: Iterable<Node>, trim: boolean = true): string {
  let html = "";
  for (const node of nodes) {
    html += isElement(node) ? node.outerHTML : node.textContent;
  }
  return trim ? html.trim() : html;
}
