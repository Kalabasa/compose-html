"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderComponent = void 0;
const dom_1 = require("dom/dom");
const node_path_1 = __importDefault(require("node:path"));
const log_1 = require("util/log");
const preconditions_1 = require("util/preconditions");
const renderer_1 = require("./renderer");
const render_scripts_1 = require("./render_scripts");
const DEFAULT_SLOT_NAME = "default";
const SLOT_USED = Symbol("SLOT_USED");
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename, ".ts"));
async function renderComponent(component, attrs, children, 
// todo: injection
render, renderContext = renderer_1.nullRenderContext // fixme: code smell: unrelated param passthrough
) {
    logger.debug("component start:", `<${component.name} .. >`);
    logger.group();
    const fragment = component.content.cloneNode(true);
    await (0, render_scripts_1.evaluateScripts)(fragment, component, attrs, children, render, renderContext);
    // Key: slot name
    // Value is `SLOT_USED` if slot has been used
    const slotMap = mapSlots(fragment.querySelectorAll("slot"));
    if (slotMap.size) {
        processSlots(component, slotMap, children);
    }
    logger.groupEnd();
    logger.debug("component done:", `<${component.name} .. />`, "→", fragment);
    logger.trace("\n" + (0, log_1.formatHTMLValue)((0, dom_1.toHTML)(fragment)) + "\n");
    return (0, dom_1.childNodesOf)(fragment);
}
exports.renderComponent = renderComponent;
function processSlots(component, slotMap, children) {
    logger.debug(`process slots for ${component.name}:`, "slots=\b", slotMap.keys(), "children=\b", children);
    logger.group();
    const unslottedChildren = [];
    for (const child of children) {
        let slotName;
        if ((0, dom_1.isElement)(child) && (slotName = child.getAttribute("slot"))) {
            replaceSlot(slotMap, slotName, child);
        }
        else {
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
    logger.groupEnd();
}
function replaceSlot(slotMap, slotName, ...replacement) {
    const slot = (0, preconditions_1.checkNotNull)(slotMap.get(slotName), slotName
        ? `No <slot> found with name: ${slotName}`
        : "No default <slot> found.");
    (0, preconditions_1.check)(slot != SLOT_USED, "<slot> cannot be used by multiple elements.");
    let finalReplacement;
    if (replacement.length === 1 &&
        (0, dom_1.isTemplateElement)(replacement[0]) &&
        replacement[0].getAttribute("slot") === slotName) {
        finalReplacement = Array.from(replacement[0].content.childNodes);
    }
    else {
        finalReplacement = replacement;
    }
    logger.debug("replace slot", `'${slotName}'`, "with", finalReplacement);
    slot.replaceWith(...finalReplacement);
    slotMap.set(slotName, SLOT_USED);
}
function mapSlots(slots) {
    const map = new Map();
    for (const slot of slots) {
        const name = slot.getAttribute("name") ?? DEFAULT_SLOT_NAME;
        (0, preconditions_1.check)(!map.has(name), "<slot> names must be unique within a component.");
        map.set(name, slot);
    }
    return map;
}
