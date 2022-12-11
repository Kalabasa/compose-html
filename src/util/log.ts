import util from "node:util";
import loglevel from "loglevel";
import { highlight } from "cli-highlight";
import { isDocumentFragment, isElement, isText, toHTML } from "dom/dom";
import { isRawHTML } from "renderer/vm";

let currentGlobalContext: string | undefined = undefined;
let currentLoggerContext: string | undefined = undefined;

const logMethodNames = new Set<loglevel.LogLevelNames>();

const originalFactory = loglevel.methodFactory;
loglevel.methodFactory = function (methodName, logLevel, loggerName) {
  logMethodNames.add(methodName);

  const originalMethod = originalFactory(methodName, logLevel, loggerName);

  return (...msg: any[]) => {
    const context = [currentGlobalContext, currentLoggerContext, "  "]
      .filter((s) => s)
      .join("  ");

    const continuation = context.replace(/./g, " ").slice(0, -5) + "~    ";
    const text =
      context +
      msg
        .map((item) => format(item))
        .join(" ")
        .replace(/\n/gm, "\n" + continuation);

    const ret = originalMethod(text);

    currentLoggerContext = undefined;

    return ret;
  };
};

loglevel.setLevel(
  (loglevel.levels as any)[process.env.LOGLEVEL ?? "DEBUG"] ??
    loglevel.levels.DEBUG
);

export const log = loglevel;

export function setLogGlobalContext(context: string | undefined) {
  currentGlobalContext = context;
}

export function createLogger(context?: string | Function) {
  const contextStr = typeof context === "function" ? context.name : context;

  return new Proxy(loglevel, {
    get(target, p, receiver) {
      if (logMethodNames.has(p as any)) {
        currentLoggerContext = contextStr;
      }

      return Reflect.get(target, p, receiver);
    },
  });
}

function format(thing: any, depth: number = 2): any {
  if (!thing) return thing;

  if (isDocumentFragment(thing)) {
    return asIs(`DocumentFragment(${formatHTMLValue(toHTML(thing))})`);
  } else if (isElement(thing)) {
    return asIs(`Element(${formatHTMLValue(thing.outerHTML)})`);
  } else if (isText(thing)) {
    return asIs(`Text(${JSON.stringify(thing.textContent)})`);
  } else if (isRawHTML(thing)) {
    return asIs(`html(${formatHTMLValue(thing.html)})`);
  } else if (
    depth > 0 &&
    typeof thing === "object" &&
    Symbol.iterator in thing
  ) {
    return formatIterable(thing, depth);
  } else if (typeof thing === "object") {
    return asIs(toString(thing));
  }

  return thing;
}

function formatHTMLValue(html: string): string {
  html = html.trim();
  if (html.includes("\n")) {
    html = ["", ...html.split("\n")].join("\n  ") + "\n";
  }
  return highlight(html, { language: "html" });
}

function formatIterable(ite: Iterable<any>, depth: number): String {
  const arrayString = toString([...ite].map((item) => format(item, depth - 1)));
  if (Array.isArray(ite)) {
    return asIs(arrayString);
  } else {
    return asIs("{" + arrayString.substring(1, arrayString.length - 1) + "}");
  }
}

function asIs(str: string): String {
  const newStr = new String(str);
  (newStr as any)[util.inspect.custom] = () => str;
  return newStr;
}

function toString(thing: any): string {
  return util.inspect(thing);
}
