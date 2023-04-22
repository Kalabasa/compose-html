"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateScripts = void 0;
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const node_path_1 = __importDefault(require("node:path"));
const is_iterable_1 = require("util/is_iterable");
const log_1 = require("util/log");
const preconditions_1 = require("util/preconditions");
const map_attrs_1 = require("./map_attrs");
const raw_html_1 = require("./raw_html");
const renderer_1 = require("./renderer");
const spread_attrs_1 = require("./spread_attrs");
const vm_1 = require("./vm");
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename, ".ts"));
async function evaluateScripts(inOutFragment, component, attrs, children, 
// todo: injection
render, context = renderer_1.nullRenderContext) {
    const vm = (0, vm_1.createVM)(component, context, {
        html: createHTMLTag(attrs, () => vm, render),
        raw: raw_html_1.rawHTMLTag,
        attrs: (0, map_attrs_1.mapAttrsForScript)(attrs),
        children, // todo: make immutable when exposed
    });
    runStaticScripts(component, vm);
    await evaluateFragment(inOutFragment, attrs, vm);
}
exports.evaluateScripts = evaluateScripts;
function runStaticScripts(component, vm) {
    const scriptCode = component.staticScripts
        .map((el) => el.textContent)
        .join("\n");
    if (scriptCode) {
        logger.debug("run static script:\n" +
            (0, log_1.formatJSValue)(scriptCode.replace(/^\s*\n|\s+$/g, "")));
        vm.runCode(scriptCode);
    }
}
async function evaluateFragment(inOutFragment, attrs, vm) {
    (0, spread_attrs_1.spreadAttrs)(inOutFragment, attrs);
    await renderScripts(inOutFragment, vm);
}
async function renderScripts(inOutFragment, vm) {
    for (const node of (0, dom_1.stableChildNodesOf)(inOutFragment)) {
        await renderNode(node, vm.runCode);
    }
}
async function renderNode(inOutNode, runCode) {
    if ((0, dom_1.isElement)(inOutNode)) {
        await renderElementAttrs(inOutNode, runCode);
        if ((0, dom_1.isInlineJavaScriptElement)(inOutNode) &&
            inOutNode.hasAttribute("render")) {
            await renderScriptElement(inOutNode, runCode);
            return;
        }
    }
    for (const childNode of (0, dom_1.stableChildNodesOf)(inOutNode)) {
        await renderNode(childNode, runCode);
    }
}
async function renderElementAttrs(inOutElement, runCode) {
    for (const attr of Array.from(inOutElement.attributes)) {
        let renderedAttrValue = await renderAttrValueIfDynamic(attr.value, runCode);
        if (renderedAttrValue) {
            const { value } = renderedAttrValue;
            if (value == null) {
                inOutElement.removeAttribute(attr.name);
            }
            else {
                inOutElement.setAttribute(attr.name, String(value));
            }
        }
    }
}
async function renderAttrValueIfDynamic(attrValue, runCode) {
    const marked = attrValue.startsWith(compiler_1.SCRIPT_DELIMITER_OPEN) &&
        attrValue.endsWith(compiler_1.SCRIPT_DELIMITER_CLOSE);
    if (!marked)
        return undefined;
    const expr = attrValue.slice(1, -1);
    const newValue = await runCode(`(async function(){ return ${expr} })()`);
    logger.debug("rendered attr:", `"${attrValue}"`, "→", `"${newValue}"`);
    return { value: newValue };
}
async function renderScriptElement(inOutElement, runCode) {
    const code = inOutElement.innerHTML;
    logger.debug("render script:", (0, log_1.formatJSValue)(code.replace(/\n/g, " ")));
    const asyncResults = unwrapResults(runCode(wrapCode(code, inOutElement)));
    const results = [];
    for await (const result of asyncResults) {
        results.push(result);
    }
    logger.debug("render script result:", results);
    inOutElement.replaceWith(...results);
    // because the node was replaced, standard recursion won't work
    // so we renderNode() the results here
    for (const item of results) {
        if (!(0, dom_1.isNode)(item))
            continue;
        await renderNode(item, runCode);
    }
}
function createHTMLTag(attrs, getVM, render) {
    return async (segments, ...expressions) => {
        logger.debug("render HTML literal");
        logger.group();
        const raw = await (0, raw_html_1.rawHTMLTag)(segments, ...expressions);
        const fragment = (0, dom_1.parse)(raw.html);
        await evaluateFragment(fragment, attrs, getVM());
        const result = await render((0, dom_1.childNodesOf)(fragment));
        logger.groupEnd();
        return result;
    };
}
// unwraps the result of `wrapCode()`
async function* unwrapResults(results) {
    for (let result of await results) {
        if (result == null)
            continue;
        if (typeof result === "string" || result instanceof String) {
            yield String(result);
        }
        else if ((0, is_iterable_1.isIterable)(result)) {
            yield* unwrapResults(Promise.resolve(result));
        }
        else if ((0, dom_1.isNode)(result)) {
            yield result;
        }
        else if ((0, raw_html_1.isRawHTML)(result)) {
            for (const node of (0, dom_1.childNodesOf)((0, dom_1.parse)(result.html))) {
                yield node;
            }
        }
        else {
            yield String(result);
        }
    }
}
// wraps code as a Promise<Iterable<__>> for uniform handling
function wrapCode(code, script) {
    const render = script.getAttribute("render");
    if (render === "gen") {
        return wrapGenCode(code);
    }
    else if (render === "func") {
        return wrapFuncCode(code);
    }
    (0, preconditions_1.check)(render === "expr");
    return wrapFuncCode(`return (${code})`);
}
function wrapFuncCode(code) {
    return `Promise.all([(async function(){${code}})()])`;
}
function wrapGenCode(code) {
    return `(async function(){ const __a = []; for await (const __v of (async function*(){${code}})()) __a.push(__v); return __a })()`;
}
