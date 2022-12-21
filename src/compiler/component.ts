// Don't mutate the inner objects, and don't reparent the nodes
export interface Component {
  readonly name: string;
  readonly filePath: string;
  readonly source: DocumentFragment;
  readonly page: Page | undefined;
  readonly metadata: ReadonlyArray<Node>;
  readonly content: DocumentFragment;
  readonly staticScripts: ReadonlyArray<HTMLScriptElement>;
  readonly clientScripts: ReadonlyArray<HTMLScriptElement>;
  readonly styles: ReadonlyArray<HTMLStyleElement>;
  readonly htmlLiterals: ReadonlyArray<DocumentFragment>;
}

export type Page = {
  skeleton: Element;
};
