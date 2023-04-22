#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/util/is_iterable.ts
function isIterable(obj) {
  return typeof obj[Symbol.iterator] === "function";
}
var init_is_iterable = __esm({
  "src/util/is_iterable.ts"() {
  }
});

// src/util/preconditions.ts
var preconditions_exports = {};
__export(preconditions_exports, {
  check: () => check,
  checkNotNull: () => checkNotNull
});
function check(condition, message) {
  if (!condition) {
    console.error(message);
    throw new Error(message);
  }
}
function checkNotNull(value, message) {
  check(value != null, message);
  return value;
}
var init_preconditions = __esm({
  "src/util/preconditions.ts"() {
  }
});

// src/util/cast_string_array.ts
function castStrArr(array) {
  check(array.every((item) => typeof item === "string"));
  return array;
}
var init_cast_string_array = __esm({
  "src/util/cast_string_array.ts"() {
    init_preconditions();
  }
});

// src/dom/expand_self_closing.ts
function expandSelfClosing(html) {
  let result = [];
  const textProcessor = new TextProcessor(createTextNode(html));
  let openTag;
  let openTagKey;
  for (const token of (0, import_xml_zero_lexer.default)(html)) {
    const nodeType = token[0];
    if (nodeType === import_xml_zero_lexer.NodeTypes.ELEMENT_NODE && token[1] && token[2]) {
      openTag = html.substring(token[1], token[2]);
      openTagKey = openTag.toLowerCase();
    } else if (nodeType === import_xml_zero_lexer.NodeTypes.CLOSE_ELEMENT && token[1] === token[2] && openTag && (!HTML_ELEMENTS.has(openTagKey) || CUSTOM_ELEMENTS.has(openTagKey))) {
      result.push(...castStrArr(textProcessor.readUntil(token[1] - 1)));
      result.push(`></${openTag}>`);
      textProcessor.readUntil(token[1] + 1);
    }
  }
  result.push(...castStrArr(textProcessor.readUntil(Infinity)));
  return result.join("");
}
var import_html_tags, import_xml_zero_lexer, HTML_ELEMENTS, CUSTOM_ELEMENTS;
var init_expand_self_closing = __esm({
  "src/dom/expand_self_closing.ts"() {
    init_text_processor();
    import_html_tags = __toESM(require("html-tags"));
    init_cast_string_array();
    import_xml_zero_lexer = __toESM(require("xml-zero-lexer"));
    init_dom();
    HTML_ELEMENTS = new Set(import_html_tags.default);
    CUSTOM_ELEMENTS = /* @__PURE__ */ new Set(["slot"]);
  }
});

// src/dom/dom.ts
function parse(source) {
  const template = sharedAPI.createElement("template");
  template.innerHTML = expandSelfClosing(desensitizeHTML(source));
  return template.content;
}
function appendChild(parent, child) {
  if (isTemplateElement(parent)) {
    return parent.content.appendChild(child);
  }
  return parent.appendChild(child);
}
function childNodesOf(parent) {
  if (isTemplateElement(parent)) {
    return parent.content.childNodes;
  }
  return parent.childNodes;
}
function stableChildNodesOf(parent) {
  return Array.from(childNodesOf(parent));
}
function isTemplateElement(node) {
  return isElement(node) && node.tagName.toLowerCase() === "template";
}
function isInlineJavaScriptElement(node) {
  if (!isElement(node))
    return false;
  const src = node.getAttribute("src");
  const type = node.getAttribute("type");
  return node.tagName.toLowerCase() == "script" && (!type && !src || type === "text/javascript");
}
function isNode(node) {
  return typeof node?.nodeType === "number";
}
function isElement(node) {
  return node?.nodeType != void 0 && node.nodeType === node.ELEMENT_NODE;
}
function isText(node) {
  return node?.nodeType != void 0 && node.nodeType === node.TEXT_NODE;
}
function isDocumentFragment(node) {
  return node?.nodeType != void 0 && node.nodeType === node.DOCUMENT_FRAGMENT_NODE;
}
function toHTML(nodes, trim2 = true) {
  let html = "";
  if (isDocumentFragment(nodes)) {
    return toHTML(childNodesOf(nodes), trim2);
  } else if (isIterable(nodes)) {
    for (const item of nodes) {
      html += toHTML(item, false);
    }
  } else {
    html = isElement(nodes) ? undesensitizeHTML(nodes.outerHTML) : nodes.textContent ?? "";
  }
  return trim2 ? html.trim() : html;
}
function exportAPI(func) {
  return func.bind(sharedAPI);
}
var import_jsdom, sharedAPI, createDocumentFragment, createElement, createTextNode;
var init_dom = __esm({
  "src/dom/dom.ts"() {
    import_jsdom = require("jsdom");
    init_is_iterable();
    init_desensitize();
    init_expand_self_closing();
    sharedAPI = new import_jsdom.JSDOM("", { contentType: "text/html" }).window.document;
    createDocumentFragment = exportAPI(
      sharedAPI.createDocumentFragment
    );
    createElement = exportAPI(sharedAPI.createElement);
    createTextNode = exportAPI(sharedAPI.createTextNode);
  }
});

// src/compiler/text_processor.ts
var TextProcessor;
var init_text_processor = __esm({
  "src/compiler/text_processor.ts"() {
    init_dom();
    init_preconditions();
    TextProcessor = class {
      totalScannedLength = 0;
      currentNodeIndex;
      currentNodeTextOffset = 0;
      sourceNodes;
      constructor(sourceNode) {
        this.sourceNodes = isText(sourceNode) ? [sourceNode] : Array.from(childNodesOf(sourceNode));
        this.currentNodeIndex = 0;
        while (!isText(this.sourceNodes[this.currentNodeIndex]) && this.currentNodeIndex < this.sourceNodes.length) {
          this.currentNodeIndex++;
        }
      }
      readUntil(targetIndex) {
        check(targetIndex >= this.totalScannedLength);
        if (this.currentNodeIndex >= this.sourceNodes.length)
          return [];
        let read = [];
        let localText;
        let localTargetIndex;
        while (true) {
          const currentNode = this.sourceNodes[this.currentNodeIndex];
          check(isText(currentNode));
          localText = currentNode.textContent ?? "";
          localTargetIndex = targetIndex - this.currentNodeTextOffset;
          const substring = localText.substring(
            this.totalScannedLength - this.currentNodeTextOffset,
            localTargetIndex
          );
          if (substring) {
            read.push(substring);
          }
          if (localTargetIndex <= localText.length) {
            this.totalScannedLength = targetIndex;
            return read;
          } else {
            while (true) {
              this.currentNodeIndex++;
              if (this.currentNodeIndex >= this.sourceNodes.length)
                return read;
              if (isText(this.sourceNodes[this.currentNodeIndex])) {
                break;
              } else {
                read.push(this.sourceNodes[this.currentNodeIndex]);
              }
            }
            this.currentNodeTextOffset = this.currentNodeTextOffset + localText.length;
            this.totalScannedLength = this.currentNodeTextOffset;
            if (this.currentNodeIndex >= this.sourceNodes.length)
              return read;
          }
        }
      }
    };
  }
});

// src/dom/desensitize.ts
function desensitizeHTML(html) {
  return replaceTags(html, DESEN_MAP);
}
function undesensitizeHTML(html) {
  return replaceTags(html, UNDESEN_MAP);
}
function replaceTags(html, map) {
  let result = [];
  const textProcessor = new TextProcessor(createTextNode(html));
  for (const token of (0, import_xml_zero_lexer2.default)(html)) {
    const nodeType = token[0];
    if (nodeType !== import_xml_zero_lexer2.NodeTypes.ELEMENT_NODE && nodeType !== import_xml_zero_lexer2.NodeTypes.CLOSE_ELEMENT || !token[1] || !token[2]) {
      continue;
    }
    result.push(...castStrArr(textProcessor.readUntil(token[1])));
    const tagName = castStrArr(textProcessor.readUntil(token[2])).join("");
    result.push(map.get(tagName) ?? tagName);
  }
  result.push(...castStrArr(textProcessor.readUntil(Infinity)));
  return result.join("");
}
var import_xml_zero_lexer2, DZ_PREFIX, ELEMENTS, DESEN_MAP, UNDESEN_MAP;
var init_desensitize = __esm({
  "src/dom/desensitize.ts"() {
    init_text_processor();
    import_xml_zero_lexer2 = __toESM(require("xml-zero-lexer"));
    init_cast_string_array();
    init_dom();
    DZ_PREFIX = "dz-";
    ELEMENTS = /* @__PURE__ */ new Set(["html", "head", "body"]);
    DESEN_MAP = new Map(
      Array.from(ELEMENTS.values()).map((item) => [item, DZ_PREFIX + item])
    );
    UNDESEN_MAP = new Map(
      Array.from(DESEN_MAP.entries()).map(([from, to]) => [to, from])
    );
  }
});

