"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = require("builder/builder");
const glob_1 = require("glob");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
describe("builder", () => {
    jest.setTimeout(20 * 1000);
    const topDir = (0, node_path_1.resolve)(__dirname, "../../..");
    const projects = ["project1"];
    const exclude = ["**/dont-process.html"];
    it.each(projects)("builds %s", async (projectDir) => {
        const inputDir = getInputDir(projectDir);
        await withTempDir(async (outputDir) => {
            await (0, builder_1.build)({
                inputDir,
                outputDir,
                exclude,
            });
            expect(filesToString(outputDir)).toMatchSnapshot();
        });
    });
    it.each(projects)("builds %s via cli", async (projectDir) => {
        const inputDir = getInputDir(projectDir);
        await inDir(topDir, async () => {
            run("yarn install");
            run("yarn build");
            await withTempDir((outputDir) => {
                run("node dist/bin/main.js" +
                    ` -i ${(0, node_path_1.relative)(process.cwd(), inputDir)}` +
                    ` -o ${outputDir}` +
                    ` --exclude ${exclude.map((p) => `'${p}' `)}`);
                expect(filesToString(outputDir)).toMatchSnapshot();
            });
        });
    });
    it.each(projects)("builds %s via config file", async (projectDir) => {
        const inputDir = getInputDir(projectDir);
        await inDir(topDir, async () => {
            run("yarn install");
            run("yarn build");
            await withTempDir(async (outputDir) => await withTempFile(JSON.stringify({
                inputDir,
                outputDir,
                exclude,
            }), (configFile) => {
                run(`node dist/bin/main.js --config ${configFile}`);
                expect(filesToString(outputDir)).toMatchSnapshot();
            }));
        });
    });
});
function run(command) {
    console.log("> " + command);
    return (0, node_child_process_1.execSync)(command, { stdio: "inherit" });
}
async function inDir(dir, fn) {
    const cwd = process.cwd();
    process.chdir(dir);
    try {
        await fn();
    }
    finally {
        process.chdir(cwd);
    }
}
async function withTempDir(fn) {
    const tempDir = makeTempDir();
    try {
        await fn(tempDir);
    }
    finally {
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    }
}
async function withTempFile(data, fn) {
    const file = (0, node_path_1.resolve)("jest-builder-tmpfile-" + Date.now().toString(36));
    try {
        (0, node_fs_1.writeFileSync)(file, data);
        fn(file);
    }
    finally {
        await (0, promises_1.rm)(file, { force: true });
    }
}
function getInputDir(projectDir) {
    return (0, node_path_1.resolve)(__dirname, "data", projectDir);
}
function makeTempDir() {
    return (0, node_fs_1.mkdtempSync)((0, node_path_1.resolve)((0, node_os_1.tmpdir)(), "jest-builder-"));
}
function filesToString(rootDir) {
    let result = "";
    const files = glob_1.glob.sync((0, node_path_1.resolve)(rootDir, "**"));
    for (const filePath of files) {
        if (!(0, node_fs_1.lstatSync)(filePath).isFile())
            continue;
        result += "./";
        result += (0, node_path_1.relative)(rootDir, filePath);
        result += ":\n";
        result += (0, node_fs_1.readFileSync)(filePath);
        result += "\n\n";
    }
    return result.trimEnd();
}
