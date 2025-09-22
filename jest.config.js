export default {
  coverageReporters: ['text'],
  projects: [
    {
      displayName: 'client',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'jsdom',
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: './src/client/tsconfig.json',
        }],
      },
      roots: ['<rootDir>/src/client/tests'],
      testMatch: ['<rootDir>/src/client/tests/**/*.test.{ts,tsx}'],
      collectCoverageFrom: [
        'src/client/src/**/*.{ts,tsx}',
        '!src/client/src/**/*.d.ts',
        '!src/client/src/main.tsx',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/client/tests/setup.ts'],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: './src/server/tsconfig.json',
        }],
      },
      roots: ['<rootDir>/src/server/tests'],
      testMatch: ['<rootDir>/src/server/tests/**/*.test.ts'],
      collectCoverageFrom: [
        'src/server/src/**/*.ts',
        '!src/server/src/**/*.d.ts',
        '!src/server/src/main.ts',
      ],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  ],
};