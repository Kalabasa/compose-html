export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["src", "node_modules"],
  setupFilesAfterEnv: ["./src/util/setup_tests.ts"],
};
