<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * API Service for interacting with the external API
 *
 * This service provides methods for communicating with the external API,
 * handling authentication, retries, error handling, and response formatting.
 * It uses Laravel's HTTP client for all API interactions.
 */
class ApiService
{
    /**
     * The base URL for the API
     */
    protected string $baseUrl;

    /**
     * The HTTP client instance
     */
    protected PendingRequest $client;

    /**
     * Maximum number of retry attempts for API calls
     */
    protected int $maxRetries;

    /**
     * Retry delay in milliseconds
     */
    protected int $retryDelay;

    /**
     * API token for authentication
     */
    protected ?string $apiToken;

    /**
     * Create a new API service instance
     *
     * Initializes the service with configuration from the services.api config.
     * Sets up the HTTP client with appropriate headers, timeout, and authentication.
     *
     * @return void
     */
    public function __construct()
    {
        // Use config instead of env directly for better caching
        $this->baseUrl = Config::get('services.api.base_url', 'http://localhost:8000');
        $this->maxRetries = Config::get('services.api.max_retries', 3);
        $this->retryDelay = Config::get('services.api.retry_delay', 100);
        $this->apiToken = Config::get('services.api.token');

        // Configure HTTP client with more detailed options
        $this->client = Http::baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30)
            ->withOptions([
                'verify' => Config::get('services.api.verify_ssl', false),
                'connect_timeout' => Config::get('services.api.connect_timeout', 5),
            ]);

        // Add API token if available
        if ($this->apiToken) {
            $this->client = $this->client->withToken($this->apiToken);
        }

