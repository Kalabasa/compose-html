"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("@jest/console");
global.console = new console_1.CustomConsole(process.stdout, process.stderr, (_, message) => message);
const log_1 = require("./log");
beforeEach(() => {
    (0, log_1.setLogGlobalContext)(expect.getState().currentTestName);
});
afterEach(() => {
    (0, log_1.setLogGlobalContext)(undefined);
});
