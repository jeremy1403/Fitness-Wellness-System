<?php

return [
    'api_path' => 'api/v1',
    'api_domain' => null,
    'export_path' => 'api.json',

    'info' => [
        'version' => env('API_VERSION', '1.0.0'),
        'description' => 'Fitness & Wellness API documentation.',
    ],

    'ui' => [
        'title' => 'Fitness & Wellness API',
        'theme' => 'light',
        'hide_try_it' => false,
        'hide_schemas' => false,
        'logo' => '',
        'layout' => 'responsive',
    ],

    'middleware' => [
        'web',
        \Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess::class,
    ],

    'extensions' => [],
];
