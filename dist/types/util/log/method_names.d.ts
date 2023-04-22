import { Logger, LogLevelNames } from "loglevel";
export declare function installMethodNameCollector(logger: Logger): {
    methodNames: Set<LogLevelNames>;
};
