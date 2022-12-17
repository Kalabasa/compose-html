import {
  SCRIPT_DELIMITER_CLOSE,
  SCRIPT_DELIMITER_OPEN,
} from "compiler/compiler";
import { Component } from "compiler/component";
import {
  childNodesOf,
  isElement,
  isNode,
  parse,
  stableChildNodesOf,
} from "dom/dom";
import path from "node:path";
import { isIterable } from "util/is_iterable";
import { createLogger, formatJSValue } from "util/log";
import { check } from "util/preconditions";
import { isRawHTML } from "./raw_html";
import { Renderer } from "./renderer";
import { createVM } from "./vm";

const logger = createLogger(path.basename(__filename, ".ts"));

export function renderScripts(
  inOutFragment: DocumentFragment,
  component: Component,
  attrs: Record<string, any>,
  renderer: Renderer
): void {
  const vm = createVM(component, attrs, {
    __renderHTMLLiteral__: createHTMLLiteralRenderFunc(component, renderer),
  });

  const scriptCode = component.staticScripts
    .map((el) => el.textContent)
    .join("\n");
  if (scriptCode) {
    logger.debug(
      "run static script:\n" +
        formatJSValue(scriptCode.replace(/^\s*\n|\s+$/g, ""))
    );
    vm.runCode(scriptCode);
  }

  for (const node of stableChildNodesOf(inOutFragment)) {
    renderNode(node, vm.runCode);
  }
}

function createHTMLLiteralRenderFunc(
  component: Component,
  renderer: Renderer
): any {
  return (index: number) => {
    logger.debug("render HTML literal", index);
    logger.group();
    const result = renderer.renderList(
      childNodesOf(component.htmlLiterals[index])
    );
    logger.groupEnd();
    return result;
  };
}

function renderNode(inOutNode: Node, runCode: (code: string) => unknown): void {
  if (isElement(inOutNode)) {
    renderElementAttrs(inOutNode, runCode);

    if (
      inOutNode.tagName.toLowerCase() === "script" &&
      inOutNode.hasAttribute("render")
    ) {
      renderScriptElement(inOutNode as HTMLScriptElement, runCode);
      return;
    }
  }

  for (const childNode of stableChildNodesOf(inOutNode)) {
    renderNode(childNode, runCode);
  }
}

function renderElementAttrs(
  inOutElement: Element,
  runCode: (code: string) => unknown
) {
  for (const attr of Array.from(inOutElement.attributes)) {
    let renderedAttrValue = renderAttrValueIfDynamic(attr.value, runCode);
    if (renderedAttrValue) {
      inOutElement.setAttribute(attr.name, renderedAttrValue.value);
    }
  }
}

function renderAttrValueIfDynamic(
  attrValue: string,
  runCode: (code: string) => unknown
): { value: string } | undefined {
  const marked =
    attrValue.startsWith(SCRIPT_DELIMITER_OPEN) &&
    attrValue.endsWith(SCRIPT_DELIMITER_CLOSE);

  if (!marked) return undefined;

  const expr = attrValue.slice(1, -1);
  const newValue = String(runCode(expr));

  logger.debug("rendered attr:", `"${attrValue}"`, "→", `"${newValue}"`);
  return { value: newValue };
}

function renderScriptElement(
  inOutElement: HTMLScriptElement,
  runCode: (code: string) => unknown
) {
  const code = inOutElement.innerHTML;

  logger.debug("render script:", formatJSValue(code.replace(/\n/g, " ")));
  const results = Array.from(
    unwrapResults(runCode(wrapCode(code, inOutElement)) as any[])
  );

  logger.debug("render script result:", results);
  inOutElement.replaceWith(...results);

  // because the node was replaced, standard recursion won't work
  // so we renderNode() the results here
  for (const item of results) {
    if (!isNode(item)) continue;
    renderNode(item, runCode);
  }
}

function* unwrapResults(results: Iterable<any>): Generator<string | Node> {
  for (const result of results) {
    if (typeof result === "string" || result instanceof String) {
      yield String(result);
    } else if (isIterable(result)) {
      yield* unwrapResults(result);
    } else if (isNode(result)) {
      yield result;
    } else if (isRawHTML(result)) {
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
