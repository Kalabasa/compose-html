import { TextProcessor } from "compiler/text_processor";
import htmlTags from "html-tags";
import { castStrArr } from "util/cast_string_array";
import Lexx, { NodeTypes } from "xml-zero-lexer";
import { createTextNode } from "./dom";

const HTML_ELEMENTS = new Set<string>(htmlTags);
// Tags which are technically HTML tags, but is used in a custom way by the framework, so it's now a "foreign" element
const CUSTOM_ELEMENTS = new Set(["slot"]);

export function expandSelfClosing(html: string) {
  let result: string[] = [];

  const textProcessor = new TextProcessor(createTextNode(html));

  let openTag: string | undefined;
  let openTagKey: string | undefined;

  for (const token of Lexx(html)) {
    const nodeType = token[0];

    if (nodeType === NodeTypes.ELEMENT_NODE && token[1] && token[2]) {
      // open tag
      openTag = html.substring(token[1], token[2]);
      openTagKey = openTag.toLowerCase();
    } else if (
      nodeType === NodeTypes.CLOSE_ELEMENT &&
      token[1] === token[2] &&
      openTag &&
      (!HTML_ELEMENTS.has(openTagKey!) || CUSTOM_ELEMENTS.has(openTagKey!))
    ) {
      // self-closed, the slash is at token[1] + 1
      result.push(...castStrArr(textProcessor.readUntil(token[1] - 1)));
      result.push(`></${openTag}>`);
      textProcessor.readUntil(token[1] + 1);
    }
  }

  result.push(...castStrArr(textProcessor.readUntil(Infinity)));

  return result.join("");
}
