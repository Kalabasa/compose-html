"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Renderer = exports.nullRenderContext = void 0;
const desensitize_1 = require("dom/desensitize");
const dom_1 = require("dom/dom");
const node_path_1 = __importDefault(require("node:path"));
const log_1 = require("util/log");
const map_attrs_1 = require("./map_attrs");
const render_component_1 = require("./render_component");
const render_page_1 = require("./render_page");
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename, ".ts"));
// fixme: smells like weird undefined behavior
exports.nullRenderContext = {
    rootDir: "",
    outputDir: "",
};
class Renderer {
    components;
    constructor(components = new Map()) {
        this.components = new Map([...components.entries()].map(([tagName, component]) => [
            tagName.toLowerCase(),
            component,
        ]));
    }
    async render(component, renderContext = exports.nullRenderContext) {
        logger.debug("====== render start ======", "\nroot component:", component.name);
        logger.trace("\n" + (0, log_1.formatHTMLValue)((0, dom_1.toHTML)(component.content)) + "\n");
        let context;
        if (component.page) {
            context = {
                ...renderContext,
                metadata: new Set(component.metadata),
                clientScripts: new Set(component.clientScripts),
                styles: new Set(component.styles),
            };
        }
        let result = await this.renderList(await (0, render_component_1.renderComponent)(component, [], [], this.renderList, renderContext), context);
        if (context) {
            logger.debug("context update:", context.metadata.size, `(+${context.metadata.size - component.metadata.length})`, "metadata,", context.clientScripts.size, `(+${context.clientScripts.size - component.clientScripts.length})`, "clientScripts,", context.styles.size, `(+${context.styles.size - component.styles.length})`, "styles.");
        }
        if (component.page && context) {
            result = [
                (0, render_page_1.renderPage)(result, {
                    page: component.page,
                    metadata: Array.from(context.metadata),
                    // reverse arrays to satisfy dependency loading order
                    clientScripts: Array.from(context.clientScripts).reverse(),
                    styles: Array.from(context.styles).reverse(),
                }),
            ];
        }
        logger.debug("");
        logger.debug("====== render done ======", "\nroot component:", component.name);
        logger.trace("\n" + (0, log_1.formatHTMLValue)((0, dom_1.toHTML)(result)) + "\n");
        return result;
    }
    async renderNode(node, context) {
        const children = await this.renderList((0, dom_1.childNodesOf)(node), context);
        let result;
        let component = undefined;
        if ((0, dom_1.isElement)(node) &&
            (component = this.components.get(node.tagName.toLowerCase()))) {
            if (component.page) {
                throw new Error("Can't render a page component inside another component");
            }
            const componentOutput = await (0, render_component_1.renderComponent)(component, (0, map_attrs_1.mapAttrs)(node.attributes), children, (nodes) => this.renderList(nodes, context), context ?? exports.nullRenderContext);
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
        }
        else if (context &&
            (0, dom_1.isElement)(node) &&
            node.tagName.toLowerCase() === `${desensitize_1.DZ_PREFIX}head`) {
            // todo: if <head> is processed on render, then metadata compilation step is redundant
            children.forEach((child) => context.metadata.add(child));
            result = [];
        }
        else {
            const clone = node.cloneNode(false);
            for (const child of children) {
                (0, dom_1.appendChild)(clone, child);
            }
            result = [clone];
        }
        return result;
    }
    renderList = async (nodes, context) => {
        // todo: parallelize (if safe)
        const rendered = [];
        for await (const item of this.generateRenderedList(nodes, context)) {
            rendered.push(item);
        }
        return rendered;
    };
    async *generateRenderedList(nodes, context) {
        // todo: parallelize (if safe)
        for (const node of nodes) {
            for (const rendered of await this.renderNode(node, context)) {
                yield rendered;
            }
        }
    }
}
exports.Renderer = Renderer;
