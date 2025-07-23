<?php

namespace App\Http\Controllers;

use App\Services\ApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SettingsController extends Controller
{
    protected ApiService $apiService;

    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the settings page.
     */
    public function index()
    {
        // Get documentation
        $apiDocs = $this->getApiDocs();

        // Get configuration data
        $companyInfo = $this->apiService->getCompanyInfo();
        $windowTypes = $this->apiService->getWindowTypes();
        $extras = $this->apiService->getExtras();
        $finishes = $this->apiService->getFinishes();
        $pdfTextConfig = $this->apiService->getPdfTextConfig();

        return Inertia::render('Settings/Index', [
            'apiDocs' => $apiDocs,
            'companyInfo' => $companyInfo,
            'windowTypes' => $windowTypes,
            'extras' => $extras,
            'finishes' => $finishes,
            'pdfTextConfig' => $pdfTextConfig,
        ]);
    }

    /**
     * Get API documentation from the API server.
     */
    private function getApiDocs()
    {
        try {
            $baseUrl = env('API_BASE_URL', 'http://localhost:8000');

            // Just return the URL instead of trying to fetch the content
            return [
                'status' => 'success',
                'url' => "$baseUrl/docs",
                'apiBaseUrl' => $baseUrl,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Error preparing API documentation URL: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Proxy API requests to avoid CORS issues.
     */
    public function proxyApiRequest(Request $request, $path = '')
    {
        try {
            $baseUrl = env('API_BASE_URL', 'http://localhost:8000');
            $method = strtolower($request->method());
            $url = "$baseUrl/$path";

            // Forward the request to the API server
            $response = Http::withHeaders($request->headers->all())
                ->$method($url, $request->all());

            return response($response->body(), $response->status())
                ->withHeaders($response->headers());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to proxy request to API server',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update company information.
     */
    public function updateCompanyInfo(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address.line1' => 'required|string|max:255',
            'address.line2' => 'required|string|max:255',
            'address.country' => 'required|string|max:255',
            'contact.phone' => 'required|string|max:255',
            'contact.email' => 'required|email|max:255',
            'contact.website' => 'required|string|max:255',
            'registration.company_number' => 'required|string|max:255',
            'registration.vat_number' => 'required|string|max:255',
        ]);

        $result = $this->apiService->updateCompanyInfo($validated);

        if ($result) {
            return redirect()->route('settings.index')->with('success', 'Company information updated successfully');
        }

        return redirect()->route('settings.index')->with('error', 'Failed to update company information');
    }

    /**
     * Update window types.
     */
    public function updateWindowTypes(Request $request)
    {
        $validated = $request->validate([
            'window_types' => 'required|array',
            'window_types.*.name' => 'required|string|max:255',
            'window_types.*.description' => 'required|string',
            'window_types.*.base_price' => 'required|numeric|min:0',
        ]);

        $result = $this->apiService->updateWindowTypes($validated);

        if ($result) {
            return redirect()->route('settings.index')->with('success', 'Window types updated successfully');
        }

        return redirect()->route('settings.index')->with('error', 'Failed to update window types');
    }

    /**
     * Update extras.
     */
    public function updateExtras(Request $request)
    {
        $validated = $request->validate([
            'extras' => 'required|array',
            'extras.*.Name' => 'required|string|max:255',
            'extras.*.Description' => 'required|string',
            'extras.*.Cost' => 'required|numeric|min:0',
        ]);

        $result = $this->apiService->updateExtras($validated);

        if ($result) {
            return redirect()->route('settings.index')->with('success', 'Extras updated successfully');
        }

        return redirect()->route('settings.index')->with('error', 'Failed to update extras');
    }

    /**
     * Update finishes.
     */
    public function updateFinishes(Request $request)
    {
        $validated = $request->validate([
            'paint_finishes' => 'required|array',
            'glass_specifications' => 'required|array',
            'hardware_finishes' => 'required|array',
        ]);

        $result = $this->apiService->updateFinishes($validated);

        if ($result) {
            return redirect()->route('settings.index')->with('success', 'Finishes updated successfully');
        }

        return redirect()->route('settings.index')->with('error', 'Failed to update finishes');
    }

    /**
     * Update PDF text configuration.
     */
    public function updatePdfTextConfig(Request $request)
    {
        $validated = $request->validate([
            'header' => 'required|string|max:255',
            'footer' => 'required|string|max:255',
            'terms_and_conditions' => 'required|array',
            'formats.date_format' => 'required|string|max:255',
            'formats.currency_symbol' => 'required|string|max:10',
            'formats.vat_rate' => 'required|numeric|min:0|max:1',
        ]);

        $result = $this->apiService->updatePdfTextConfig($validated);

        if ($result) {
            return redirect()->route('settings.index')->with('success', 'PDF text configuration updated successfully');
        }

        return redirect()->route('settings.index')->with('error', 'Failed to update PDF text configuration');
    }
}
