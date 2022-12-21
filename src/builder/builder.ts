import { compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { toHTML } from "dom/dom";
import glob from "glob";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { html as beautifyHTML, HTMLBeautifyOptions } from "js-beautify";
import { createLogger } from "util/log";

type BuildOptions = {
  inputDir?: string;
  outputDir?: string;
  rootDir?: string;
  beautify?: HTMLBeautifyOptions | false;
};

const DEFAULT_OPTIONS = {
  inputDir: process.cwd(),
  outputDir: path.resolve(process.cwd(), "out"),
  beautify: {
    extra_liners: [],
  },
} satisfies BuildOptions;

const logger = createLogger(path.basename(__filename, ".ts"));

export function build(options: BuildOptions = {}) {
  const {
    inputDir,
    outputDir,
    rootDir: rootDirOption,
    beautify,
  } = Object.assign({}, DEFAULT_OPTIONS, options);

  const componentMap = new Map<string, Component>();

  const htmlFiles = glob.sync(path.resolve(inputDir, "**/*.html"));
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);
    componentMap.set(component.name, component);
  }

  logger.debug("Loaded components:", componentMap.keys());

  const rootDir = rootDirOption ?? inputDir;
  const renderer = new Renderer(componentMap);

  // render pages
  for (const component of componentMap.values()) {
    if (!component.page || !component.filePath.startsWith(rootDir)) continue;

    let pageHTML = toHTML(renderer.render(component));

    if (beautify) {
      initBeautifyDefaults(beautify, pageHTML);
      pageHTML = beautifyHTML(pageHTML, beautify);
    }

    const pagePath = path.relative(rootDir, component.filePath);
    const outFilePath = path.resolve(outputDir, pagePath);

    mkdirSync(path.dirname(outFilePath), { recursive: true });
    writeFileSync(outFilePath, pageHTML);
  }
}

function initBeautifyDefaults(
  beautify: { extra_liners: never[] } & HTMLBeautifyOptions,
  pageHTML: string
) {
  if (!beautify.indent_with_tabs && beautify.indent_size == undefined) {
    // detect indent
    const indentMatch = pageHTML.match(/\n(\s+)(?=\S)/);
    if (indentMatch) {
      const char = indentMatch[1][0];
      if (char === "\t") {
        beautify.indent_with_tabs = true;
      } else {
        beautify.indent_char = char;
        beautify.indent_size = indentMatch[1].length;
      }
    }
  }
}