// src/renderer/raw_html.ts
function isRawHTML(thing) {
  return typeof thing === "object" && rawHTMLSymbol in thing;
}
function rawHTML(html) {
  return { [rawHTMLSymbol]: true, html };
}
async function rawHTMLTag(segments, ...expressions) {
  const parts = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i + 1 === segments.length) {
      parts.push(segment);
    } else {
      parts.push(segment, await stringifyHTMLTagExpression(expressions[i]));
    }
  }
  return rawHTML(parts.join(""));
}
async function stringifyHTMLTagExpression(expression) {
  if (expression != null)
    expression = await expression;
  if (expression == null)
    return "";
  if (typeof expression === "string" || expression instanceof String) {
    return String(expression);
  } else if (isElement(expression)) {
    return expression.outerHTML;
  } else if (isText(expression)) {
    return expression.textContent ?? "";
  } else if (isIterable(expression)) {
    let joined = "";
    for (const item of expression) {
      joined += await stringifyHTMLTagExpression(item);
    }
    return joined;
  } else {
    return String(expression);
  }
}
var rawHTMLSymbol;
var init_raw_html = __esm({
  "src/renderer/raw_html.ts"() {
    init_dom();
    init_is_iterable();
    rawHTMLSymbol = Symbol("rawHTML");
  }
});

// src/util/log/format.ts
function installFormatter(logger6) {
  const originalFactory = logger6.methodFactory;
  logger6.methodFactory = function(methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);
    return (...msg) => {
      return originalMethod(...msg.map((item) => format(item)));
    };
  };
}
function format(thing, depth = 2) {
  if (!thing)
    return thing;
  if (isDocumentFragment(thing)) {
    return asIs(`DocumentFragment(${shortHTML(toHTML(thing))})`);
  } else if (isElement(thing)) {
    return asIs(`Element(${shortHTML(toHTML(thing))})`);
  } else if (isText(thing)) {
    const text = (0, import_cli_highlight.highlight)(JSON.stringify(thing.textContent), LANG_JSON);
    return asIs(`Text(${text})`);
  } else if (isRawHTML(thing)) {
    return asIs(`html(${shortHTML(thing.html)})`);
  } else if (depth > 0 && typeof thing === "object" && Symbol.iterator in thing) {
    return formatIterable(thing, depth);
  } else if (typeof thing === "object") {
    return asIs(toString(thing));
  }
  return thing;
}
function shortHTML(html) {
  html = html.trim();
  let truncated = false;
  if (html.includes("\n")) {
    const lines = html.split(/\s*\n\s*/g);
    if (lines.length > 3) {
      lines.length = 3;
      lines[2] = "<!--..-->";
      truncated = true;
    }
    html = lines.join(" ");
  }
  html = formatHTMLValue(html);
  if (truncated) {
    const commentOpen = html.lastIndexOf("<!--");
    const commentClose = html.lastIndexOf("-->");
    html = html.substring(0, commentOpen) + html.substring(commentOpen + 4, commentClose) + html.substring(commentClose + 3);
  }
  return html;
}
function formatHTMLValue(html) {
  return (0, import_cli_highlight.highlight)(html.trim(), LANG_HTML);
}
function formatJSValue(js) {
  return (0, import_cli_highlight.highlight)(js.trim(), LANG_JSX);
}
function formatIterable(ite, depth) {
  const arrayString = toString([...ite].map((item) => format(item, depth - 1)));
  if (Array.isArray(ite)) {
    return asIs(arrayString);
  } else {
    return asIs("{" + arrayString.substring(1, arrayString.length - 1) + "}");
  }
}
function asIs(str) {
  const newStr = new String(str);
  newStr[import_node_util.default.inspect.custom] = () => str;
  return newStr;
}
function toString(thing) {
  return import_node_util.default.inspect(thing);
}
var import_node_util, import_cli_highlight, LANG_JSON, LANG_HTML, LANG_JSX;
var init_format = __esm({
  "src/util/log/format.ts"() {
    import_node_util = __toESM(require("node:util"));
    import_cli_highlight = require("cli-highlight");
    init_dom();
    init_raw_html();
    LANG_JSON = { language: "json" };
    LANG_HTML = { language: "html" };
    LANG_JSX = { language: "jsx" };
  }
});

// src/util/log/context.ts
function installContextWrapper(logger6) {
  const originalFactory = logger6.methodFactory;
  logger6.methodFactory = function(methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);
    return (...msg) => {
      const context = [
        formatTag(currentGlobalContext),
        formatTag(currentContext),
        " "
      ].filter((s) => s).join(" ").padStart(45, " ");
      const continuation = context.replace(/./g, " ").slice(0, -3) + "~  ";
      const text = context + msg.map((item) => format(item)).join(" ").replace(/\n/gm, "\n" + continuation);
      const ret = originalMethod(text);
      currentContext = void 0;
      return ret;
    };
  };
}
function setLogContext(context) {
  currentContext = context;
}
function formatTag(tag) {
  if (!tag)
    return void 0;
  const max = 30;
  tag = tag.length > max ? tag.length > 5 ? tag.substring(0, max - 9) + "..." + tag.substring(tag.length - 6, tag.length) : tag.substring(0, max - 3) + "..." : tag;
  tag = `[${tag}]`;
  return tag;
}
var currentGlobalContext, currentContext;
var init_context = __esm({
  "src/util/log/context.ts"() {
    init_format();
    currentGlobalContext = void 0;
    currentContext = void 0;
  }
});

// src/util/log/group.ts
function installLogGrouper(logger6) {
  const originalFactory = logger6.methodFactory;
  logger6.methodFactory = function(methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);
    return (...msg) => {
      if (currentIndent === 0) {
        originalMethod(...msg);
      } else {
        const text = currentIndentStr + msg.map((item) => format(item)).join(" ").replace(/\n/gm, "\n" + currentIndentStr);
        originalMethod(text);
      }
    };
  };
}
function increaseLogIndent() {
  currentIndent++;
  currentIndentStr = currentIndentStr.padEnd(indentLength(), " ");
}
function decreaseLogIndent() {
  currentIndent--;
  if (currentIndent < 0)
    throw new Error("invalid state");
  currentIndentStr = currentIndentStr.substring(0, indentLength());
}
function indentLength() {
  return currentIndent * 2;
}
var currentIndent, currentIndentStr;
var init_group = __esm({
  "src/util/log/group.ts"() {
    init_format();
    currentIndent = 0;
    currentIndentStr = "";
  }
});

// src/util/log/method_names.ts
function installMethodNameCollector(logger6) {
  const originalFactory = logger6.methodFactory;
  logger6.methodFactory = function(methodName, logLevel, loggerName) {
    const originalMethod = originalFactory(methodName, logLevel, loggerName);
    methodNames.add(methodName);
    return originalMethod;
  };
  return { methodNames };
}
var methodNames;
var init_method_names = __esm({
  "src/util/log/method_names.ts"() {
    methodNames = /* @__PURE__ */ new Set();
  }
});

