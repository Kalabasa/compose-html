export declare function parse(source: string): DocumentFragment;
export declare const createDocumentFragment: () => DocumentFragment;
export declare const createElement: {
    <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions | undefined): HTMLElementTagNameMap[K];
    <K_1 extends keyof HTMLElementDeprecatedTagNameMap>(tagName: K_1, options?: ElementCreationOptions | undefined): HTMLElementDeprecatedTagNameMap[K_1];
    (tagName: string, options?: ElementCreationOptions | undefined): HTMLElement;
};
export declare const createTextNode: (data: string) => Text;
export declare function appendChild(parent: Node, child: Node): ReturnType<Node["appendChild"]>;
export declare function childNodesOf(parent: Node): NodeList;
export declare function stableChildNodesOf(parent: Node): Iterable<Node>;
export declare function isTemplateElement(node: Node): node is HTMLTemplateElement;
export declare function isInlineJavaScriptElement(node: Node): node is HTMLScriptElement;
export declare function isNode(node: any): node is Node;
export declare function isElement(node: any): node is Element;
export declare function isText(node: any): node is Text;
export declare function isDocumentFragment(node: any): node is DocumentFragment;
export declare function toHTML(nodes: Node | Iterable<Node>, trim?: boolean): string;
