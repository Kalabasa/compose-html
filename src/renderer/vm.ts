import { Component } from "component/component";
import path from "node:path";
import { createContext, runInContext } from "node:vm";

export function createVM(component: Component): {
  runCode: (code: string) => unknown;
} {
  const context = createContext({
    require: wrapRequire(require, component.filePath),
  });

  const runCode = (code: string) =>
    runInContext(code, context, { filename: component.filePath });

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
