import { Logger } from "loglevel";
import { format } from "./format";

export type LogGrouper = Pick<Console, "group" | "groupEnd">;

let currentIndent = 0;
let currentIndentStr = "";

export function installLogGrouper(logger: Logger): void {
  const originalFactory = logger.methodFactory;

  logger.methodFactory = function (methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);

    return (...msg: any[]) => {
      if (logger.getLevel() > logLevel) return;

      if (currentIndent === 0) {
        originalMethod(...msg);
      } else {
        const text =
          currentIndentStr +
          msg
            .map((item) => format(item))
            .join(" ")
            .replace(/\n/gm, "\n" + currentIndentStr);
        originalMethod(text);
      }
    };
  };
}

export function increaseLogIndent() {
  currentIndent++;
  currentIndentStr = currentIndentStr.padEnd(indentLength(), " ");
}

export function decreaseLogIndent() {
  currentIndent--;
  if (currentIndent < 0) throw new Error("invalid state");
  currentIndentStr = currentIndentStr.substring(0, indentLength());
}

function indentLength(): number {
  return currentIndent * 2;
}
