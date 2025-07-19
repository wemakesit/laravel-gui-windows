<?php

namespace App\Http\Controllers;

use App\Models\Estimate;
use App\Models\EstimateFile;
use App\Services\ApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EstimateCreateController extends Controller
{
    protected ApiService $apiService;

    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the estimate wizard.
     */
    public function index(Request $request): InertiaResponse
    {
        // Get all the necessary data for the wizard
        $windowTypes = $this->apiService->getWindowTypes();
        $extras = $this->apiService->getExtras();
        $finishes = $this->apiService->getFinishes();
        $companyInfo = $this->apiService->getCompanyInfo();
        $pdfTextConfig = $this->apiService->getPdfTextConfig();
        $options = $this->apiService->getOptions();

        return Inertia::render('Estimates/Wizard', [
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'companyInfo' => $companyInfo,
            'pdfTextConfig' => $pdfTextConfig,
            'options' => $options,
            'loadedEstimate' => null, // No estimate loaded by default
        ]);
    }

    /**
     * Generate and save the estimate.
     */
    public function generate(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'customerInfo' => 'required|array',
                'windows' => 'required|array',
                'selectedCaveats' => 'array',
                'companyInfo' => 'required|array',
            ]);

            // Generate a unique reference number
            $referenceNumber = 'EST-' . date('Y') . '-' . str_pad(
                Estimate::whereYear('created_at', date('Y'))->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Calculate totals
            $windowCount = count($validated['windows']);
            $totalAmount = 0; // This would be calculated based on your business logic

            // Create the estimate record
            $estimate = Estimate::create([
                'reference_number' => $referenceNumber,
                'customer_name' => $validated['customerInfo']['name'] ?? '',
                'customer_email' => $validated['customerInfo']['email'] ?? '',
                'customer_phone' => $validated['customerInfo']['phone'] ?? '',
                'customer_address' => $validated['customerInfo']['address'] ?? '',
                'additional_info' => $validated['customerInfo']['additionalInfo'] ?? null,
                'window_count' => $windowCount,
                'total_amount' => $totalAmount,
                'estimate_data' => $validated,
            ]);

            // Generate PDF via API
            $pdfResponse = $this->apiService->generateEstimate($validated);

            if ($pdfResponse && isset($pdfResponse['success']) && $pdfResponse['success']) {
                // Save the PDF file
                $filename = $referenceNumber . '.pdf';
                $path = 'estimates/' . $filename;

                if (isset($pdfResponse['pdf_content'])) {
                    Storage::put($path, base64_decode($pdfResponse['pdf_content']));

                    // Create file record
                    EstimateFile::create([
                        'estimate_id' => $estimate->id,
                        'filename' => $filename,
                        'path' => $path,
                        'mime_type' => 'application/pdf',
                        'size' => Storage::size($path),
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'estimate_id' => $estimate->id,
                    'reference_number' => $referenceNumber,
                    'download_url' => route('estimates.download', $estimate->id),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
