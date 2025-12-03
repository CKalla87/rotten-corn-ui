// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { beforeAll, afterEach, afterAll } from '@jest/globals';

// Mock axios service to avoid import.meta issues
jest.mock('@services/axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    default: axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      withCredentials: true
    })
  };
});

// Mock Utils service to avoid import.meta issues
jest.mock('@services/utils/utils.service', () => ({
  Utils: {
    generateString: jest.fn((length: number) => {
      return Array(length).fill('a').join('');
    }),
    avatarColor: jest.fn(() => '#f33e58'),
    generateAvatar: jest.fn(() => 'data:image/png;base64,mock'),
    appEnvironment: jest.fn(() => 'DEV'),
    appImageUrl: jest.fn(() => 'https://mock-image-url.com'),
    mapSettingsDropdownItems: jest.fn(() => []),
    dispatchUser: jest.fn(),
    clearStore: jest.fn(),
    dispatchNotification: jest.fn(),
    dispatchClearNotification: jest.fn(),
  }
}));

// Conditionally load MSW only if needed
// Some tests don't need MSW, so we'll try to load it but handle errors gracefully
type MSWServer = { listen: () => void; resetHandlers: () => void; close: () => void };
let server: MSWServer | null = null;
try {
  // Use jest.requireActual for consistency with Jest's module system
  const serverModule = (jest.requireActual as (module: string) => { server: MSWServer })('@mocks/server');
  server = serverModule.server;
  
  beforeAll(() => {
    // Establish requests interception layer before all tests.
    if (server) {
      server.listen();
    }
  });

  afterEach(() => {
    if (server) {
      server.resetHandlers();
    }
  });

  afterAll(() => {
    // Clean up after all tests are done, preventing this
    // interception layer from affecting irrelevant tests.
    if (server) {
      server.close();
    }
  });
} catch {
  // MSW not available or failed to load - skip setup
  // This allows tests that don't need MSW to run
  console.warn('MSW server not available, skipping MSW setup');
}

