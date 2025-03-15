/** @type {import("jest").Config} */
const config = {
  // collectCoverage: true,
  collectCoverageFrom: ["client/src/**"],
  coveragePathIgnorePatterns: ["<rootDir>/client/src/_site/"],
  coverageThreshold: { global: { lines: 100, functions: 100 } },
  displayName: "frontend",
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/client/src/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/client/src/_site/"],
  transform: { "^.+\\.jsx?$": "babel-jest" },
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
};

export default config;
