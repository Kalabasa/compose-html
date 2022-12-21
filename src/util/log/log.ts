import loglevel, { Logger } from "loglevel";
import { installContextWrapper, setLogContext } from "./context";
import { installFormatter } from "./format";
import {
  installLogGrouper,
  decreaseLogIndent,
  increaseLogIndent,
  LogGrouper,
} from "./group";
import { installMethodNameCollector } from "./method_names";

const { methodNames } = installMethodNameCollector(loglevel);
installFormatter(loglevel);
if (require.main !== module) installContextWrapper(loglevel);
installLogGrouper(loglevel);

loglevel.setLevel(
  (loglevel.levels as any)[process.env.LOGLEVEL ?? "DEBUG"] ??
    loglevel.levels.DEBUG
);

export function createLogger(context?: string | Function): Logger & LogGrouper {
  const contextStr = typeof context === "function" ? context.name : context;

  return new Proxy(Object.create(null), {
    get(_, p, __) {
      if (p === "group") {
        return () => increaseLogIndent();
      }
      if (p === "groupEnd") {
        return () => decreaseLogIndent();
      }
      if (methodNames.has(p as any)) {
        setLogContext(contextStr);
      }

      return Reflect.get(loglevel, p, loglevel);
    },
  }) as Logger & LogGrouper;
}
