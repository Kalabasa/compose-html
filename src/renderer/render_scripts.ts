import { Component } from "component/component";
import { childNodesOf, isElement, parse, stableChildNodesOf } from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { check } from "util/preconditions";
import { createVM, isRawHTML } from "./vm";

const logger = createLogger(path.basename(__filename, ".ts"));

export function renderScripts(
  inOutFragment: DocumentFragment,
  component: Component
): void {
  const vm = createVM(component);

  const scriptCode = component.staticScripts
    .map((el) => el.textContent)
    .join("\n");
  if (scriptCode) {
    logger.debug("Run static script -", "\n" + scriptCode.trim());
    vm.runCode(scriptCode);
  }

  for (const node of stableChildNodesOf(inOutFragment)) {
    renderNode(node, vm.runCode);
  }
}

function renderNode(inOutNode: Node, runCode: (code: string) => unknown): void {
  if (
    isElement(inOutNode) &&
    inOutNode.tagName === "SCRIPT" &&
    inOutNode.hasAttribute("render")
  ) {
    renderScriptElement(inOutNode as HTMLScriptElement, runCode);
    return;
  }

  for (const childNode of stableChildNodesOf(inOutNode)) {
    renderNode(childNode, runCode);
  }
}

function renderScriptElement(
  inOutElement: HTMLScriptElement,
  runCode: (code: string) => unknown
) {
  const code = inOutElement.innerHTML;
  logger.debug("Render script -", code);
  const results = runCode(wrapCode(code, inOutElement)) as any[];
  logger.debug("Render result -", results);
  inOutElement.replaceWith(...unwrapResults(results));
}

function* unwrapResults(results: any[]): Generator<string | Node> {
  for (const result of results) {
    if (isRawHTML(result)) {
      for (const node of childNodesOf(parse(result.html))) {
        yield node;
      }
    } else {
      yield String(result);
    }
  }
}

function wrapCode(code: string, script: HTMLScriptElement): string {
  const render = script.getAttribute("render");

  if (render === "gen") {
    return `[...(function*(){${code}})()]`;
  } else if (render === "func") {
    return `[(function*(){${code}})()]`;
  }
  check(render === "expr");
  return `[${code}]`;
}
