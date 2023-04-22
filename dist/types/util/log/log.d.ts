import { Logger } from "loglevel";
import { LogGrouper } from "./group";
export declare function createLogger(context?: string | Function): Logger & LogGrouper;
