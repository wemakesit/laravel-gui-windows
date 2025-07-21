<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\EstimateCreateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Inertia\Inertia;

// Authentication required routes
Route::middleware('auth')->group(function () {
    // Main dashboard route
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Legacy dashboard route for compatibility
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.legacy');

    // Estimate Routes
    Route::get('/estimates', [EstimateController::class, 'index'])->name('estimates.index');

    // Estimate Creation Routes - these need to be before the {estimate} routes to avoid conflicts
    Route::get('/estimates/create', [EstimateCreateController::class, 'index'])->name('estimates.create');
    Route::post('/estimates/generate', [EstimateCreateController::class, 'generate'])->name('estimates.generate');

    // Estimate Detail Routes - using string IDs instead of model binding for PouchDB compatibility
    Route::get('/estimates/{id}', [EstimateController::class, 'show'])->name('estimates.show');
    Route::post('/estimates/{id}/generate-pdf', [EstimateController::class, 'generatePdf'])->name('estimates.generate-pdf');
    Route::get('/estimates/{id}/download', [EstimateController::class, 'download'])->name('estimates.download');
    Route::get('/estimates/{id}/load', [EstimateController::class, 'load'])->name('estimates.load');
    Route::delete('/estimates/{id}', [EstimateController::class, 'destroy'])->name('estimates.destroy');

    // Settings Routes
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/company-info', [SettingsController::class, 'updateCompanyInfo'])->name('settings.update-company-info');
    Route::post('/settings/window-types', [SettingsController::class, 'updateWindowTypes'])->name('settings.update-window-types');
    Route::post('/settings/extras', [SettingsController::class, 'updateExtras'])->name('settings.update-extras');
    Route::post('/settings/finishes', [SettingsController::class, 'updateFinishes'])->name('settings.update-finishes');
    Route::post('/settings/pdf-text-config', [SettingsController::class, 'updatePdfTextConfig'])->name('settings.update-pdf-text-config');

    // API Proxy Route - to avoid CORS issues when accessing the API directly from the browser
    Route::any('/api-proxy/{path?}', [SettingsController::class, 'proxyApiRequest'])->where('path', '.*')->name('api.proxy');

    // Sync Test Route - for testing PouchDB sync functionality
    Route::get('/sync-test', function () {
        return Inertia::render('SyncTest');
    })->name('sync.test');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
