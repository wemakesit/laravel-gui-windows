<?php

namespace App\Http\Controllers;


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
     * Generate and save the estimate locally (no PDF generation yet).
     */
    public function generate(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'customerInfo' => 'required|array',
                'customerInfo.first_name' => 'required|string',
                'customerInfo.last_name' => 'required|string',
                'customerInfo.email' => 'required|email',
                'customerInfo.phone' => 'required|string',
                'customerInfo.address' => 'required|string',
                'windows' => 'required|array|min:1',
                'selectedCaveats' => 'array',
                'companyInfo' => 'required|array',
            ]);

            // Generate a unique reference number
            $referenceNumber = 'EST-'.date('Y').'-'.str_pad(
                Estimate::whereYear('created_at', date('Y'))->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Calculate totals from windows data
            $windowCount = count($validated['windows']);
            $totalAmount = $this->calculateTotalAmount($validated['windows']);

            // Create customer name
            $customerName = trim(
                ($validated['customerInfo']['title'] ?? '') . ' ' .
                $validated['customerInfo']['first_name'] . ' ' .
                $validated['customerInfo']['last_name']
            );

            // Prepare estimate data for WatermelonDB
            $estimateData = [
                'type' => 'estimate',
                'reference_number' => $referenceNumber,
                'customer_name' => $customerName,
                'customer_email' => $validated['customerInfo']['email'],
                'customer_phone' => $validated['customerInfo']['phone'],
                'customer_address' => $validated['customerInfo']['address'],
                'additional_info' => $validated['customerInfo']['additional_info'] ?? null,
                'window_count' => $windowCount,
                'total_amount' => $totalAmount,
                'estimate_data' => $validated,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            // Return success with estimate data for WatermelonDB storage
            return response()->json([
                'success' => true,
                'estimate_data' => $estimateData,
                'reference_number' => $referenceNumber,
                'message' => 'Estimate data prepared for WatermelonDB storage',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate total amount from windows data.
     */
    private function calculateTotalAmount(array $windows): float
    {
        $total = 0;

        foreach ($windows as $window) {
            $windowTotal = ($window['cost'] ?? 0) * ($window['quantity'] ?? 1);

            // Add extras cost
            if (isset($window['extras']) && is_array($window['extras'])) {
                foreach ($window['extras'] as $extra) {
                    $windowTotal += ($extra['cost'] ?? 0);
                }
            }

            $total += $windowTotal;
        }

        return $total;
    }
}
