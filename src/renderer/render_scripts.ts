import {
  SCRIPT_DELIMITER_CLOSE,
  SCRIPT_DELIMITER_OPEN
} from "compiler/compiler";
import { Component } from "compiler/component";
import {
  childNodesOf,
  isElement,
  isInlineJavaScriptElement,
  isNode,
  parse,
  stableChildNodesOf
} from "dom/dom";
import path from "node:path";
import { isIterable } from "util/is_iterable";
import { createLogger, formatJSValue } from "util/log";
import { check } from "util/preconditions";
import { isRawHTML } from "./raw_html";
import { VM } from "./vm";

const logger = createLogger(path.basename(__filename, ".ts"));

export async function renderScripts(
  inOutFragment: DocumentFragment,
  component: Component,
  vm: VM
): Promise<void> {
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
    await renderNode(node, vm.runCode);
  }
}

async function renderNode(
  inOutNode: Node,
  runCode: (code: string) => unknown
): Promise<void> {
  if (isElement(inOutNode)) {
    await renderElementAttrs(inOutNode, runCode);

    if (
      isInlineJavaScriptElement(inOutNode) &&
      inOutNode.hasAttribute("render")
    ) {
      await renderScriptElement(inOutNode as HTMLScriptElement, runCode);
      return;
    }
  }

  for (const childNode of stableChildNodesOf(inOutNode)) {
    await renderNode(childNode, runCode);
  }
}

async function renderElementAttrs(
  inOutElement: Element,
  runCode: (code: string) => unknown
) {
  for (const attr of Array.from(inOutElement.attributes)) {
    let renderedAttrValue = await renderAttrValueIfDynamic(attr.value, runCode);
    if (renderedAttrValue) {
      const { value } = renderedAttrValue;
      if (value == null) {
        inOutElement.removeAttribute(attr.name);
      } else {
        inOutElement.setAttribute(attr.name, String(value));
      }
    }
  }
}

async function renderAttrValueIfDynamic(
  attrValue: string,
  runCode: (code: string) => unknown
): Promise<{ value?: any } | undefined> {
  const marked =
    attrValue.startsWith(SCRIPT_DELIMITER_OPEN) &&
    attrValue.endsWith(SCRIPT_DELIMITER_CLOSE);

  if (!marked) return undefined;

  const expr = attrValue.slice(1, -1);
  const newValue = await runCode(`(async function(){ return ${expr} })()`);

  logger.debug("rendered attr:", `"${attrValue}"`, "→", `"${newValue}"`);
  return { value: newValue };
}

async function renderScriptElement(
  inOutElement: HTMLScriptElement,
  runCode: (code: string) => unknown
) {
  const code = inOutElement.innerHTML;

  logger.debug("render script:", formatJSValue(code.replace(/\n/g, " ")));
  const asyncResults = unwrapResults(
    runCode(wrapCode(code, inOutElement)) as any
  );
  const results = [];
  for await (const result of asyncResults) {
    results.push(result);
  }

  logger.debug("render script result:", results);
  inOutElement.replaceWith(...results);

  // because the node was replaced, standard recursion won't work
  // so we renderNode() the results here
  for (const item of results) {
    if (!isNode(item)) continue;
    await renderNode(item, runCode);
  }
}

async function* unwrapResults(
  results: Promise<Iterable<any>>
): AsyncGenerator<string | Node> {
  for (let result of await results) {
    if (result == null) continue;
    if (typeof result === "string" || result instanceof String) {
      yield String(result);
    } else if (isIterable(result)) {
      yield* unwrapResults(Promise.resolve(result));
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

// wraps code as a Promise<Iterable<__>> for uniform handling
function wrapCode(code: string, script: HTMLScriptElement): string {
  const render = script.getAttribute("render");

  if (render === "gen") {
    return wrapGenCode(code);
  } else if (render === "func") {
    return wrapFuncCode(code);
  }
  check(render === "expr");
  return wrapFuncCode(`return (${code})`);
}

function wrapFuncCode(code: string): string {
  return `Promise.all([(async function(){${code}})()])`;
}

function wrapGenCode(code: string): string {
  return `(async function(){ const __a = []; for await (const __v of (async function*(){${code}})()) __a.push(__v); return __a })()`;
}
