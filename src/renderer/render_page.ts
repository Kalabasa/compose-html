import { DZ_PREFIX } from "dom/desensitize";
import { createElement } from "dom/dom";

type PageData = {
  metadata: ReadonlyArray<Node>;
  clientScripts: ReadonlyArray<HTMLScriptElement>;
  styles: ReadonlyArray<HTMLStyleElement>;
};

export function renderPage(bodyContent: Node[], data: PageData): HTMLElement {
  const { html, head, body } = createSkeleton();
  head.append(...data.metadata, ...data.styles, ...data.clientScripts);
  body.append(...bodyContent);
  return html;
}

function createSkeleton() {
  const html = createElement(`${DZ_PREFIX}html`);
  const head = html.appendChild(createElement(`${DZ_PREFIX}head`));
  const body = html.appendChild(createElement(`${DZ_PREFIX}body`));
  return { html, head, body };
}
