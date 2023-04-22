import { Page } from "compiler/component";
type PageData = {
    readonly page: Page | undefined;
    readonly metadata: ReadonlyArray<Node>;
    readonly clientScripts: ReadonlyArray<HTMLScriptElement>;
    readonly styles: ReadonlyArray<HTMLStyleElement>;
};
export declare function renderPage(bodyContent: Node[], pageData: PageData): Element;
export {};
