import { CustomConsole } from "@jest/console";

global.console = new CustomConsole(
  process.stdout,
  process.stderr,
  (_, message) => message
);

import { setLogGlobalContext } from "./log";

beforeEach(() => {
  setLogGlobalContext(expect.getState().currentTestName);
});

afterEach(() => {
  setLogGlobalContext(undefined);
});
