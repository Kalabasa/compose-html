import { build } from "builder/builder";
import { glob } from "glob";
import { lstatSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { relative, resolve } from "node:path";

describe("builder", () => {
  jest.setTimeout(20 * 1000);

  const topDir = resolve(__dirname, "../../..");
  const projects = ["project1", "project2"];
  const exclude = ["**/dont-process.html"];

  beforeAll(() =>
    inDir(topDir, () => {
      run("npm install");
    })
  );

  it.each(projects)("builds %s via api", async (projectDir) => {
    const inputDir = getInputDir(projectDir);
    await inDir(topDir, () =>
      withTempDir(async (outputDir) => {
        await build({
          inputDir,
          outputDir,
          exclude,
        });
        expect(filesToString(outputDir)).toMatchSnapshot();
      })
    );
  });

  it.each(projects)("builds %s via cli", async (projectDir) => {
    const inputDir = getInputDir(projectDir);
    await inDir(topDir, () =>
      withTempDir((outputDir) => {
        run(
          "node dist/bin/main.js" +
            ` -i ${relative(process.cwd(), inputDir)}` +
            ` -o ${outputDir}` +
            ` --exclude ${exclude.map((p) => `'${p}' `)}`
        );
        expect(filesToString(outputDir)).toMatchSnapshot();
      })
    );
  });

  it.each(projects)("builds %s via config file", async (projectDir) => {
    const inputDir = getInputDir(projectDir);
    await inDir(topDir, () =>
      withTempDir((outputDir) =>
        withTempFile(
          JSON.stringify({
            inputDir,
            outputDir,
            exclude,
          }),
          (configFile) => {
            run(`node dist/bin/main.js --config ${configFile}`);
            expect(filesToString(outputDir)).toMatchSnapshot();
          }
        )
      )
    );
  });

  it.each(projects)(
    "builds %s via config file with cli override",
    async (projectDir) => {
      const inputDir = getInputDir(projectDir);
      await inDir(topDir, () =>
        withTempDir((outputDir) =>
          withTempFile(
            JSON.stringify({
              inputDir,
              outputDir,
              exclude,
            }),
            (configFile) => {
              run(`node dist/bin/main.js --config ${configFile} -p about`);
              expect(filesToString(outputDir)).toMatchSnapshot();
            }
          )
        )
      );
    }
  );
});

function run(command: string) {
  console.log("> " + command);
  return execSync(command, { stdio: "inherit" });
}

async function inDir(dir: string, fn: Function) {
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    await fn();
  } finally {
    process.chdir(cwd);
  }
}

async function withTempDir(
  fn: (dir: string) => void | Promise<void>
): Promise<void> {
  const tempDir = makeTempDir();
  try {
    await fn(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function withTempFile(data: string, fn: (file: string) => void) {
  const file = resolve("jest-builder-tmpfile-" + Date.now().toString(36));
  try {
    writeFileSync(file, data);
    fn(file);
  } finally {
    await rm(file, { force: true });
  }
}

function getInputDir(projectDir: string) {
  return resolve(__dirname, "data", projectDir);
}

function makeTempDir() {
  return mkdtempSync(resolve(tmpdir(), "jest-builder-"));
}

function filesToString(rootDir: string): string {
  let result = "";

  const files = glob.sync(resolve(rootDir, "**"));
  for (const filePath of files) {
    if (!lstatSync(filePath).isFile()) continue;
    result += "./";
    result += relative(rootDir, filePath);
    result += ":\n";
    result += readFileSync(filePath);
    result += "\n\n";
  }

  return "\n" + result.trim() + "\n";
}
