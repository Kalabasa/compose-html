"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detect_script_behavior_1 = require("compiler/detect_script_behavior");
const jsdom_1 = require("jsdom");
describe("detectScriptBehavior", () => {
    const { document } = new jsdom_1.JSDOM("", { contentType: "text/html" }).window;
    it("detects when the script yields", () => {
        const script = document.createElement("script");
        script.innerHTML = "yield 1;";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeTruthy();
        expect(returns).toBeFalsy();
    });
    it("detects when the script returns", () => {
        const script = document.createElement("script");
        script.innerHTML = "return 1;";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeFalsy();
        expect(returns).toBeTruthy();
    });
    it("detects when the script yields and returns", () => {
        const script = document.createElement("script");
        script.innerHTML = "yield 1; return 1;";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeTruthy();
        expect(returns).toBeTruthy();
    });
    it("detects when the script does not yield or return", () => {
        const script = document.createElement("script");
        script.innerHTML = "console.log(1);";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeFalsy();
        expect(returns).toBeFalsy();
    });
    it("detects nothing when the script has an inner function that yields", () => {
        const script = document.createElement("script");
        script.innerHTML = "function inner() { yield 1; }";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeFalsy();
        expect(returns).toBeFalsy();
    });
    it("detects nothing when the script has an inner function that returns", () => {
        const script = document.createElement("script");
        script.innerHTML = "function inner() { return 1; }";
        const { yields, returns } = (0, detect_script_behavior_1.detectScriptBehavior)(script);
        expect(yields).toBeFalsy();
        expect(returns).toBeFalsy();
    });
});