// src/util/log/log.ts
function createLogger(context) {
  const contextStr = typeof context === "function" ? context.name : context;
  return new Proxy(/* @__PURE__ */ Object.create(null), {
    get(_, p, __) {
      if (p === "group") {
        return () => increaseLogIndent();
      }
      if (p === "groupEnd") {
        return () => decreaseLogIndent();
      }
      if (methodNames2.has(p)) {
        setLogContext(contextStr);
      }
      return Reflect.get(import_loglevel.default, p, import_loglevel.default);
    }
  });
}
var import_loglevel, methodNames2;
var init_log = __esm({
  "src/util/log/log.ts"() {
    import_loglevel = __toESM(require("loglevel"));
    init_context();
    init_format();
    init_group();
    init_method_names();
    ({ methodNames: methodNames2 } = installMethodNameCollector(import_loglevel.default));
    installFormatter(import_loglevel.default);
    if (require.main !== module)
      installContextWrapper(import_loglevel.default);
    installLogGrouper(import_loglevel.default);
    import_loglevel.default.setLevel(
      import_loglevel.default.levels[process.env.LOGLEVEL ?? "INFO"] ?? import_loglevel.default.levels.DEBUG
    );
  }
});

// src/util/log/index.ts
var init_log2 = __esm({
  "src/util/log/index.ts"() {
    init_log();
    init_context();
    init_format();
  }
});

// src/compiler/find_delimiters.ts
function findDelimiters(open, close, node) {
  const text = new TextProcessor(node);
  const openMatcher = new GreedyMatcher(open);
  const closeMatcher = new GreedyMatcher(close);
  let found = [];
  let currentLevel = 0;
  let i = 0;
  while (true) {
    const char = text.readUntil(++i).find((item) => typeof item === "string");
    if (!char)
      break;
    check(char.length === 1);
    if (char === "\\") {
      text.readUntil(++i);
      continue;
    }
    const matchesOpen = openMatcher.feed(char);
    const matchesClose = closeMatcher.feed(char);
    if (matchesOpen) {
      currentLevel++;
      found.push({
        index: i - open.length,
        levelInside: currentLevel,
        type: open
      });
    } else if (matchesClose) {
      found.push({
        index: i - close.length,
        levelInside: currentLevel,
        type: close
      });
      currentLevel--;
    }
  }
  return found;
}
var GreedyMatcher;
var init_find_delimiters = __esm({
  "src/compiler/find_delimiters.ts"() {
    init_preconditions();
    init_text_processor();
    GreedyMatcher = class {
      constructor(target) {
        this.target = target;
      }
      index = 0;
      feed(char) {
        if (this.target[this.index] === char) {
          this.index++;
          if (this.index >= this.target.length) {
            this.index = 0;
            return true;
          }
        } else {
          this.index = 0;
        }
        return false;
      }
    };
  }
});

// src/compiler/node_list_builder.ts
var NodeListBuilder;
var init_node_list_builder = __esm({
  "src/compiler/node_list_builder.ts"() {
    init_dom();
    NodeListBuilder = class {
      nodes = [];
      collect() {
        return this.nodes;
      }
      append(...content) {
        for (let item of content) {
          if (isText(item)) {
            item = item.textContent ?? "";
          }
          if (typeof item === "string") {
            if (!item)
              continue;
            const lastNode = this.nodes[this.nodes.length - 1];
            if (isText(lastNode)) {
              lastNode.textContent += item;
            } else {
              this.nodes.push(createTextNode(item));
            }
          } else {
            this.nodes.push(item);
          }
        }
      }
    };
  }
});

