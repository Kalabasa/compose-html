import { Component } from "component/component";
import {
  createFragment,
  isElement,
  childNodesOf,
  isTemplateElement,
} from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { checkNotNull, check } from "util/preconditions";
import { renderScripts } from "./render_scripts";

const SLOT_USED = Symbol("SLOT_USED");

const logger = createLogger(path.basename(__filename, ".ts"));

export function renderComponent(
  component: Component,
  attributes: Iterable<Attr>,
  children: Node[]
): Iterable<Node> {
  logger.debug("Component start -", `<${component.name}>`);
  const fragment = component.content.cloneNode(true) as DocumentFragment;

  renderScripts(fragment, component);

  const unslottedChildren: Node[] = [];
  // Key: slot name. Unnamed slot has key == "".
  // Value is `SLOT_USED` if slot has been used
  const slotMap: Map<string, HTMLSlotElement | typeof SLOT_USED> = mapSlots(
    fragment.querySelectorAll("slot")
  );

  logger.debug(
    "Processing slots -",
    `<${component.name}>`,
    "slots:",
    slotMap.keys(),
    "children:",
    children
  );

  for (const child of children) {
    let slotName: string | null;
    if (isElement(child) && (slotName = child.getAttribute("slot"))) {
      replaceSlot(slotMap, slotName, child);
    } else {
      unslottedChildren.push(child);
    }
  }

  if (unslottedChildren.length) {
    replaceSlot(slotMap, "", ...unslottedChildren);
  }

  logger.debug(
    "Component done -",
    `<${component.name}>`,
    "→",
    childNodesOf(fragment)
  );
  return childNodesOf(fragment);
}

function replaceSlot(
  slotMap: Map<string, HTMLSlotElement | typeof SLOT_USED>,
  slotName: string,
  ...replacement: Node[]
) {
  logger.debug("Replace slot", `'${slotName}'`, "with", replacement);

  const slot = checkNotNull(
    slotMap.get(slotName),
    slotName
      ? `No <slot> found with name: ${slotName}`
      : "No default <slot> found."
  );

  check(slot != SLOT_USED, "<slot> cannot be used by multiple elements.");

  if (replacement.length === 1 && isTemplateElement(replacement[0])) {
    slot.replaceWith(...replacement[0].content.childNodes);
  } else {
    slot.replaceWith(...replacement);
  }

  slotMap.set(slotName, SLOT_USED);
}

function mapSlots(
  slots: Iterable<HTMLSlotElement>
): Map<string, HTMLSlotElement> {
  const map = new Map<string, HTMLSlotElement>();

  for (const slot of slots) {
    const name = slot.getAttribute("name") ?? "";
    check(!map.has(name), "<slot> names must be unique within a component.");
    map.set(name, slot);
  }

  return map;
}
