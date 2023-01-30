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
    ...cloneNodes(pageData.clientScripts.filter(not(isDeferredScript)))
  );

  checkNotNull(body).replaceChildren(
    // No need to clone bodyContent, it's an incremental object
    ...bodyContent,
    ...removeDeferAttr(
      cloneNodes(pageData.clientScripts.filter(isDeferredScript))
    )
  );

  return checkNotNull(html);
}

function isDeferredScript(script: HTMLScriptElement) {
  return script.hasAttribute("defer");
}

function not(predicate: (...args: unknown[]) => boolean) {
  return (...args: unknown[]) => !predicate(...args);
}

// mutates input directly
function* removeDeferAttr(scripts: Iterable<HTMLScriptElement>) {
  for (const script of scripts) {
    script.defer = false;
    yield script;
  }
}

function* cloneNodes<T extends Node>(nodes: Iterable<T>) {
  for (const node of nodes) {
    yield node.cloneNode(true);
  }
}
