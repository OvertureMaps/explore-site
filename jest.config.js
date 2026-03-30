const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  // .mjs files use Node's built-in test runner (node:test) rather than Jest — exclude them here
  testPathIgnorePatterns: ['/node_modules/', '\\.mjs$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.svg\\?react$': '<rootDir>/__mocks__/svgMock.js',
  },
  watchman: false,
};

module.exports = createJestConfig(config);
