import '@testing-library/jest-dom';

// Mock crypto.randomUUID for Node.js
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
globalThis.crypto.randomUUID = jest.fn(() => 'test-uuid-' + Math.random());