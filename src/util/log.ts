import util from "node:util";
import loglevel from "loglevel";
import { isElement, isText } from "dom/dom";

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
      .join(":  ");

    const ret = originalMethod(context, ...msg.map((item) => format(item)));

    currentLoggerContext = undefined;

    return ret;
  };
};

loglevel.setLevel(loglevel.levels.DEBUG);

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

  if (isElement(thing)) {
    return stringsTo(`Element(${thing.outerHTML})`);
  } else if (isText(thing)) {
    return stringsTo(`Text(${thing.textContent})`);
  } else if (
    depth > 0 &&
    (Array.isArray(thing) ||
      (typeof thing === "object" && Symbol.iterator in thing))
  ) {
    return formatIterable(thing, depth);
  }

  return thing;
}

function formatIterable(ite: Iterable<any>, depth: number): object {
  const str = toString([...ite].map((item) => format(item, depth - 1)));
  return stringsTo("{" + str.substring(1, str.length - 1) + "}");
}

function stringsTo(str: string): object {
  return Object.create({
    toString: () => str,
    [util.inspect.custom]: () => str,
  });
}

function toString(thing: any): string {
  return util.inspect(thing);
}
