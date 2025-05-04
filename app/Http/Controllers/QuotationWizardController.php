<?php

namespace App\Http\Controllers;

use App\Services\ApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuotationWizardController extends Controller
{
    protected ApiService $apiService;

    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the quotation wizard.
     */
    public function index()
    {
        // Get all the necessary data for the wizard
        $windowTypes = $this->apiService->getWindowTypes();
        $extras = $this->apiService->getExtras();
        $finishes = $this->apiService->getFinishes();
        $companyInfo = $this->apiService->getCompanyInfo();
        $pdfTextConfig = $this->apiService->getPdfTextConfig();

        return Inertia::render('Quotation/Wizard', [
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'companyInfo' => $companyInfo,
            'pdfTextConfig' => $pdfTextConfig,
        ]);
    }

    /**
     * Generate a quotation.
     */
    public function generate(Request $request)
    {
        // Validate the data
        $validated = $this->validateQuotationData($request->all());

        $result = $this->apiService->generateQuotation($validated);

        if ($result['success']) {
            // Generate a unique filename with timestamp
            $filename = 'quotation_' . date('Y-m-d_H-i-s') . '.pdf';

            // Store the PDF temporarily
            $tempPath = storage_path('app/temp/' . $filename);

            // Create the directory if it doesn't exist
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }

            // Write the PDF data to the file
            file_put_contents($tempPath, $result['data']);

            // Return the file as a download and then delete it
            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ])->deleteFileAfterSend(true);
        }

        return back()->with('error', $result['error'] ?? 'Failed to generate quotation');
    }

    /**
     * Validate quotation data
     */
    private function validateQuotationData($data)
    {
        $rules = [
            'customer_details' => 'required|array',
            'customer_details.first_name' => 'required|string',
            'customer_details.last_name' => 'required|string',
            'customer_details.email' => 'required|email',
            'customer_details.phone' => 'required|string',
            'customer_details.address' => 'required|string',
            'windows' => 'required|array',
            'windows.*.room' => 'required|string',
            'windows.*.type' => 'required|string',
            'windows.*.glass_specification' => 'required|string',
            'windows.*.paint_finish' => 'required|string',
            'windows.*.hardware_finish' => 'required|string',
            'windows.*.cost' => 'required|numeric',
            'windows.*.quantity' => 'required|integer|min:1',
            'windows.*.extras' => 'nullable|array',
            'selected_caveats' => 'nullable|array',
        ];

        return validator($data, $rules)->validate();
    }
}
