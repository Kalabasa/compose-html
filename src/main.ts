import { program } from "commander";

program.option("-i, --input <dir>").option("-o, --output <dir>").parse();

const options = program.opts();
const inputDir = options.input;
const outputDir = options.output;

console.log({ inputDir, outputDir });
