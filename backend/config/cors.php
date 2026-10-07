<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Aquí configuramos las cabeceras CORS que Laravel enviará automáticamente
    | para las peticiones del frontend SPA en Next.js.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // CRÍTICO para Sanctum cookie-based auth:
    // permite que el navegador envíe las cookies de sesión en peticiones cross-origin
    'supports_credentials' => true,

];
