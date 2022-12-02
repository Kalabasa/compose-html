import { JSDOM } from "jsdom";

export function parse(source: Iterable<Node> | string): Node[] {
  if (typeof source === "string") {
    return Array.from(JSDOM.fragment(source).childNodes);
  } else {
    return Array.isArray(source) ? source : Array.from(source);
  }
}

export function createFragment(templateNodes?: Node[]): DocumentFragment {
  return JSDOM.fragment(templateNodes ? toHTML(templateNodes) : "");
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

export function toHTML(nodes: Node[]): string {
  return nodes
    .map((node) => (isElement(node) ? node.outerHTML : node.textContent))
    .join("");
}
