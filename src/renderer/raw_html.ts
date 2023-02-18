import { isElement, isText } from "dom/dom";
import { isIterable } from "util/is_iterable";

export const rawHTMLSymbol = Symbol("rawHTML");

export type RawHTML = {
  [rawHTMLSymbol]: true;
  html: string;
};

export function isRawHTML(thing: any): thing is RawHTML {
  return typeof thing === "object" && rawHTMLSymbol in thing;
}

export function rawHTML(html: string): RawHTML {
  return { [rawHTMLSymbol]: true, html: html };
}

export async function rawHTMLTag(
  segments: string[],
  ...expressions: any[]
): Promise<RawHTML> {
  const parts: string[] = [];
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i + 1 === segments.length) {
      parts.push(segment);
    } else {
      parts.push(segment, await stringifyHTMLTagExpression(expressions[i]));
    }
  }
  
  return rawHTML(parts.join(""));
}

async function stringifyHTMLTagExpression(expression: any): Promise<string> {
  if (expression != null) expression = await expression;
  if (expression == null) return "";
  if (typeof expression === "string" || expression instanceof String) {
    return String(expression);
  } else if (isElement(expression)) {
    return expression.outerHTML;
  } else if (isText(expression)) {
    return expression.textContent ?? "";
  } else if (isIterable(expression)) {
    let joined = "";
    for (const item of expression) {
      joined += await stringifyHTMLTagExpression(item);
    }
    return joined;
  } else {
    return String(expression);
  }
}
