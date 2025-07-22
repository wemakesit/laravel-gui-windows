<?php

namespace App\Http\Controllers;

use App\Services\ApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EstimateController extends Controller
{
    /**
     * Display the estimate listing page.
     * Note: Estimates are now stored in WatermelonDB locally, not SQL database.
     * The frontend will handle loading estimates from WatermelonDB.
     */
    public function index(): InertiaResponse
    {
        // Return empty estimates array since data comes from WatermelonDB
        return Inertia::render('Estimates/Index', [
            'estimates' => [],
            'useOfflineMode' => true,
        ]);
    }

    /**
     * Display the specified estimate.
     * Note: Estimates are now stored in WatermelonDB locally.
     * The frontend will handle loading the estimate data.
     */
    public function show(string $id): InertiaResponse
    {
        return Inertia::render('Estimates/Show', [
            'estimateId' => $id,
            'useOfflineMode' => true,
        ]);
    }

    /**
     * Download the PDF file for the specified estimate.
     * Note: PDF files are now handled through WatermelonDB local storage.
     */
    public function download(string $id): Response
    {
        // This will be handled by the frontend through WatermelonDB local storage
        abort(404, 'PDF download is now handled through WatermelonDB local storage');
    }

    /**
     * Remove the specified estimate from storage.
     * Note: Deletion is now handled through WatermelonDB locally.
     */
    public function destroy(string $id): JsonResponse
    {
        // Return success - deletion will be handled by frontend WatermelonDB
        return response()->json([
            'success' => true,
            'message' => 'Estimate deletion will be handled by WatermelonDB',
        ]);
    }

    /**
     * Load an estimate into the wizard for editing.
     * Note: Estimate data is now loaded from WatermelonDB locally.
     */
    public function load(string $id): InertiaResponse
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
            'estimateId' => $id,
            'useOfflineMode' => true,
        ]);
    }

    /**
     * Generate PDF for an existing estimate.
     * Note: PDF generation is now handled through WatermelonDB local storage.
     */
    public function generatePdf(string $id): JsonResponse
    {
        // PDF generation will be handled by the frontend through WatermelonDB
        return response()->json([
            'success' => true,
            'message' => 'PDF generation is now handled through WatermelonDB local storage',
        ]);
    }
}
