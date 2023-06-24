import { Component } from "compiler/component";
import { createElement, isInlineJavaScriptElement } from "dom/dom";
import path from "node:path";
import { createLogger } from "util/log";
import { checkNotNull } from "util/preconditions";

export type Page = {
  pagePath: string;
  nodes: Node[];
};

type Bundle = {
  src: string;
  code: string;
};

const logger = createLogger(path.basename(__filename, ".ts"));

export function extractScriptBundles(
  pages: Page[],
  minPageUsage: number,
  srcPrefix: string,
  components: Iterable<Component>
): Array<Bundle> {
  const { scriptPages, scriptElements, scriptComponents } = mapScripts(
    pages,
    components
  );

  const scriptBundles = generateBundles(
    scriptElements,
    scriptComponents,
    scriptPages,
    minPageUsage
  );

  mergeBundles(scriptPages, scriptBundles);

  for (const bundle of new Set(scriptBundles.values())) {
    bundle.src = `${srcPrefix}${bundle.src}.js`;
  }

  replaceScriptsWithBundles(pages, scriptBundles);

  return [...scriptBundles.values()];
}

// Merge bundles that are always included together in the same pages
function mergeBundles(
  scriptPages: Map<string, Page[]>,
  scriptBundles: Map<string, Bundle>
): void {
  // bucket key = page usage signature / hash
  const buckets = new Map<string, Bundle>();

  for (const [scriptHTML, bundle] of scriptBundles.entries()) {
    const pages = scriptPages.get(scriptHTML) ?? [];

    const signature = pages
      .map((page) => page.pagePath)
      .sort()
      .join(":");

    const bucketBundle = buckets.get(signature);
    if (bucketBundle) {
      // merge bundles
      bucketBundle.src += "-" + bundle.src;
      bucketBundle.code += "\n" + bundle.code;
      // point to the same bundle
      scriptBundles.set(scriptHTML, bucketBundle);
    } else {
      buckets.set(signature, bundle);
    }
  }
}

function generateBundles(
  scriptElements: Map<string, HTMLScriptElement>,
  scriptComponents: Map<string, Component>,
  scriptPages: Map<string, Page[]>,
  minPageUsage: number
) {
  const scriptBundles = new Map<string, Bundle>();
  for (const [scriptHTML, pages] of scriptPages.entries()) {
    const element = checkNotNull(scriptElements.get(scriptHTML));

    const canBeExtracted =
      pages.length >= minPageUsage || element.hasAttribute("async");
    if (!canBeExtracted) continue;

    const component = scriptComponents.get(scriptHTML);
    if (!component) continue;

    const bundle: Bundle = {
      src: component.name,
      code: element.innerHTML,
    };

    scriptBundles.set(scriptHTML, bundle);
  }
  return scriptBundles;
}

function replaceScriptsWithBundles(
  pages: Page[],
  scriptBundles: Map<string, Bundle>
) {
  for (const page of pages) {
    let bundleLogs: string[] | undefined;
    if (logger.getLevel() <= logger.levels.DEBUG) {
      bundleLogs = [];
    }

    for (const script of findScripts(page.nodes)) {
      const bundle = scriptBundles.get(script.outerHTML);
      if (bundle) {
        const bundleScript = createElement("script");
        for (const attr of script.attributes) {
          bundleScript.setAttribute(attr.name, attr.value);
        }
        bundleScript.src = bundle.src;
        script.replaceWith(bundleScript);

        if (logger.getLevel() <= logger.levels.DEBUG) {
          bundleLogs!.push(bundle.src);
        }
      }
    }

    if (bundleLogs?.length) {
      logger.debug(
        `Extracting ${bundleLogs.length} bundles from:`,
        page.pagePath,
        bundleLogs.map((log) => "\n  " + log).join("")
      );
    }
  }
}

function mapScripts(pages: Page[], components: Iterable<Component>) {
  const scriptPages = new Map<string, Page[]>();
  const scriptElements = new Map<string, HTMLScriptElement>();
  const scriptComponents = new Map<string, Component>();

  for (const page of pages) {
    for (const script of findScripts(page.nodes)) {
      scriptElements.set(script.outerHTML, script);

      let pages = scriptPages.get(script.outerHTML);
      if (!pages) scriptPages.set(script.outerHTML, (pages = []));

      pages.push(page);
    }
  }

  for (const component of components) {
    for (const script of component.clientScripts) {
      scriptElements.set(script.outerHTML, script);
      scriptComponents.set(script.outerHTML, component);
    }
  }

  return { scriptPages, scriptElements, scriptComponents };
}

function* findScripts(nodes: Iterable<Node>): Generator<HTMLScriptElement> {
  for (const node of nodes) {
    if (isInlineJavaScriptElement(node)) yield node;
    else yield* findScripts(node.childNodes);
  }
}
