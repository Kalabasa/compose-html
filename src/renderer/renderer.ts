import { Component } from "compiler/component";
import { appendChild, childNodesOf, isElement, toHTML } from "dom/dom";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { mapAttrs } from "./attr_helpers";
import { renderComponent } from "./render_component";
import { renderPage } from "./render_page";

const logger = createLogger(path.basename(__filename, ".ts"));

type RendererOptions = {};

export class Renderer {
  private readonly components: Map<string, Component>;

  constructor(
    components: Map<string, Component> = new Map(),
    options: RendererOptions = {}
  ) {
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

    let result = this.renderList(renderComponent(component, [], [], this));

    if (component.isPage) {
      result = [renderPage(result, component)];
    }

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
    if (
      isElement(node) &&
      (component = this.components.get(node.tagName.toLowerCase()))
    ) {
      if (component.isPage) {
        throw new Error(
          "Can't render a page component inside another component"
        );
      }

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
