import { Logger, LogLevelNames } from "loglevel";

const methodNames = new Set<LogLevelNames>();

export function installMethodNameCollector(logger: Logger): {
  methodNames: Set<LogLevelNames>;
} {
  const originalFactory = logger.methodFactory;

  logger.methodFactory = function (methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);

    methodNames.add(methodName);

    return originalMethod;
  };

  return { methodNames };
}
