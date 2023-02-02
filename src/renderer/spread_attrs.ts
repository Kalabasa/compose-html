import { childNodesOf, isElement } from "dom/dom";

const SPREAD_ATTR_NAME = "{...attrs}";

export function spreadAttrs(
  root: Node | DocumentFragment,
  attrs: Record<string, any>
) {
  if (isElement(root)) spreadAttrsForElement(root, attrs);
  for (const node of childNodesOf(root)) {
    spreadAttrs(node, attrs);
  }
}

function spreadAttrsForElement(element: Element, attrs: Record<string, any>) {
  for (const [name, value] of Array.from(element.attributes).map((attr) => [
    attr.name,
    attr.value,
  ])) {
    if (name === SPREAD_ATTR_NAME) {
      element.removeAttribute(SPREAD_ATTR_NAME);
      for (const [inName, inValue] of Object.entries(attrs)) {
        element.setAttribute(inName, inValue);
      }
    } else {
      // re-set to keep order
      element.setAttribute(name, value);
    }
  }
}
