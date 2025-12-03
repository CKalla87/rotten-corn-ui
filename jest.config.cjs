// Path mappings from tsconfig.app.json
const moduleNameMapper = {
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  '^@services/(.*)$': '<rootDir>/src/services/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@pages/(.*)$': '<rootDir>/src/pages/$1',
  '^@mocks/(.*)$': '<rootDir>/src/mocks/$1',
  '^@assets/(.*)$': '<rootDir>/src/assets/$1',
  '^@colors/(.*)$': '<rootDir>/src/colors/$1',
  '^@redux/(.*)$': '<rootDir>/src/redux-toolkit/$1',
  '^@root/(.*)$': '<rootDir>/src/$1'
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    '\\.svg$': '<rootDir>/src/__mocks__/fileMock.js',
    '^@services/axios$': '<rootDir>/src/__mocks__/services/axios.ts',
    ...moduleNameMapper,
  },
  globals: {
    'import.meta': {
      env: {
        DEV: true,
        VITE_BASE_ENDPOINT: 'http://localhost:5000'
      }
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      jsx: 'react-jsx',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@mswjs|msw|until-async|@mswjs/interceptors))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  testTimeout: 10000,
};
