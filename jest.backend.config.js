/** @type {import("jest").Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**",
    "config/**",
  ],
  coverageThreshold: { global: { lines: 98, functions: 98 } },
  displayName: "backend",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/controllers/**/*.test.js",
    "<rootDir>/helpers/**/*.test.js",
    "<rootDir>/middlewares/**/*.test.js",
    "<rootDir>/config/**/*.test.js",
  ],
  transform: {},
};

export default config;
