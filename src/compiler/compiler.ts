import { Component } from "compiler/component";
import { DZ_PREFIX } from "dom/desensitize";
import {
  childNodesOf,
  createDocumentFragment,
  createElement,
  createTextNode,
  isDocumentFragment,
  isElement,
  isInlineJavaScriptElement,
  isText,
  parse,
  stableChildNodesOf,
  toHTML,
} from "dom/dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { check } from "util/preconditions";
import { findDelimiters } from "./find_delimiters";
import { NodeListBuilder } from "./node_list_builder";
import { detectScriptBehavior } from "./detect_script_behavior";
import { TextProcessor } from "./text_processor";
import { queryPageSkeleton } from "util/query_page_skeleton";

export const SCRIPT_DELIMITER_OPEN = "{";
export const SCRIPT_DELIMITER_CLOSE = "}";

const DYNAMIC_ATTR_PREFIX = ":";

const logger = createLogger(path.basename(__filename, ".ts"));

type Context = {
  metadata: Node[];
  contentRoot: Node;
  staticScripts: HTMLScriptElement[];
  clientScripts: HTMLScriptElement[];
  styles: HTMLStyleElement[];
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
    filePath
  );
  logger.trace("\n" + formatHTMLValue(source.trim()) + "\n");

  const sourceFragment = parse(source);
  let content = sourceFragment.cloneNode(true);

  const processed = processNode(content);

  if (processed.contentRoot === content) {
    trim(content);
  } else {
    content = createDocumentFragment();
    content.append(...childNodesOf(processed.contentRoot));
  }

  const component: Component = {
    name,
    filePath,
    source: sourceFragment,
    page: extractPage(sourceFragment),
    metadata: processed.metadata,
    content,
    staticScripts: processed.staticScripts,
    clientScripts: processed.clientScripts,
    styles: processed.styles,
  };

  logger.debug("");
  logger.debug(
    "====== compile done ======",
    "\nmetadata:",
    component.metadata,
    "\npage:",
    component.page?.skeleton,
    "\ncontent:",
    component.content,
    "\nstatic scripts:",
    component.staticScripts,
    "\nclient scripts:",
    component.clientScripts,
    "\nstyles:",
    component.styles,
    "\n"
  );
  return component;
}

function extractPage(sourceFragment: DocumentFragment) {
  let page: Component["page"] = undefined;
  let { html, head, body } = queryPageSkeleton(sourceFragment.cloneNode(true));
  if (html || body) {
    html = html ?? createElement(`${DZ_PREFIX}html`);
    body = body ?? createElement(`${DZ_PREFIX}body`);
    head = head ?? createElement(`${DZ_PREFIX}head`);

    head.replaceChildren();
    body.replaceChildren();

    for (const child of stableChildNodesOf(html)) {
      if (child == head || child == body) continue;
      if (isText(child) && !child.textContent?.trim()) continue;
      html.removeChild(child);
    }

    if (!html.contains(body)) html.appendChild(body);
    if (!html.contains(head)) html.prepend(head);

    page = {
      skeleton: html as HTMLElement,
    };
  }
  return page;
}

function processNode(
  node: Node,
  context: Context = {
    metadata: [],
    contentRoot: node,
    staticScripts: [],
    clientScripts: [],
    styles: [],
  }
) {
  logger.debug("process node:", node);
  logger.group();

  let consumed = false;

  if (isElement(node)) {
    consumed = processElement(node, context);
  }

  const detached = !node.parentNode && !isDocumentFragment(node);
  if (detached) {
    logger.debug("detached from content");
    logger.groupEnd();
  } else if (consumed) {
    logger.debug("consumed; ignore subnodes");
    logger.groupEnd();
  } else {
    processShorthands(node, context);

    logger.groupEnd();

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
        logger.debug(`convert shorthand {${code}}`);
        logger.group();
        processRenderScript(scriptElement, context);
        logger.debug("converted shorthand →", scriptElement);
        logger.groupEnd();

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

  switch (element.tagName.toLowerCase()) {
    case "script":
      if (!isInlineJavaScriptElement(element)) {
        // external <script src="...">
        context.metadata.push(element);
        element.remove();
        return true;
      }

      const isRender = element.hasAttribute("render");
      const isStatic = element.hasAttribute("static");
      const isClient = element.hasAttribute("client");

      // regular <script> (e.g. <script src="jquery.min.js">), as is
      if (+isRender + +isStatic + +isClient !== 1) {
        return true;
      }

      if (isRender) {
        processRenderScript(element as HTMLScriptElement, context);
      } else if (isStatic) {
        element.removeAttribute("static");
        context.staticScripts.push(element as HTMLScriptElement);
        element.remove();
      } else if (isClient) {
        element.removeAttribute("client");
        context.clientScripts.push(element as HTMLScriptElement);
        element.remove();
      }
      return true;
    case "style":
      context.styles.push(element as HTMLStyleElement);
      element.remove();
      return true;
    case `${DZ_PREFIX}html`:
    case `${DZ_PREFIX}body`:
      logger.debug("change to root here");
      context.contentRoot = element;
      return false;
    case `${DZ_PREFIX}head`:
      context.metadata.push(...childNodesOf(element));
      element.remove();
      return true;
    case "title":
    case "base":
    case "meta":
    case "link":
      context.metadata.push(element);
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
        "convert attr shorthand",
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
    "auto-detected render type as",
    `render="${script.getAttribute("render")}"`
  );
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
