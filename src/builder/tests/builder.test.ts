import { build } from "builder/builder";
import { glob } from "glob";
import { lstatSync, mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";

describe("build", () => {
  it.each(["project1"])("builds %s", (projectDir) => {
    const inputDir = resolve(__dirname, "data", projectDir);
    const outputDir = mkdtempSync(resolve(tmpdir(), "jest-builder-"));
    try {
      build({
        inputDir,
        outputDir,
      });

      expect(filesToString(outputDir)).toMatchSnapshot();
    } finally {
      rm(outputDir, { recursive: true, force: true });
    }
  });
});

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

  return result.trimEnd();
}
