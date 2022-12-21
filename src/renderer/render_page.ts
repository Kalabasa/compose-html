import { Page } from "compiler/component";
import { check, checkNotNull } from "util/preconditions";
import { queryPageSkeleton } from "util/query_page_skeleton";

type PageData = {
  readonly page: Page | undefined;
  readonly metadata: ReadonlyArray<Node>;
  readonly clientScripts: ReadonlyArray<HTMLScriptElement>;
  readonly styles: ReadonlyArray<HTMLStyleElement>;
};

export function renderPage(
  bodyContent: Node[],
  metadata: PageData
): Element {
  const page = (check(metadata.page), checkNotNull(metadata.page));

  const { html, head, body } = queryPageSkeleton(page.skeleton.cloneNode(true));

  checkNotNull(head).replaceChildren(
    ...metadata.metadata,
    ...metadata.styles,
    ...metadata.clientScripts
  );
  checkNotNull(body).replaceChildren(...bodyContent);

  return checkNotNull(html);
}
