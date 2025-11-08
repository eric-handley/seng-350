export default {
  coverageReporters: ['text'],
  projects: [
    {
      displayName: 'client',
      preset: 'ts-jest/presets/js-with-ts-esm',
      testEnvironment: 'jsdom',
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Keep ESM paths without .js extension working
        '^(\\.{1,2}/.*)\\.js$': '$1',
        // Ensure a single React instance is used across the workspace
        '^react$': '<rootDir>/node_modules/react',
        '^react-dom$': '<rootDir>/node_modules/react-dom',
        '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime.js',
        '^react-dom/client$': '<rootDir>/node_modules/react-dom/client',
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: './src/client/tsconfig.json',
        }],
      },
      roots: ['<rootDir>/src/client/tests'],
      testMatch: ['<rootDir>/src/client/tests/**/*.test.{ts,tsx}'],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
      ],
      collectCoverageFrom: [
        'src/client/src/**/*.{ts,tsx}',
        '!src/client/src/**/*.d.ts',
        '!src/client/src/main.tsx',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/client/tests/setup.ts'],
    },
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      globalTeardown: '<rootDir>/src/server/tests/global-teardown.ts',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: './src/server/tsconfig.json',
        }],
      },
      roots: ['<rootDir>/src/server/tests'],
      testMatch: ['<rootDir>/src/server/tests/**/*.test.ts'],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
      ],
      collectCoverageFrom: [
        'src/server/src/**/*.ts',
        '!src/server/src/**/*.d.ts',
        '!src/server/src/**/*.test.ts',
        '!src/server/src/main.ts',
      ],
    },
  ],
};
