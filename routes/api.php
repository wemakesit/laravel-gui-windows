<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Services\ApiService;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// API Health Check
Route::get('/health', function (ApiService $apiService) {
    return $apiService->getHealth();
});

// Company Info
Route::get('/company-info', function (ApiService $apiService) {
    return $apiService->getCompanyInfo();
});

// Window Types
Route::get('/window-types', function (ApiService $apiService) {
    return $apiService->getWindowTypes();
});

// Extras
Route::get('/extras', function (ApiService $apiService) {
    return $apiService->getExtras();
});

// Finishes
Route::get('/finishes', function (ApiService $apiService) {
    return $apiService->getFinishes();
});

// PDF Text Config
Route::get('/pdf-text-config', function (ApiService $apiService) {
    return $apiService->getPdfTextConfig();
});
