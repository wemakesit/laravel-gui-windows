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
        $validated = $request->validate([
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
        ]);

        $result = $this->apiService->generateQuotation($validated);

        if ($result['success']) {
            // Return the PDF as a download
            return response($result['data'], 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="quotation.pdf"',
            ]);
        }

        return back()->with('error', $result['error'] ?? 'Failed to generate quotation');
    }
}
