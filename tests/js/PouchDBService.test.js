/**
 * PouchDB Service Tests
 * Tests for PouchDB integration, offline functionality, and CouchDB sync
 */

// Mock PouchDB
const mockPouchDB = {
  put: jest.fn(),
  get: jest.fn(),
  allDocs: jest.fn(),
  destroy: jest.fn(),
  sync: jest.fn(),
  replicate: {
    from: jest.fn(),
    to: jest.fn()
  }
};

// Mock PouchDB constructor
jest.mock('pouchdb', () => {
  return jest.fn().mockImplementation(() => mockPouchDB);
});

// Mock environment variables
const mockEnv = {
  VITE_COUCHDB_CONFIG_URL: 'http://localhost:5984/window_config',
  VITE_COUCHDB_ESTIMATES_URL: 'http://localhost:5984/window_estimates'
};

// Mock import.meta.env
global.importMeta = {
  env: mockEnv
};

// Mock navigator
Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true
});

// Mock window events
const mockEventListeners = {};
global.window = {
  addEventListener: jest.fn((event, callback) => {
    mockEventListeners[event] = callback;
  }),
  removeEventListener: jest.fn()
};

describe('PouchDBService', () => {
  let PouchDBService;
  let pouchDBService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true
    });

    // Reset mock implementations
    mockPouchDB.put.mockResolvedValue({ ok: true, id: 'test', rev: '1-abc' });
    mockPouchDB.get.mockResolvedValue({ _id: 'test', _rev: '1-abc' });
    mockPouchDB.allDocs.mockResolvedValue({ rows: [] });
    mockPouchDB.destroy.mockResolvedValue({ ok: true });
    mockPouchDB.sync.mockReturnValue({
      on: jest.fn(),
      cancel: jest.fn()
    });
    mockPouchDB.replicate.from.mockResolvedValue({ ok: true });
    mockPouchDB.replicate.to.mockResolvedValue({ ok: true });

    // Import PouchDBService after mocks are set up
    PouchDBService = require('../../resources/js/Services/PouchDBService').default;
    pouchDBService = new PouchDBService();
  });

  describe('Initialization', () => {
    test('should initialize local databases', () => {
      expect(require('pouchdb')).toHaveBeenCalledWith('window_config');
      expect(require('pouchdb')).toHaveBeenCalledWith('window_estimates');
    });

    test('should set up event listeners for online/offline', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test('should start sync if online', () => {
      expect(mockPouchDB.sync).toHaveBeenCalled();
    });
  });

  describe('Sync Status Management', () => {
    test('should return current sync status', () => {
      const status = pouchDBService.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('syncInProgress');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('docsRead');
      expect(status).toHaveProperty('docsWritten');
      expect(status).toHaveProperty('docWriteFailures');
      expect(status).toHaveProperty('errors');
    });

    test('should allow subscribing to sync status changes', () => {
      const callback = jest.fn();
      const unsubscribe = pouchDBService.onSyncStatusChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Online/Offline Handling', () => {
    test('should handle online event', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Trigger online event
      Object.defineProperty(global.navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      if (mockEventListeners.online) {
        mockEventListeners.online();
      }

      const status = pouchDBService.getSyncStatus();
      expect(status.isOnline).toBe(true);
    });

    test('should handle offline event', () => {
      // Trigger offline event
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      if (mockEventListeners.offline) {
        mockEventListeners.offline();
      }

      const status = pouchDBService.getSyncStatus();
      expect(status.isOnline).toBe(false);
    });
  });

  describe('Window Configuration Management', () => {
    test('should save window configuration', async () => {
      const config = {
        type: 'window_type',
        name: 'Test Window',
        price: 100,
        description: 'Test description'
      };

      const result = await pouchDBService.saveWindowConfig(config);

      expect(mockPouchDB.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...config,
          _id: expect.stringMatching(/^config_/),
          updatedAt: expect.any(String)
        })
      );
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('_rev');
    });

    test('should get all window configurations', async () => {
      mockPouchDB.allDocs.mockResolvedValue({
        rows: [
          {
            doc: {
              _id: 'config_1',
              type: 'window_type',
              name: 'Test Window',
              price: 100
            }
          }
        ]
      });

      const configs = await pouchDBService.getWindowConfigs();

      expect(mockPouchDB.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        startkey: 'config_',
        endkey: 'config_\ufff0'
      });
      expect(configs).toHaveLength(1);
      expect(configs[0]).toHaveProperty('name', 'Test Window');
    });
  });

  describe('Estimate Management', () => {
    test('should save estimate', async () => {
      const estimate = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '01234567890',
        customerAddress: '123 Test Street',
        windows: [],
        totalPrice: 500,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      const result = await pouchDBService.saveEstimate(estimate);

      expect(mockPouchDB.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...estimate,
          _id: expect.stringMatching(/^estimate_/),
          updatedAt: expect.any(String)
        })
      );
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('_rev');
    });

    test('should get estimate by ID', async () => {
      const mockEstimate = {
        _id: 'estimate_123',
        _rev: '1-abc',
        customerName: 'Test Customer',
        totalPrice: 500
      };

      mockPouchDB.get.mockResolvedValue(mockEstimate);

      const result = await pouchDBService.getEstimate('estimate_123');

      expect(mockPouchDB.get).toHaveBeenCalledWith('estimate_123');
      expect(result).toEqual(mockEstimate);
    });

    test('should return null for non-existent estimate', async () => {
      mockPouchDB.get.mockRejectedValue({ status: 404 });

      const result = await pouchDBService.getEstimate('non-existent');

      expect(result).toBeNull();
    });

    test('should get all estimates', async () => {
      mockPouchDB.allDocs.mockResolvedValue({
        rows: [
          {
            doc: {
              _id: 'estimate_1',
              customerName: 'Customer 1',
              totalPrice: 500
            }
          }
        ]
      });

      const estimates = await pouchDBService.getEstimates();

      expect(mockPouchDB.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        startkey: 'estimate_',
        endkey: 'estimate_\ufff0'
      });
      expect(estimates).toHaveLength(1);
      expect(estimates[0]).toHaveProperty('customerName', 'Customer 1');
    });
  });

  describe('Sync Operations', () => {
    test('should not start sync when offline', async () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });

      const offlineService = new PouchDBService();
      
      // Sync should not be called for offline service
      expect(mockPouchDB.sync).toHaveBeenCalledTimes(2); // Only from the first service instance
    });

    test('should handle missing CouchDB URLs', async () => {
      // Clear environment variables
      Object.defineProperty(import.meta, 'env', {
        value: {},
        writable: true
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const serviceWithoutUrls = new PouchDBService();
      await serviceWithoutUrls.startSync();

      expect(consoleSpy).toHaveBeenCalledWith('CouchDB URLs not configured, sync disabled');
      
      consoleSpy.mockRestore();
    });

    test('should force sync and recreate databases', async () => {
      await pouchDBService.forceSync();

      expect(mockPouchDB.destroy).toHaveBeenCalledTimes(2); // config and estimates DBs
      expect(mockPouchDB.replicate.from).toHaveBeenCalledTimes(2);
    });

    test('should throw error when forcing sync offline', async () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      });

      await expect(pouchDBService.forceSync()).rejects.toThrow('Cannot force sync while offline');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockPouchDB.put.mockRejectedValue(new Error('Database error'));

      await expect(pouchDBService.saveEstimate({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '123',
        customerAddress: '123 Street',
        windows: [],
        totalPrice: 100,
        createdAt: new Date().toISOString(),
        status: 'draft'
      })).rejects.toThrow('Database error');
    });

    test('should handle sync errors', () => {
      const mockSync = {
        on: jest.fn(),
        cancel: jest.fn()
      };

      mockPouchDB.sync.mockReturnValue(mockSync);

      // Create new service to trigger sync setup
      new PouchDBService();

      // Simulate sync error
      const errorCallback = mockSync.on.mock.calls.find(call => call[0] === 'error');
      if (errorCallback) {
        errorCallback[1](new Error('Sync error'));
      }

      const status = pouchDBService.getSyncStatus();
      expect(status.error).toBeTruthy();
    });
  });
});
