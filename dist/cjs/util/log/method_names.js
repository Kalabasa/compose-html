"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installMethodNameCollector = void 0;
const methodNames = new Set();
function installMethodNameCollector(logger) {
    const originalFactory = logger.methodFactory;
    logger.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);
        methodNames.add(methodName);
        return originalMethod;
    };
    return { methodNames };
}
exports.installMethodNameCollector = installMethodNameCollector;
