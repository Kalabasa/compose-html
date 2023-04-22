import { Component } from "compiler/component";
export type RenderContext = {
    rootDir: string;
    outputDir: string;
};
type Context = {
    metadata: Set<Node>;
    clientScripts: Set<HTMLScriptElement>;
    styles: Set<HTMLStyleElement>;
} & RenderContext;
export declare const nullRenderContext: RenderContext;
export declare class Renderer {
    private readonly components;
    constructor(components?: Map<string, Component>);
    render(component: Component, renderContext?: RenderContext): Promise<Node[]>;
    renderNode(node: Node, context?: Context): Promise<Node[]>;
    renderList: (nodes: Iterable<Node>, context?: Context) => Promise<Node[]>;
    private generateRenderedList;
}
export {};
