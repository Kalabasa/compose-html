"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const compiler_1 = require("compiler/compiler");
const dom_1 = require("dom/dom");
const glob_1 = __importDefault(require("glob"));
const js_beautify_1 = require("js-beautify");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const renderer_1 = require("renderer/renderer");
const log_1 = require("util/log");
const preconditions_1 = require("util/preconditions");
const bundler_1 = require("./bundler");
const DEFAULT_OPTIONS = {
    inputDir: process.cwd(),
    outputDir: node_path_1.default.resolve(process.cwd(), "out"),
    beautify: {
        extra_liners: [],
    },
};
const logger = (0, log_1.createLogger)(node_path_1.default.basename(__filename, ".ts"));
async function build(options = {}) {
    const { inputDir, outputDir, rootDir: rootDirOption, exclude, beautify, } = Object.assign({}, DEFAULT_OPTIONS, options);
    const rootDir = rootDirOption ?? inputDir;
    logger.info("✍  compose-html", "\n\nWorking directories", "\n   input:", formatPath(inputDir), "\n  output:", formatPath(outputDir), "\n    root:", formatPath(rootDir), "\n");
    /** @type {glob.IOptions} */
    const htmlGlobOptions = { nodir: true, ignore: exclude };
    const htmlFiles = glob_1.default.sync(node_path_1.default.resolve(inputDir, "**/*.html"), htmlGlobOptions);
    const nonHTMLFiles = glob_1.default
        .sync(node_path_1.default.resolve(rootDir, "**/*"), { nodir: true })
        .filter((f) => !htmlFiles.includes(f));
    logger.info(htmlFiles.length, "html files");
    logger.info(nonHTMLFiles.length, "non-html files");
    // compile HTML files
    const pageComponents = [];
    const componentMap = new Map();
    for (const filePath of htmlFiles) {
        const component = (0, compiler_1.compileFile)(filePath);
        if (component.page) {
            if (component.filePath.startsWith(rootDir)) {
                pageComponents.push(component);
            }
            else {
                logger.warn("Page component found outside root dir:", component.filePath);
            }
        }
        else {
            (0, preconditions_1.check)(!componentMap.has(component.name), `Component name must be unique. Found duplicate: ${component.name}` +
                `\n  at ${filePath}`);
            componentMap.set(component.name, component);
        }
    }
    logger.debug("Loaded components:", componentMap.keys());
    const renderer = new renderer_1.Renderer(componentMap);
    // copy non-HTML files
    for (const file of nonHTMLFiles) {
        const relPath = node_path_1.default.relative(rootDir, file);
        const outFilePath = node_path_1.default.resolve(outputDir, relPath);
        // skip if file is not newer than the copy
        if (node_fs_1.default.existsSync(outFilePath)) {
            const outFileStats = node_fs_1.default.statSync(outFilePath);
            if (outFileStats.isFile()) {
                const fileStats = node_fs_1.default.statSync(file);
                if (outFileStats.mtime > fileStats.mtime) {
                    continue;
                }
            }
        }
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(outFilePath), { recursive: true });
        node_fs_1.default.copyFileSync(file, outFilePath);
        logger.info("Copied", formatPath(file), "→", formatPath(outFilePath));
    }
    // render pages
    const pages = [];
    const absRootDir = node_path_1.default.resolve(rootDir);
    for (const component of pageComponents) {
        const pagePath = node_path_1.default.relative(rootDir, component.filePath);
        const srcPath = component.filePath;
        const outPath = component.name === "index"
            ? node_path_1.default.resolve(outputDir, pagePath)
            : node_path_1.default.resolve(outputDir, node_path_1.default.dirname(pagePath), component.name, "index.html");
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
    const scriptBundles = (0, bundler_1.extractScriptBundles)(pages);
    for (const { relPath, code } of scriptBundles) {
        const outPath = node_path_1.default.resolve(outputDir, relPath);
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(outPath), { recursive: true });
        node_fs_1.default.writeFileSync(outPath, code);
        logger.info("Bundled script →", formatPath(outPath));
    }
    for (const { srcPath, outPath, nodes } of pages) {
        let html = (0, dom_1.toHTML)(nodes);
        if (beautify) {
            initBeautifyDefaults(beautify, html);
            html = (0, js_beautify_1.html)(html, beautify);
        }
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(outPath), { recursive: true });
        node_fs_1.default.writeFileSync(outPath, html);
        logger.info("Rendered", formatPath(srcPath), "→", formatPath(outPath));
    }
}
exports.build = build;
function initBeautifyDefaults(beautify, pageHTML) {
    if (!beautify.indent_with_tabs && beautify.indent_size == undefined) {
        // detect indent
        const indentMatch = pageHTML.match(/\n(\s+)(?=\S)/);
        if (indentMatch) {
            const char = indentMatch[1][0];
            if (char === "\t") {
                beautify.indent_with_tabs = true;
            }
            else {
                beautify.indent_char = char;
                beautify.indent_size = indentMatch[1].length;
            }
        }
    }
}
function formatPath(p) {
    const cwd = process.cwd();
    const abs = node_path_1.default.resolve(p);
    if (abs.startsWith(cwd)) {
        return node_path_1.default.relative(cwd, p);
    }
    else {
        return abs;
    }
}
