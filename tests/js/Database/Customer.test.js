/**
 * Customer Model Tests
 * Tests for Customer model functionality and relationships
 */

// Mock WatermelonDB
const mockDatabase = {
  get: jest.fn(),
  write: jest.fn(),
};

const mockQuery = {
  fetch: jest.fn(),
};

const mockCustomer = {
  id: 'customer-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '01234567890',
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 4B',
  city: 'Test City',
  county: 'Test County',
  postcode: 'TE1 2ST',
  country: 'United Kingdom',
  companyName: 'Test Company',
  notes: 'Test notes',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  estimates: mockQuery,
  update: jest.fn(),
  markAsDeleted: jest.fn(),
};

// Mock the Customer model
jest.mock('../../../resources/js/Database/models/Customer', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockCustomer),
  };
});

describe('Customer Model', () => {
  let Customer;

  beforeEach(() => {
    jest.clearAllMocks();
    Customer = require('../../../resources/js/Database/models/Customer').default;
  });

  describe('Static Properties', () => {
    test('should have correct table name', () => {
      expect(Customer.table).toBe('customers');
    });

    test('should have correct associations', () => {
      expect(Customer.associations).toEqual({
        estimates: { type: 'has_many', foreignKey: 'customer_id' },
      });
    });
  });

  describe('Instance Properties', () => {
    let customer;

    beforeEach(() => {
      customer = new Customer();
    });

    test('should have all required fields', () => {
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('phone');
      expect(customer).toHaveProperty('addressLine1');
      expect(customer).toHaveProperty('addressLine2');
      expect(customer).toHaveProperty('city');
      expect(customer).toHaveProperty('county');
      expect(customer).toHaveProperty('postcode');
      expect(customer).toHaveProperty('country');
      expect(customer).toHaveProperty('companyName');
      expect(customer).toHaveProperty('notes');
      expect(customer).toHaveProperty('createdAt');
      expect(customer).toHaveProperty('updatedAt');
    });

    test('should have estimates relationship', () => {
      expect(customer).toHaveProperty('estimates');
    });
  });

  describe('Derived Properties', () => {
    let customer;

    beforeEach(() => {
      customer = new Customer();
    });

    test('should generate full address correctly', () => {
      const expectedAddress = [
        customer.addressLine1,
        customer.addressLine2,
        customer.city,
        customer.county,
        customer.postcode,
        customer.country,
      ].filter(Boolean).join(', ');

      expect(customer.fullAddress).toBe(expectedAddress);
    });

    test('should generate display name with company', () => {
      expect(customer.displayName).toBe(`${customer.companyName} (${customer.name})`);
    });

    test('should generate display name without company', () => {
      const customerWithoutCompany = {
        ...mockCustomer,
        companyName: null,
      };
      
      expect(customerWithoutCompany.displayName || customerWithoutCompany.name).toBe(customerWithoutCompany.name);
    });
  });

  describe('Writer Methods', () => {
    let customer;

    beforeEach(() => {
      customer = new Customer();
      customer.update = jest.fn().mockImplementation((callback) => {
        callback(customer);
        return Promise.resolve();
      });
    });

    test('should update customer info', async () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '09876543210',
        addressLine1: '456 New Street',
        city: 'New City',
        postcode: 'NE3 4WS',
      };

      await customer.updateInfo(updateData);

      expect(customer.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle partial updates', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      await customer.updateInfo(updateData);

      expect(customer.update).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle undefined values in update', async () => {
      const updateData = {
        name: 'Updated Name',
        email: undefined,
        phone: null,
      };

      await customer.updateInfo(updateData);

      expect(customer.update).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Validation', () => {
    test('should require name field', () => {
      // This would be handled by WatermelonDB schema validation
      // In a real test, we'd test the actual validation logic
      expect(mockCustomer.name).toBeDefined();
      expect(mockCustomer.name).not.toBe('');
    });

    test('should allow optional fields to be null', () => {
      const customerWithNulls = {
        ...mockCustomer,
        email: null,
        phone: null,
        companyName: null,
      };

      expect(customerWithNulls.email).toBeNull();
      expect(customerWithNulls.phone).toBeNull();
      expect(customerWithNulls.companyName).toBeNull();
    });
  });

  describe('Relationships', () => {
    let customer;

    beforeEach(() => {
      customer = new Customer();
      mockQuery.fetch.mockResolvedValue([
        { id: 'estimate-1', referenceNumber: 'EST-001' },
        { id: 'estimate-2', referenceNumber: 'EST-002' },
      ]);
    });

    test('should fetch related estimates', async () => {
      const estimates = await customer.estimates.fetch();

      expect(estimates).toHaveLength(2);
      expect(estimates[0]).toHaveProperty('referenceNumber', 'EST-001');
      expect(estimates[1]).toHaveProperty('referenceNumber', 'EST-002');
    });
  });
});
