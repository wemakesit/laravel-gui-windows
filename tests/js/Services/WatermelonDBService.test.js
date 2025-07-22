/**
 * WatermelonDBService Tests
 * Tests for WatermelonDB service functionality
 */

// Mock WatermelonDB
const mockDatabase = {
  write: jest.fn(),
  get: jest.fn(),
  unsafeResetDatabase: jest.fn(),
};

const mockCollection = {
  create: jest.fn(),
  find: jest.fn(),
  query: jest.fn(),
  fetchCount: jest.fn(),
};

const mockQuery = {
  fetch: jest.fn(),
  fetchCount: jest.fn(),
};

const mockCustomer = {
  id: 'customer-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '01234567890',
  addressLine1: '123 Test Street',
  city: 'Test City',
  postcode: 'TE1 2ST',
  country: 'United Kingdom',
};

const mockEstimate = {
  id: 'estimate-1',
  customerId: 'customer-1',
  referenceNumber: 'EST-001',
  status: 'draft',
  isSynced: false,
  createdAt: new Date('2024-01-01'),
  hasPdf: false,
};

const mockWindow = {
  id: 'window-1',
  estimateId: 'estimate-1',
  room: 'Living Room',
  windowType: 'Casement',
  width: 1200,
  height: 1000,
  quantity: 1,
};

// Mock the database
jest.mock('../../../resources/js/Database', () => ({
  __esModule: true,
  default: mockDatabase,
}));

// Mock the service
const { WatermelonDBService } = require('../../../resources/js/Services/WatermelonDBService');

