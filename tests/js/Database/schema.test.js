/**
 * WatermelonDB Schema Tests
 * Tests for database schema structure and validation
 */

import { schema } from '../../../resources/js/Database/schema';

describe('WatermelonDB Schema', () => {
  test('should have correct version', () => {
    expect(schema.version).toBe(1);
  });

  test('should have all required tables', () => {
    const tableNames = schema.tables.map(table => table.name);
    
    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('estimates');
    expect(tableNames).toContain('windows');
    expect(tableNames).toContain('extras');
    expect(tableNames).toContain('photos');
  });

  describe('Customers Table', () => {
    let customersTable;

    beforeEach(() => {
      customersTable = schema.tables.find(table => table.name === 'customers');
    });

    test('should exist', () => {
      expect(customersTable).toBeDefined();
    });

    test('should have required columns', () => {
      const columnNames = customersTable.columns.map(col => col.name);
      
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('phone');
      expect(columnNames).toContain('address_line_1');
      expect(columnNames).toContain('address_line_2');
      expect(columnNames).toContain('city');
      expect(columnNames).toContain('county');
      expect(columnNames).toContain('postcode');
      expect(columnNames).toContain('country');
      expect(columnNames).toContain('company_name');
      expect(columnNames).toContain('notes');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should have correct column types', () => {
      const nameColumn = customersTable.columns.find(col => col.name === 'name');
      const createdAtColumn = customersTable.columns.find(col => col.name === 'created_at');
      
      expect(nameColumn.type).toBe('string');
      expect(createdAtColumn.type).toBe('number');
    });

    test('should have optional columns marked correctly', () => {
      const nameColumn = customersTable.columns.find(col => col.name === 'name');
      const emailColumn = customersTable.columns.find(col => col.name === 'email');
      
      expect(nameColumn.isOptional).toBeFalsy();
      expect(emailColumn.isOptional).toBe(true);
    });
  });

  describe('Estimates Table', () => {
    let estimatesTable;

    beforeEach(() => {
      estimatesTable = schema.tables.find(table => table.name === 'estimates');
    });

    test('should exist', () => {
      expect(estimatesTable).toBeDefined();
    });

    test('should have required columns', () => {
      const columnNames = estimatesTable.columns.map(col => col.name);
      
      expect(columnNames).toContain('customer_id');
      expect(columnNames).toContain('reference_number');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('total_amount');
      expect(columnNames).toContain('discount_amount');
      expect(columnNames).toContain('vat_amount');
      expect(columnNames).toContain('final_amount');
      expect(columnNames).toContain('notes');
      expect(columnNames).toContain('valid_until');
      expect(columnNames).toContain('pdf_generated_at');
      expect(columnNames).toContain('pdf_url');
      expect(columnNames).toContain('is_synced');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should have indexed foreign key', () => {
      const customerIdColumn = estimatesTable.columns.find(col => col.name === 'customer_id');
      
      expect(customerIdColumn.isIndexed).toBe(true);
    });
  });

  describe('Windows Table', () => {
    let windowsTable;

    beforeEach(() => {
      windowsTable = schema.tables.find(table => table.name === 'windows');
    });

    test('should exist', () => {
      expect(windowsTable).toBeDefined();
    });

    test('should have required columns', () => {
      const columnNames = windowsTable.columns.map(col => col.name);
      
      expect(columnNames).toContain('estimate_id');
      expect(columnNames).toContain('room');
      expect(columnNames).toContain('window_type');
      expect(columnNames).toContain('width');
      expect(columnNames).toContain('height');
      expect(columnNames).toContain('quantity');
      expect(columnNames).toContain('unit_price');
      expect(columnNames).toContain('total_price');
      expect(columnNames).toContain('finish');
      expect(columnNames).toContain('glass_type');
      expect(columnNames).toContain('opening_type');
      expect(columnNames).toContain('notes');
      expect(columnNames).toContain('options');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should have correct column types', () => {
      const widthColumn = windowsTable.columns.find(col => col.name === 'width');
      const roomColumn = windowsTable.columns.find(col => col.name === 'room');
      
      expect(widthColumn.type).toBe('number');
      expect(roomColumn.type).toBe('string');
    });
  });

  describe('Extras Table', () => {
    let extrasTable;

    beforeEach(() => {
      extrasTable = schema.tables.find(table => table.name === 'extras');
    });

    test('should exist', () => {
      expect(extrasTable).toBeDefined();
    });

    test('should have required columns', () => {
      const columnNames = extrasTable.columns.map(col => col.name);
      
      expect(columnNames).toContain('estimate_id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('quantity');
      expect(columnNames).toContain('unit_price');
      expect(columnNames).toContain('total_price');
      expect(columnNames).toContain('category');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('Photos Table', () => {
    let photosTable;

    beforeEach(() => {
      photosTable = schema.tables.find(table => table.name === 'photos');
    });

    test('should exist', () => {
      expect(photosTable).toBeDefined();
    });

    test('should have required columns', () => {
      const columnNames = photosTable.columns.map(col => col.name);
      
      expect(columnNames).toContain('estimate_id');
      expect(columnNames).toContain('window_id');
      expect(columnNames).toContain('filename');
      expect(columnNames).toContain('file_path');
      expect(columnNames).toContain('file_size');
      expect(columnNames).toContain('mime_type');
      expect(columnNames).toContain('caption');
      expect(columnNames).toContain('is_synced');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should have indexed columns', () => {
      const estimateIdColumn = photosTable.columns.find(col => col.name === 'estimate_id');
      const windowIdColumn = photosTable.columns.find(col => col.name === 'window_id');
      
      expect(estimateIdColumn.isIndexed).toBe(true);
      expect(windowIdColumn.isIndexed).toBe(true);
    });
  });
});
