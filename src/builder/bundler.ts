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

  logger.debug(
    "script to pages map:\n" +
      Array.from(scriptPages.entries())
        .map(
          ([script, pages]) =>
            `  \`${script.replaceAll(/\s+/g, " ").slice(0, 80)}\`\n` +
            `      => ${pages.map((page) => page.pagePath).join(", ")}`
        )
        .join("\n")
  );

  const scriptBundles = generateBundles(
    scriptElements,
    scriptComponents,
    scriptPages,
    minPageUsage
  );

  mergeBundles(scriptPages, scriptElements, scriptBundles);

  const bundleSet = new Set(scriptBundles.values());

  for (const bundle of bundleSet) {
    bundle.src = `${srcPrefix}${bundle.src}.js`;
  }

  replaceScriptsWithBundles(pages, scriptBundles);

  return [...bundleSet];
}

// Merge bundles that are always included together in the same pages
function mergeBundles(
  scriptPages: Map<string, Page[]>,
  scriptElements: Map<string, HTMLScriptElement>,
  scriptBundles: Map<string, Bundle>
): void {
  // bucket key = script loading type + page usage signature / hash
  const buckets = new Map<string, Bundle>();

  for (const [scriptHTML, bundle] of scriptBundles.entries()) {
    const element = checkNotNull(scriptElements.get(scriptHTML));
    const loadingType =
      (element.hasAttribute("async") ? "a" : "s") +
      (element.hasAttribute("defer") ? "d" : "e");

    const pages = scriptPages.get(scriptHTML) ?? [];

    const signature =
      loadingType +
      "::" +
      pages
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

    let src = "";
    const component = scriptComponents.get(scriptHTML);
    if (component) {
      src = component.name;
    } else {
      src = pages.map((page) => page.pagePath.replaceAll(/\W/g, "_")).join("-");
    }

    if (!src) continue;

    const bundle: Bundle = {
      src,
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
    const included = new Set<Bundle>();

    for (const script of findScripts(page.nodes)) {
      const bundle = scriptBundles.get(script.outerHTML);
      if (bundle) {
        if (included.has(bundle)) {
          script.remove();
          continue;
        }

        included.add(bundle);

        const bundleScript = createElement("script");
        for (const attr of script.attributes) {
          bundleScript.setAttribute(attr.name, attr.value);
        }
        bundleScript.src = bundle.src;
        script.replaceWith(bundleScript);
      }
    }

    if (included.size) {
      logger.debug(
        `Extracting ${included.size} bundles from:`,
        page.pagePath,
        [...included].map((bundle) => "\n  " + bundle.src).join("")
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
