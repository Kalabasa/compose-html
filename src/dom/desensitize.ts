import { TextProcessor } from "compiler/text_processor";
import Lexx, { NodeTypes } from "xml-zero-lexer";
import { castStrArr } from "../util/cast_string_array";
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

    result.push(...castStrArr(textProcessor.readUntil(token[1])));
    const tagName = castStrArr(textProcessor.readUntil(token[2])).join("");
    result.push(map.get(tagName) ?? tagName);
  }

  result.push(...castStrArr(textProcessor.readUntil(Infinity)));

  return result.join("");
}
