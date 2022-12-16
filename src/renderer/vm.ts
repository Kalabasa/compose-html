import { Component } from "compiler/component";
import path from "node:path";
import { createContext, runInContext } from "node:vm";
import { rawHTML, RawHTML, rawHTMLSymbol } from "./raw_html";

export function createVM(
  component: Component,
  attrs: Record<string, any>,
  context: Record<string, any>
): {
  runCode: (code: string) => unknown;
} {
  const fullContext = createContext({
    require: wrapRequire(require, component.filePath),
    html: htmlTag,
    attrs,
    ...context,
  });

  const runCode = (code: string) =>
    runInContext(code, fullContext, { filename: component.filePath });

  return { runCode };
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

  return rawHTML(parts.join(""));
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
