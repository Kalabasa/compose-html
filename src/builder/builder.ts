import { compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { toHTML } from "dom/dom";
import glob from "glob";
import { html as beautifyHTML, HTMLBeautifyOptions } from "js-beautify";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { createLogger } from "util/log";
import { check } from "util/preconditions";
import { extractScriptBundles } from "./bundler";

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

  // compile HTML files
  const pageComponents: Component[] = [];
  const componentMap = new Map<string, Component>();
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);

    if (!component.page || component.name != "index") {
      check(!componentMap.has(component.name), `Component name must be unique. Found duplicate: ${component.name}`);
      componentMap.set(component.name, component);
    }

    if (component.page && component.filePath.startsWith(rootDir)) {
      pageComponents.push(component);
    }
  }
  
  logger.debug("Loaded components:", componentMap.keys());
  const renderer = new Renderer(componentMap);

  // copy non-HTML files
  for (const file of nonHTMLFiles) {
    const relPath = path.relative(rootDir, file);
    const outFilePath = path.resolve(outputDir, relPath);
    mkdirSync(path.dirname(outFilePath), { recursive: true });
    copyFileSync(file, outFilePath);
    logger.info("Copied", formatPath(file), "→", formatPath(outFilePath));
  }

  // render pages
  const pages: Array<{
    srcPath: string;
    pagePath: string;
    outPath: string;
    nodes: Node[];
  }> = [];
  for (const component of pageComponents) {
    const nodes = renderer.render(component);

    const pagePath = path.relative(rootDir, component.filePath);
    const outPath =
      component.name === "index"
        ? path.resolve(outputDir, pagePath)
        : path.resolve(
            outputDir,
            path.dirname(pagePath),
            component.name,
            "index.html"
          );

    pages.push({ srcPath: component.filePath, pagePath, outPath, nodes });
  }

  const scriptBundles = extractScriptBundles(pages);

  for (const { relPath, code } of scriptBundles) {
    const outPath = path.resolve(outputDir, relPath);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, code);
    logger.info("Bundled script →", formatPath(outPath));
  }

  for (const { srcPath, outPath, nodes } of pages) {
    let html = toHTML(nodes);
    if (beautify) {
      initBeautifyDefaults(beautify, html);
      html = beautifyHTML(html, beautify);
    }

    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    logger.info("Rendered", formatPath(srcPath), "→", formatPath(outPath));
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
