import baseConfig from '../../jest.config.base.js';

export default {
  ...baseConfig,
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
};