const esbuild = require("esbuild");
const package = require("./package.json");

esbuild.build({
  entryPoints: ["dist/cjs/main.js"],
  bundle: true,
  external: [...Object.keys(package.dependencies), ...Object.keys(package.devDependencies)],
  platform: "node",
  outfile: "dist/bin/main.js",
});