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
}
export type Page = {
    skeleton: Element;
};
