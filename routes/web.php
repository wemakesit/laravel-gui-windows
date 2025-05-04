<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationCreateController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
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
Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
Route::get('/quotations/{quotation}/download', [QuotationController::class, 'download'])->name('quotations.download');
Route::get('/quotations/{quotation}/load', [QuotationController::class, 'load'])->name('quotations.load');
Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy');

// Quotation Creation Routes
Route::get('/quotations/create', [QuotationCreateController::class, 'index'])->name('quotations.create');
Route::post('/quotations/generate', [QuotationCreateController::class, 'generate'])->name('quotations.generate');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
