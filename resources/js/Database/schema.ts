import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'customers',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'address_line_1', type: 'string', isOptional: true },
        { name: 'address_line_2', type: 'string', isOptional: true },
        { name: 'city', type: 'string', isOptional: true },
        { name: 'county', type: 'string', isOptional: true },
        { name: 'postcode', type: 'string', isOptional: true },
        { name: 'country', type: 'string', isOptional: true },
        { name: 'company_name', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'estimates',
      columns: [
        { name: 'customer_id', type: 'string', isIndexed: true, isOptional: false },
        { name: 'reference_number', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' }, // draft, pending, approved, rejected
        { name: 'total_amount', type: 'number', isOptional: true },
        { name: 'discount_amount', type: 'number', isOptional: true },
        { name: 'vat_amount', type: 'number', isOptional: true },
        { name: 'final_amount', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'valid_until', type: 'number', isOptional: true },
        { name: 'pdf_generated_at', type: 'number', isOptional: true },
        { name: 'pdf_url', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'windows',
      columns: [
        { name: 'estimate_id', type: 'string', isIndexed: true },
        { name: 'room', type: 'string' },
        { name: 'window_type', type: 'string' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'unit_price', type: 'number', isOptional: true },
        { name: 'total_price', type: 'number', isOptional: true },
        { name: 'finish', type: 'string', isOptional: true },
        { name: 'glass_type', type: 'string', isOptional: true },
        { name: 'opening_type', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'options', type: 'string', isOptional: true }, // JSON string for selected options
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'extras',
      columns: [
        { name: 'estimate_id', type: 'string', isOptional: true, isIndexed: true }, // null for config extras
        { name: 'api_id', type: 'string', isOptional: true, isIndexed: true }, // for config extras from API
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number', isOptional: true }, // null for config extras
        { name: 'unit_price', type: 'number' },
        { name: 'total_price', type: 'number', isOptional: true }, // null for config extras
        { name: 'category', type: 'string', isOptional: true },
        { name: 'is_config', type: 'boolean' }, // true for config extras, false for estimate extras
        { name: 'is_active', type: 'boolean', isOptional: true }, // for config extras
        { name: 'last_synced', type: 'number', isOptional: true }, // for config extras
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'photos',
      columns: [
        { name: 'estimate_id', type: 'string', isIndexed: true },
        {
          name: 'window_id',
          type: 'string',
          isOptional: true,
          isIndexed: true,
        },
        { name: 'filename', type: 'string' },
        { name: 'file_path', type: 'string' },
        { name: 'file_size', type: 'number', isOptional: true },
        { name: 'mime_type', type: 'string', isOptional: true },
        { name: 'caption', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'window_types',
      columns: [
        { name: 'api_id', type: 'string', isIndexed: true }, // ID from API
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' }, // API field name
        { name: 'cost', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_synced', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'finishes',
      columns: [
        { name: 'api_id', type: 'string', isIndexed: true }, // ID from API
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' }, // glass_specifications, paint_finishes, hardware_finishes
        { name: 'cost', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_synced', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'company_info',
      columns: [
        { name: 'key', type: 'string', isIndexed: true }, // single record with key 'default'
        { name: 'data', type: 'string' }, // JSON string of company info
        { name: 'last_synced', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;
