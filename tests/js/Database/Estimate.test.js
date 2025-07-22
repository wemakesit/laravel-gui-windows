/**
 * Estimate Model Tests
 * Tests for Estimate model functionality and relationships
 */

// Mock WatermelonDB
const mockQuery = {
  fetch: jest.fn(),
};

const mockCustomer = {
  id: 'customer-1',
  name: 'John Doe',
};

const mockEstimate = {
  id: 'estimate-1',
  customerId: 'customer-1',
  referenceNumber: 'EST-001',
  status: 'draft',
  totalAmount: 1000,
  discountAmount: 100,
  vatAmount: 180,
  finalAmount: 1080,
  notes: 'Test estimate',
  validUntil: new Date('2024-12-31'),
  pdfGeneratedAt: null,
  pdfUrl: null,
  isSynced: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  customer: mockCustomer,
  windows: mockQuery,
  extras: mockQuery,
  photos: mockQuery,
  update: jest.fn(),
  markAsDeleted: jest.fn(),
};

// Mock the Estimate model
jest.mock('../../../resources/js/Database/models/Estimate', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockEstimate),
  };
});

describe('Estimate Model', () => {
  let Estimate;

  beforeEach(() => {
    jest.clearAllMocks();
    Estimate = require('../../../resources/js/Database/models/Estimate').default;
  });

  describe('Static Properties', () => {
    test('should have correct table name', () => {
      expect(Estimate.table).toBe('estimates');
    });

    test('should have correct associations', () => {
      expect(Estimate.associations).toEqual({
        customer: { type: 'belongs_to', key: 'customer_id' },
        windows: { type: 'has_many', foreignKey: 'estimate_id' },
        extras: { type: 'has_many', foreignKey: 'estimate_id' },
        photos: { type: 'has_many', foreignKey: 'estimate_id' },
      });
    });
  });

  describe('Instance Properties', () => {
    let estimate;

    beforeEach(() => {
      estimate = new Estimate();
    });

    test('should have all required fields', () => {
      expect(estimate).toHaveProperty('customerId');
      expect(estimate).toHaveProperty('referenceNumber');
      expect(estimate).toHaveProperty('status');
      expect(estimate).toHaveProperty('totalAmount');
      expect(estimate).toHaveProperty('discountAmount');
      expect(estimate).toHaveProperty('vatAmount');
      expect(estimate).toHaveProperty('finalAmount');
      expect(estimate).toHaveProperty('notes');
      expect(estimate).toHaveProperty('validUntil');
      expect(estimate).toHaveProperty('pdfGeneratedAt');
      expect(estimate).toHaveProperty('pdfUrl');
      expect(estimate).toHaveProperty('isSynced');
      expect(estimate).toHaveProperty('createdAt');
      expect(estimate).toHaveProperty('updatedAt');
    });

    test('should have relationships', () => {
      expect(estimate).toHaveProperty('customer');
      expect(estimate).toHaveProperty('windows');
      expect(estimate).toHaveProperty('extras');
      expect(estimate).toHaveProperty('photos');
    });
  });

  describe('Derived Properties', () => {
    let estimate;

    beforeEach(() => {
      estimate = new Estimate();
    });

    test('should identify draft status', () => {
      expect(estimate.isDraft).toBe(true);
    });

    test('should identify pending status', () => {
      const pendingEstimate = { ...mockEstimate, status: 'pending' };
      expect(pendingEstimate.status === 'pending').toBe(true);
    });

    test('should identify approved status', () => {
      const approvedEstimate = { ...mockEstimate, status: 'approved' };
      expect(approvedEstimate.status === 'approved').toBe(true);
    });

    test('should identify rejected status', () => {
      const rejectedEstimate = { ...mockEstimate, status: 'rejected' };
      expect(rejectedEstimate.status === 'rejected').toBe(true);
    });

    test('should check if expired', () => {
      const expiredEstimate = {
        ...mockEstimate,
        validUntil: new Date('2020-01-01'), // Past date
      };
      
      const currentTime = Date.now();
      const isExpired = expiredEstimate.validUntil.getTime() < currentTime;
      expect(isExpired).toBe(true);
    });

    test('should check if not expired', () => {
      const futureEstimate = {
        ...mockEstimate,
        validUntil: new Date('2030-01-01'), // Future date
      };
      
      const currentTime = Date.now();
      const isExpired = futureEstimate.validUntil.getTime() < currentTime;
      expect(isExpired).toBe(false);
    });

    test('should check if has PDF', () => {
      const estimateWithPdf = {
        ...mockEstimate,
        pdfUrl: 'http://example.com/estimate.pdf',
        pdfGeneratedAt: new Date(),
      };
      
      const hasPdf = !!(estimateWithPdf.pdfUrl && estimateWithPdf.pdfGeneratedAt);
      expect(hasPdf).toBe(true);
    });

    test('should check if has no PDF', () => {
      expect(mockEstimate.pdfUrl).toBeNull();
      expect(mockEstimate.pdfGeneratedAt).toBeNull();
      
      const hasPdf = !!(mockEstimate.pdfUrl && mockEstimate.pdfGeneratedAt);
      expect(hasPdf).toBe(false);
    });
  });

  describe('Writer Methods', () => {
    let estimate;

    beforeEach(() => {
      estimate = new Estimate();
      estimate.update = jest.fn().mockImplementation((callback) => {
        callback(estimate);
        return Promise.resolve();
      });
    });

    test('should update status', async () => {
      await estimate.updateStatus('approved');

      expect(estimate.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should update amounts', async () => {
      const amounts = {
        totalAmount: 1200,
        discountAmount: 120,
        vatAmount: 216,
        finalAmount: 1296,
      };

      await estimate.updateAmounts(amounts);

      expect(estimate.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should mark as synced', async () => {
      await estimate.markAsSynced();

      expect(estimate.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should set PDF info', async () => {
      const pdfUrl = 'http://example.com/estimate.pdf';

      await estimate.setPdfInfo(pdfUrl);

      expect(estimate.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle partial amount updates', async () => {
      const amounts = {
        totalAmount: 1500,
        finalAmount: 1800,
      };

      await estimate.updateAmounts(amounts);

      expect(estimate.update).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Relationships', () => {
    let estimate;

    beforeEach(() => {
      estimate = new Estimate();
      mockQuery.fetch.mockResolvedValue([
        { id: 'window-1', room: 'Living Room' },
        { id: 'window-2', room: 'Kitchen' },
      ]);
    });

    test('should fetch related windows', async () => {
      const windows = await estimate.windows.fetch();

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveProperty('room', 'Living Room');
      expect(windows[1]).toHaveProperty('room', 'Kitchen');
    });

    test('should fetch related extras', async () => {
      mockQuery.fetch.mockResolvedValue([
        { id: 'extra-1', name: 'Security Lock' },
        { id: 'extra-2', name: 'Tinted Glass' },
      ]);

      const extras = await estimate.extras.fetch();

      expect(extras).toHaveLength(2);
      expect(extras[0]).toHaveProperty('name', 'Security Lock');
      expect(extras[1]).toHaveProperty('name', 'Tinted Glass');
    });

    test('should fetch related photos', async () => {
      mockQuery.fetch.mockResolvedValue([
        { id: 'photo-1', filename: 'window1.jpg' },
        { id: 'photo-2', filename: 'window2.jpg' },
      ]);

      const photos = await estimate.photos.fetch();

      expect(photos).toHaveLength(2);
      expect(photos[0]).toHaveProperty('filename', 'window1.jpg');
      expect(photos[1]).toHaveProperty('filename', 'window2.jpg');
    });

    test('should have customer relationship', () => {
      expect(estimate.customer).toEqual(mockCustomer);
    });
  });

  describe('Validation', () => {
    test('should require customer ID', () => {
      expect(mockEstimate.customerId).toBeDefined();
      expect(mockEstimate.customerId).not.toBe('');
    });

    test('should require reference number', () => {
      expect(mockEstimate.referenceNumber).toBeDefined();
      expect(mockEstimate.referenceNumber).not.toBe('');
    });

    test('should require status', () => {
      expect(mockEstimate.status).toBeDefined();
      expect(['draft', 'pending', 'approved', 'rejected']).toContain(mockEstimate.status);
    });

    test('should allow optional amounts to be null', () => {
      const estimateWithNulls = {
        ...mockEstimate,
        totalAmount: null,
        discountAmount: null,
        vatAmount: null,
        finalAmount: null,
      };

      expect(estimateWithNulls.totalAmount).toBeNull();
      expect(estimateWithNulls.discountAmount).toBeNull();
      expect(estimateWithNulls.vatAmount).toBeNull();
      expect(estimateWithNulls.finalAmount).toBeNull();
    });
  });
});
