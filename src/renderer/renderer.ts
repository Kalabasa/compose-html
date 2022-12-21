import { Component } from "compiler/component";
import { appendChild, childNodesOf, isElement, toHTML } from "dom/dom";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { mapAttrs } from "./attr_helpers";
import { renderComponent } from "./render_component";
import { renderPage } from "./render_page";

const logger = createLogger(path.basename(__filename, ".ts"));

type RendererOptions = {};

type Context = {
  metadata: Set<Node>;
  clientScripts: Set<HTMLScriptElement>;
  styles: Set<HTMLStyleElement>;
};

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
      "\n\n" + formatHTMLValue(toHTML(component.content)),
      "\n"
    );

    let context: Context | undefined;

    if (component.page) {
      context = {
        metadata: new Set(component.metadata),
        clientScripts: new Set(component.clientScripts),
        styles: new Set(component.styles),
      };
    }

    let result = this.renderList(
      renderComponent(component, [], [], this.renderList),
      context
    );

    if (component.page && context) {
      result = [
        renderPage(result, {
          page: component.page,
          metadata: Array.from(context.metadata),
          clientScripts: Array.from(context.clientScripts),
          styles: Array.from(context.styles),
        }),
      ];
    }

    logger.debug("");
    logger.debug(
      "====== render done ======",
      "\nroot component:",
      component.name,
      "\n\n" + formatHTMLValue(toHTML(result)),
      "\n"
    );
    return result;
  }

  renderNode(node: Node, context?: Context): Node[] {
    logger.debug(node);
    logger.group();

    const children = this.renderList(childNodesOf(node), context);

    let result: Node[];

    let component: Component | undefined = undefined;
    if (
      isElement(node) &&
      (component = this.components.get(node.tagName.toLowerCase()))
    ) {
      if (component.page) {
        throw new Error(
          "Can't render a page component inside another component"
        );
      }

      const componentOutput = renderComponent(
        component,
        mapAttrs(node.attributes),
        children,
        this.renderList
      );

      if (context) {
        for (const metadata of component.metadata) {
          context.metadata.add(metadata);
        }
        for (const script of component.clientScripts) {
          context.clientScripts.add(script);
        }
        for (const style of component.styles) {
          context.styles.add(style);
        }
      }

      result = this.renderList(componentOutput, context);
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

  renderList = (nodes: Iterable<Node>, context?: Context): Node[] => {
    return [...this.generateRenderedList(nodes, context)];
  };

  private *generateRenderedList(
    nodes: Iterable<Node>,
    context?: Context
  ): Generator<Node> {
    for (const node of nodes) {
      for (const rendered of this.renderNode(node, context)) {
        yield rendered;
      }
    }
  }
}
