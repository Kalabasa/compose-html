import { Component } from "component/component";
import {
  childNodesOf,
  createElement,
  createTextNode,
  isDocumentFragment,
  isElement,
  isText,
  parse,
  stableChildNodesOf,
  toHTML,
} from "dom/dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createLogger } from "util/log";
import { check } from "util/preconditions";
import { TextProcessor } from "./text_processor";
import { findDelimiters } from "./find_delimiters";
import { detectScriptBehavior } from "./script_helpers";
import { NodeListBuilder } from "./node_list_builder";

export const SCRIPT_DELIMITER_OPEN = "{";
export const SCRIPT_DELIMITER_CLOSE = "}";

const HTML_DELIMITER_OPEN = "(<";
const HTML_DELIMITER_CLOSE = ">)";

const DYNAMIC_ATTR_PREFIX = ":";

const logger = createLogger(path.basename(__filename, ".ts"));

type Context = {
  staticScripts: HTMLScriptElement[];
  clientScripts: HTMLScriptElement[];
  styles: HTMLStyleElement[];
  htmlLiterals: DocumentFragment[];
};

export function compileFile(filePath: string): Component {
  return compile(
    path.basename(filePath, ".html"),
    filePath,
    readFileSync(filePath).toString()
  );
}

export function compile(
  name: string,
  filePath: string,
  source: string
): Component {
  logger.debug(
    "====== compile start ======",
    "\nname:",
    name,
    "\nfile path:",
    filePath,
    "\n\n" + source.trim(),
    "\n"
  );

  const sourceFragment = parse(source);

  const content = sourceFragment.cloneNode(true) as DocumentFragment;
  const context = processNode(content);

  context.htmlLiterals.forEach((htmlLiteral, index) => {
    logger.debug("post-processing HTML literal", index);
    processNode(htmlLiteral, context);
  });

  trim(content);

  const { staticScripts, clientScripts, styles, htmlLiterals } = context;

  const component: Component = {
    name,
    filePath,
    source: sourceFragment,
    content,
    staticScripts,
    clientScripts,
    styles,
    htmlLiterals,
  };
  logger.debug(
    "====== compile done ======",
    "\ncontent:",
    content,
    "\nstatic scripts:",
    staticScripts,
    "\nclient scripts:",
    clientScripts,
    "\nstyles:",
    styles,
    "\nhtml literals:",
    htmlLiterals,
    "\n"
  );
  return component;
}

function processNode(
  node: Node,
  context: Context = {
    staticScripts: [],
    clientScripts: [],
    styles: [],
    htmlLiterals: [],
  }
) {
  logger.debug("processing node:", node);

  let consumed = false;

  if (isElement(node)) {
    consumed = processElement(node, context);
  }

  const removed = !node.parentNode && !isDocumentFragment(node);
  if (removed) {
    logger.debug("  removed from content");
  } else if (consumed) {
    logger.debug("  consumed; ignoring subnodes");
  } else {
    processShorthands(node, context);

    for (const child of stableChildNodesOf(node)) {
      processNode(child, context);
    }
  }

  return context;
}

// Replaces {foo} shorthand with <script render>foo<script>
function processShorthands(node: Node, context: Context): boolean {
  const builder = new NodeListBuilder();
  const textProcessor = new TextProcessor(node);
  const delimiters = findDelimiters(
    SCRIPT_DELIMITER_OPEN,
    SCRIPT_DELIMITER_CLOSE,
    node
  );

  let contentDidChange = false;
  let openIndex = 0;

  for (const delimiter of delimiters) {
    if (delimiter.levelInside === 1) {
      if (delimiter.type === SCRIPT_DELIMITER_OPEN) {
        openIndex = delimiter.index;
      } else if (delimiter.type === SCRIPT_DELIMITER_CLOSE) {
        builder.append(...textProcessor.readUntil(openIndex));
        textProcessor.readUntil(openIndex + SCRIPT_DELIMITER_OPEN.length);
        const code = stringify(textProcessor.readUntil(delimiter.index));
        textProcessor.readUntil(
          delimiter.index + SCRIPT_DELIMITER_CLOSE.length
        );

        // push <script render> Element
        const scriptElement = createElement("script");
        scriptElement.setAttribute("render", "");
        scriptElement.appendChild(createTextNode(code));
        logger.debug(`  converting shorthand {${code}}`);
        processRenderScript(scriptElement, context);
        logger.debug("  converted shorthand →", scriptElement);

        builder.append(scriptElement);

        contentDidChange = true;
      }
    }
  }

  builder.append(...textProcessor.readUntil(Infinity));

  const newContent = builder.collect();
  if (contentDidChange) {
    if (isText(node)) {
      node.replaceWith(...newContent);
      return true;
    } else if (isElement(node) || isDocumentFragment(node)) {
      node.replaceChildren(...newContent);
      return true;
    }
  }

  return false;
}

