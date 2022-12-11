import { Logger } from "loglevel";
import { format } from "./format";

let currentGlobalContext: string | undefined = undefined;
let currentContext: string | undefined = undefined;

export function installContextWrapper(logger: Logger) {
  const originalFactory = logger.methodFactory;

  logger.methodFactory = function (methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);

    return (...msg: any[]) => {
      const context = [
        formatTag(currentGlobalContext),
        formatTag(currentContext),
        " ",
      ]
        .filter((s) => s)
        .join(" ")
        .padStart(45, " ");

      const continuation = context.replace(/./g, " ").slice(0, -3) + "~  ";

      const text =
        context +
        msg
          .map((item) => format(item))
          .join(" ")
          .replace(/\n/gm, "\n" + continuation);

      const ret = originalMethod(text);

      currentContext = undefined;

      return ret;
    };
  };
}

export function setLogGlobalContext(context: string | undefined) {
  currentGlobalContext = context;
}

export function setLogContext(context: string | undefined) {
  currentContext = context;
}

export function formatTag(tag?: string): string | undefined {
  if (!tag) return undefined;
  const max = 30; // max length
  // ellipsize
  tag =
    tag.length > max
      ? tag.length > 5
        ? tag.substring(0, max - 9) +
          "..." +
          tag.substring(tag.length - 6, tag.length)
        : tag.substring(0, max - 3) + "..."
      : tag;
  tag = `[${tag}]`;
  return tag;
}
