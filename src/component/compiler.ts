import type { FunctionDeclaration } from "estree";
import * as acornLoose from "acorn-loose";
import * as acornWalk from "acorn-walk";
import { Component } from "component/component";
import {
  createElement,
  createTextNode,
  isElement,
  isText,
  parse,
  stableChildNodesOf,
} from "dom/dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createLogger } from "util/log";
import { check } from "util/preconditions";

const DELIMITER_OPEN = "{";
const DELIMITER_CLOSE = "}";
const ESCAPE = "\\";

const logger = createLogger(path.basename(__filename, ".ts"));

type Context = {
  staticScripts: HTMLScriptElement[];
  clientScripts: HTMLScriptElement[];
  styles: HTMLStyleElement[];
};

export function compileFile(filePath: string): Component {
  return compile(
    path.basename(filePath),
    filePath,
    readFileSync(filePath).toString()
  );
}

export function compile(
  name: string,
  filePath: string,
  source: string
): Component {
  logger.debug("Compile start -", filePath, `<${name}>`, "\n" + source.trim());
  const sourceFragment = parse(source);

  const content = sourceFragment.cloneNode(true) as DocumentFragment;
  const { staticScripts, clientScripts, styles } = process(content);

  const component = {
    name,
    filePath,
    source: sourceFragment,
    content,
    staticScripts,
    clientScripts,
    styles,
  };
  logger.debug(
    "Compile done -",
    `<${name}>`,
    "\ncontent:",
    content,
    "\nstaticScripts:",
    staticScripts,
    "\nclientScripts:",
    clientScripts,
    "\nstyles:",
    styles
  );
  return component;
}

function process(
  inOutContent: DocumentFragment,
  context: Context = {
    staticScripts: [],
    clientScripts: [],
    styles: [],
  }
) {
  for (const node of stableChildNodesOf(inOutContent)) {
    processNode(node, context);
  }

  return context;
}

function processNode(node: Node, context: Context) {
  let consumed = true;

  if (isText(node)) {
    consumed = processText(node);
  } else if (isElement(node)) {
    consumed = processElement(node, context);
  }

  if (!consumed) {
    for (const child of stableChildNodesOf(node)) {
      processNode(child, context);
    }
  }
}

function processElement(inOutNode: Element, context: Context): boolean {
  logger.debug("Process element -", inOutNode);

  switch (inOutNode.tagName) {
    case "SCRIPT":
      const isRender = inOutNode.hasAttribute("render");
      const isStatic = inOutNode.hasAttribute("static");
      const isClient = inOutNode.hasAttribute("client");

      if (+isRender + +isStatic + +isClient !== 1) {
        throw new Error("<script> type unspecified");
      }

      if (isRender) {
        processRenderAttribute(inOutNode as HTMLScriptElement);
        return true;
      } else if (isStatic) {
        context.staticScripts.push(inOutNode as HTMLScriptElement);
        inOutNode.remove();
        return true;
      } else if (isClient) {
        context.clientScripts.push(inOutNode as HTMLScriptElement);
        inOutNode.remove();
        return true;
      }
      break;
    case "STYLE":
      context.styles.push(inOutNode as HTMLStyleElement);
      inOutNode.remove();
      return true;
  }

  return false;
}

// Replaces {foo} shorthand with <script render>foo<script>
function processText(inOutNode: Text): boolean {
  logger.debug("Process text -", inOutNode);

  const sourceText = inOutNode.textContent;
  if (!sourceText) return false;

  let newContent: Node[] = [];
  let accumulatedText = "";
  let consumedIndex = 0;

  let codeStartIndex = 0;
  let currentNestingLevel = 0; // ignore nested delimiters

  for (let i = 0; i < sourceText.length; i++) {
    const char = sourceText[i];

    if (char === ESCAPE) {
      accumulatedText += sourceText.substring(consumedIndex, i);
      i++;
      consumedIndex = i;
      continue;
    }

    if (char === DELIMITER_OPEN) currentNestingLevel++;

    if (currentNestingLevel === 1) {
      if (char === DELIMITER_OPEN) {
        codeStartIndex = i + 1;
      } else if (char == DELIMITER_CLOSE) {
        // push Text Node
        accumulatedText += sourceText.substring(
          consumedIndex,
          codeStartIndex - 1
        );
        if (accumulatedText.length) {
          newContent.push(createTextNode(accumulatedText));
          accumulatedText = "";
        }

        // push <script render> Element
        const code = sourceText.substring(codeStartIndex, i);
        const scriptElement = createElement("script");
        scriptElement.setAttribute("render", "");
        scriptElement.appendChild(createTextNode(code));
        processRenderAttribute(scriptElement);
        newContent.push(scriptElement);

        logger.debug(`Convert shorthand {${code}}`);

        consumedIndex = i + 1;
      }
    }

    if (char === DELIMITER_CLOSE) currentNestingLevel--;
  }

  // Remaining text
  accumulatedText += sourceText.substring(consumedIndex);
  if (accumulatedText.length) {
    newContent.push(createTextNode(accumulatedText));
  }

  if (newContent.length > 1 || isElement(newContent[0])) {
    inOutNode.replaceWith(...newContent);
    return true;
  }

  return false;
}

function processRenderAttribute(inOutScript: HTMLScriptElement) {
  check(inOutScript.hasAttribute("render"));

  // render type already specified
  if (inOutScript.getAttribute("render")) return;

  // wrap to allow yield, return, and await
  const code = `async function* wrapper(){${inOutScript.innerHTML}}`;
  const tree = acornLoose.parse(code, { ecmaVersion: "latest" });

  // determine if this code yields or returns
  const state = { wrapperVisited: false, yields: false, returns: false };
  acornWalk.recursive(tree as acorn.Node, state, {
    Function(node, state, callback) {
      console.log(state);
      console.log(node);
      if (state.wrapperVisited) return;

      const func = node as unknown as FunctionDeclaration;
      check(func.generator === true);
      check(func.async === true);
      check(func.id?.name === "wrapper");

      state.wrapperVisited = true;

      callback(func.body as unknown as acorn.Node, state);
    },
    YieldExpression(node, state) {
      state.yields = true;
    },
    ReturnStatement(node, state) {
      state.returns = true;
    },
    Node(node, state, callback) {
      console.log(node);
      callback(node, state);
    },
  });

  if (state.yields) {
    inOutScript.setAttribute("render", "gen");
  } else if (state.returns) {
    inOutScript.setAttribute("render", "func");
  } else {
    inOutScript.setAttribute("render", "expr");
  }
}
