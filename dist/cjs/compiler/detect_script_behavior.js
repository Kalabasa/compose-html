"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectScriptBehavior = void 0;
const acornLoose = __importStar(require("acorn-loose"));
const acornWalk = __importStar(require("acorn-walk"));
const preconditions_1 = require("util/preconditions");
function detectScriptBehavior(inOutScript) {
    // wrap to allow yield, return, and await keywords in code
    const code = `async function* wrapper(){${inOutScript.innerHTML}}`;
    const tree = acornLoose.parse(code, { ecmaVersion: "latest" });
    // determine if this code yields or returns
    const state = { wrapperVisited: false, yields: false, returns: false };
    acornWalk.recursive(tree, state, {
        Function(node, state, callback) {
            if (state.wrapperVisited)
                return;
            const func = node;
            (0, preconditions_1.check)(func.generator === true);
            (0, preconditions_1.check)(func.async === true);
            (0, preconditions_1.check)(func.id?.name === "wrapper");
            state.wrapperVisited = true;
            callback(func.body, state);
        },
        YieldExpression(node, state) {
            state.yields = true;
        },
        ReturnStatement(node, state) {
            state.returns = true;
        },
    });
    return {
        yields: state.yields,
        returns: state.returns,
    };
}
exports.detectScriptBehavior = detectScriptBehavior;
