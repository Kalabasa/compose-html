import { Component } from "component/component";
import { appendChild, childNodesOf, isElement } from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { mapAttrs } from "./attr_helpers";
import { renderComponent } from "./render_component";

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

  render(component: Component): Node[] {
    logger.debug("Render start -", `<${component.name}>`);

    const result = this.renderList(renderComponent(component, [], [], this));

    logger.debug("Render end -", childNodesOf(component.content), "→", result);
    return result;
  }

  renderNode(node: Node): Node[] {
    logger.debug("Node start -", node);

    const children = this.renderList(childNodesOf(node));

    let result: Node[];

    let component: Component | undefined = undefined;
    if (isElement(node) && (component = this.components.get(node.tagName))) {
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

    logger.debug("Node end -", node, "→", result);
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
