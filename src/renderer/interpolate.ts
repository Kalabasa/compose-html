import { Component } from "component/component";
import { childNodesOf, isText } from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { createVM } from "./vm";

const DELIMITER_OPEN = "{";
const DELIMITER_CLOSE = "}";
const ESCAPE = "\\";

const logger = createLogger(path.basename(__filename, ".ts"));

export function interpolate(nodes: Iterable<Node>, component: Component): void {
  const vm = createVM(component);

  const scriptCode = component.scripts.map((el) => el.textContent).join("\n");
  if (scriptCode) vm.runCode(scriptCode);

  for (const node of nodes) {
    interpolateNode(node, vm.runCode);
  }
}

function interpolateNode(node: Node, runCode: (code: string) => unknown): void {
  if (isText(node) && node.textContent) {
    const interpolatedText = interpolateText(node.textContent, runCode);
    if (interpolatedText !== false) {
      node.textContent = interpolatedText;
    }
  }

  for (const childNode of childNodesOf(node)) {
    interpolateNode(childNode, runCode);
  }
}

function interpolateText(
  text: string,
  runCode: (code: string) => unknown
): string | false {
  let cursor = text.indexOf(DELIMITER_OPEN);
  if (cursor < 0) {
    return false;
  }

  let newTextContent = "";
  let consumedText = 0;

  do {
    // At the beginnng of this loop, cursor is on a DELIMITER_OPEN char
    if (isEscaped(cursor, text)) {
      continue;
    }

    let closeIndex;
    while ((closeIndex = text.indexOf(DELIMITER_CLOSE, cursor + 1)) >= 0) {
      // At the beginnng of this loop, closeIndex is on a DELIMITER_CLOSE char
      if (isEscaped(closeIndex, text)) {
        continue;
      }

      // cursor is now at a valid DELIMITER_OPEN, closeIndex now at a valid DELIMITER_CLOSE
      // perform interpolation
      const code = text.substring(cursor + 1, closeIndex);
      newTextContent += text.substring(consumedText, cursor);
      const result = String(runCode(code));
      logger.debug(`Running code: '${code}' result: '${result}'`);
      newTextContent += result;

      // Update cursors
      cursor = closeIndex + 1;
      consumedText = cursor;
    }
  } while ((cursor = text.indexOf(DELIMITER_OPEN, cursor + 1)) >= 0);

  newTextContent += text.substring(consumedText);

  return newTextContent;
}

function isEscaped(currentIndex: number, text: string): boolean {
  let cursor = currentIndex - 1;
  while (cursor > 0 && text[cursor] === ESCAPE) {
    cursor--;
  }
  return (currentIndex - cursor) % 2 === 0;
}
