import { Component } from "compiler/component";
import { DZ_PREFIX } from "dom/desensitize";
import { appendChild, childNodesOf, isElement, toHTML } from "dom/dom";
import path from "node:path";
import { createLogger, formatHTMLValue } from "util/log";
import { mapAttrs } from "./map_attrs";
import { renderComponent } from "./render_component";
import { renderPage } from "./render_page";

const logger = createLogger(path.basename(__filename, ".ts"));

export type RenderContext = {
  rootDir: string;
  outputDir: string;
};

type Context = {
  metadata: Set<Node>;
  clientScripts: Set<HTMLScriptElement>;
  styles: Set<HTMLStyleElement>;
} & RenderContext;

// fixme: smells like weird undefined behavior
export const nullRenderContext: RenderContext = {
  rootDir: "",
  outputDir: "",
};

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

  async render(
    component: Component,
    renderContext: RenderContext = nullRenderContext
  ): Promise<Node[]> {
    logger.debug(
      "====== render start ======",
      "\nroot component:",
      component.name
    );
    logger.trace("\n" + formatHTMLValue(toHTML(component.content)) + "\n");

    let context: Context | undefined;

    if (component.page) {
      context = {
        ...renderContext,
        metadata: new Set(component.metadata),
        clientScripts: new Set(component.clientScripts),
        styles: new Set(component.styles),
      };
    }

    let result = await this.renderList(
      await renderComponent(component, [], [], this.renderList, renderContext),
      context
    );

    if (context) {
      logger.debug(
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
          // reverse arrays to satisfy dependency loading order
          clientScripts: Array.from(context.clientScripts).reverse(),
          styles: Array.from(context.styles).reverse(),
        }),
      ];
    }

    logger.debug("");
    logger.debug(
      "====== render done ======",
      "\nroot component:",
      component.name
    );
    logger.trace("\n" + formatHTMLValue(toHTML(result)) + "\n");
    return result;
  }

  async renderNode(node: Node, context?: Context): Promise<Node[]> {
    const children = await this.renderList(childNodesOf(node), context);

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
          // re-order to keep correct load order
          context.clientScripts.delete(script);
          context.clientScripts.add(script);
        }
        for (const style of component.styles) {
          context.styles.add(style);
        }
      }

      result = await this.renderList(componentOutput, context);
    } else if (
      context &&
      isElement(node) &&
      node.tagName.toLowerCase() === `${DZ_PREFIX}head`
    ) {
      // todo: if <head> is processed on render, then metadata compilation step is redundant
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

  renderList = async (
    nodes: Iterable<Node>,
    context?: Context
  ): Promise<Node[]> => {
    // todo: parallelize (if safe)
    const rendered = [];
    for await (const item of this.generateRenderedList(nodes, context)) {
      rendered.push(item);
    }
    return rendered;
  };

  private async *generateRenderedList(
    nodes: Iterable<Node>,
    context?: Context
  ): AsyncGenerator<Node> {
    // todo: parallelize (if safe)
    for (const node of nodes) {
      for (const rendered of await this.renderNode(node, context)) {
        yield rendered;
      }
    }
  }
}
