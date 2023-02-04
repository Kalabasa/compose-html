import { Component } from "compiler/component";
import path from "node:path";
import { createContext, runInContext } from "node:vm";
import { mapAttrsForScript } from "./map_attrs";
import { rawHTML, RawHTML } from "./raw_html";
import { nullRenderContext, RenderContext } from "./renderer";

export type VM = {
  runCode: (code: string) => unknown;
};

export function createVM(
  component: Component,
  attrs: Record<string, any>,
  children: Node[],
  jsContext: Record<string, any>,
  context: RenderContext = nullRenderContext
): VM {
  const fullContext = createContext({
    require: wrapRequire(require, component.filePath),
    console,
    url: makeURLFunc(context, component.filePath),
    html: htmlTag,
    attrs: mapAttrsForScript(attrs),
    children, // todo: make immutable when exposed
    ...jsContext,
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

// todo: unit test this
function makeURLFunc(
  context: RenderContext,
  componentFilePath: string
): (urlPath: string) => string {
  return (localUrlPath) => {
    const filePath = path.resolve(
      path.dirname(componentFilePath),
      localUrlPath
    );
    const siteUrlPath = path.relative(context.rootDir, filePath);
    return path.join("/", siteUrlPath);
  };
}
