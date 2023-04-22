import { Logger } from "loglevel";
export declare function installContextWrapper(logger: Logger): void;
export declare function setLogGlobalContext(context: string | undefined): void;
export declare function setLogContext(context: string | undefined): void;
export declare function formatTag(tag?: string): string | undefined;
