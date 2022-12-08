import { JSDOM } from "jsdom";

const sharedAPI = new JSDOM().window.document;

export function parse(source: string): DocumentFragment {
  return JSDOM.fragment(source);
}

export function createFragment(templateNodes?: Node[]): DocumentFragment {
  return JSDOM.fragment(templateNodes ? toHTML(templateNodes, false) : "");
}

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
  return isElement(node) && node.tagName === "TEMPLATE";
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
    html = isElement(nodes) ? nodes.outerHTML : nodes.textContent ?? "";
  }

  return trim ? html.trim() : html;
}

function isIterable(obj: any): obj is Iterable<any> {
  return typeof (obj as Iterable<any>)[Symbol.iterator] === "function";
}

function exportAPI<T extends Function>(func: T): T {
  return func.bind(sharedAPI);
}
