import { Component } from "compiler/component";
export declare const SCRIPT_DELIMITER_OPEN = "{";
export declare const SCRIPT_DELIMITER_CLOSE = "}";
export declare function compileFile(filePath: string): Component;
export declare function compile(name: string, filePath: string, source: string): Component;
