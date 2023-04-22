type Page = {
    pagePath: string;
    nodes: Node[];
};
type Bundle = {
    relPath: string;
    code: string;
};
export declare function extractScriptBundles(pages: Page[]): Array<Bundle>;
export {};
