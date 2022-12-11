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
