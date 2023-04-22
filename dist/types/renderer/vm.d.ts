import { Component } from "compiler/component";
import { RenderContext } from "./renderer";
export type VM = {
    runCode: (code: string) => unknown;
};
export declare function createVM(component: Component, context: RenderContext, jsContext: Record<string, any>): VM;
