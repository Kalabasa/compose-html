import { Component } from "component/component";
import {
  appendChild,
  childNodesOf,
  createFragment,
  isElement,
  isTemplateElement,
  isText,
  parse,
} from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { check, checkNotNull } from "util/preconditions";
import { interpolate } from "./interpolate";

const SLOT_USED = Symbol("SLOT_USED");

const logger = createLogger(path.basename(__filename, ".ts"));

export class Renderer {
  private readonly components: Map<string, Component>;

  constructor(components: Map<string, Component> = new Map()) {
    this.components = new Map(
      [...components.entries()].map(([tagName, component]) => [
        tagName.toUpperCase(),
        component,
      ])
    );
  }

  render(source: Iterable<Node> | string): Node[] {
    logger.debug("Render start -", source);

    const nodes = parse(source);

    const renderedNodes: Node[] = [];
    for (const node of nodes) {
      renderedNodes.push(...this.renderNode(node));
    }

    logger.debug("Render end -", nodes, "→", renderedNodes);
    return renderedNodes;
  }

  private renderNode(node: Node): Iterable<Node> {
    logger.debug("Node start -", node);

    const childNodes = childNodesOf(node);
    const children = childNodes.length ? this.render(childNodes) : [];

    let result: Iterable<Node>;

    let component: Component | undefined = undefined;
    if (isElement(node) && (component = this.components.get(node.tagName))) {
      result = this.renderComponent(component, node.attributes, children);
    } else {
      const clone = node.cloneNode(false);
      for (const child of children) {
        appendChild(clone, child);
      }
      result = [clone];
    }

    logger.debug("Node end -", node, "→", result);
    return result;
  }

  private renderComponent(
    component: Component,
    attributes: NamedNodeMap,
    children: Node[]
  ): Iterable<Node> {
    logger.debug("Component start -", `<${component.name}>`);
    const fragment = createFragment(component.content);

    interpolate(fragment.childNodes, component);

    const unslottedChildren: Node[] = [];
    // Key: slot name. Unnamed slot has key == "".
    // Value is `SLOT_USED` if slot has been used
    const slotMap: Map<string, HTMLSlotElement | typeof SLOT_USED> = mapSlots(
      fragment.querySelectorAll("slot")
    );

    logger.debug(
      "Component slotting -",
      `<${component.name}>`,
      "slots:",
      slotMap.keys(),
      "children:",
      children
    );

    for (const child of children) {
      let slotName: string | null;
      if (isElement(child) && (slotName = child.getAttribute("slot"))) {
        this.replaceSlot(slotMap, slotName, child);
      } else {
        unslottedChildren.push(child);
      }
    }

    if (unslottedChildren.length) {
      this.replaceSlot(slotMap, "", ...unslottedChildren);
    }

    logger.debug(
      "Component done -",
      `<${component.name}>`,
      "→",
      childNodesOf(fragment)
    );
    return childNodesOf(fragment);
  }

  private replaceSlot(
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