function processElement(element: Element, context: Context): boolean {
  processElementAttrs(element);

  switch (element.tagName) {
    case "SCRIPT":
      const isRender = element.hasAttribute("render");
      const isStatic = element.hasAttribute("static");
      const isClient = element.hasAttribute("client");

      if (+isRender + +isStatic + +isClient !== 1) {
        throw new Error("<script> type unspecified");
      }

      if (isRender) {
        processRenderScript(element as HTMLScriptElement, context);
        return true;
      } else if (isStatic) {
        context.staticScripts.push(element as HTMLScriptElement);
        element.remove();
        return true;
      } else if (isClient) {
        context.clientScripts.push(element as HTMLScriptElement);
        element.remove();
        return true;
      }
      break;
    case "STYLE":
      context.styles.push(element as HTMLStyleElement);
      element.remove();
      return true;
  }

  return false;
}

function processElementAttrs(element: Element) {
  // If true, force re-set attribute even if not changed
  let forceReset = false;

  for (const attr of Array.from(element.attributes)) {
    let name = attr.name;
    let value = attr.value;

    if (attr.name.startsWith(DYNAMIC_ATTR_PREFIX)) {
      name = attr.name.substring(1);
      value = SCRIPT_DELIMITER_OPEN + attr.value + SCRIPT_DELIMITER_CLOSE;

      logger.debug(
        "  converting attr shorthand",
        `${attr.name}="${attr.value}"`,
        "→",
        `${name}="${value}"`
      );

      // keep true til the end to preserve attr order
      forceReset = true;
    }

    if (forceReset) {
      element.removeAttribute(attr.name);
      element.setAttribute(name, value);
    }
  }
}

function processRenderScript(script: HTMLScriptElement, context: Context) {
  processScriptHtmlLiterals(script, context);
  processScriptRenderAttribute(script);
}

function processScriptRenderAttribute(script: HTMLScriptElement) {
  check(script.hasAttribute("render"));

  // render type already specified
  if (script.getAttribute("render")) return;

  const behavior = detectScriptBehavior(script);

  if (behavior.yields) {
    script.setAttribute("render", "gen");
  } else if (behavior.returns) {
    script.setAttribute("render", "func");
  } else {
    script.setAttribute("render", "expr");
  }
  logger.debug(
    "  auto-detected render type as",
    `render="${script.getAttribute("render")}"`
  );
}

function processScriptHtmlLiterals(
  script: HTMLScriptElement,
  context: Context
): boolean {
  const builder = new NodeListBuilder();
  const textProcessor = new TextProcessor(script);
  const delimiters = findDelimiters(
    HTML_DELIMITER_OPEN,
    HTML_DELIMITER_CLOSE,
    script
  );

  let openIndex = 0;

  for (const delimiter of delimiters) {
    if (delimiter.levelInside === 1) {
      if (delimiter.type === HTML_DELIMITER_OPEN) {
        openIndex = delimiter.index;
      } else if (delimiter.type === HTML_DELIMITER_CLOSE) {
        builder.append(...textProcessor.readUntil(openIndex));
        // offset by one because the delimiter includes part of content '<' and '>'
        textProcessor.readUntil(openIndex + HTML_DELIMITER_OPEN.length - 1);
        const html = stringify(textProcessor.readUntil(delimiter.index + 1));
        textProcessor.readUntil(delimiter.index + HTML_DELIMITER_CLOSE.length);

        const htmlLiteralExpr = addHtmlLiteral(html, context);

        logger.debug(
          `  converted HTML literal (${html})`,
          "→",
          htmlLiteralExpr
        );

        builder.append(htmlLiteralExpr);
      }
    }
  }

  builder.append(...textProcessor.readUntil(Infinity));

  const newContent = builder.collect();
  check(newContent.length === 1);

  const willChange = script.textContent !== newContent[0].textContent;
  if (willChange) {
    script.innerHTML = newContent[0].textContent!;
    return true;
  }

  return false;
}

function addHtmlLiteral(html: string, context: Context): string {
  const index = context.htmlLiterals.push(parse(html)) - 1;
  return ` (__renderHTMLLiteral__(${index})) `;
}

function stringify(array: (string | Node)[]) {
  return array
    .map((item) => (typeof item === "string" ? item : toHTML(item)))
    .join("");
}

function trim(content: DocumentFragment) {
  const children = Array.from(childNodesOf(content));
  for (const item of children) {
    if (!isText(item) || !item.textContent) break;
    item.textContent = item.textContent.trimStart();
    if (item.textContent.length) break;
    item.remove();
  }
  for (const item of children.reverse()) {
    if (!isText(item) || !item.textContent) break;
    item.textContent = item.textContent.trimEnd();
    if (item.textContent.length) break;
    item.remove();
  }
}
