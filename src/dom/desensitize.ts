import { TextProcessor } from "component/text_processor";
import { check } from "util/preconditions";
import Lexx, { NodeTypes } from "xml-zero-lexer";
import { createTextNode } from "./dom";

const PREFIX = "dz-";
const SENSITIVE_ELEMENTS = new Set(["html", "head", "body"]);

const DESENSITIZE_MAP = new Map(
  Array.from(SENSITIVE_ELEMENTS.values()).map((item) => [item, PREFIX + item])
);

const UNDESENSITIZE_MAP = new Map(
  Array.from(DESENSITIZE_MAP.entries()).map(([from, to]) => [to, from])
);

// replace parse-sensitive elements to be more resilient for general processing
export function desensitizeHTML(html: string) {
  return replaceTags(html, DESENSITIZE_MAP);
}

// undo
export function undesensitizeHTML(html: string) {
  return replaceTags(html, UNDESENSITIZE_MAP);
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
