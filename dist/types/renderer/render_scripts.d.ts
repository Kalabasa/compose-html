import { Component } from "compiler/component";
import { RenderContext } from "./renderer";
export declare function evaluateScripts(inOutFragment: DocumentFragment, component: Component, attrs: Record<string, any>, children: Node[], render: (nodes: Iterable<Node>) => Promise<Node[]>, context?: RenderContext): Promise<void>;
