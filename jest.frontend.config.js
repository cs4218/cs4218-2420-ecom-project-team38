/** @type {import("jest").Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: ["client/src/**/*.test.{js,jsx}"],
  coverageThreshold: { global: { lines: 100, functions: 100 } },
  displayName: "frontend",
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/client/src/**/*.{spec,test}.{js,jsx}"],
  testPathIgnorePatterns: ["_site"],
  transform: { "^.+\\.jsx?$": "babel-jest" },
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
};

export default config;
