import { Page } from "compiler/component";
import { check, checkNotNull } from "util/preconditions";
import { queryPageSkeleton } from "util/query_page_skeleton";

type PageData = {
  readonly page: Page | undefined;
  readonly metadata: ReadonlyArray<Node>;
  readonly clientScripts: ReadonlyArray<HTMLScriptElement>;
  readonly styles: ReadonlyArray<HTMLStyleElement>;
};

export function renderPage(bodyContent: Node[], pageData: PageData): Element {
  const page = (check(pageData.page), checkNotNull(pageData.page));

  const { html, head, body } = queryPageSkeleton(page.skeleton.cloneNode(true));

  // These are ReadonlyArrays. Expect immutability of nodes, so clone
  checkNotNull(head).replaceChildren(
    ...cloneNodes(pageData.metadata),
    ...cloneNodes(pageData.styles),
    ...cloneNodes(pageData.clientScripts)
  );

  // No need to clone bodyContent, it's an incremental object
  checkNotNull(body).replaceChildren(...bodyContent);

  return checkNotNull(html);
}

function* cloneNodes(nodes: Iterable<Node>) {
  for (const node of nodes) {
    yield node.cloneNode(true);
  }
}
