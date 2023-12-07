import { Component } from "compiler/component";
import path from "node:path";
import { createContext, runInContext } from "node:vm";
import { RenderContext } from "./renderer";

export type VM = {
  runCode: (code: string) => unknown;
};

export function createVM(
  component: Component,
  context: RenderContext,
  jsContext: Record<string, any>
): VM {
  const fullJsContext = createContext({
    require: wrapRequire(require, component.filePath),
    console,
    process: { env: process.env },
    url: makeURLFunc(context, component.filePath),
    __rootDir: context.rootDir,
    __outputDir: context.outputDir,
    __pagePath: context.pagePath,
    ...jsContext,
  });

  const runCode = (code: string) =>
    runInContext(code, fullJsContext, { filename: component.filePath });

  return { runCode };
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
