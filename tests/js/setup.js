/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:8888',
    origin: 'http://localhost:8888',
    protocol: 'http:',
    host: 'localhost:8888',
    hostname: 'localhost',
    port: '8888',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob constructor
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts || [];
    this.options = options || {};
    this.size = 0;
    this.type = options?.type || '';
  }
};

// Mock File constructor
global.File = class File extends Blob {
  constructor(parts, name, options) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadstart = null;
    this.onloadend = null;
    this.onprogress = null;
  }

  readAsDataURL() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,mock-data';
      if (this.onload) this.onload();
    }, 0);
  }

  readAsText() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock text content';
      if (this.onload) this.onload();
    }, 0);
  }

  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort();
  }
};

// Mock canvas and 2D context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(['mock canvas data'], { type: 'image/png' }));
});

// Mock video element
HTMLVideoElement.prototype.play = jest.fn(() => Promise.resolve());
HTMLVideoElement.prototype.pause = jest.fn();
HTMLVideoElement.prototype.load = jest.fn();

// Mock audio element
HTMLAudioElement.prototype.play = jest.fn(() => Promise.resolve());
HTMLAudioElement.prototype.pause = jest.fn();
HTMLAudioElement.prototype.load = jest.fn();

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({
        getTracks: () => [
          {
            stop: jest.fn(),
            getSettings: () => ({ width: 1920, height: 1080 }),
          },
        ],
      })
    ),
    enumerateDevices: jest.fn(() =>
      Promise.resolve([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Mock Camera 1',
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Mock Camera 2',
        },
      ])
    ),
    getSupportedConstraints: jest.fn(() => ({
      width: true,
      height: true,
      facingMode: true,
    })),
  },
});

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('mock clipboard text')),
  },
});

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn((success) =>
      success({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10,
        },
      })
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn((id) => clearTimeout(id));

// Suppress React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
