import console from "console";
global.console = console;

import { setLogGlobalContext } from "./log";

beforeEach(() => {
  setLogGlobalContext(`${expect.getState().currentTestName}`);
});
