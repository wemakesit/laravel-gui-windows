<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Services\ApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuotationController extends Controller
{
    /**
     * Display the quotation landing page.
     */
    public function index()
    {
        $quotations = Quotation::with('file')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($quotation) {
                return [
                    'id' => $quotation->id,
                    'reference_number' => $quotation->reference_number,
                    'customer_name' => $quotation->customer_name,
                    'created_at' => $quotation->created_at->format('d/m/Y H:i'),
                    'window_count' => $quotation->window_count,
                    'total_amount' => $quotation->total_amount,
                    'has_file' => $quotation->file !== null,
                ];
            });

        return Inertia::render('Quotation/Index', [
            'quotations' => $quotations,
        ]);
    }

    /**
     * Display the specified quotation.
     */
    public function show(Quotation $quotation)
    {
        return Inertia::render('Quotation/Show', [
            'quotation' => [
                'id' => $quotation->id,
                'reference_number' => $quotation->reference_number,
                'customer_name' => $quotation->customer_name,
                'customer_email' => $quotation->customer_email,
                'customer_phone' => $quotation->customer_phone,
                'customer_address' => $quotation->customer_address,
                'additional_info' => $quotation->additional_info,
                'window_count' => $quotation->window_count,
                'total_amount' => $quotation->total_amount,
                'created_at' => $quotation->created_at->format('d/m/Y H:i'),
                'has_file' => $quotation->file !== null,
                'quotation_data' => $quotation->quotation_data,
            ],
        ]);
    }

    /**
     * Download the quotation PDF file.
     */
    public function download(Quotation $quotation)
    {
        if (!$quotation->file) {
            return back()->with('error', 'No file found for this quotation.');
        }

        $path = $quotation->file->path;

        if (!Storage::exists($path)) {
            return back()->with('error', 'File not found.');
        }

        return Storage::download(
            $path,
            $quotation->file->filename,
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Load a quotation into the wizard for editing.
     */
    public function load(Quotation $quotation)
    {
        // Get all the necessary data for the wizard
        $apiService = app(ApiService::class);
        $windowTypes = $apiService->getWindowTypes();
        $extras = $apiService->getExtras();
        $finishes = $apiService->getFinishes();
        $companyInfo = $apiService->getCompanyInfo();
        $pdfTextConfig = $apiService->getPdfTextConfig();
        $options = $apiService->getOptions();

        return Inertia::render('Quotation/Wizard', [
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'companyInfo' => $companyInfo,
            'pdfTextConfig' => $pdfTextConfig,
            'options' => $options,
            'loadedQuotation' => $quotation->quotation_data,
        ]);
    }

    /**
     * Delete the specified quotation.
     */
    public function destroy(Quotation $quotation)
    {
        // Delete the file if it exists
        if ($quotation->file && Storage::exists($quotation->file->path)) {
            Storage::delete($quotation->file->path);
        }

        // Delete the quotation
        $quotation->delete();

        return redirect()->route('quotations.index')
            ->with('success', 'Quotation deleted successfully.');
    }
}
