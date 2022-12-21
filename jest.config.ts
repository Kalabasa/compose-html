export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["src", "node_modules"],
  roots: ["src"],
  setupFilesAfterEnv: ["./src/util/setup_tests.ts"],
};
