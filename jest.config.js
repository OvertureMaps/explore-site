const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.svg\\?react$': '<rootDir>/__mocks__/svgMock.js',
  },
  watchman: false,
};

module.exports = createJestConfig(config);
