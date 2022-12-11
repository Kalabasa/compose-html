import util from "node:util";
import { highlight } from "cli-highlight";
import { isDocumentFragment, isElement, isText, toHTML } from "dom/dom";
import { isRawHTML } from "renderer/raw_html";

const LANG_JSON = { language: "json" };
const LANG_HTML = { language: "html" };
const LANG_JSX = { language: "jsx" };

export function format(thing: any, depth: number = 2): any {
  if (!thing) return thing;

  if (isDocumentFragment(thing)) {
    return asIs(`DocumentFragment(${shortHTML(toHTML(thing))})`);
  } else if (isElement(thing)) {
    return asIs(`Element(${shortHTML(thing.outerHTML)})`);
  } else if (isText(thing)) {
    const text = highlight(JSON.stringify(thing.textContent), LANG_JSON);
    return asIs(`Text(${text})`);
  } else if (isRawHTML(thing)) {
    return asIs(`html(${shortHTML(thing.html)})`);
  } else if (
    depth > 0 &&
    typeof thing === "object" &&
    Symbol.iterator in thing
  ) {
    return formatIterable(thing, depth);
  } else if (typeof thing === "object") {
    return asIs(toString(thing));
  }

  return thing;
}

function shortHTML(html: string): string {
  html = html.trim();

  let truncated = false;
  if (html.includes("\n")) {
    const lines = html.split(/\s*\n\s*/g);
    if (lines.length > 3) {
      lines.length = 3;
      lines[2] = "<!--..-->";
      truncated = true;
    }
    html = lines.join(" ");
  }

  html = formatHTMLValue(html);

  if (truncated) {
    const commentOpen = html.lastIndexOf("<!--");
    const commentClose = html.lastIndexOf("-->");
    html =
      html.substring(0, commentOpen) +
      html.substring(commentOpen + 4, commentClose) +
      html.substring(commentClose + 3);
  }

  return html;
}

export function formatHTMLValue(html: string): string {
  return highlight(html.trim(), LANG_HTML);
}

export function formatJSValue(js: string): string {
  return highlight(js.trim(), LANG_JSX);
}

function formatIterable(ite: Iterable<any>, depth: number): String {
  const arrayString = toString([...ite].map((item) => format(item, depth - 1)));
  if (Array.isArray(ite)) {
    return asIs(arrayString);
  } else {
    return asIs("{" + arrayString.substring(1, arrayString.length - 1) + "}");
  }
}

function asIs(str: string): String {
  const newStr = new String(str);
  (newStr as any)[util.inspect.custom] = () => str;
  return newStr;
}

function toString(thing: any): string {
  return util.inspect(thing);
}
