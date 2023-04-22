"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.compileFile = exports.SCRIPT_DELIMITER_CLOSE = exports.SCRIPT_DELIMITER_OPEN = void 0;
const desensitize_1 = require("dom/desensitize");
const dom_1 = require("dom/dom");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const log_1 = require("util/log");
const preconditions_1 = require("util/preconditions");
const find_delimiters_1 = require("./find_delimiters");
const node_list_builder_1 = require("./node_list_builder");
const detect_script_behavior_1 = require("./detect_script_behavior");
const text_processor_1 = require("./text_processor");
const query_page_skeleton_1 = require("util/query_page_skeleton");
exports.SCRIPT_DELIMITER_OPEN = "{";
exports.SCRIPT_DELIMITER_CLOSE = "}";
const DYNAMIC_ATTR_PREFIX = ":";
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename, ".ts"));
function compileFile(filePath) {
    return compile(node_path_1.default.basename(filePath, ".html"), filePath, (0, node_fs_1.readFileSync)(filePath).toString());
}
exports.compileFile = compileFile;
function compile(name, filePath, source) {
    logger.debug("====== compile start ======", "\nname:", name, "\nfile path:", filePath);
    logger.trace("\n" + (0, log_1.formatHTMLValue)(source.trim()) + "\n");
    const sourceFragment = (0, dom_1.parse)(source);
    let content = sourceFragment.cloneNode(true);
    const processed = processNode(content);
    if (processed.contentRoot === content) {
        trim(content);
    }
    else {
        content = (0, dom_1.createDocumentFragment)();
        content.append(...(0, dom_1.childNodesOf)(processed.contentRoot));
    }
    const component = {
        name,
        filePath,
        source: sourceFragment,
        page: extractPage(sourceFragment),
        metadata: processed.metadata,
        content,
        staticScripts: processed.staticScripts,
        clientScripts: processed.clientScripts,
        styles: processed.styles,
    };
    logger.debug("");
    logger.debug("====== compile done ======", "\nmetadata:", component.metadata, "\npage:", component.page?.skeleton, "\ncontent:", component.content, "\nstatic scripts:", component.staticScripts, "\nclient scripts:", component.clientScripts, "\nstyles:", component.styles, "\n");
    return component;
}
exports.compile = compile;
function extractPage(sourceFragment) {
    let page = undefined;
    let { html, head, body } = (0, query_page_skeleton_1.queryPageSkeleton)(sourceFragment.cloneNode(true));
    if (html || body) {
        html = html ?? (0, dom_1.createElement)(`${desensitize_1.DZ_PREFIX}html`);
        body = body ?? (0, dom_1.createElement)(`${desensitize_1.DZ_PREFIX}body`);
        head = head ?? (0, dom_1.createElement)(`${desensitize_1.DZ_PREFIX}head`);
        head.replaceChildren();
        body.replaceChildren();
        for (const child of (0, dom_1.stableChildNodesOf)(html)) {
            if (child == head || child == body)
                continue;
            if ((0, dom_1.isText)(child) && !child.textContent?.trim())
                continue;
            html.removeChild(child);
        }
        if (!html.contains(body))
            html.appendChild(body);
        if (!html.contains(head))
            html.prepend(head);
        page = {
            skeleton: html,
        };
    }
    return page;
}
function processNode(node, context = {
    metadata: [],
    contentRoot: node,
    staticScripts: [],
    clientScripts: [],
    styles: [],
}) {
    logger.debug("process node:", node);
    logger.group();
    let consumed = false;
    if ((0, dom_1.isElement)(node)) {
        consumed = processElement(node, context);
    }
    const detached = !node.parentNode && !(0, dom_1.isDocumentFragment)(node);
    if (detached) {
        logger.debug("detached from content");
        logger.groupEnd();
    }
    else if (consumed) {
        logger.debug("consumed; ignore subnodes");
        logger.groupEnd();
    }
    else {
        processShorthands(node, context);
        logger.groupEnd();
        for (const child of (0, dom_1.stableChildNodesOf)(node)) {
            processNode(child, context);
        }
    }
    return context;
}
// Replaces {foo} shorthand with <script render>foo<script>
function processShorthands(node, context) {
    const builder = new node_list_builder_1.NodeListBuilder();
    const textProcessor = new text_processor_1.TextProcessor(node);
    const delimiters = (0, find_delimiters_1.findDelimiters)(exports.SCRIPT_DELIMITER_OPEN, exports.SCRIPT_DELIMITER_CLOSE, node);
    let contentDidChange = false;
    let openIndex = 0;
    for (const delimiter of delimiters) {
        if (delimiter.levelInside === 1) {
            if (delimiter.type === exports.SCRIPT_DELIMITER_OPEN) {
                openIndex = delimiter.index;
            }
            else if (delimiter.type === exports.SCRIPT_DELIMITER_CLOSE) {
                builder.append(...textProcessor.readUntil(openIndex));
                textProcessor.readUntil(openIndex + exports.SCRIPT_DELIMITER_OPEN.length);
                const code = stringify(textProcessor.readUntil(delimiter.index));
                textProcessor.readUntil(delimiter.index + exports.SCRIPT_DELIMITER_CLOSE.length);
                // push <script render> Element
                const scriptElement = (0, dom_1.createElement)("script");
                scriptElement.setAttribute("render", "");
                scriptElement.appendChild((0, dom_1.createTextNode)(code));
                logger.debug(`convert shorthand {${code}}`);
                logger.group();
                processRenderScript(scriptElement);
                logger.debug("converted shorthand →", scriptElement);
                logger.groupEnd();
                builder.append(scriptElement);
                contentDidChange = true;
            }
        }
    }
    builder.append(...textProcessor.readUntil(Infinity));
    const newContent = builder.collect();
    if (contentDidChange) {
        if ((0, dom_1.isText)(node)) {
            node.replaceWith(...newContent);
            return true;
        }
        else if ((0, dom_1.isElement)(node) || (0, dom_1.isDocumentFragment)(node)) {
            node.replaceChildren(...newContent);
            return true;
        }
    }
    return false;
}
function processElement(element, context) {
    processElementAttrs(element);
    switch (element.tagName.toLowerCase()) {
        case "script":
            if (!(0, dom_1.isInlineJavaScriptElement)(element)) {
                // external <script src="...">
                context.metadata.push(element);
                element.remove();
                return true;
            }
            const isRender = element.hasAttribute("render");
            const isStatic = element.hasAttribute("static");
            const isClient = element.hasAttribute("client");
            // regular <script> (e.g. <script src="jquery.min.js">), as is
            if (+isRender + +isStatic + +isClient !== 1) {
                return true;
            }
            if (isRender) {
                processRenderScript(element);
            }
            else if (isStatic) {
                element.removeAttribute("static");
                context.staticScripts.push(element);
                element.remove();
            }
            else if (isClient) {
                element.removeAttribute("client");
                context.clientScripts.push(element);
                element.remove();
            }
            return true;
        case "style":
            context.styles.push(element);
            element.remove();
            return true;
        case `${desensitize_1.DZ_PREFIX}html`:
        case `${desensitize_1.DZ_PREFIX}body`:
            logger.debug("change to root here");
            context.contentRoot = element;
            return false;
        case `${desensitize_1.DZ_PREFIX}head`:
            context.metadata.push(...(0, dom_1.childNodesOf)(element));
            element.remove();
            return true;
        case "title":
        case "base":
        case "meta":
        case "link":
            context.metadata.push(element);
            element.remove();
            return true;
    }
    return false;
}
function processElementAttrs(element) {
    // If true, force re-set attribute even if not changed
    let forceReset = false;
    for (const attr of Array.from(element.attributes)) {
        let name = attr.name;
        let value = attr.value;
        if (attr.name.startsWith(DYNAMIC_ATTR_PREFIX)) {
            name = attr.name.substring(1);
            value = exports.SCRIPT_DELIMITER_OPEN + attr.value + exports.SCRIPT_DELIMITER_CLOSE;
            logger.debug("convert attr shorthand", `${attr.name}="${attr.value}"`, "→", `${name}="${value}"`);
            // keep true til the end to preserve attr order
            forceReset = true;
        }
        if (forceReset) {
            element.removeAttribute(attr.name);
            element.setAttribute(name, value);
        }
    }
}
function processRenderScript(script) {
    processScriptRenderAttribute(script);
}
function processScriptRenderAttribute(script) {
    (0, preconditions_1.check)(script.hasAttribute("render"));
    // render type already specified
    if (script.getAttribute("render"))
        return;
    const behavior = (0, detect_script_behavior_1.detectScriptBehavior)(script);
    if (behavior.yields) {
        script.setAttribute("render", "gen");
    }
    else if (behavior.returns) {
        script.setAttribute("render", "func");
    }
    else {
        script.setAttribute("render", "expr");
    }
    logger.debug("auto-detected render type as", `render="${script.getAttribute("render")}"`);
}
function stringify(array) {
    return array
        .map((item) => (typeof item === "string" ? item : (0, dom_1.toHTML)(item)))
        .join("");
}
function trim(content) {
    const children = Array.from((0, dom_1.childNodesOf)(content));
    for (const item of children) {
        if (!(0, dom_1.isText)(item) || !item.textContent)
            break;
        item.textContent = item.textContent.trimStart();
        if (item.textContent.length)
            break;
        item.remove();
    }
    for (const item of children.reverse()) {
        if (!(0, dom_1.isText)(item) || !item.textContent)
            break;
        item.textContent = item.textContent.trimEnd();
        if (item.textContent.length)
            break;
        item.remove();
    }
}
