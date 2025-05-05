<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\QuotationFile;
use App\Services\ApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuotationCreateController extends Controller
{
    protected ApiService $apiService;

    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the quotation wizard.
     */
    public function index(Request $request)
    {
        // Get all the necessary data for the wizard
        $windowTypes = $this->apiService->getWindowTypes();
        $extras = $this->apiService->getExtras();
        $finishes = $this->apiService->getFinishes();
        $companyInfo = $this->apiService->getCompanyInfo();
        $pdfTextConfig = $this->apiService->getPdfTextConfig();
        $options = $this->apiService->getOptions();

        return Inertia::render('Quotation/Wizard', [
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'companyInfo' => $companyInfo,
            'pdfTextConfig' => $pdfTextConfig,
            'options' => $options,
            'loadedQuotation' => null, // No quotation loaded by default
        ]);
    }

    /**
     * Generate a quotation.
     */
    public function generate(Request $request)
    {
        // Validate the data
        $validated = $this->validateQuotationData($request->all());

        // Log the validated data for debugging
        \Log::info('Validated quotation data', ['data' => json_encode($validated)]);

        // Ensure each window has an options field
        foreach ($validated['windows'] as &$window) {
            if (!isset($window['options'])) {
                $window['options'] = 1; // Default to option 1 if not set
            }

            // If options is an empty array, set it to 1
            if (is_array($window['options']) && empty($window['options'])) {
                $window['options'] = 1;
            }
        }

        $result = $this->apiService->generateQuotation($validated);

        if ($result['success']) {
            // Generate a unique filename with timestamp
            $filename = 'quotation_' . date('Y-m-d_H-i-s') . '.pdf';

            // Store the PDF temporarily for download
            $tempPath = storage_path('app/temp/' . $filename);

            // Create the temp directory if it doesn't exist
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }

            // Write the PDF data to the temp file
            file_put_contents($tempPath, $result['data']);

            // Create a permanent storage path for the PDF
            $storagePath = 'quotations/' . $filename;

            // Create the quotations directory if it doesn't exist
            if (!file_exists(storage_path('app/quotations'))) {
                mkdir(storage_path('app/quotations'), 0755, true);
            }

            // Store the PDF permanently
            Storage::put($storagePath, $result['data']);

            // Calculate total amount
            $totalAmount = $this->calculateTotalAmount($validated);

            // Create the quotation record
            $quotation = Quotation::create([
                'reference_number' => Quotation::generateReferenceNumber(),
                'customer_name' => $validated['customer_details']['first_name'] . ' ' . $validated['customer_details']['last_name'],
                'customer_email' => $validated['customer_details']['email'],
                'customer_phone' => $validated['customer_details']['phone'],
                'customer_address' => $validated['customer_details']['address'],
                'additional_info' => $validated['customer_details']['additional_info'] ?? null,
                'window_count' => count($validated['windows']),
                'total_amount' => $totalAmount,
                'quotation_data' => $validated,
            ]);

            // Create the quotation file record
            $quotation->file()->create([
                'filename' => $filename,
                'path' => $storagePath,
                'mime_type' => 'application/pdf',
                'size' => Storage::size($storagePath),
            ]);

            // Return the file as a download but don't delete it
            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ])->deleteFileAfterSend(true);
        }

        \Log::error('Failed to generate quotation', ['error' => $result['error'] ?? 'Unknown error']);
        return back()->with('error', $result['error'] ?? 'Failed to generate quotation');
    }

    /**
     * Calculate the total amount for a quotation
     */
    private function calculateTotalAmount(array $data): float
    {
        $total = 0;

        foreach ($data['windows'] as $window) {
            $windowTotal = $window['cost'] * ($window['quantity'] ?? 1);

            // Add extras if any
            if (isset($window['extras']) && is_array($window['extras'])) {
                foreach ($window['extras'] as $extra) {
                    $windowTotal += $extra['cost'] ?? 0;
                }
            }

            $total += $windowTotal;
        }

        // Add VAT if applicable (assuming 20% VAT)
        $vatRate = 0.2; // Default VAT rate

        return $total * (1 + $vatRate);
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
            'windows.*.options' => 'required', // Accept both integer and array formats
            'selected_caveats' => 'nullable|array',
        ];

        // Custom validation for options field to handle both integer and array formats
        $validator = validator($data, $rules);

        $validator->after(function ($validator) use ($data) {
            if (isset($data['windows']) && is_array($data['windows'])) {
                foreach ($data['windows'] as $index => $window) {
                    if (isset($window['options'])) {
                        // Check if options is neither an integer nor an array
                        if (!is_int($window['options']) && !is_array($window['options'])) {
                            $validator->errors()->add(
                                "windows.{$index}.options",
                                'The options field must be either an integer or an array.'
                            );
                        }
                    }
                }
            }
        });

        return $validator->validate();
    }
}
