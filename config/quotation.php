<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quotation Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the quotation system including default options,
    | API endpoints, and other quotation-related settings.
    |
    */

    'api' => [
        'base_url' => env('QUOTATION_API_BASE_URL', 'http://localhost:8001'),
        'timeout' => env('QUOTATION_API_TIMEOUT', 30),
        'retry_attempts' => env('QUOTATION_API_RETRY_ATTEMPTS', 3),
    ],



    'pdf' => [
        'storage_path' => env('QUOTATION_PDF_STORAGE_PATH', 'quotations'),
        'max_file_size' => env('QUOTATION_PDF_MAX_SIZE', 10485760), // 10MB
        'allowed_formats' => ['pdf'],
    ],

    'validation' => [
        'max_windows_per_quote' => env('QUOTATION_MAX_WINDOWS', 50),
        'max_extras_per_quote' => env('QUOTATION_MAX_EXTRAS', 20),
        'reference_number_format' => env('QUOTATION_REF_FORMAT', 'EST-%Y%m%d-%s'),
    ],

    'defaults' => [
        'vat_rate' => env('QUOTATION_VAT_RATE', 0.20), // 20%
        'valid_for_days' => env('QUOTATION_VALID_DAYS', 30),
        'currency' => env('QUOTATION_CURRENCY', 'GBP'),
        'currency_symbol' => env('QUOTATION_CURRENCY_SYMBOL', '£'),
    ],
];
