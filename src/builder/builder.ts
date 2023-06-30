import { compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { toHTML } from "dom/dom";
import glob from "glob";
import { html as beautifyHTML, HTMLBeautifyOptions } from "js-beautify";
import fs from "node:fs";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { createLogger } from "util/log";
import { check } from "util/preconditions";
import { extractScriptBundles } from "./bundler";

type BuildOptions = {
  inputDir?: string;
  outputDir?: string;
  rootDir?: string;
  pagePattern?: string;
  exclude?: string[];
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

export async function build(options: BuildOptions = {}) {
  const {
    inputDir,
    outputDir,
    rootDir: rootDirOption,
    pagePattern,
    exclude,
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

  if (pagePattern) {
    logger.info("Page filter pattern:", pagePattern);
  }
  const checkPageFilter = pagePattern
    ? (pageFilePath: string) => pageFilePath.includes(pagePattern)
    : () => true;

  /** @type {glob.IOptions} */
  const htmlGlobOptions = { nodir: true, ignore: exclude };
  const htmlFiles = glob.sync(
    path.resolve(inputDir, "**/*.html"),
    htmlGlobOptions
  );
  const nonHTMLFiles = glob
    .sync(path.resolve(rootDir, "**/*"), { nodir: true })
    .filter((f) => !htmlFiles.includes(f));
  logger.info(htmlFiles.length, "html files");
  logger.info(nonHTMLFiles.length, "non-html files");

  // compile HTML files
  const pageComponents: Component[] = [];
  const componentMap = new Map<string, Component>();
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);

    if (component.page) {
      if (component.filePath.startsWith(rootDir)) {
        if (checkPageFilter(component.filePath)) {
          pageComponents.push(component);
        }
      } else {
        logger.warn(
          "Page component found outside root dir:",
          component.filePath
        );
      }
    } else {
      check(
        !componentMap.has(component.name),
        `Component name must be unique. Found duplicate: ${component.name}` +
          `\n  at ${filePath}`
      );
      componentMap.set(component.name, component);
    }
  }

  logger.debug("Loaded components:", componentMap.keys());
  const renderer = new Renderer(componentMap);

  // copy non-HTML files
  for (const file of nonHTMLFiles) {
    const relPath = path.relative(rootDir, file);
    const outFilePath = path.resolve(outputDir, relPath);

    // skip if file is not newer than the copy
    if (fs.existsSync(outFilePath)) {
      const outFileStats = fs.statSync(outFilePath);
      if (outFileStats.isFile()) {
        const fileStats = fs.statSync(file);
        if (outFileStats.mtime > fileStats.mtime) {
          continue;
        }
      }
    }

    fs.mkdirSync(path.dirname(outFilePath), { recursive: true });
    fs.copyFileSync(file, outFilePath);
    logger.info("Copied", formatPath(file), "→", formatPath(outFilePath));
  }

  // render pages
  const pages: Array<{
    srcPath: string;
    pagePath: string;
    outPath: string;
    nodes: Node[];
  }> = [];

  const absRootDir = path.resolve(rootDir);

  for (const component of pageComponents) {
    let pagePath: string, outPath: string;
    const srcPath = component.filePath;

    if (component.page?.path) {
      // custom path specified by page (<html page="/my/path.html">)
      pagePath = path.normalize("./" + component.page.path);
      outPath = path.resolve(outputDir, pagePath);
    } else {
      // automatic path determined by file structure
      pagePath = path.relative(rootDir, srcPath);
      if (component.name === "index") {
        outPath = path.resolve(outputDir, pagePath);
      } else {
        // for pretty URLs, "page.html" → "page/index.html"
        outPath = path.resolve(
          outputDir,
          path.dirname(pagePath),
          component.name,
          "index.html"
        );
      }
    }

    const nodes = await renderer.render(component, {
      rootDir: absRootDir,
      outputDir,
    });

    pages.push({
      srcPath,
      pagePath,
      outPath,
      nodes,
    });
  }

  const scriptBundles = extractScriptBundles(
    pages,
    2,
    "/scripts/",
    componentMap.values()
  );

  for (const { src, code } of scriptBundles) {
    const outPath = path.resolve(outputDir, "." + src);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, code);
    logger.info("Bundled script →", formatPath(outPath));
  }

  for (const { srcPath, outPath, nodes } of pages) {
    // Hack: This is the only place to insert the doctype, as it’s not a node
    let html = "<!DOCTYPE html>" + toHTML(nodes);
    if (beautify) {
      initBeautifyDefaults(beautify, html);
      html = beautifyHTML(html, beautify);
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
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
