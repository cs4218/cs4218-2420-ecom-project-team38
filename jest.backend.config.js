/** @type {import("jest").Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**"],
  coverageThreshold: { global: { lines: 100, functions: 100 } },
  displayName: "backend",
  testEnvironment: "node",
  testMatch: ["<rootDir>/controllers/**/*.test.js"],
  transform: {},
};

export default config;
