import { FunctionDeclaration } from "estree";
import * as acornLoose from "acorn-loose";
import * as acornWalk from "acorn-walk";
import { check } from "util/preconditions";

export function detectScriptBehavior(inOutScript: HTMLScriptElement) {
  // wrap to allow yield, return, and await keywords in code
  const code = `async function* wrapper(){${inOutScript.innerHTML}}`;
  const tree = acornLoose.parse(code, { ecmaVersion: "latest" });

  // determine if this code yields or returns
  const state = { wrapperVisited: false, yields: false, returns: false };
  acornWalk.recursive(tree as acorn.Node, state, {
    Function(node, state, callback) {
      if (state.wrapperVisited) return;

      const func = node as unknown as FunctionDeclaration;
      check(func.generator === true);
      check(func.async === true);
      check(func.id?.name === "wrapper");

      state.wrapperVisited = true;

      callback(func.body as unknown as acorn.Node, state);
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
