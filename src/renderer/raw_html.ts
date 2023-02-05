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

export function rawHTMLTag(segments: string[], ...expressions: any[]): RawHTML {
  const parts: string[] = [];

  segments.forEach((segment, i) => {
    if (i + 1 === segments.length) {
      parts.push(segment);
    } else {
      parts.push(segment, String(expressions[i]));
    }
  });

  return rawHTML(parts.join(""));
}
