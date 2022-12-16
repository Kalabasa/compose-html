// todo: props type generic

// Don't mutate the inner objects, or use nodes to add to a different parent
export interface Component {
  readonly name: string;
  readonly filePath: string;
  readonly source: DocumentFragment;
  readonly content:  DocumentFragment;
  readonly staticScripts: ReadonlyArray<HTMLScriptElement>;
  readonly clientScripts: ReadonlyArray<HTMLScriptElement>;
  readonly styles: ReadonlyArray<HTMLStyleElement>;
  readonly htmlLiterals: ReadonlyArray<DocumentFragment>;
}