// node_modules/acorn-walk/dist/walk.js
var require_walk = __commonJS({
  "node_modules/acorn-walk/dist/walk.js"(exports2, module2) {
    (function(global, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = global || self, factory((global.acorn = global.acorn || {}, global.acorn.walk = {})));
    })(exports2, function(exports3) {
      "use strict";
      function simple(node, visitors, baseVisitor, state, override) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        (function c(node2, st, override2) {
          var type = override2 || node2.type, found = visitors[type];
          baseVisitor[type](node2, st, c);
          if (found) {
            found(node2, st);
          }
        })(node, state, override);
      }
      function ancestor(node, visitors, baseVisitor, state, override) {
        var ancestors = [];
        if (!baseVisitor) {
          baseVisitor = base;
        }
        (function c(node2, st, override2) {
          var type = override2 || node2.type, found = visitors[type];
          var isNew = node2 !== ancestors[ancestors.length - 1];
          if (isNew) {
            ancestors.push(node2);
          }
          baseVisitor[type](node2, st, c);
          if (found) {
            found(node2, st || ancestors, ancestors);
          }
          if (isNew) {
            ancestors.pop();
          }
        })(node, state, override);
      }
      function recursive2(node, state, funcs, baseVisitor, override) {
        var visitor = funcs ? make(funcs, baseVisitor || void 0) : baseVisitor;
        (function c(node2, st, override2) {
          visitor[override2 || node2.type](node2, st, c);
        })(node, state, override);
      }
      function makeTest(test) {
        if (typeof test === "string") {
          return function(type) {
            return type === test;
          };
        } else if (!test) {
          return function() {
            return true;
          };
        } else {
          return test;
        }
      }
      var Found = function Found2(node, state) {
        this.node = node;
        this.state = state;
      };
      function full(node, callback, baseVisitor, state, override) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var last;
        (function c(node2, st, override2) {
          var type = override2 || node2.type;
          baseVisitor[type](node2, st, c);
          if (last !== node2) {
            callback(node2, st, type);
            last = node2;
          }
        })(node, state, override);
      }
      function fullAncestor(node, callback, baseVisitor, state) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var ancestors = [], last;
        (function c(node2, st, override) {
          var type = override || node2.type;
          var isNew = node2 !== ancestors[ancestors.length - 1];
          if (isNew) {
            ancestors.push(node2);
          }
          baseVisitor[type](node2, st, c);
          if (last !== node2) {
            callback(node2, st || ancestors, ancestors, type);
            last = node2;
          }
          if (isNew) {
            ancestors.pop();
          }
        })(node, state);
      }
      function findNodeAt(node, start, end, test, baseVisitor, state) {
        if (!baseVisitor) {
          baseVisitor = base;
        }
        test = makeTest(test);
        try {
          (function c(node2, st, override) {
            var type = override || node2.type;
            if ((start == null || node2.start <= start) && (end == null || node2.end >= end)) {
              baseVisitor[type](node2, st, c);
            }
            if ((start == null || node2.start === start) && (end == null || node2.end === end) && test(type, node2)) {
              throw new Found(node2, st);
            }
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeAround(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        try {
          (function c(node2, st, override) {
            var type = override || node2.type;
            if (node2.start > pos || node2.end < pos) {
              return;
            }
            baseVisitor[type](node2, st, c);
            if (test(type, node2)) {
              throw new Found(node2, st);
            }
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeAfter(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        try {
          (function c(node2, st, override) {
            if (node2.end < pos) {
              return;
            }
            var type = override || node2.type;
            if (node2.start >= pos && test(type, node2)) {
              throw new Found(node2, st);
            }
            baseVisitor[type](node2, st, c);
          })(node, state);
        } catch (e) {
          if (e instanceof Found) {
            return e;
          }
          throw e;
        }
      }
      function findNodeBefore(node, pos, test, baseVisitor, state) {
        test = makeTest(test);
        if (!baseVisitor) {
          baseVisitor = base;
        }
        var max;
        (function c(node2, st, override) {
          if (node2.start > pos) {
            return;
          }
          var type = override || node2.type;
          if (node2.end <= pos && (!max || max.node.end < node2.end) && test(type, node2)) {
            max = new Found(node2, st);
          }
          baseVisitor[type](node2, st, c);
        })(node, state);
        return max;
      }
      function make(funcs, baseVisitor) {
        var visitor = Object.create(baseVisitor || base);
        for (var type in funcs) {
          visitor[type] = funcs[type];
        }
        return visitor;
      }
      function skipThrough(node, st, c) {
        c(node, st);
      }
      function ignore(_node, _st, _c) {
      }
      var base = {};
      base.Program = base.BlockStatement = base.StaticBlock = function(node, st, c) {
        for (var i = 0, list = node.body; i < list.length; i += 1) {
          var stmt = list[i];
          c(stmt, st, "Statement");
        }
      };
      base.Statement = skipThrough;
      base.EmptyStatement = ignore;
      base.ExpressionStatement = base.ParenthesizedExpression = base.ChainExpression = function(node, st, c) {
        return c(node.expression, st, "Expression");
      };
      base.IfStatement = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.consequent, st, "Statement");
        if (node.alternate) {
          c(node.alternate, st, "Statement");
        }
      };
      base.LabeledStatement = function(node, st, c) {
        return c(node.body, st, "Statement");
      };
      base.BreakStatement = base.ContinueStatement = ignore;
      base.WithStatement = function(node, st, c) {
        c(node.object, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.SwitchStatement = function(node, st, c) {
        c(node.discriminant, st, "Expression");
        for (var i$1 = 0, list$1 = node.cases; i$1 < list$1.length; i$1 += 1) {
          var cs = list$1[i$1];
          if (cs.test) {
            c(cs.test, st, "Expression");
          }
          for (var i = 0, list = cs.consequent; i < list.length; i += 1) {
            var cons = list[i];
            c(cons, st, "Statement");
          }
        }
      };
      base.SwitchCase = function(node, st, c) {
        if (node.test) {
          c(node.test, st, "Expression");
        }
        for (var i = 0, list = node.consequent; i < list.length; i += 1) {
          var cons = list[i];
          c(cons, st, "Statement");
        }
      };
      base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function(node, st, c) {
        if (node.argument) {
          c(node.argument, st, "Expression");
        }
      };
      base.ThrowStatement = base.SpreadElement = function(node, st, c) {
        return c(node.argument, st, "Expression");
      };
      base.TryStatement = function(node, st, c) {
        c(node.block, st, "Statement");
        if (node.handler) {
          c(node.handler, st);
        }
        if (node.finalizer) {
          c(node.finalizer, st, "Statement");
        }
      };
      base.CatchClause = function(node, st, c) {
        if (node.param) {
          c(node.param, st, "Pattern");
        }
        c(node.body, st, "Statement");
      };
      base.WhileStatement = base.DoWhileStatement = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.ForStatement = function(node, st, c) {
        if (node.init) {
          c(node.init, st, "ForInit");
        }
        if (node.test) {
          c(node.test, st, "Expression");
        }
        if (node.update) {
          c(node.update, st, "Expression");
        }
        c(node.body, st, "Statement");
      };
      base.ForInStatement = base.ForOfStatement = function(node, st, c) {
        c(node.left, st, "ForInit");
        c(node.right, st, "Expression");
        c(node.body, st, "Statement");
      };
      base.ForInit = function(node, st, c) {
        if (node.type === "VariableDeclaration") {
          c(node, st);
        } else {
          c(node, st, "Expression");
        }
      };
      base.DebuggerStatement = ignore;
      base.FunctionDeclaration = function(node, st, c) {
        return c(node, st, "Function");
      };
      base.VariableDeclaration = function(node, st, c) {
        for (var i = 0, list = node.declarations; i < list.length; i += 1) {
          var decl = list[i];
          c(decl, st);
        }
      };
      base.VariableDeclarator = function(node, st, c) {
        c(node.id, st, "Pattern");
        if (node.init) {
          c(node.init, st, "Expression");
        }
      };
      base.Function = function(node, st, c) {
        if (node.id) {
          c(node.id, st, "Pattern");
        }
        for (var i = 0, list = node.params; i < list.length; i += 1) {
          var param = list[i];
          c(param, st, "Pattern");
        }
        c(node.body, st, node.expression ? "Expression" : "Statement");
      };
      base.Pattern = function(node, st, c) {
        if (node.type === "Identifier") {
          c(node, st, "VariablePattern");
        } else if (node.type === "MemberExpression") {
          c(node, st, "MemberPattern");
        } else {
          c(node, st);
        }
      };
      base.VariablePattern = ignore;
      base.MemberPattern = skipThrough;
      base.RestElement = function(node, st, c) {
        return c(node.argument, st, "Pattern");
      };
      base.ArrayPattern = function(node, st, c) {
        for (var i = 0, list = node.elements; i < list.length; i += 1) {
          var elt = list[i];
          if (elt) {
            c(elt, st, "Pattern");
          }
        }
      };
      base.ObjectPattern = function(node, st, c) {
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          if (prop.type === "Property") {
            if (prop.computed) {
              c(prop.key, st, "Expression");
            }
            c(prop.value, st, "Pattern");
          } else if (prop.type === "RestElement") {
            c(prop.argument, st, "Pattern");
          }
        }
      };
      base.Expression = skipThrough;
      base.ThisExpression = base.Super = base.MetaProperty = ignore;
      base.ArrayExpression = function(node, st, c) {
        for (var i = 0, list = node.elements; i < list.length; i += 1) {
          var elt = list[i];
          if (elt) {
            c(elt, st, "Expression");
          }
        }
      };
      base.ObjectExpression = function(node, st, c) {
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];
          c(prop, st);
        }
      };
      base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
      base.SequenceExpression = function(node, st, c) {
        for (var i = 0, list = node.expressions; i < list.length; i += 1) {
          var expr = list[i];
          c(expr, st, "Expression");
        }
      };
      base.TemplateLiteral = function(node, st, c) {
        for (var i = 0, list = node.quasis; i < list.length; i += 1) {
          var quasi = list[i];
          c(quasi, st);
        }
        for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1) {
          var expr = list$1[i$1];
          c(expr, st, "Expression");
        }
      };
      base.TemplateElement = ignore;
      base.UnaryExpression = base.UpdateExpression = function(node, st, c) {
        c(node.argument, st, "Expression");
      };
      base.BinaryExpression = base.LogicalExpression = function(node, st, c) {
        c(node.left, st, "Expression");
        c(node.right, st, "Expression");
      };
      base.AssignmentExpression = base.AssignmentPattern = function(node, st, c) {
        c(node.left, st, "Pattern");
        c(node.right, st, "Expression");
      };
      base.ConditionalExpression = function(node, st, c) {
        c(node.test, st, "Expression");
        c(node.consequent, st, "Expression");
        c(node.alternate, st, "Expression");
      };
      base.NewExpression = base.CallExpression = function(node, st, c) {
        c(node.callee, st, "Expression");
        if (node.arguments) {
          for (var i = 0, list = node.arguments; i < list.length; i += 1) {
            var arg = list[i];
            c(arg, st, "Expression");
          }
        }
      };
      base.MemberExpression = function(node, st, c) {
        c(node.object, st, "Expression");
        if (node.computed) {
          c(node.property, st, "Expression");
        }
      };
      base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function(node, st, c) {
        if (node.declaration) {
          c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression");
        }
        if (node.source) {
          c(node.source, st, "Expression");
        }
      };
      base.ExportAllDeclaration = function(node, st, c) {
        if (node.exported) {
          c(node.exported, st);
        }
        c(node.source, st, "Expression");
      };
      base.ImportDeclaration = function(node, st, c) {
        for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
          var spec = list[i];
          c(spec, st);
        }
        c(node.source, st, "Expression");
      };
      base.ImportExpression = function(node, st, c) {
        c(node.source, st, "Expression");
      };
      base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.PrivateIdentifier = base.Literal = ignore;
      base.TaggedTemplateExpression = function(node, st, c) {
        c(node.tag, st, "Expression");
        c(node.quasi, st, "Expression");
      };
      base.ClassDeclaration = base.ClassExpression = function(node, st, c) {
        return c(node, st, "Class");
      };
      base.Class = function(node, st, c) {
        if (node.id) {
          c(node.id, st, "Pattern");
        }
        if (node.superClass) {
          c(node.superClass, st, "Expression");
        }
        c(node.body, st);
      };
      base.ClassBody = function(node, st, c) {
        for (var i = 0, list = node.body; i < list.length; i += 1) {
          var elt = list[i];
          c(elt, st);
        }
      };
      base.MethodDefinition = base.PropertyDefinition = base.Property = function(node, st, c) {
        if (node.computed) {
          c(node.key, st, "Expression");
        }
        if (node.value) {
          c(node.value, st, "Expression");
        }
      };
      exports3.ancestor = ancestor;
      exports3.base = base;
      exports3.findNodeAfter = findNodeAfter;
      exports3.findNodeAround = findNodeAround;
      exports3.findNodeAt = findNodeAt;
      exports3.findNodeBefore = findNodeBefore;
      exports3.full = full;
      exports3.fullAncestor = fullAncestor;
      exports3.make = make;
      exports3.recursive = recursive2;
      exports3.simple = simple;
      Object.defineProperty(exports3, "__esModule", { value: true });
    });
  }
});