describe('WatermelonDBService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockDatabase.get.mockReturnValue(mockCollection);
    mockDatabase.write.mockImplementation((callback) => callback());
    mockCollection.query.mockReturnValue(mockQuery);
    mockQuery.fetch.mockResolvedValue([]);
    mockQuery.fetchCount.mockResolvedValue(0);
    
    service = new WatermelonDBService();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('WatermelonDB initialized successfully');
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Initialization failed');
      
      // Mock a failure scenario
      jest.spyOn(service, 'initialize').mockRejectedValueOnce(error);
      
      await expect(service.initialize()).rejects.toThrow('Initialization failed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Customer Operations', () => {
    beforeEach(() => {
      mockCollection.create.mockImplementation((callback) => {
        const customer = { ...mockCustomer };
        callback(customer);
        return Promise.resolve(customer);
      });
      mockCollection.find.mockResolvedValue(mockCustomer);
      mockQuery.fetch.mockResolvedValue([mockCustomer]);
    });

    test('should create customer', async () => {
      const customerInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '01234567890',
        addressLine1: '123 Test Street',
        city: 'Test City',
        postcode: 'TE1 2ST',
        country: 'United Kingdom',
      };

      const result = await service.createCustomer(customerInfo);

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockCollection.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        name: customerInfo.name,
        email: customerInfo.email,
      }));
    });

    test('should get customer by id', async () => {
      const result = await service.getCustomer('customer-1');

      expect(mockCollection.find).toHaveBeenCalledWith('customer-1');
      expect(result).toEqual(mockCustomer);
    });

    test('should return null for non-existent customer', async () => {
      mockCollection.find.mockRejectedValue(new Error('Not found'));

      const result = await service.getCustomer('non-existent');

      expect(result).toBeNull();
    });

    test('should get all customers', async () => {
      const result = await service.getAllCustomers();

      expect(mockQuery.fetch).toHaveBeenCalled();
      expect(result).toEqual([mockCustomer]);
    });

    test('should search customers', async () => {
      const searchTerm = 'John';
      
      await service.searchCustomers(searchTerm);

      expect(mockCollection.query).toHaveBeenCalled();
      expect(mockQuery.fetch).toHaveBeenCalled();
    });
  });

  describe('Estimate Operations', () => {
    beforeEach(() => {
      mockCollection.create.mockImplementation((callback) => {
        const estimate = { ...mockEstimate };
        callback(estimate);
        return Promise.resolve(estimate);
      });
      mockCollection.find.mockResolvedValue(mockEstimate);
      mockQuery.fetch.mockResolvedValue([mockEstimate]);
    });

    test('should create estimate', async () => {
      const result = await service.createEstimate('customer-1', 'EST-001');

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockCollection.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        customerId: 'customer-1',
        status: 'draft',
        isSynced: false,
      }));
    });

    test('should generate reference number if not provided', async () => {
      jest.spyOn(service, 'generateReferenceNumber').mockReturnValue('EST-12345');

      await service.createEstimate('customer-1');

      expect(mockCollection.create).toHaveBeenCalled();
    });

    test('should get estimate by id', async () => {
      const result = await service.getEstimate('estimate-1');

      expect(mockCollection.find).toHaveBeenCalledWith('estimate-1');
      expect(result).toEqual(mockEstimate);
    });

    test('should get all estimates', async () => {
      const result = await service.getAllEstimates();

      expect(mockQuery.fetch).toHaveBeenCalled();
      expect(result).toEqual([mockEstimate]);
    });

    test('should get estimates by customer', async () => {
      await service.getEstimatesByCustomer('customer-1');

      expect(mockCollection.query).toHaveBeenCalled();
      expect(mockQuery.fetch).toHaveBeenCalled();
    });

    test('should get draft estimates', async () => {
      await service.getDraftEstimates();

      expect(mockCollection.query).toHaveBeenCalled();
      expect(mockQuery.fetch).toHaveBeenCalled();
    });
  });

  describe('Window Operations', () => {
    beforeEach(() => {
      mockCollection.create.mockImplementation((callback) => {
        const window = { ...mockWindow };
        callback(window);
        return Promise.resolve(window);
      });
      mockQuery.fetch.mockResolvedValue([mockWindow]);
    });

    test('should add window to estimate', async () => {
      const windowData = {
        room: 'Living Room',
        windowType: 'Casement',
        width: 1200,
        height: 1000,
        quantity: 1,
      };

      const result = await service.addWindowToEstimate('estimate-1', windowData);

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockCollection.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        estimateId: 'estimate-1',
        room: windowData.room,
        windowType: windowData.windowType,
      }));
    });

    test('should get windows by estimate', async () => {
      const result = await service.getWindowsByEstimate('estimate-1');

      expect(mockCollection.query).toHaveBeenCalled();
      expect(mockQuery.fetch).toHaveBeenCalled();
      expect(result).toEqual([mockWindow]);
    });

    test('should update window', async () => {
      const mockWindowInstance = {
        ...mockWindow,
        update: jest.fn().mockResolvedValue(),
      };
      mockCollection.find.mockResolvedValue(mockWindowInstance);

      const updates = {
        room: 'Kitchen',
        width: 1500,
      };

      await service.updateWindow('window-1', updates);

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockCollection.find).toHaveBeenCalledWith('window-1');
      expect(mockWindowInstance.update).toHaveBeenCalled();
    });

    test('should delete window', async () => {
      const mockWindowInstance = {
        ...mockWindow,
        markAsDeleted: jest.fn().mockResolvedValue(),
      };
      mockCollection.find.mockResolvedValue(mockWindowInstance);

      await service.deleteWindow('window-1');

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockCollection.find).toHaveBeenCalledWith('window-1');
      expect(mockWindowInstance.markAsDeleted).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('should generate reference number', () => {
      const refNumber = service.generateReferenceNumber();

      expect(refNumber).toMatch(/^EST-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    test('should get storage info', async () => {
      mockQuery.fetchCount
        .mockResolvedValueOnce(5) // customers
        .mockResolvedValueOnce(10) // estimates
        .mockResolvedValueOnce(25) // windows
        .mockResolvedValueOnce(8); // photos

      const result = await service.getStorageInfo();

      expect(result).toEqual({
        customers: 5,
        estimates: 10,
        windows: 25,
        photos: 8,
      });
    });

    test('should clear all data', async () => {
      await service.clearAllData();

      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockDatabase.unsafeResetDatabase).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      mockDatabase.write.mockRejectedValue(error);

      await expect(service.createCustomer({
        name: 'Test Customer',
      })).rejects.toThrow('Database error');
    });

    test('should handle query errors', async () => {
      const error = new Error('Query error');
      mockQuery.fetch.mockRejectedValue(error);

      await expect(service.getAllCustomers()).rejects.toThrow('Query error');
    });
  });
});
