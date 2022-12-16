import { Component } from "component/component";
import { appendChild, childNodesOf, isElement, toHTML } from "dom/dom";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { mapAttrs } from "./attr_helpers";
import { renderComponent } from "./render_component";

const logger = createLogger(path.basename(__filename, ".ts"));

export class Renderer {
  private readonly components: Map<string, Component>;

  constructor(components: Map<string, Component> = new Map()) {
    this.components = new Map(
      [...components.entries()].map(([tagName, component]) => [
        tagName.toLowerCase(),
        component,
      ])
    );
  }

  render(component: Component): Node[] {
    logger.debug(
      "====== render start ======",
      "\nroot component:",
      component.name,
      "\n\n\b",
      formatHTMLValue(toHTML(component.content)),
      "\n"
    );

    const result = this.renderList(renderComponent(component, [], [], this));

    logger.debug("");
    logger.debug(
      "====== render done ======",
      "\nroot component:",
      component.name,
      "\n\n\b",
      formatHTMLValue(toHTML(result)),
      "\n"
    );
    return result;
  }

  renderNode(node: Node): Node[] {
    logger.debug(node);
    logger.group();

    const children = this.renderList(childNodesOf(node));

    let result: Node[];

    let component: Component | undefined = undefined;
    if (isElement(node) && (component = this.components.get(node.tagName.toLowerCase()))) {
      const componentOutput = renderComponent(
        component,
        mapAttrs(node.attributes),
        children,
        this
      );
      result = this.renderList(componentOutput);
    } else {
      const clone = node.cloneNode(false);
      for (const child of children) {
        appendChild(clone, child);
      }
      result = [clone];
    }

    logger.groupEnd();
    return result;
  }

  renderList(nodes: Iterable<Node>): Node[] {
    return [...this.generateRenderedList(nodes)];
  }

  private *generateRenderedList(nodes: Iterable<Node>): Generator<Node> {
    for (const node of nodes) {
      for (const rendered of this.renderNode(node)) {
        yield rendered;
      }
    }
  }
}
