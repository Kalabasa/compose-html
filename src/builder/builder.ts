import { compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { toHTML } from "dom/dom";
import glob from "glob";
import { copyFileSync, lstatSync, mkdirSync, writeFileSync } from "node:fs";
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
  const rootDir = rootDirOption ?? inputDir;

  logger.info(
    "✍  compose-html",
    "\n\nWorking directories",
    "\n   input:",
    formatPath(inputDir),
    "\n  output:",
    formatPath(outputDir),
    "\n    root:",
    formatPath(rootDir),
    "\n"
  );

  const nodir = { nodir: true };
  const htmlFiles = glob.sync(path.resolve(inputDir, "**/*.html"), nodir);
  const nonHTMLFiles = glob
    .sync(path.resolve(rootDir, "**/*"), nodir)
    .filter((f) => !htmlFiles.includes(f));
  logger.info(htmlFiles.length, "html files");
  logger.info(nonHTMLFiles.length, "non-html files");

  // compile HTML files as components
  const componentMap = new Map<string, Component>();
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);
    componentMap.set(component.name, component);
  }
  const renderer = new Renderer(componentMap);
  logger.debug("Loaded components:", componentMap.keys());
 
  // copy non-HTML files
  for (const file of nonHTMLFiles) {
    const relPath = path.relative(rootDir, file);
    const outFilePath = path.resolve(outputDir, relPath);
    mkdirSync(path.dirname(outFilePath), { recursive: true });
    copyFileSync(file, outFilePath);
    logger.info("Copied", formatPath(file), "→", formatPath(outFilePath));
  }

  // render pages
  for (const component of componentMap.values()) {
    if (!component.page || !component.filePath.startsWith(rootDir)) continue;

    let pageHTML = toHTML(renderer.render(component));

    if (beautify) {
      initBeautifyDefaults(beautify, pageHTML);
      pageHTML = beautifyHTML(pageHTML, beautify);
    }

    const pagePath = path.relative(rootDir, component.filePath);
    const outFilePath =
      component.name === "index"
        ? path.resolve(outputDir, pagePath)
        : path.resolve(
            outputDir,
            path.dirname(pagePath),
            component.name,
            "index.html"
          );

    mkdirSync(path.dirname(outFilePath), { recursive: true });
    writeFileSync(outFilePath, pageHTML);
    logger.info(
      "Rendered",
      formatPath(component.filePath),
      "→",
      formatPath(outFilePath)
    );
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

function formatPath(p: string): string {
  const cwd = process.cwd();
  const abs = path.resolve(p);
  if (abs.startsWith(cwd)) {
    return path.relative(cwd, p);
  } else {
    return abs;
  }
}
