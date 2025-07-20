<?php

namespace App\Http\Controllers;

use App\Models\Estimate;
use App\Services\ApiService;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EstimateController extends Controller
{
    /**
     * Display the estimate listing page.
     */
    public function index(): InertiaResponse
    {
        $estimates = Estimate::with('file')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($estimate) {
                return [
                    'id' => $estimate->id,
                    'reference_number' => $estimate->reference_number,
                    'customer_name' => $estimate->customer_name,
                    'created_at' => $estimate->created_at->format('d/m/Y H:i'),
                    'window_count' => $estimate->window_count,
                    'total_amount' => $estimate->total_amount,
                    'has_file' => $estimate->file !== null,
                ];
            });

        return Inertia::render('Estimates/Index', [
            'estimates' => $estimates,
        ]);
    }

    /**
     * Display the specified estimate.
     */
    public function show(Estimate $estimate): InertiaResponse
    {
        return Inertia::render('Estimates/Show', [
            'estimate' => [
                'id' => $estimate->id,
                'reference_number' => $estimate->reference_number,
                'customer_name' => $estimate->customer_name,
                'customer_email' => $estimate->customer_email,
                'customer_phone' => $estimate->customer_phone,
                'customer_address' => $estimate->customer_address,
                'additional_info' => $estimate->additional_info,
                'window_count' => $estimate->window_count,
                'total_amount' => $estimate->total_amount,
                'created_at' => $estimate->created_at->format('d/m/Y H:i'),
                'has_file' => $estimate->file !== null,
                'estimate_data' => $estimate->estimate_data,
            ],
        ]);
    }

    /**
     * Download the PDF file for the specified estimate.
     */
    public function download(Estimate $estimate): Response
    {
        $file = $estimate->file;

        if (! $file || ! file_exists(storage_path('app/'.$file->path))) {
            abort(404, 'File not found');
        }

        return response()->download(
            storage_path('app/'.$file->path),
            $file->filename,
            ['Content-Type' => $file->mime_type]
        );
    }

    /**
     * Remove the specified estimate from storage.
     */
    public function destroy(Estimate $estimate): \Illuminate\Http\RedirectResponse
    {
        // Delete associated file if it exists
        if ($estimate->file && file_exists(storage_path('app/'.$estimate->file->path))) {
            unlink(storage_path('app/'.$estimate->file->path));
        }

        $estimate->delete();

        return redirect()->route('estimates.index')
            ->with('success', 'Window estimate deleted successfully.');
    }

    /**
     * Load an estimate into the wizard for editing.
     */
    public function load(Estimate $estimate): InertiaResponse
    {
        // Get all the necessary data for the wizard
        $apiService = app(ApiService::class);
        $windowTypes = $apiService->getWindowTypes();
        $extras = $apiService->getExtras();
        $finishes = $apiService->getFinishes();
        $companyInfo = $apiService->getCompanyInfo();
        $pdfTextConfig = $apiService->getPdfTextConfig();
        $options = $apiService->getOptions();

        return Inertia::render('Estimates/Wizard', [
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'companyInfo' => $companyInfo,
            'pdfTextConfig' => $pdfTextConfig,
            'options' => $options,
            'loadedEstimate' => $estimate->estimate_data,
        ]);
    }
}
