import { Component } from "compiler/component";
import { RenderContext } from "./renderer";
export declare function renderComponent(component: Component, attrs: Record<string, any>, children: Node[], render: (nodes: Iterable<Node>) => Promise<Node[]>, renderContext?: RenderContext): Promise<Iterable<Node>>;
