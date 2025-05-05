<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AddressController extends Controller
{
    /**
     * Get the Postcodes.io API configuration for the frontend.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getConfig()
    {
        return response()->json([
            'url' => Config::get('services.postcodes.url'),
        ]);
    }

    /**
     * Search for addresses by postcode using the Postcodes.io API.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchByPostcode(Request $request)
    {
        $postcode = $request->input('postcode');

        if (empty($postcode)) {
            return response()->json(['error' => 'Postcode is required'], 400);
        }

        $apiUrl = Config::get('services.postcodes.url');

        try {
            // Format the postcode by removing spaces
            $formattedPostcode = str_replace(' ', '', $postcode);

            // Make request to Postcodes.io API
            $response = Http::get("{$apiUrl}/postcodes/{$formattedPostcode}");

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['result'])) {
                    $result = $data['result'];

                    // Get nearby postcodes to provide multiple address options
                    $nearbyResponse = Http::get("{$apiUrl}/postcodes/{$formattedPostcode}/nearest");
                    $nearbyData = $nearbyResponse->json();
                    $nearbyResults = $nearbyData['result'] ?? [];

                    // Format the addresses for the frontend
                    $addresses = [];

                    // Add the main postcode result
                    $addresses[] = [
                        'id' => 1,
                        'text' => $this->formatAddress($result, 1),
                        'postcode' => $result['postcode'],
                    ];

                    // Add nearby postcodes as additional options
                    foreach ($nearbyResults as $index => $nearby) {
                        if ($index === 0) continue; // Skip the first one as it's the same as the main result
                        if ($index > 5) break; // Limit to 5 nearby addresses

                        $addresses[] = [
                            'id' => $index + 1,
                            'text' => $this->formatAddress($nearby, $index + 1),
                            'postcode' => $nearby['postcode'],
                        ];
                    }

                    return response()->json(['addresses' => $addresses]);
                } else {
                    return response()->json(['error' => 'No data found for this postcode'], 404);
                }
            } else {
                $errorMessage = $response->json()['error'] ?? 'Error from Postcodes.io API';
                Log::error('Postcodes.io API error: ' . $response->body());
                return response()->json(['error' => $errorMessage], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Postcodes.io API exception: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to connect to Postcodes.io API: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Format an address from the Postcodes.io API result.
     *
     * @param  array  $data
     * @param  int  $index
     * @return string
     */
    private function formatAddress($data, $index)
    {
        $addressParts = [];

        // Add a placeholder for the house/building number
        $addressParts[] = "Address " . $index;

        // Add the street if available
        if (!empty($data['admin_district'])) {
            $addressParts[] = $data['admin_district'];
        }

        // Add the locality if available
        if (!empty($data['parish'])) {
            $addressParts[] = $data['parish'];
        } elseif (!empty($data['admin_ward'])) {
            $addressParts[] = $data['admin_ward'];
        }

        // Add the town/city
        if (!empty($data['admin_district'])) {
            $addressParts[] = $data['admin_district'];
        }

        // Add the county
        if (!empty($data['admin_county'])) {
            $addressParts[] = $data['admin_county'];
        }

        // Add the postcode
        if (!empty($data['postcode'])) {
            $addressParts[] = $data['postcode'];
        }

        // Filter out duplicates and empty values, then join with commas
        $addressParts = array_filter($addressParts);
        $addressParts = array_unique($addressParts);

        return implode(', ', $addressParts);
    }
}
