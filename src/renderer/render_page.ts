import { Component } from "compiler/component";
import { check, checkNotNull } from "util/preconditions";
import { queryPageSkeleton } from "util/query_page_skeleton";

type ComponentData = Pick<
  Component,
  "page" | "metadata" | "styles" | "clientScripts"
>;

export function renderPage(
  bodyContent: Node[],
  componentData: ComponentData
): Element {
  const page = (check(componentData.page), checkNotNull(componentData.page));

  const { html, head, body } = queryPageSkeleton(page.skeleton.cloneNode(true));

  checkNotNull(head).replaceChildren(
    ...componentData.metadata,
    ...componentData.styles,
    ...componentData.clientScripts
  );
  checkNotNull(body).replaceChildren(...bodyContent);

  return checkNotNull(html);
}
