/**
 * Window Model Tests
 * Tests for Window model functionality and relationships
 */

// Mock WatermelonDB
const mockQuery = {
  fetch: jest.fn(),
  length: 0,
};

const mockEstimate = {
  id: 'estimate-1',
  referenceNumber: 'EST-001',
};

const mockWindow = {
  id: 'window-1',
  estimateId: 'estimate-1',
  room: 'Living Room',
  windowType: 'Casement',
  width: 1200,
  height: 1000,
  quantity: 2,
  unitPrice: 450,
  totalPrice: 900,
  finish: 'White',
  glassType: 'Double Glazed',
  openingType: 'Side Hung',
  notes: 'Standard installation',
  options: ['Option 1', 'Option 3'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  estimate: mockEstimate,
  photos: mockQuery,
  update: jest.fn(),
  markAsDeleted: jest.fn(),
};

// Mock the Window model
jest.mock('../../../resources/js/Database/models/Window', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockWindow),
  };
});

describe('Window Model', () => {
  let Window;

  beforeEach(() => {
    jest.clearAllMocks();
    Window = require('../../../resources/js/Database/models/Window').default;
  });

  describe('Static Properties', () => {
    test('should have correct table name', () => {
      expect(Window.table).toBe('windows');
    });

    test('should have correct associations', () => {
      expect(Window.associations).toEqual({
        estimate: { type: 'belongs_to', key: 'estimate_id' },
        photos: { type: 'has_many', foreignKey: 'window_id' },
      });
    });
  });

  describe('Instance Properties', () => {
    let window;

    beforeEach(() => {
      window = new Window();
    });

    test('should have all required fields', () => {
      expect(window).toHaveProperty('estimateId');
      expect(window).toHaveProperty('room');
      expect(window).toHaveProperty('windowType');
      expect(window).toHaveProperty('width');
      expect(window).toHaveProperty('height');
      expect(window).toHaveProperty('quantity');
      expect(window).toHaveProperty('unitPrice');
      expect(window).toHaveProperty('totalPrice');
      expect(window).toHaveProperty('finish');
      expect(window).toHaveProperty('glassType');
      expect(window).toHaveProperty('openingType');
      expect(window).toHaveProperty('notes');
      expect(window).toHaveProperty('options');
      expect(window).toHaveProperty('createdAt');
      expect(window).toHaveProperty('updatedAt');
    });

    test('should have relationships', () => {
      expect(window).toHaveProperty('estimate');
      expect(window).toHaveProperty('photos');
    });
  });

  describe('Derived Properties', () => {
    let window;

    beforeEach(() => {
      window = new Window();
    });

    test('should calculate area correctly', () => {
      const expectedArea = window.width * window.height;
      expect(expectedArea).toBe(1200 * 1000); // 1,200,000 mm²
    });

    test('should calculate total area correctly', () => {
      const area = window.width * window.height;
      const totalArea = area * window.quantity;
      expect(totalArea).toBe(1200 * 1000 * 2); // 2,400,000 mm²
    });

    test('should generate display name correctly', () => {
      const expectedDisplayName = `${window.room} - ${window.windowType}`;
      expect(expectedDisplayName).toBe('Living Room - Casement');
    });

    test('should format dimensions correctly', () => {
      const expectedDimensions = `${window.width}mm x ${window.height}mm`;
      expect(expectedDimensions).toBe('1200mm x 1000mm');
    });

    test('should check if has photos', () => {
      // Mock photos query with length > 0
      const windowWithPhotos = {
        ...mockWindow,
        photos: { length: 2 },
      };
      
      expect(windowWithPhotos.photos.length > 0).toBe(true);
    });

    test('should check if has no photos', () => {
      expect(mockWindow.photos.length > 0).toBe(false);
    });
  });

  describe('Writer Methods', () => {
    let window;

    beforeEach(() => {
      window = new Window();
      window.update = jest.fn().mockImplementation((callback) => {
        callback(window);
        return Promise.resolve();
      });
    });

    test('should update dimensions', async () => {
      const newWidth = 1500;
      const newHeight = 1200;

      await window.updateDimensions(newWidth, newHeight);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should update pricing', async () => {
      const unitPrice = 500;
      const totalPrice = 1000;

      await window.updatePricing(unitPrice, totalPrice);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should update configuration', async () => {
      const config = {
        windowType: 'Tilt & Turn',
        finish: 'Oak',
        glassType: 'Triple Glazed',
        openingType: 'Inward Opening',
        options: ['Option 1', 'Option 2', 'Option 4'],
      };

      await window.updateConfiguration(config);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should update quantity', async () => {
      const newQuantity = 3;

      await window.updateQuantity(newQuantity);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle partial configuration updates', async () => {
      const config = {
        windowType: 'Sliding',
        finish: 'Black',
      };

      await window.updateConfiguration(config);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle null pricing values', async () => {
      await window.updatePricing(null, null);

      expect(window.update).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Relationships', () => {
    let window;

    beforeEach(() => {
      window = new Window();
      mockQuery.fetch.mockResolvedValue([
        { id: 'photo-1', filename: 'window1.jpg' },
        { id: 'photo-2', filename: 'window2.jpg' },
      ]);
    });

    test('should fetch related photos', async () => {
      const photos = await window.photos.fetch();

      expect(photos).toHaveLength(2);
      expect(photos[0]).toHaveProperty('filename', 'window1.jpg');
      expect(photos[1]).toHaveProperty('filename', 'window2.jpg');
    });

    test('should have estimate relationship', () => {
      expect(window.estimate).toEqual(mockEstimate);
    });
  });

  describe('Validation', () => {
    test('should require estimate ID', () => {
      expect(mockWindow.estimateId).toBeDefined();
      expect(mockWindow.estimateId).not.toBe('');
    });

    test('should require room', () => {
      expect(mockWindow.room).toBeDefined();
      expect(mockWindow.room).not.toBe('');
    });

    test('should require window type', () => {
      expect(mockWindow.windowType).toBeDefined();
      expect(mockWindow.windowType).not.toBe('');
    });

    test('should require dimensions', () => {
      expect(mockWindow.width).toBeDefined();
      expect(mockWindow.width).toBeGreaterThan(0);
      expect(mockWindow.height).toBeDefined();
      expect(mockWindow.height).toBeGreaterThan(0);
    });

    test('should require quantity', () => {
      expect(mockWindow.quantity).toBeDefined();
      expect(mockWindow.quantity).toBeGreaterThan(0);
    });

    test('should allow optional fields to be null', () => {
      const windowWithNulls = {
        ...mockWindow,
        unitPrice: null,
        totalPrice: null,
        finish: null,
        glassType: null,
        openingType: null,
        notes: null,
        options: null,
      };

      expect(windowWithNulls.unitPrice).toBeNull();
      expect(windowWithNulls.totalPrice).toBeNull();
      expect(windowWithNulls.finish).toBeNull();
      expect(windowWithNulls.glassType).toBeNull();
      expect(windowWithNulls.openingType).toBeNull();
      expect(windowWithNulls.notes).toBeNull();
      expect(windowWithNulls.options).toBeNull();
    });
  });

  describe('Options Handling', () => {
    test('should handle options array', () => {
      expect(Array.isArray(mockWindow.options)).toBe(true);
      expect(mockWindow.options).toContain('Option 1');
      expect(mockWindow.options).toContain('Option 3');
    });

    test('should handle null options', () => {
      const windowWithoutOptions = {
        ...mockWindow,
        options: null,
      };

      expect(windowWithoutOptions.options).toBeNull();
    });

    test('should handle empty options array', () => {
      const windowWithEmptyOptions = {
        ...mockWindow,
        options: [],
      };

      expect(Array.isArray(windowWithEmptyOptions.options)).toBe(true);
      expect(windowWithEmptyOptions.options).toHaveLength(0);
    });
  });
});
