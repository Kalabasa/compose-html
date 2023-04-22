import { Logger } from "loglevel";
export type LogGrouper = Pick<Console, "group" | "groupEnd">;
export declare function installLogGrouper(logger: Logger): void;
export declare function increaseLogIndent(): void;
export declare function decreaseLogIndent(): void;
