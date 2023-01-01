import { check } from "util/preconditions";

const SPREAD_ATTR_NAME = "...attrs";

export function spreadAttrs(
  fragment: DocumentFragment,
  attrs: Record<string, any>
) {
  const root = fragment.firstElementChild;
  if (!root?.hasAttribute(SPREAD_ATTR_NAME)) return;

  // it is feasible to spread on any element, but for simplicity, support only root
  check(
    fragment.childElementCount === 1,
    "Spread attrs only allowed on a single root element."
  );

  for (const [name, value] of Array.from(root.attributes).map((attr) => [
    attr.name,
    attr.value,
  ])) {
    if (name === SPREAD_ATTR_NAME) {
      root.removeAttribute(SPREAD_ATTR_NAME);
      for (const [inName, inValue] of Object.entries(attrs)) {
        root.setAttribute(inName, inValue);
      }
    } else {
      // re-set to keep order
      root.setAttribute(name, value);
    }
  }
}
