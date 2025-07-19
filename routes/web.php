<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationCreateController;
use App\Http\Controllers\SettingsController;
use Inertia\Inertia;

// Redirect root to quotations index
Route::get('/', function () {
    return redirect()->route('quotations.index');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Quotation Routes
Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index');

// Quotation Creation Routes - these need to be before the {quotation} routes to avoid conflicts
Route::get('/quotations/create', [QuotationCreateController::class, 'index'])->name('quotations.create');
Route::post('/quotations/generate', [QuotationCreateController::class, 'generate'])->name('quotations.generate');

// Quotation Detail Routes - these must come after any specific routes like 'create'
Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
Route::get('/quotations/{quotation}/download', [QuotationController::class, 'download'])->name('quotations.download');
Route::get('/quotations/{quotation}/load', [QuotationController::class, 'load'])->name('quotations.load');
Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy');

// Settings Routes
Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
Route::post('/settings/company-info', [SettingsController::class, 'updateCompanyInfo'])->name('settings.update-company-info');
Route::post('/settings/window-types', [SettingsController::class, 'updateWindowTypes'])->name('settings.update-window-types');
Route::post('/settings/extras', [SettingsController::class, 'updateExtras'])->name('settings.update-extras');
Route::post('/settings/finishes', [SettingsController::class, 'updateFinishes'])->name('settings.update-finishes');
Route::post('/settings/pdf-text-config', [SettingsController::class, 'updatePdfTextConfig'])->name('settings.update-pdf-text-config');

// API Proxy Route - to avoid CORS issues when accessing the API directly from the browser
Route::any('/api-proxy/{path?}', [SettingsController::class, 'proxyApiRequest'])->where('path', '.*')->name('api.proxy');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
