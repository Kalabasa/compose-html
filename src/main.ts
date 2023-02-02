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
  .option("--exclude <pattern...>")
  .option("--root <dir>")
  .parse();

const configPath = program.getOptionValue("config");
if (configPath) {
  const config = readConfig(configPath);
  program.setOptionValueWithSource("input", config.inputDir, "config");
  program.setOptionValueWithSource("output", config.outputDir, "config");
  program.setOptionValueWithSource("root", config.rootDir, "config");
  program.setOptionValueWithSource("exclude", config.exclude, "config");
}

const options = program.opts();
const inputDir = resolveDirOption(options.input);
const outputDir = resolveDirOption(options.output);
const rootDir = resolveDirOption(options.root);
const exclude =
  options.exclude &&
  options.exclude.map((p: string) => path.resolve(process.cwd(), p));

if (inputDir) {
  check(lstatSync(inputDir).isDirectory, `Bad input directory: ${inputDir}`);
}

build({
  inputDir,
  outputDir,
  rootDir,
  exclude,
});

function resolveDirOption(value: string) {
  return value && path.resolve(process.cwd(), value);
}

function readConfig(path: string) {
  return JSON.parse(readFileSync(path).toString()) as unknown as any;
}
