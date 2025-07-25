<?php

return [

    'identifier' => env('WATERMELON_IDENTIFIER', 'watermelon_id'),

    'route' => env('WATERMELON_ROUTE', '/api/watermelon/sync'),

    'middleware' => [
        'web',
        // 'auth', // Uncomment if you want to require authentication
    ],

    'models' => [
        'customers' => \App\Models\WatermelonCustomer::class,
        'estimates' => \App\Models\WatermelonEstimate::class,
        'windows' => \App\Models\WatermelonWindow::class,
    ],

];
