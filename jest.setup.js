// Polyfills for Jest environment
const { Buffer } = require('buffer');
const { TextEncoder, TextDecoder } = require('util');

// Ensure these are available globally before any imports
global.Buffer = Buffer;
global.process = require('process');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock import.meta for Vite
if (typeof global.importMeta === 'undefined') {
  global.importMeta = {
    env: {
      DEV: true,
      VITE_BASE_ENDPOINT: 'http://localhost:5000'
    }
  };
}

// Polyfill MessagePort for undici
if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = class MessagePort {
    constructor() {}
    postMessage() {}
    start() {}
    close() {}
  };
  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
    }
  };
}

// Polyfill BroadcastChannel for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Polyfill ReadableStream for undici/MSW
const { ReadableStream, TransformStream, WritableStream } = require('web-streams-polyfill');
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.WritableStream = WritableStream;

// Polyfill fetch API for MSW using undici
const { fetch, Request, Response, Headers } = require('undici');
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

