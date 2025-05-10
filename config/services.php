<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'postcodes' => [
        'url' => env('POSTCODES_API_URL', 'https://api.postcodes.io'),
    ],

    'api' => [
        'base_url' => env('API_BASE_URL', 'http://localhost:8001'),
        'token' => env('API_TOKEN'),
        'max_retries' => env('API_MAX_RETRIES', 3),
        'retry_delay' => env('API_RETRY_DELAY', 100), // milliseconds
        'verify_ssl' => env('API_VERIFY_SSL', false),
        'connect_timeout' => env('API_CONNECT_TIMEOUT', 5), // seconds
    ],

];
