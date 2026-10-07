<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — SaludMercal
|--------------------------------------------------------------------------
*/

// ── Rutas públicas (sin autenticación) ─────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Rutas protegidas (requieren sesión Sanctum) ─────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