// src/compiler/detect_script_behavior.ts
function detectScriptBehavior(inOutScript) {
  const code = `async function* wrapper(){${inOutScript.innerHTML}}`;
  const tree = acornLoose.parse(code, { ecmaVersion: "latest" });
  const state = { wrapperVisited: false, yields: false, returns: false };
  acornWalk.recursive(tree, state, {
    Function(node, state2, callback) {
      if (state2.wrapperVisited)
        return;
      const func = node;
      check(func.generator === true);
      check(func.async === true);
      check(func.id?.name === "wrapper");
      state2.wrapperVisited = true;
      callback(func.body, state2);
    },
    YieldExpression(node, state2) {
      state2.yields = true;
    },
    ReturnStatement(node, state2) {
      state2.returns = true;
    }
  });
  return {
    yields: state.yields,
    returns: state.returns
  };
}
var acornLoose, acornWalk;
var init_detect_script_behavior = __esm({
  "src/compiler/detect_script_behavior.ts"() {
    acornLoose = __toESM(require("acorn-loose"));
    acornWalk = __toESM(require_walk());
    init_preconditions();
  }
});

// src/util/query_page_skeleton.ts
function queryPageSkeleton(root) {
  return {
    html: isElement(root) && root.matches(`${DZ_PREFIX}html`) ? root : root.querySelector(`${DZ_PREFIX}html`),
    head: root.querySelector(`${DZ_PREFIX}head`),
    body: root.querySelector(`${DZ_PREFIX}body`)
  };
}
var init_query_page_skeleton = __esm({
  "src/util/query_page_skeleton.ts"() {
    init_desensitize();
    init_dom();
  }
});

