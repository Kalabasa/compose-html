import { DZ_PREFIX } from "dom/desensitize";
import { isElement } from "dom/dom";

export function queryPageSkeleton(root: DocumentFragment | Element) {
  return {
    html:
      isElement(root) && root.matches(`${DZ_PREFIX}html`)
        ? root
        : root.querySelector(`${DZ_PREFIX}html`),
    head: root.querySelector(`${DZ_PREFIX}head`),
    body: root.querySelector(`${DZ_PREFIX}body`),
  };
}
