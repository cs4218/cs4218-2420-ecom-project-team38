import backendConfig from "./jest.backend.config.js";
import frontendConfig from "./jest.frontend.config.js";

/** @type {import("jest").Config} */
const config = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      functions: 90,
      lines: 90,
    },
  },
  testTimeout: 10000,
  projects: [{ ...backendConfig }, { ...frontendConfig }],
};

export default config;
