#!/usr/bin/env node
import { build } from "builder/builder";
import { program } from "commander";
import { lstatSync } from "fs";
import path from "node:path";
import { check, checkNotNull } from "util/preconditions";

program
  .requiredOption("-i, --input <dir>")
  .requiredOption("-o, --output <dir>")
  .option("--root <dir>")
  .parse();

const options = program.opts();
const inputDir = path.resolve(process.cwd(), options.input);
const outputDir = path.resolve(process.cwd(), options.output);
const rootDir = options.root && path.resolve(process.cwd(), options.root);

check(lstatSync(inputDir).isDirectory, `Bad input directory: ${inputDir}`);

build({
  inputDir,
  outputDir,
  rootDir,
});
