import { Component } from "component/component";
import path from "node:path";
import { createContext, runInContext } from "node:vm";

export function createVM(component: Component): {
  runCode: (code: string) => unknown;
} {
  const context = createContext({
    require: wrapRequire(require, component.filePath),
    html: htmlTag,
  });

  const runCode = (code: string) =>
    runInContext(code, context, { filename: component.filePath });

  return { runCode };
}

const rawHTMLSymbol = Symbol("rawHTML");

export type RawHTML = {
  [rawHTMLSymbol]: true;
  html: string;
};

export function isRawHTML(thing: any): thing is RawHTML {
  return typeof thing === "object" && rawHTMLSymbol in thing;
}

function htmlTag(segments: string[], ...expressions: any[]): RawHTML {
  const parts: string[] = [];

  segments.forEach((segment, i) => {
    if (i + 1 === segments.length) {
      parts.push(segment);
    } else {
      parts.push(segment, String(expressions[i]));
    }
  });

  return { [rawHTMLSymbol]: true, html: parts.join("") };
}

function wrapRequire(require: NodeRequire, filePath: string): NodeRequire {
  const wrappedRequire = (id: string) => {
    if (id.startsWith(".")) {
      id = path.resolve(path.dirname(filePath), id);
    }
    return require(id);
  };

  const newRequire = Object.assign(wrappedRequire, require);
  return newRequire;
}
