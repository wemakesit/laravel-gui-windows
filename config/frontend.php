<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Frontend Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration values that need to be accessible to the frontend
    | JavaScript application. These will be injected into the page.
    |
    */

    'api' => [
        'base_url' => env('FRONTEND_API_BASE_URL', '/api-proxy'),
        'timeout' => env('FRONTEND_API_TIMEOUT', 30000),
        'retry_attempts' => env('FRONTEND_API_RETRY_ATTEMPTS', 3),
    ],

    'watermelon' => [
        'sync_url' => env('WATERMELON_SYNC_URL', '/api/watermelon/sync'),
        'auto_sync_interval' => env('WATERMELON_AUTO_SYNC_INTERVAL', 300000), // 5 minutes
        'batch_size' => env('WATERMELON_BATCH_SIZE', 100),
    ],

    'pwa' => [
        'cache_version' => env('PWA_CACHE_VERSION', '1.0.0'),
        'offline_timeout' => env('PWA_OFFLINE_TIMEOUT', 5000),
        'sync_interval' => env('PWA_SYNC_INTERVAL', 600000), // 10 minutes
    ],

    'camera' => [
        'max_width' => env('CAMERA_MAX_WIDTH', 1920),
        'max_height' => env('CAMERA_MAX_HEIGHT', 1080),
        'quality' => env('CAMERA_QUALITY', 0.8),
        'format' => env('CAMERA_FORMAT', 'image/jpeg'),
    ],

    'ui' => [
        'wizard_timeout' => env('UI_WIZARD_TIMEOUT', 3000),
        'persistence_delay' => env('UI_PERSISTENCE_DELAY', 1000),
        'debounce_delay' => env('UI_DEBOUNCE_DELAY', 300),
    ],

    'debug' => [
        'enabled' => env('FRONTEND_DEBUG_ENABLED', false),
        'log_level' => env('FRONTEND_LOG_LEVEL', 'error'),
        'show_pwa_debug' => env('SHOW_PWA_DEBUG', false),
    ],


];
