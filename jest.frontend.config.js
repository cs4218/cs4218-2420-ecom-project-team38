/** @type {import("jest").Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: ["client/src/**"],
  coveragePathIgnorePatterns: ["<rootDir>/client/src/_site/"],
  coverageThreshold: { global: { lines: 98, functions: 98 } },
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
