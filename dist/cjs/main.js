#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = require("builder/builder");
const commander_1 = require("commander");
const fs_1 = require("fs");
const node_path_1 = __importDefault(require("node:path"));
const preconditions_1 = require("util/preconditions");
commander_1.program
    .option("--config <path>", "Path to configuration file")
    .option("-i, --input <dir>")
    .option("-o, --output <dir>")
    .option("--exclude <pattern...>")
    .option("--root <dir>")
    .parse();
const configPath = commander_1.program.getOptionValue("config");
if (configPath) {
    const config = readConfig(configPath);
    commander_1.program.setOptionValueWithSource("input", config.inputDir, "config");
    commander_1.program.setOptionValueWithSource("output", config.outputDir, "config");
    commander_1.program.setOptionValueWithSource("root", config.rootDir, "config");
    commander_1.program.setOptionValueWithSource("exclude", config.exclude, "config");
}
const options = commander_1.program.opts();
const inputDir = resolveDirOption(options.input);
const outputDir = resolveDirOption(options.output);
const rootDir = resolveDirOption(options.root);
const exclude = options.exclude &&
    options.exclude.map((p) => node_path_1.default.resolve(process.cwd(), p));
if (inputDir) {
    (0, preconditions_1.check)((0, fs_1.lstatSync)(inputDir).isDirectory, `Bad input directory: ${inputDir}`);
}
(0, builder_1.build)({
    inputDir,
    outputDir,
    rootDir,
    exclude,
});
function resolveDirOption(value) {
    return value && node_path_1.default.resolve(process.cwd(), value);
}
function readConfig(path) {
    return JSON.parse((0, fs_1.readFileSync)(path).toString());
}