        Log::info('ApiService initialized', ['base_url' => $this->baseUrl]);
    }

    /**
     * Execute a callable with retry logic and exponential backoff
     *
     * @param  string  $endpoint  The API endpoint being called (for logging)
     * @param  callable  $apiCall  The API call function to execute
     * @return mixed The response from the API call
     *
     * @throws RequestException When the API request fails after all retries
     * @throws ConnectionException When a connection error occurs after all retries
     * @throws Exception When an unexpected error occurs
     */
    protected function executeWithRetry(string $endpoint, callable $apiCall)
    {
        $response = null;
        $attempt = 1;
        $maxAttempts = $this->maxRetries;

        while ($attempt <= $maxAttempts) {
            try {
                $response = $apiCall();
                break; // If successful, exit the retry loop
            } catch (ConnectionException $e) {
                if ($attempt === $maxAttempts) {
                    throw $e; // Rethrow if we've exhausted retries
                }

                Log::warning("API connection retry {$attempt}/{$maxAttempts} for {$endpoint}: {$e->getMessage()}");

                // Calculate exponential backoff delay
                $delay = $this->retryDelay * pow(2, $attempt - 1);
                usleep($delay * 1000); // Convert to microseconds
                $attempt++;
            } catch (RequestException $e) {
                // Only retry on server errors (5xx)
                if (! $e->response || $e->response->status() < 500 || $attempt === $maxAttempts) {
                    throw $e; // Don't retry client errors or if we've exhausted retries
                }

                Log::warning("API request retry {$attempt}/{$maxAttempts} for {$endpoint}: {$e->getMessage()}");

                // Calculate exponential backoff delay
                $delay = $this->retryDelay * pow(2, $attempt - 1);
                usleep($delay * 1000); // Convert to microseconds
                $attempt++;
            }
        }

        // If we got here without a response, something went wrong
        if (! $response) {
            throw new Exception("Failed to get response after {$maxAttempts} attempts");
        }

        return $response;
    }

    /**
     * Process API response with standardized error handling
     *
     * @param  string  $endpoint  The API endpoint that was called
     * @param  callable  $apiCall  The API call function to execute with retry logic
     * @param  bool  $allowFailure  Whether to return an error response instead of throwing an exception
     * @return array<string, mixed> The processed API response
     *
     * @throws RequestException When the API request fails and $allowFailure is false
     * @throws ConnectionException When a connection error occurs and $allowFailure is false
     * @throws Exception When an unexpected error occurs and $allowFailure is false
     */
    protected function processApiCall(string $endpoint, callable $apiCall, bool $allowFailure = true): array
    {
        try {
            // Execute the API call with retry logic
            $response = $this->executeWithRetry($endpoint, $apiCall);

            // Check if the response is successful
            if ($response->successful()) {
                $data = $response->json() ?? [];
                Log::debug("API call to {$endpoint} successful", ['status' => $response->status()]);

                return $data;
            }

            // Log the error response
            Log::error("API call to {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
            ]);

            // If we allow failure, return an error response
            if ($allowFailure) {
                return $this->createErrorResponse(
                    "API call to {$endpoint} failed with status {$response->status()}",
                    $response->status(),
                    $response->json() ?? []
                );
            }

            // Otherwise, throw the exception
            $response->throw();

            // This line will never be reached, but it's here for completeness
            return [];
        } catch (RequestException $e) {
            $statusCode = 500;
            $responseData = [];

            if ($e->response) {
                $statusCode = $e->response->status();
                try {
                    $responseData = $e->response->json() ?? [];
                } catch (Exception $jsonException) {
                    // If JSON parsing fails, just use an empty array
                    $responseData = [];
                }
            }

            Log::error("API request exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'status' => $statusCode,
                'trace' => $e->getTraceAsString(),
            ]);

            if ($allowFailure) {
                return $this->createErrorResponse(
                    $e->getMessage(),
                    $statusCode,
                    $responseData
                );
            }

            throw $e;
        } catch (ConnectionException $e) {
            Log::error("API connection exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($allowFailure) {
                return $this->createErrorResponse(
                    "Connection error: {$e->getMessage()}",
                    503 // Service Unavailable
                );
            }

            throw $e;
        } catch (Exception $e) {
            Log::error("Unexpected exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($allowFailure) {
                return $this->createErrorResponse(
                    "Unexpected error: {$e->getMessage()}",
                    500 // Internal Server Error
                );
            }

            throw $e;
        }
    }

    /**
     * Create a standardized error response array
     *
     * @param  string  $message  The error message
     * @param  int  $status  The HTTP status code
     * @param  array<string, mixed>  $data  Additional data to include in the response
     * @return array<string, mixed> The formatted error response
     */
    protected function createErrorResponse(string $message, int $status, array $data = []): array
    {
        $response = [
            'error' => true,
            'message' => $message,
            'status' => $status,
        ];

        if (! empty($data)) {
            $response['data'] = $data;
        }

        return $response;
    }

    /**
     * Perform a standardized GET request to the API
     *
     * @param  string  $endpoint  The API endpoint to call
     * @return array<string, mixed> The API response data
     */
    protected function performGetRequest(string $endpoint): array
    {
        return $this->processApiCall($endpoint, function () use ($endpoint) {
            return $this->client->get($endpoint);
        });
    }

    /**
     * Get health status of the API
     *
     * @return array<string, mixed> Health status information
     */
    public function getHealth(): array
    {
        return $this->performGetRequest('/api/v1/health');
    }

    /**
     * Get company information
     *
     * @return array<string, mixed> Company information data
     */
    public function getCompanyInfo(): array
    {
        return $this->performGetRequest('/api/v1/config/company_info');
    }

    /**
     * Perform a standardized update request to the API
     *
     * @param  string  $endpoint  The API endpoint to call
     * @param  array<string, mixed>  $data  The data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    protected function performUpdateRequest(string $endpoint, array $data, bool $partial = true): array
    {
        return $this->processApiCall($endpoint, function () use ($endpoint, $data, $partial) {
            return $this->client->put($endpoint, [
                'json' => $data,
                'query' => ['partial' => $partial],
            ]);
        }, false);
    }

    /**
     * Update company information
     *
     * @param  array<string, mixed>  $data  The company information data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateCompanyInfo(array $data, bool $partial = true): array
    {
        return $this->performUpdateRequest('/api/v1/config/company_info', $data, $partial);
    }

    /**
     * Get window types with caching
     *
     * @return array<string, mixed> Window types data
     */
    public function getWindowTypes(): array
    {
        // Try to get from cache first
        if (\Illuminate\Support\Facades\Cache::has('window_types')) {
            $cachedData = \Illuminate\Support\Facades\Cache::get('window_types');
            Log::debug('Retrieved window types from cache');

            return $cachedData;
        }

        try {
            // If not in cache, fetch from API
            $data = $this->performGetRequest('/api/v1/config/window_types');

            // Check if the data has the expected structure
            if (! isset($data['window_types']) || ! is_array($data['window_types']) || empty($data['window_types'])) {
                Log::warning('API returned invalid window types data structure', ['data' => $data]);
                $data = $this->getDefaultWindowTypes();
            }

            // Cache the data for 24 hours
            \Illuminate\Support\Facades\Cache::put('window_types', $data, 60 * 24);
            Log::debug('Cached window types data');

            return $data;
        } catch (\Exception $e) {
            Log::error('Failed to fetch window types from API', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return default window types if API call fails
            return $this->getDefaultWindowTypes();
        }
    }

    /**
     * Get default window types when API call fails
     *
     * @return array<string, mixed> Default window types data
     */
    protected function getDefaultWindowTypes(): array
    {
        return [
            'window_types' => [
                [
                    'Type' => 'Softwood Sash Window S',
                    'Description' => 'Standard softwood sash window - small size',
                    'Cost' => 1350.0,
                    'BasePrice' => 1350.0,
                ],
                [
                    'Type' => 'Softwood Sash Window M',
                    'Description' => 'Standard softwood sash window - medium size',
                    'Cost' => 1500.0,
                    'BasePrice' => 1500.0,
                ],
                [
                    'Type' => 'Softwood Sash Window L',
                    'Description' => 'Standard softwood sash window - large size',
                    'Cost' => 1700.0,
                    'BasePrice' => 1700.0,
                ],
                [
                    'Type' => 'Softwood Casement Window',
                    'Description' => 'Standard softwood casement window',
                    'Cost' => 1200.0,
                    'BasePrice' => 1200.0,
                ],
            ],
        ];
    }

    /**
     * Update window types
     *
     * @param  array<string, mixed>  $data  The window types data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateWindowTypes(array $data, bool $partial = true): array
    {
        $result = $this->performUpdateRequest('/api/v1/config/window_types', $data, $partial);

        // Clear the cache after updating
        \Illuminate\Support\Facades\Cache::forget('window_types');
        Log::debug('Cleared window types cache after update');

        return $result;
    }

    /**
     * Get extras
     *
     * @return array<string, mixed> Extras data
     */
    public function getExtras(): array
    {
        return $this->performGetRequest('/api/v1/config/extras');
    }

    /**
     * Update extras
     *
     * @param  array<string, mixed>  $data  The extras data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateExtras(array $data, bool $partial = true): array
    {
        return $this->performUpdateRequest('/api/v1/config/extras', $data, $partial);
    }

    /**
     * Transform complex objects to simple strings
     *
     * @param  array<string, mixed>  $data  The data containing complex objects
     * @param  string  $key  The key of the array to transform
     * @return array<string, mixed> The data with transformed values
     */
    protected function transformComplexObjectsToStrings(array $data, string $key): array
    {
        if (! isset($data['error']) && isset($data[$key]) && is_array($data[$key])) {
            $transformed = [];
            foreach ($data[$key] as $item) {
                if (is_array($item) && isset($item['name'])) {
                    $transformed[] = $item['name'];
                } else {
                    $transformed[] = $item;
                }
            }
            $data[$key] = $transformed;
        }

        return $data;
    }

    /**
     * Get finishes
     *
     * @return array<string, mixed> Finishes data with transformed complex objects
     */
    public function getFinishes(): array
    {
        $data = $this->performGetRequest('/api/v1/config/finishes');

        // Transform complex objects to simple strings
        $data = $this->transformComplexObjectsToStrings($data, 'glass_specifications');
        $data = $this->transformComplexObjectsToStrings($data, 'paint_finishes');

        return $data;
    }

    /**
     * Update finishes
     *
     * @param  array<string, mixed>  $data  The finishes data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateFinishes(array $data, bool $partial = true): array
    {
        return $this->performUpdateRequest('/api/v1/config/finishes', $data, $partial);
    }

    /**
     * Get PDF text configuration
     *
     * @return array<string, mixed> PDF text configuration data
     */
    public function getPdfTextConfig(): array
    {
        return $this->performGetRequest('/api/v1/config/pdf_text_config');
    }

    /**
     * Get options
     *
     * @return array<string, mixed> Options data or default options if endpoint doesn't exist
     */
    public function getOptions(): array
    {
        try {
            // Try to get options from the API directly (not using performGetRequest)
            // so we can catch and handle the 404 error
            $response = $this->executeWithRetry('/api/v1/config/options', function () {
                return $this->client->get('/api/v1/config/options');
            });

            if ($response->successful()) {
                return $response->json() ?? [];
            }

            // If we get a 404, return default options
            if ($response->status() === 404) {
                Log::info('Options endpoint not found, returning default options');

                return [
                    'options' => [
                        ['id' => 1, 'name' => 'Option 1'],
                        ['id' => 2, 'name' => 'Option 2'],
                        ['id' => 3, 'name' => 'Option 3'],
                        ['id' => 4, 'name' => 'Option 4'],
                        ['id' => 5, 'name' => 'Option 5'],
                    ],
                ];
            }

            // For other error statuses, return an error response
            return $this->createErrorResponse(
                "API call to /api/v1/config/options failed with status {$response->status()}",
                $response->status(),
                $response->json() ?? []
            );
        } catch (RequestException $e) {
            // If the endpoint doesn't exist (404), return a default structure
            if ($e->response && $e->response->status() === 404) {
                Log::info('Options endpoint not found, returning default options');

                return [
                    'options' => [
                        ['id' => 1, 'name' => 'Option 1'],
                        ['id' => 2, 'name' => 'Option 2'],
                        ['id' => 3, 'name' => 'Option 3'],
                        ['id' => 4, 'name' => 'Option 4'],
                        ['id' => 5, 'name' => 'Option 5'],
                    ],
                ];
            }

            // For other errors, return an error response
            $statusCode = $e->response ? $e->response->status() : 500;

            return $this->createErrorResponse(
                $e->getMessage(),
                $statusCode,
                $e->response ? ($e->response->json() ?? []) : []
            );
        } catch (Exception $e) {
            // For unexpected errors, return an error response
            return $this->createErrorResponse(
                "Unexpected error: {$e->getMessage()}",
                500
            );
        }
    }

    /**
     * Update options
     *
     * @param  array<string, mixed>  $data  The options data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateOptions(array $data, bool $partial = true): array
    {
        return $this->performUpdateRequest('/api/v1/config/options', $data, $partial);
    }

    /**
     * Update PDF text configuration
     *
     * @param  array<string, mixed>  $data  The PDF text configuration data to update
     * @param  bool  $partial  Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updatePdfTextConfig(array $data, bool $partial = true): array
    {
        return $this->performUpdateRequest('/api/v1/config/pdf_text_config', $data, $partial);
    }

    /**
     * Format window options to ensure they are properly structured
     *
     * @param  array<string, mixed>  $data  The estimate data containing windows
     * @return array<string, mixed> The data with properly formatted window options
     */
    protected function formatWindowOptions(array $data): array
    {
        if (isset($data['windows']) && is_array($data['windows'])) {
            foreach ($data['windows'] as &$window) {
                // Ensure options is set (default to [1] if not set)
                if (! isset($window['options'])) {
                    $window['options'] = [1];
                }

                // If options is a single integer, convert it to an array
                if (is_numeric($window['options'])) {
                    $window['options'] = [(int) $window['options']];
                }

                // If options is an empty array, set it to [1]
                if (is_array($window['options']) && empty($window['options'])) {
                    $window['options'] = [1];
                }

                // If options is a string representation of an array (from form data), convert it to an actual array
                if (is_string($window['options']) && strpos($window['options'], ',') !== false) {
                    $window['options'] = array_map('intval', explode(',', $window['options']));
                }

                // Ensure all option IDs are integers
                if (is_array($window['options'])) {
                    $window['options'] = array_map('intval', $window['options']);
                }
            }
        }

        return $data;
    }

    /**
     * Generate estimate PDF from the API
     *
     * @param  array<string, mixed>  $data  The estimate data to send to the API
     * @return array<string, mixed> The API response with PDF data or error information
     */
    public function generateEstimate(array $data): array
    {
        $endpoint = '/api/v1/quotations';

        // Log the data being sent to the API for debugging
        Log::info('Sending estimate data to API', ['data' => json_encode($data)]);

        // Format window options
        $data = $this->formatWindowOptions($data);

        // Prepare the data for the API
        $requestData = [
            'customer_details' => $data['customer_details'] ?? null,
            'windows' => $data['windows'] ?? [],
            'selected_caveats' => $data['selected_caveats'] ?? null,
        ];

        // Add company_info if it exists
        if (isset($data['company_info'])) {
            $requestData['company_info'] = $data['company_info'];
        }

        // Log the formatted data being sent to the API
        Log::info('Formatted data for API', ['data' => json_encode($requestData)]);

        try {
            // Create a custom HTTP client instance for PDF response
            $pdfClient = $this->client->withHeaders(['Accept' => 'application/pdf']);

            // Execute the API call with retry logic
            $response = $this->executeWithRetry($endpoint, function () use ($pdfClient, $endpoint, $requestData) {
                return $pdfClient->post($endpoint, $requestData);
            });

            // Check if the request was successful
            if ($response->successful()) {
                // Get the response body (PDF content) and headers
                $pdfContent = $response->body();
                $contentType = $response->header('Content-Type');

                // Log success
                Log::info('Estimate generated successfully');

                // Return success response with PDF data
                return [
                    'success' => true,
                    'data' => $pdfContent,
                    'headers' => ['Content-Type' => $contentType],
                ];
            }

            // If we get here, the API returned an error status code
            Log::error('API returned error for estimate generation', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => 'API returned error: '.$response->status(),
                'status' => $response->status(),
            ];
        } catch (RequestException $e) {
            $statusCode = 500;
            $errorMessage = $e->getMessage();
            $responseData = [];

            // Try to get more detailed error information if available
            if ($e->response) {
                $statusCode = $e->response->status();
                $errorBody = $e->response->body();

                // Try to parse JSON error response
                try {
                    $errorData = json_decode($errorBody, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $responseData = $errorData;
                        if (isset($errorData['detail'])) {
                            $errorMessage = is_string($errorData['detail'])
                                ? $errorData['detail']
                                : json_encode($errorData['detail']);
                        }
                    }
                } catch (Exception $jsonException) {
                    // If JSON parsing fails, use the original error message
                }
            }

            Log::error('API request exception for estimate generation', [
                'message' => $errorMessage,
                'status' => $statusCode,
                'trace' => $e->getTraceAsString(),
                'response_data' => $responseData,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
                'status' => $statusCode,
                'data' => $responseData,
            ];
        } catch (ConnectionException $e) {
            Log::error('API connection exception for estimate generation', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Connection error: '.$e->getMessage(),
                'status' => 503, // Service Unavailable
            ];
        } catch (Exception $e) {
            Log::error('Unexpected exception for estimate generation', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 500, // Internal Server Error
            ];
        }
    }
}
