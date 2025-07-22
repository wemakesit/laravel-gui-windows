/**
 * PWA Service Tests
 * Tests for PWA functionality, offline capabilities, and service worker integration
 */

// Mock IndexedDB for testing
global.indexedDB = require('fake-indexeddb');
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

// Mock navigator for PWA features
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: { state: 'activated' },
      addEventListener: jest.fn(),
      postMessage: jest.fn()
    })),
    ready: Promise.resolve({
      active: { state: 'activated' },
      addEventListener: jest.fn(),
      postMessage: jest.fn()
    })
  },
  writable: true
});

Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia for install prompt detection
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

describe('PWA Service', () => {
  let PWAService;
  let pwaService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true
    });

    // Import PWAService after mocks are set up
    PWAService = require('../../resources/js/Services/PWAService').default;
    pwaService = new PWAService();
  });

  describe('Service Worker Registration', () => {
    test('should register service worker successfully', async () => {
      await pwaService.init();
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    test('should handle service worker registration failure', async () => {
      navigator.serviceWorker.register.mockRejectedValueOnce(new Error('Registration failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await pwaService.init();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Service Worker registration failed')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Install Prompt Handling', () => {
    test('should detect install prompt availability', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' }))
      };

      // Simulate beforeinstallprompt event
      pwaService.handleBeforeInstallPrompt(mockEvent);
      
      expect(pwaService.canInstall()).toBe(true);
    });

    test('should handle install prompt acceptance', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' }))
      };

      pwaService.handleBeforeInstallPrompt(mockEvent);
      
      const result = await pwaService.installApp();
      
      expect(result).toBe(true);
      expect(mockEvent.prompt).toHaveBeenCalled();
    });

    test('should handle install prompt dismissal', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'dismissed' }))
      };

      pwaService.handleBeforeInstallPrompt(mockEvent);
      
      const result = await pwaService.installApp();
      
      expect(result).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('pwa_install_dismissed', 'true');
    });
  });

  describe('Offline Detection', () => {
    test('should detect online status', () => {
      expect(pwaService.isOnline()).toBe(true);
    });

    test('should detect offline status', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });

      expect(pwaService.isOnline()).toBe(false);
    });

    test('should handle online/offline events', () => {
      const onlineCallback = jest.fn();
      const offlineCallback = jest.fn();

      pwaService.onOnline(onlineCallback);
      pwaService.onOffline(offlineCallback);

      // Simulate offline event
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      window.dispatchEvent(new Event('offline'));
      
      expect(offlineCallback).toHaveBeenCalled();

      // Simulate online event
      Object.defineProperty(global.navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      window.dispatchEvent(new Event('online'));
      
      expect(onlineCallback).toHaveBeenCalled();
    });
  });

  describe('Estimate Caching', () => {
    test('should cache estimate data', async () => {
      const estimateData = {
        id: 'test-estimate-1',
        customerInfo: { name: 'Test Customer' },
        windows: [{ type: 'Window 1' }],
        selectedCaveats: {},
        timestamp: Date.now(),
        synced: false
      };

      await pwaService.cacheEstimate(estimateData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached_estimates',
        expect.stringContaining('test-estimate-1')
      );
    });

    test('should retrieve cached estimates', () => {
      const mockEstimates = [
        {
          id: 'test-estimate-1',
          customerInfo: { name: 'Test Customer' },
          windows: [],
          selectedCaveats: {},
          timestamp: Date.now(),
          synced: false
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEstimates));

      const estimates = pwaService.getLocalEstimatesSync();

      expect(estimates).toEqual(mockEstimates);
      expect(localStorage.getItem).toHaveBeenCalledWith('cached_estimates');
    });

    test('should handle corrupted cache data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const estimates = pwaService.getLocalEstimatesSync();

      expect(estimates).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Sync Functionality', () => {
    test('should not sync when offline', async () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await pwaService.syncEstimates();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot sync - offline')
      );

      consoleSpy.mockRestore();
    });

    test('should sync unsynced estimates when online', async () => {
      const mockEstimates = [
        {
          id: 'test-estimate-1',
          customerInfo: { name: 'Test Customer' },
          windows: [],
          selectedCaveats: {},
          timestamp: Date.now(),
          synced: false
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEstimates));

      // Mock fetch for sync
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      );

      await pwaService.syncEstimates();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/estimates/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('App Installation Detection', () => {
    test('should detect standalone mode', () => {
      window.matchMedia.mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(pwaService.isInstalled()).toBe(true);
    });

    test('should detect iOS standalone mode', () => {
      Object.defineProperty(global.navigator, 'standalone', {
        value: true,
        writable: true
      });

      expect(pwaService.isInstalled()).toBe(true);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache data', () => {
      pwaService.clearCache();

      expect(localStorage.removeItem).toHaveBeenCalledWith('cached_estimates');
      expect(localStorage.removeItem).toHaveBeenCalledWith('last_sync');
    });

    test('should reset install prompt', () => {
      pwaService.resetInstallPrompt();

      expect(localStorage.removeItem).toHaveBeenCalledWith('pwa_install_dismissed');
      expect(localStorage.removeItem).toHaveBeenCalledWith('pwa_install_dismissed_time');
    });
  });

  describe('Status Reporting', () => {
    test('should return correct PWA status', () => {
      const status = pwaService.getStatus();

      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isInstalled');
      expect(status).toHaveProperty('canInstall');
      expect(status).toHaveProperty('serviceWorkerReady');
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.isInstalled).toBe('boolean');
      expect(typeof status.canInstall).toBe('boolean');
      expect(typeof status.serviceWorkerReady).toBe('boolean');
    });

    test('should track last sync time', () => {
      const mockDate = new Date('2023-01-01T00:00:00Z');
      localStorageMock.getItem.mockReturnValue(mockDate.getTime().toString());

      const status = pwaService.getStatus();

      expect(status.lastSync).toEqual(mockDate);
    });
  });
});
