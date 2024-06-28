#!/usr/bin/env node
import { build } from "builder/builder";
import { program } from "commander";
import { lstatSync, readFileSync } from "fs";
import path from "node:path";
import { check } from "util/preconditions";

program
  .option("--config <path>", "Path to configuration file")
  .option("-i, --input <dir>")
  .option("-o, --output <dir>")
  .option("-p, --page-pattern <pattern>")
  .option("--plain-html <pattern...>")
  .option("--ignore <pattern...>")
  .option("--root <dir>")
  .parse();

const configPath = program.getOptionValue("config");
if (configPath) {
  const config = readConfig(configPath);
  setOptionFromConfigValue("input", config.inputDir);
  setOptionFromConfigValue("output", config.outputDir);
  setOptionFromConfigValue("root", config.rootDir);
  setOptionFromConfigValue("pagePattern", config.pagePattern);
  setOptionFromConfigValue("plainHtml", config.plainHtml);
  setOptionFromConfigValue("ignore", config.ignore);
}

const options = program.opts();
const inputDir = resolveDirOption(options.input);
const outputDir = resolveDirOption(options.output);
const rootDir = resolveDirOption(options.root);
const pagePattern = options.pagePattern;
const plainHtml =
  options.plainHtml &&
  options.plainHtml.map((p: string) => path.resolve(process.cwd(), p));
const ignore =
  options.ignore &&
  options.ignore.map((p: string) => path.resolve(process.cwd(), p));

if (inputDir) {
  check(lstatSync(inputDir).isDirectory, `Bad input directory: ${inputDir}`);
}

build({
  inputDir,
  outputDir,
  rootDir,
  pagePattern,
  plainHtml,
  ignore,
});

function resolveDirOption(value: string) {
  return value && path.resolve(process.cwd(), value);
}

function readConfig(path: string) {
  return JSON.parse(readFileSync(path).toString()) as unknown as any;
}

function setOptionFromConfigValue(key: string, configValue: string) {
  if (program.getOptionValueSource(key) != "cli") {
    program.setOptionValueWithSource(key, configValue, "config");
  }
}
