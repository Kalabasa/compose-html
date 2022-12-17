import { TextProcessor } from "compiler/text_processor";
import { check } from "util/preconditions";
import Lexx, { NodeTypes } from "xml-zero-lexer";
import { createTextNode } from "./dom";

// prefix to allow nesting that would be illegal in valid HTML
export const DZ_PREFIX = "dz-";

const ELEMENTS = new Set(["html", "head", "body"]);

const DESEN_MAP = new Map(
  Array.from(ELEMENTS.values()).map((item) => [item, DZ_PREFIX + item])
);
const UNDESEN_MAP = new Map(
  Array.from(DESEN_MAP.entries()).map(([from, to]) => [to, from])
);

// replace parse-sensitive elements to be more resilient for general processing
export function desensitizeHTML(html: string) {
  return replaceTags(html, DESEN_MAP);
}

// undo
export function undesensitizeHTML(html: string) {
  return replaceTags(html, UNDESEN_MAP);
}

function replaceTags(html: string, map: Map<string, string>) {
  let result: string[] = [];

  const textProcessor = new TextProcessor(createTextNode(html));

  for (const token of Lexx(html)) {
    const nodeType = token[0];

    if (
      (nodeType !== NodeTypes.ELEMENT_NODE &&
        nodeType !== NodeTypes.CLOSE_ELEMENT) ||
      !token[1] ||
      !token[2]
    ) {
      continue;
    }

    result.push(...chkStrArr(textProcessor.readUntil(token[1])));
    const tagName = chkStrArr(textProcessor.readUntil(token[2])).join("");
    result.push(map.get(tagName) ?? tagName);
  }

  result.push(...chkStrArr(textProcessor.readUntil(Infinity)));

  return result.join("");
}

// checkStringArray
function chkStrArr<T extends any[]>(array: T): T & string[] {
  check(array.every((item) => typeof item === "string"));
  return array;
}
