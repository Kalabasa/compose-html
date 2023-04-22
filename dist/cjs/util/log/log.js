"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const context_1 = require("./context");
const format_1 = require("./format");
const group_1 = require("./group");
const method_names_1 = require("./method_names");
const { methodNames } = (0, method_names_1.installMethodNameCollector)(loglevel_1.default);
(0, format_1.installFormatter)(loglevel_1.default);
if (require.main !== module)
    (0, context_1.installContextWrapper)(loglevel_1.default);
(0, group_1.installLogGrouper)(loglevel_1.default);
loglevel_1.default.setLevel(loglevel_1.default.levels[process.env.LOGLEVEL ?? "INFO"] ??
    loglevel_1.default.levels.DEBUG);
function createLogger(context) {
    const contextStr = typeof context === "function" ? context.name : context;
    return new Proxy(Object.create(null), {
        get(_, p, __) {
            if (p === "group") {
                return () => (0, group_1.increaseLogIndent)();
            }
            if (p === "groupEnd") {
                return () => (0, group_1.decreaseLogIndent)();
            }
            if (methodNames.has(p)) {
                (0, context_1.setLogContext)(contextStr);
            }
            return Reflect.get(loglevel_1.default, p, loglevel_1.default);
        },
    });
}
exports.createLogger = createLogger;
