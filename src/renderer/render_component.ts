import { Component } from "compiler/component";
import { childNodesOf, isElement, isTemplateElement, toHTML } from "dom/dom";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { check, checkNotNull } from "util/preconditions";
import { Renderer } from "./renderer";
import { renderScripts } from "./render_scripts";

const DEFAULT_SLOT_NAME = "default";

const SLOT_USED = Symbol("SLOT_USED");

const logger = createLogger(path.basename(__filename, ".ts"));

export function renderComponent(
  component: Component,
  attrs: Record<string, any>,
  children: Node[],
  renderer: Renderer
): Iterable<Node> {
  logger.debug("component start:", `<${component.name} .. >`);
  logger.group();

  const fragment = component.content.cloneNode(true) as DocumentFragment;

  renderScripts(fragment, component, attrs, renderer);

  // Key: slot name
  // Value is `SLOT_USED` if slot has been used
  const slotMap: Map<string, HTMLSlotElement | typeof SLOT_USED> = mapSlots(
    fragment.querySelectorAll("slot")
  );

  if (slotMap.size) {
    processSlots(component, slotMap, children);
  }

  logger.groupEnd();
  logger.debug(
    "component done:",
    `<${component.name} .. />`,
    "→\n\b",
    formatHTMLValue(toHTML(fragment))
  );
  return childNodesOf(fragment);
}

function processSlots(
  component: Component,
  slotMap: Map<string, typeof SLOT_USED | HTMLSlotElement>,
  children: Node[]
) {
  logger.debug(
    `process slots for ${component.name}:`,
    "slots=\b",
    slotMap.keys(),
    "children=\b",
    children
  );
  logger.group();

  const unslottedChildren: Node[] = [];

  for (const child of children) {
    let slotName: string | null;
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
    if (slot === SLOT_USED) continue;
    replaceSlot(slotMap, slotName, ...slot.childNodes);
  }

  logger.groupEnd();
}

function replaceSlot(
  slotMap: Map<string, HTMLSlotElement | typeof SLOT_USED>,
  slotName: string,
  ...replacement: Node[]
) {
  const slot = checkNotNull(
    slotMap.get(slotName),
    slotName
      ? `No <slot> found with name: ${slotName}`
      : "No default <slot> found."
  );

  check(slot != SLOT_USED, "<slot> cannot be used by multiple elements.");

  let finalReplacement: Node[];
  if (
    replacement.length === 1 &&
    isTemplateElement(replacement[0]) &&
    replacement[0].getAttribute("slot") === slotName
  ) {
    finalReplacement = Array.from(replacement[0].content.childNodes);
  } else {
    finalReplacement = replacement;
  }

  logger.debug("replace slot", `'${slotName}'`, "with", finalReplacement);
  slot.replaceWith(...finalReplacement);

  slotMap.set(slotName, SLOT_USED);
}

function mapSlots(
  slots: Iterable<HTMLSlotElement>
): Map<string, HTMLSlotElement> {
  const map = new Map<string, HTMLSlotElement>();

  for (const slot of slots) {
    const name = slot.getAttribute("name") ?? DEFAULT_SLOT_NAME;
    check(!map.has(name), "<slot> names must be unique within a component.");
    map.set(name, slot);
  }

  return map;
}
