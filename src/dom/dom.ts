import { JSDOM } from "jsdom";
import { isIterable } from "util/is_iterable";
import { desensitizeHTML, undesensitizeHTML } from "./desensitize";
import { expandSelfClosing } from "./expand_self_closing";

const sharedAPI = new JSDOM("", { contentType: "text/html" }).window.document;

export function parse(source: string): DocumentFragment {
  const template = sharedAPI.createElement("template");
  template.innerHTML = expandSelfClosing(desensitizeHTML(source));
  return template.content;
}

export const createDocumentFragment = exportAPI(
  sharedAPI.createDocumentFragment
);
export const createElement = exportAPI(sharedAPI.createElement);
export const createTextNode = exportAPI(sharedAPI.createTextNode);

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

// Non-live node list
export function stableChildNodesOf(parent: Node): Iterable<Node> {
  // just clone array lol
  return Array.from(childNodesOf(parent));
}

export function isTemplateElement(node: Node): node is HTMLTemplateElement {
  return isElement(node) && node.tagName.toLowerCase() === "template";
}

export function isNode(node: any): node is Node {
  return typeof (node as Node)?.nodeType === "number";
}

export function isElement(node: any): node is Element {
  return (
    node?.nodeType != undefined &&
    (node as Node).nodeType === (node as Node).ELEMENT_NODE
  );
}

export function isText(node: any): node is Text {
  return (
    node?.nodeType != undefined &&
    (node as Node).nodeType === (node as Node).TEXT_NODE
  );
}

export function isDocumentFragment(node: any): node is DocumentFragment {
  return (
    node?.nodeType != undefined &&
    (node as Node).nodeType === (node as Node).DOCUMENT_FRAGMENT_NODE
  );
}

export function toHTML(
  nodes: Node | Iterable<Node>,
  trim: boolean = true
): string {
  let html = "";

  if (isDocumentFragment(nodes)) {
    return toHTML(childNodesOf(nodes), trim);
  } else if (isIterable(nodes)) {
    for (const item of nodes) {
      html += toHTML(item, false);
    }
  } else {
    html = isElement(nodes)
      ? undesensitizeHTML(nodes.outerHTML)
      : nodes.textContent ?? "";
  }

  return trim ? html.trim() : html;
}

function exportAPI<T extends Function>(func: T): T {
  return func.bind(sharedAPI);
}