// src/compiler/compiler.ts
function compileFile(filePath) {
  return compile(
    import_node_path.default.basename(filePath, ".html"),
    filePath,
    (0, import_node_fs.readFileSync)(filePath).toString()
  );
}
function compile(name, filePath, source) {
  logger.debug(
    "====== compile start ======",
    "\nname:",
    name,
    "\nfile path:",
    filePath
  );
  logger.trace("\n" + formatHTMLValue(source.trim()) + "\n");
  const sourceFragment = parse(source);
  let content = sourceFragment.cloneNode(true);
  const processed = processNode(content);
  if (processed.contentRoot === content) {
    trim(content);
  } else {
    content = createDocumentFragment();
    content.append(...childNodesOf(processed.contentRoot));
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
    styles: processed.styles
  };
  logger.debug("");
  logger.debug(
    "====== compile done ======",
    "\nmetadata:",
    component.metadata,
    "\npage:",
    component.page?.skeleton,
    "\ncontent:",
    component.content,
    "\nstatic scripts:",
    component.staticScripts,
    "\nclient scripts:",
    component.clientScripts,
    "\nstyles:",
    component.styles,
    "\n"
  );
  return component;
}
function extractPage(sourceFragment) {
  let page = void 0;
  let { html, head, body } = queryPageSkeleton(sourceFragment.cloneNode(true));
  if (html || body) {
    html = html ?? createElement(`${DZ_PREFIX}html`);
    body = body ?? createElement(`${DZ_PREFIX}body`);
    head = head ?? createElement(`${DZ_PREFIX}head`);
    head.replaceChildren();
    body.replaceChildren();
    for (const child of stableChildNodesOf(html)) {
      if (child == head || child == body)
        continue;
      if (isText(child) && !child.textContent?.trim())
        continue;
      html.removeChild(child);
    }
    if (!html.contains(body))
      html.appendChild(body);
    if (!html.contains(head))
      html.prepend(head);
    page = {
      skeleton: html
    };
  }
  return page;
}
function processNode(node, context = {
  metadata: [],
  contentRoot: node,
  staticScripts: [],
  clientScripts: [],
  styles: []
}) {
  logger.debug("process node:", node);
  logger.group();
  let consumed = false;
  if (isElement(node)) {
    consumed = processElement(node, context);
  }
  const detached = !node.parentNode && !isDocumentFragment(node);
  if (detached) {
    logger.debug("detached from content");
    logger.groupEnd();
  } else if (consumed) {
    logger.debug("consumed; ignore subnodes");
    logger.groupEnd();
  } else {
    processShorthands(node, context);
    logger.groupEnd();
    for (const child of stableChildNodesOf(node)) {
      processNode(child, context);
    }
  }
  return context;
}
function processShorthands(node, context) {
  const builder = new NodeListBuilder();
  const textProcessor = new TextProcessor(node);
  const delimiters = findDelimiters(
    SCRIPT_DELIMITER_OPEN,
    SCRIPT_DELIMITER_CLOSE,
    node
  );
  let contentDidChange = false;
  let openIndex = 0;
  for (const delimiter of delimiters) {
    if (delimiter.levelInside === 1) {
      if (delimiter.type === SCRIPT_DELIMITER_OPEN) {
        openIndex = delimiter.index;
      } else if (delimiter.type === SCRIPT_DELIMITER_CLOSE) {
        builder.append(...textProcessor.readUntil(openIndex));
        textProcessor.readUntil(openIndex + SCRIPT_DELIMITER_OPEN.length);
        const code = stringify(textProcessor.readUntil(delimiter.index));
        textProcessor.readUntil(
          delimiter.index + SCRIPT_DELIMITER_CLOSE.length
        );
        const scriptElement = createElement("script");
        scriptElement.setAttribute("render", "");
        scriptElement.appendChild(createTextNode(code));
        logger.debug(`convert shorthand {${code}}`);
        logger.group();
        processRenderScript(scriptElement);
        logger.debug("converted shorthand \u2192", scriptElement);
        logger.groupEnd();
        builder.append(scriptElement);
        contentDidChange = true;
      }
    }
  }
  builder.append(...textProcessor.readUntil(Infinity));
  const newContent = builder.collect();
  if (contentDidChange) {
    if (isText(node)) {
      node.replaceWith(...newContent);
      return true;
    } else if (isElement(node) || isDocumentFragment(node)) {
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
      if (!isInlineJavaScriptElement(element)) {
        context.metadata.push(element);
        element.remove();
        return true;
      }
      const isRender = element.hasAttribute("render");
      const isStatic = element.hasAttribute("static");
      const isClient = element.hasAttribute("client");
      if (+isRender + +isStatic + +isClient !== 1) {
        return true;
      }
      if (isRender) {
        processRenderScript(element);
      } else if (isStatic) {
        element.removeAttribute("static");
        context.staticScripts.push(element);
        element.remove();
      } else if (isClient) {
        element.removeAttribute("client");
        context.clientScripts.push(element);
        element.remove();
      }
      return true;
    case "style":
      context.styles.push(element);
      element.remove();
      return true;
    case `${DZ_PREFIX}html`:
    case `${DZ_PREFIX}body`:
      logger.debug("change to root here");
      context.contentRoot = element;
      return false;
    case `${DZ_PREFIX}head`:
      context.metadata.push(...childNodesOf(element));
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
  let forceReset = false;
  for (const attr of Array.from(element.attributes)) {
    let name = attr.name;
    let value = attr.value;
    if (attr.name.startsWith(DYNAMIC_ATTR_PREFIX)) {
      name = attr.name.substring(1);
      value = SCRIPT_DELIMITER_OPEN + attr.value + SCRIPT_DELIMITER_CLOSE;
      logger.debug(
        "convert attr shorthand",
        `${attr.name}="${attr.value}"`,
        "\u2192",
        `${name}="${value}"`
      );
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
  check(script.hasAttribute("render"));
  if (script.getAttribute("render"))
    return;
  const behavior = detectScriptBehavior(script);
  if (behavior.yields) {
    script.setAttribute("render", "gen");
  } else if (behavior.returns) {
    script.setAttribute("render", "func");
  } else {
    script.setAttribute("render", "expr");
  }
  logger.debug(
    "auto-detected render type as",
    `render="${script.getAttribute("render")}"`
  );
}
function stringify(array) {
  return array.map((item) => typeof item === "string" ? item : toHTML(item)).join("");
}
function trim(content) {
  const children = Array.from(childNodesOf(content));
  for (const item of children) {
    if (!isText(item) || !item.textContent)
      break;
    item.textContent = item.textContent.trimStart();
    if (item.textContent.length)
      break;
    item.remove();
  }
  for (const item of children.reverse()) {
    if (!isText(item) || !item.textContent)
      break;
    item.textContent = item.textContent.trimEnd();
    if (item.textContent.length)
      break;
    item.remove();
  }
}
var import_node_fs, import_node_path, SCRIPT_DELIMITER_OPEN, SCRIPT_DELIMITER_CLOSE, DYNAMIC_ATTR_PREFIX, logger;
var init_compiler = __esm({
  "src/compiler/compiler.ts"() {
    init_desensitize();
    init_dom();
    import_node_fs = require("node:fs");
    import_node_path = __toESM(require("node:path"));
    init_log2();
    init_preconditions();
    init_find_delimiters();
    init_node_list_builder();
    init_detect_script_behavior();
    init_text_processor();
    init_query_page_skeleton();
    SCRIPT_DELIMITER_OPEN = "{";
    SCRIPT_DELIMITER_CLOSE = "}";
    DYNAMIC_ATTR_PREFIX = ":";
    logger = createLogger(import_node_path.default.basename(__filename, ".ts"));
  }
});

// src/renderer/map_attrs.ts
function mapAttrs(attributes) {
  const attrs = {};
  for (const attr of attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}
function mapAttrsForScript(attributes) {
  const attrs = {};
  for (const [name, value] of Object.entries(attributes)) {
    attrs[toCamelCase(name)] = value;
  }
  return attrs;
}
function toCamelCase(kebab) {
  return kebab.replace(/-./g, (x) => x[1].toUpperCase());
}
var init_map_attrs = __esm({
  "src/renderer/map_attrs.ts"() {
  }
});

// src/renderer/spread_attrs.ts
function spreadAttrs(root, attrs) {
  if (isElement(root))
    spreadAttrsForElement(root, attrs);
  for (const node of childNodesOf(root)) {
    spreadAttrs(node, attrs);
  }
}
function spreadAttrsForElement(element, attrs) {
  for (const [name, value] of Array.from(element.attributes).map((attr) => [
    attr.name,
    attr.value
  ])) {
    if (name === SPREAD_ATTR_NAME) {
      element.removeAttribute(SPREAD_ATTR_NAME);
      for (const [inName, inValue] of Object.entries(attrs)) {
        element.setAttribute(inName, inValue);
      }
    } else {
      element.setAttribute(name, value);
    }
  }
}
var SPREAD_ATTR_NAME;
var init_spread_attrs = __esm({
  "src/renderer/spread_attrs.ts"() {
    init_dom();
    SPREAD_ATTR_NAME = "{...attrs}";
  }
});

// src/renderer/vm.ts
function createVM(component, context, jsContext) {
  const fullJsContext = (0, import_node_vm.createContext)({
    require: wrapRequire(require, component.filePath),
    console,
    process: { env: process.env },
    url: makeURLFunc(context, component.filePath),
    __rootDir: context.rootDir,
    __outputDir: context.outputDir,
    ...jsContext
  });
  const runCode = (code) => (0, import_node_vm.runInContext)(code, fullJsContext, { filename: component.filePath });
  return { runCode };
}
function wrapRequire(require2, filePath) {
  const wrappedRequire = (id) => {
    if (id.startsWith(".")) {
      id = import_node_path2.default.resolve(import_node_path2.default.dirname(filePath), id);
    }
    return require2(id);
  };
  const newRequire = Object.assign(wrappedRequire, require2);
  return newRequire;
}
function makeURLFunc(context, componentFilePath) {
  return (localUrlPath) => {
    const filePath = import_node_path2.default.resolve(
      import_node_path2.default.dirname(componentFilePath),
      localUrlPath
    );
    const siteUrlPath = import_node_path2.default.relative(context.rootDir, filePath);
    return import_node_path2.default.join("/", siteUrlPath);
  };
}
var import_node_path2, import_node_vm;
var init_vm = __esm({
  "src/renderer/vm.ts"() {
    import_node_path2 = __toESM(require("node:path"));
    import_node_vm = require("node:vm");
  }
});

// src/renderer/render_scripts.ts
async function evaluateScripts(inOutFragment, component, attrs, children, render, context = nullRenderContext) {
  const vm = createVM(component, context, {
    html: createHTMLTag(attrs, () => vm, render),
    raw: rawHTMLTag,
    attrs: mapAttrsForScript(attrs),
    children
  });
  runStaticScripts(component, vm);
  await evaluateFragment(inOutFragment, attrs, vm);
}
function runStaticScripts(component, vm) {
  const scriptCode = component.staticScripts.map((el) => el.textContent).join("\n");
  if (scriptCode) {
    logger2.debug(
      "run static script:\n" + formatJSValue(scriptCode.replace(/^\s*\n|\s+$/g, ""))
    );
    vm.runCode(scriptCode);
  }
}
async function evaluateFragment(inOutFragment, attrs, vm) {
  spreadAttrs(inOutFragment, attrs);
  await renderScripts(inOutFragment, vm);
}
async function renderScripts(inOutFragment, vm) {
  for (const node of stableChildNodesOf(inOutFragment)) {
    await renderNode(node, vm.runCode);
  }
}
async function renderNode(inOutNode, runCode) {
  if (isElement(inOutNode)) {
    await renderElementAttrs(inOutNode, runCode);
    if (isInlineJavaScriptElement(inOutNode) && inOutNode.hasAttribute("render")) {
      await renderScriptElement(inOutNode, runCode);
      return;
    }
  }
  for (const childNode of stableChildNodesOf(inOutNode)) {
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
      } else {
        inOutElement.setAttribute(attr.name, String(value));
      }
    }
  }
}
async function renderAttrValueIfDynamic(attrValue, runCode) {
  const marked = attrValue.startsWith(SCRIPT_DELIMITER_OPEN) && attrValue.endsWith(SCRIPT_DELIMITER_CLOSE);
  if (!marked)
    return void 0;
  const expr = attrValue.slice(1, -1);
  const newValue = await runCode(`(async function(){ return ${expr} })()`);
  logger2.debug("rendered attr:", `"${attrValue}"`, "\u2192", `"${newValue}"`);
  return { value: newValue };
}
async function renderScriptElement(inOutElement, runCode) {
  const code = inOutElement.innerHTML;
  logger2.debug("render script:", formatJSValue(code.replace(/\n/g, " ")));
  const asyncResults = unwrapResults(
    runCode(wrapCode(code, inOutElement))
  );
  const results = [];
  for await (const result of asyncResults) {
    results.push(result);
  }
  logger2.debug("render script result:", results);
  inOutElement.replaceWith(...results);
  for (const item of results) {
    if (!isNode(item))
      continue;
    await renderNode(item, runCode);
  }
}
function createHTMLTag(attrs, getVM, render) {
  return async (segments, ...expressions) => {
    logger2.debug("render HTML literal");
    logger2.group();
    const raw = await rawHTMLTag(segments, ...expressions);
    const fragment = parse(raw.html);
    await evaluateFragment(fragment, attrs, getVM());
    const result = await render(childNodesOf(fragment));
    logger2.groupEnd();
    return result;
  };
}
async function* unwrapResults(results) {
  for (let result of await results) {
    if (result == null)
      continue;
    if (typeof result === "string" || result instanceof String) {
      yield String(result);
    } else if (isIterable(result)) {
      yield* unwrapResults(Promise.resolve(result));
    } else if (isNode(result)) {
      yield result;
    } else if (isRawHTML(result)) {
      for (const node of childNodesOf(parse(result.html))) {
        yield node;
      }
    } else {
      yield String(result);
    }
  }
}
function wrapCode(code, script) {
  const render = script.getAttribute("render");
  if (render === "gen") {
    return wrapGenCode(code);
  } else if (render === "func") {
    return wrapFuncCode(code);
  }
  check(render === "expr");
  return wrapFuncCode(`return (${code})`);
}
function wrapFuncCode(code) {
  return `Promise.all([(async function(){${code}})()])`;
}
function wrapGenCode(code) {
  return `(async function(){ const __a = []; for await (const __v of (async function*(){${code}})()) __a.push(__v); return __a })()`;
}
var import_node_path3, logger2;
var init_render_scripts = __esm({
  "src/renderer/render_scripts.ts"() {
    init_compiler();
    init_dom();
    import_node_path3 = __toESM(require("node:path"));
    init_is_iterable();
    init_log2();
    init_preconditions();
    init_map_attrs();
    init_raw_html();
    init_renderer();
    init_spread_attrs();
    init_vm();
    logger2 = createLogger(import_node_path3.default.basename(__filename, ".ts"));
  }
});

// src/renderer/render_component.ts
async function renderComponent(component, attrs, children, render, renderContext = nullRenderContext) {
  logger3.debug("component start:", `<${component.name} .. >`);
  logger3.group();
  const fragment = component.content.cloneNode(true);
  await evaluateScripts(
    fragment,
    component,
    attrs,
    children,
    render,
    renderContext
  );
  const slotMap = mapSlots(
    fragment.querySelectorAll("slot")
  );
  if (slotMap.size) {
    processSlots(component, slotMap, children);
  }
  logger3.groupEnd();
  logger3.debug("component done:", `<${component.name} .. />`, "\u2192", fragment);
  logger3.trace("\n" + formatHTMLValue(toHTML(fragment)) + "\n");
  return childNodesOf(fragment);
}
function processSlots(component, slotMap, children) {
  logger3.debug(
    `process slots for ${component.name}:`,
    "slots=\b",
    slotMap.keys(),
    "children=\b",
    children
  );
  logger3.group();
  const unslottedChildren = [];
  for (const child of children) {
    let slotName;
    if (isElement(child) && (slotName = child.getAttribute("slot"))) {
      replaceSlot(slotMap, slotName, child);
    } else {
      unslottedChildren.push(child);
    }
  }
  if (unslottedChildren.length) {
    replaceSlot(slotMap, DEFAULT_SLOT_NAME, ...unslottedChildren);
  }
  for (const [slotName, slot] of slotMap.entries()) {
    if (slot === SLOT_USED)
      continue;
    replaceSlot(slotMap, slotName, ...slot.childNodes);
  }
  logger3.groupEnd();
}
function replaceSlot(slotMap, slotName, ...replacement) {
  const slot = checkNotNull(
    slotMap.get(slotName),
    slotName ? `No <slot> found with name: ${slotName}` : "No default <slot> found."
  );
  check(slot != SLOT_USED, "<slot> cannot be used by multiple elements.");
  let finalReplacement;
  if (replacement.length === 1 && isTemplateElement(replacement[0]) && replacement[0].getAttribute("slot") === slotName) {
    finalReplacement = Array.from(replacement[0].content.childNodes);
  } else {
    finalReplacement = replacement;
  }
  logger3.debug("replace slot", `'${slotName}'`, "with", finalReplacement);
  slot.replaceWith(...finalReplacement);
  slotMap.set(slotName, SLOT_USED);
}
function mapSlots(slots) {
  const map = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    const name = slot.getAttribute("name") ?? DEFAULT_SLOT_NAME;
    check(!map.has(name), "<slot> names must be unique within a component.");
    map.set(name, slot);
  }
  return map;
}
var import_node_path4, DEFAULT_SLOT_NAME, SLOT_USED, logger3;
var init_render_component = __esm({
  "src/renderer/render_component.ts"() {
    init_dom();
    import_node_path4 = __toESM(require("node:path"));
    init_log2();
    init_preconditions();
    init_renderer();
    init_render_scripts();
    DEFAULT_SLOT_NAME = "default";
    SLOT_USED = Symbol("SLOT_USED");
    logger3 = createLogger(import_node_path4.default.basename(__filename, ".ts"));
  }
});

// src/renderer/render_page.ts
function renderPage(bodyContent, pageData) {
  const page = (check(pageData.page), checkNotNull(pageData.page));
  const { html, head, body } = queryPageSkeleton(page.skeleton.cloneNode(true));
  checkNotNull(head).replaceChildren(
    ...cloneNodes(pageData.metadata),
    ...cloneNodes(pageData.styles),
    ...cloneNodes(pageData.clientScripts.filter(not(isDeferredScript)))
  );
  checkNotNull(body).replaceChildren(
    ...bodyContent,
    ...removeDeferAttr(
      cloneNodes(pageData.clientScripts.filter(isDeferredScript))
    )
  );
  return checkNotNull(html);
}
function isDeferredScript(script) {
  return script.hasAttribute("defer");
}
function not(predicate) {
  return (...args) => !predicate(...args);
}
function* removeDeferAttr(scripts) {
  for (const script of scripts) {
    script.defer = false;
    yield script;
  }
}
function* cloneNodes(nodes) {
  for (const node of nodes) {
    yield node.cloneNode(true);
  }
}
var init_render_page = __esm({
  "src/renderer/render_page.ts"() {
    init_preconditions();
    init_query_page_skeleton();
  }
});

// src/renderer/renderer.ts
var import_node_path5, logger4, nullRenderContext, Renderer;
var init_renderer = __esm({
  "src/renderer/renderer.ts"() {
    init_desensitize();
    init_dom();
    import_node_path5 = __toESM(require("node:path"));
    init_log2();
    init_map_attrs();
    init_render_component();
    init_render_page();
    logger4 = createLogger(import_node_path5.default.basename(__filename, ".ts"));
    nullRenderContext = {
      rootDir: "",
      outputDir: ""
    };
    Renderer = class {
      components;
      constructor(components = /* @__PURE__ */ new Map()) {
        this.components = new Map(
          [...components.entries()].map(([tagName, component]) => [
            tagName.toLowerCase(),
            component
          ])
        );
      }
      async render(component, renderContext = nullRenderContext) {
        logger4.debug(
          "====== render start ======",
          "\nroot component:",
          component.name
        );
        logger4.trace("\n" + formatHTMLValue(toHTML(component.content)) + "\n");
        let context;
        if (component.page) {
          context = {
            ...renderContext,
            metadata: new Set(component.metadata),
            clientScripts: new Set(component.clientScripts),
            styles: new Set(component.styles)
          };
        }
        let result = await this.renderList(
          await renderComponent(component, [], [], this.renderList, renderContext),
          context
        );
        if (context) {
          logger4.debug(
            "context update:",
            context.metadata.size,
            `(+${context.metadata.size - component.metadata.length})`,
            "metadata,",
            context.clientScripts.size,
            `(+${context.clientScripts.size - component.clientScripts.length})`,
            "clientScripts,",
            context.styles.size,
            `(+${context.styles.size - component.styles.length})`,
            "styles."
          );
        }
        if (component.page && context) {
          result = [
            renderPage(result, {
              page: component.page,
              metadata: Array.from(context.metadata),
              clientScripts: Array.from(context.clientScripts).reverse(),
              styles: Array.from(context.styles).reverse()
            })
          ];
        }
        logger4.debug("");
        logger4.debug(
          "====== render done ======",
          "\nroot component:",
          component.name
        );
        logger4.trace("\n" + formatHTMLValue(toHTML(result)) + "\n");
        return result;
      }
      async renderNode(node, context) {
        const children = await this.renderList(childNodesOf(node), context);
        let result;
        let component = void 0;
        if (isElement(node) && (component = this.components.get(node.tagName.toLowerCase()))) {
          if (component.page) {
            throw new Error(
              "Can't render a page component inside another component"
            );
          }
          const componentOutput = await renderComponent(
            component,
            mapAttrs(node.attributes),
            children,
            (nodes) => this.renderList(nodes, context),
            context ?? nullRenderContext
          );
          if (context) {
            for (const metadata of component.metadata) {
              context.metadata.add(metadata);
            }
            for (const script of component.clientScripts) {
              context.clientScripts.delete(script);
              context.clientScripts.add(script);
            }
            for (const style of component.styles) {
              context.styles.add(style);
            }
          }
          result = await this.renderList(componentOutput, context);
        } else if (context && isElement(node) && node.tagName.toLowerCase() === `${DZ_PREFIX}head`) {
          children.forEach((child) => context.metadata.add(child));
          result = [];
        } else {
          const clone = node.cloneNode(false);
          for (const child of children) {
            appendChild(clone, child);
          }
          result = [clone];
        }
        return result;
      }
      renderList = async (nodes, context) => {
        const rendered = [];
        for await (const item of this.generateRenderedList(nodes, context)) {
          rendered.push(item);
        }
        return rendered;
      };
      async *generateRenderedList(nodes, context) {
        for (const node of nodes) {
          for (const rendered of await this.renderNode(node, context)) {
            yield rendered;
          }
        }
      }
    };
  }
});

// src/builder/bundler.ts
function extractScriptBundles(pages) {
  return [];
}
var init_bundler = __esm({
  "src/builder/bundler.ts"() {
    init_dom();
  }
});

// src/builder/builder.ts
var builder_exports = {};
__export(builder_exports, {
  build: () => build
});
async function build(options2 = {}) {
  const {
    inputDir: inputDir2,
    outputDir: outputDir2,
    rootDir: rootDirOption,
    exclude: exclude2,
    beautify
  } = Object.assign({}, DEFAULT_OPTIONS, options2);
  const rootDir2 = rootDirOption ?? inputDir2;
  logger5.info(
    "\u270D  compose-html",
    "\n\nWorking directories",
    "\n   input:",
    formatPath(inputDir2),
    "\n  output:",
    formatPath(outputDir2),
    "\n    root:",
    formatPath(rootDir2),
    "\n"
  );
  const htmlGlobOptions = { nodir: true, ignore: exclude2 };
  const htmlFiles = import_glob.default.sync(
    import_node_path6.default.resolve(inputDir2, "**/*.html"),
    htmlGlobOptions
  );
  const nonHTMLFiles = import_glob.default.sync(import_node_path6.default.resolve(rootDir2, "**/*"), { nodir: true }).filter((f) => !htmlFiles.includes(f));
  logger5.info(htmlFiles.length, "html files");
  logger5.info(nonHTMLFiles.length, "non-html files");
  const pageComponents = [];
  const componentMap = /* @__PURE__ */ new Map();
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);
    if (component.page) {
      if (component.filePath.startsWith(rootDir2)) {
        pageComponents.push(component);
      } else {
        logger5.warn(
          "Page component found outside root dir:",
          component.filePath
        );
      }
    } else {
      check(
        !componentMap.has(component.name),
        `Component name must be unique. Found duplicate: ${component.name}
  at ${filePath}`
      );
      componentMap.set(component.name, component);
    }
  }
  logger5.debug("Loaded components:", componentMap.keys());
  const renderer = new Renderer(componentMap);
  for (const file of nonHTMLFiles) {
    const relPath = import_node_path6.default.relative(rootDir2, file);
    const outFilePath = import_node_path6.default.resolve(outputDir2, relPath);
    if (import_node_fs2.default.existsSync(outFilePath)) {
      const outFileStats = import_node_fs2.default.statSync(outFilePath);
      if (outFileStats.isFile()) {
        const fileStats = import_node_fs2.default.statSync(file);
        if (outFileStats.mtime > fileStats.mtime) {
          continue;
        }
      }
    }
    import_node_fs2.default.mkdirSync(import_node_path6.default.dirname(outFilePath), { recursive: true });
    import_node_fs2.default.copyFileSync(file, outFilePath);
    logger5.info("Copied", formatPath(file), "\u2192", formatPath(outFilePath));
  }
  const pages = [];
  const absRootDir = import_node_path6.default.resolve(rootDir2);
  for (const component of pageComponents) {
    const pagePath = import_node_path6.default.relative(rootDir2, component.filePath);
    const srcPath = component.filePath;
    const outPath = component.name === "index" ? import_node_path6.default.resolve(outputDir2, pagePath) : import_node_path6.default.resolve(
      outputDir2,
      import_node_path6.default.dirname(pagePath),
      component.name,
      "index.html"
    );
    const nodes = await renderer.render(component, {
      rootDir: absRootDir,
      outputDir: outputDir2
    });
    pages.push({
      srcPath,
      pagePath,
      outPath,
      nodes
    });
  }
  const scriptBundles = extractScriptBundles(pages);
  for (const { relPath, code } of scriptBundles) {
    const outPath = import_node_path6.default.resolve(outputDir2, relPath);
    import_node_fs2.default.mkdirSync(import_node_path6.default.dirname(outPath), { recursive: true });
    import_node_fs2.default.writeFileSync(outPath, code);
    logger5.info("Bundled script \u2192", formatPath(outPath));
  }
  for (const { srcPath, outPath, nodes } of pages) {
    let html = toHTML(nodes);
    if (beautify) {
      initBeautifyDefaults(beautify, html);
      html = (0, import_js_beautify.html)(html, beautify);
    }
    import_node_fs2.default.mkdirSync(import_node_path6.default.dirname(outPath), { recursive: true });
    import_node_fs2.default.writeFileSync(outPath, html);
    logger5.info("Rendered", formatPath(srcPath), "\u2192", formatPath(outPath));
  }
}
function initBeautifyDefaults(beautify, pageHTML) {
  if (!beautify.indent_with_tabs && beautify.indent_size == void 0) {
    const indentMatch = pageHTML.match(/\n(\s+)(?=\S)/);
    if (indentMatch) {
      const char = indentMatch[1][0];
      if (char === "	") {
        beautify.indent_with_tabs = true;
      } else {
        beautify.indent_char = char;
        beautify.indent_size = indentMatch[1].length;
      }
    }
  }
}
function formatPath(p) {
  const cwd = process.cwd();
  const abs = import_node_path6.default.resolve(p);
  if (abs.startsWith(cwd)) {
    return import_node_path6.default.relative(cwd, p);
  } else {
    return abs;
  }
}
var import_glob, import_js_beautify, import_node_fs2, import_node_path6, DEFAULT_OPTIONS, logger5;
var init_builder = __esm({
  "src/builder/builder.ts"() {
    init_compiler();
    init_dom();
    import_glob = __toESM(require("glob"));
    import_js_beautify = require("js-beautify");
    import_node_fs2 = __toESM(require("node:fs"));
    import_node_path6 = __toESM(require("node:path"));
    init_renderer();
    init_log2();
    init_preconditions();
    init_bundler();
    DEFAULT_OPTIONS = {
      inputDir: process.cwd(),
      outputDir: import_node_path6.default.resolve(process.cwd(), "out"),
      beautify: {
        extra_liners: []
      }
    };
    logger5 = createLogger(import_node_path6.default.basename(__filename, ".ts"));
  }
});

