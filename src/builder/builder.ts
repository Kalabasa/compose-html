import { compileFile } from "compiler/compiler";
import { Component } from "compiler/component";
import { toHTML } from "dom/dom";
import glob from "glob";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Renderer } from "renderer/renderer";
import { html as beautifyHTML, HTMLBeautifyOptions } from "js-beautify";

type BuildOptions = {
  inputDir?: string;
  outputDir?: string;
  beautify?: HTMLBeautifyOptions | false;
};

const DEFAULT_OPTIONS: Required<BuildOptions> = {
  inputDir: process.cwd(),
  outputDir: path.resolve(process.cwd(), "out"),
  beautify: {
    extra_liners: [],
  },
};

export function build(options: BuildOptions = {}) {
  const { inputDir, outputDir, beautify } = Object.assign(
    {},
    DEFAULT_OPTIONS,
    options
  );

  const componentMap = new Map<string, Component>();

  const htmlFiles = glob.sync(path.resolve(inputDir, "**/*.html"));
  for (const filePath of htmlFiles) {
    const component = compileFile(filePath);
    componentMap.set(component.name, component);
  }

  const renderer = new Renderer(componentMap);

  for (const component of componentMap.values()) {
    if (!component.isPage) continue;

    let pageHTML = toHTML(renderer.render(component));

    if (beautify) {
      if (beautify.indent_size == undefined) {
        // detect indent
      }
      pageHTML = beautifyHTML(pageHTML, beautify);
    }

    const pagePath = path.relative(inputDir, component.filePath);
    const outFilePath = path.resolve(outputDir, pagePath);

    mkdirSync(path.dirname(outFilePath), { recursive: true });
    writeFileSync(outFilePath, pageHTML);
  }
}