// dist/cjs/main.js
var __importDefault = exports && exports.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var builder_1 = (init_builder(), __toCommonJS(builder_exports));
var commander_1 = require("commander");
var fs_1 = require("fs");
var node_path_1 = __importDefault(require("node:path"));
var preconditions_1 = (init_preconditions(), __toCommonJS(preconditions_exports));
commander_1.program.option("--config <path>", "Path to configuration file").option("-i, --input <dir>").option("-o, --output <dir>").option("--exclude <pattern...>").option("--root <dir>").parse();
var configPath = commander_1.program.getOptionValue("config");
if (configPath) {
  const config = readConfig(configPath);
  commander_1.program.setOptionValueWithSource("input", config.inputDir, "config");
  commander_1.program.setOptionValueWithSource("output", config.outputDir, "config");
  commander_1.program.setOptionValueWithSource("root", config.rootDir, "config");
  commander_1.program.setOptionValueWithSource("exclude", config.exclude, "config");
}
var options = commander_1.program.opts();
var inputDir = resolveDirOption(options.input);
var outputDir = resolveDirOption(options.output);
var rootDir = resolveDirOption(options.root);
var exclude = options.exclude && options.exclude.map((p) => node_path_1.default.resolve(process.cwd(), p));
if (inputDir) {
  (0, preconditions_1.check)((0, fs_1.lstatSync)(inputDir).isDirectory, `Bad input directory: ${inputDir}`);
}
(0, builder_1.build)({
  inputDir,
  outputDir,
  rootDir,
  exclude
});
function resolveDirOption(value) {
  return value && node_path_1.default.resolve(process.cwd(), value);
}
function readConfig(path7) {
  return JSON.parse((0, fs_1.readFileSync)(path7).toString());
}
