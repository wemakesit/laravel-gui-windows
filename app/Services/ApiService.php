<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Exception;

class ApiService
{
    /**
     * The base URL for the API
     *
     * @var string
     */
    protected string $baseUrl;

    /**
     * The HTTP client instance
     *
     * @var PendingRequest
     */
    protected PendingRequest $client;

    /**
     * Maximum number of retry attempts for API calls
     *
     * @var int
     */
    protected int $maxRetries;

    /**
     * Retry delay in milliseconds
     *
     * @var int
     */
    protected int $retryDelay;

    /**
     * API token for authentication
     *
     * @var string|null
     */
    protected ?string $apiToken;

    /**
     * Create a new API service instance
     *
     * @return void
     */
    public function __construct()
    {
        // Use config instead of env directly for better caching
        $this->baseUrl = Config::get('services.api.base_url', 'http://localhost:8001');
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
     * Process API response with standardized error handling
     *
     * @param string $endpoint The API endpoint that was called
     * @param callable $apiCall The API call function to execute with retry logic
     * @param bool $allowFailure Whether to return an error response instead of throwing an exception
     * @return array<string, mixed> The processed API response
     * @throws RequestException When the API request fails and $allowFailure is false
     */
    protected function processApiCall(string $endpoint, callable $apiCall, bool $allowFailure = true): array
    {
        try {
            // Execute the API call with retry logic
            $response = null;

            for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
                try {
                    $response = $apiCall();
                    break; // If successful, exit the retry loop
                } catch (ConnectionException $e) {
                    if ($attempt === $this->maxRetries) {
                        throw $e; // Rethrow if we've exhausted retries
                    }
                    Log::warning("API connection retry {$attempt}/{$this->maxRetries} for {$endpoint}: {$e->getMessage()}");
                    usleep($this->retryDelay * 1000 * $attempt); // Exponential backoff
                } catch (RequestException $e) {
                    if ($e->response->status() < 500 || $attempt === $this->maxRetries) {
                        throw $e; // Don't retry client errors or if we've exhausted retries
                    }
                    Log::warning("API request retry {$attempt}/{$this->maxRetries} for {$endpoint}: {$e->getMessage()}");
                    usleep($this->retryDelay * 1000 * $attempt); // Exponential backoff
                }
            }

            // If we got here without a response, something went wrong
            if (!$response) {
                throw new Exception("Failed to get response after {$this->maxRetries} attempts");
            }

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
                'headers' => $response->headers()
            ]);

            // If we allow failure, return an error response
            if ($allowFailure) {
                return [
                    'error' => true,
                    'message' => "API call to {$endpoint} failed with status {$response->status()}",
                    'status' => $response->status(),
                    'data' => $response->json() ?? []
                ];
            }

            // Otherwise, throw the exception
            $response->throw();

            // This line will never be reached, but it's here for completeness
            return [];
        } catch (RequestException $e) {
            Log::error("API request exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'status' => $e->response->status() ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);

            if ($allowFailure) {
                return [
                    'error' => true,
                    'message' => $e->getMessage(),
                    'status' => $e->response->status() ?? 500
                ];
            }

            throw $e;
        } catch (ConnectionException $e) {
            Log::error("API connection exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($allowFailure) {
                return [
                    'error' => true,
                    'message' => "Connection error: {$e->getMessage()}",
                    'status' => 503 // Service Unavailable
                ];
            }

            throw $e;
        } catch (Exception $e) {
            Log::error("Unexpected exception for {$endpoint}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($allowFailure) {
                return [
                    'error' => true,
                    'message' => "Unexpected error: {$e->getMessage()}",
                    'status' => 500 // Internal Server Error
                ];
            }

            throw $e;
        }
    }

    /**
     * Get health status of the API
     *
     * @return array<string, mixed> Health status information
     */
    public function getHealth(): array
    {
        return $this->processApiCall('/api/v1/health', function () {
            return $this->client->get('/api/v1/health');
        });
    }

    /**
     * Get company information
     *
     * @return array<string, mixed> Company information data
     */
    public function getCompanyInfo(): array
    {
        return $this->processApiCall('/api/v1/config/company_info', function () {
            return $this->client->get('/api/v1/config/company_info');
        });
    }

    /**
     * Update company information
     *
     * @param array<string, mixed> $data The company information data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateCompanyInfo(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/company_info', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/company_info', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Get window types
     *
     * @return array<string, mixed> Window types data
     */
    public function getWindowTypes(): array
    {
        return $this->processApiCall('/api/v1/config/window_types', function () {
            return $this->client->get('/api/v1/config/window_types');
        });
    }

    /**
     * Update window types
     *
     * @param array<string, mixed> $data The window types data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateWindowTypes(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/window_types', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/window_types', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Get extras
     *
     * @return array<string, mixed> Extras data
     */
    public function getExtras(): array
    {
        return $this->processApiCall('/api/v1/config/extras', function () {
            return $this->client->get('/api/v1/config/extras');
        });
    }

    /**
     * Update extras
     *
     * @param array<string, mixed> $data The extras data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateExtras(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/extras', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/extras', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Get finishes
     *
     * @return array<string, mixed> Finishes data
     */
    public function getFinishes(): array
    {
        $data = $this->processApiCall('/api/v1/config/finishes', function () {
            return $this->client->get('/api/v1/config/finishes');
        });

        // Transform complex objects to simple strings if needed
        if (!isset($data['error']) && isset($data['glass_specifications']) && is_array($data['glass_specifications'])) {
            $transformedGlassSpecs = [];
            foreach ($data['glass_specifications'] as $spec) {
                if (is_array($spec) && isset($spec['name'])) {
                    $transformedGlassSpecs[] = $spec['name'];
                } else {
                    $transformedGlassSpecs[] = $spec;
                }
            }
            $data['glass_specifications'] = $transformedGlassSpecs;
        }

        if (!isset($data['error']) && isset($data['paint_finishes']) && is_array($data['paint_finishes'])) {
            $transformedPaintFinishes = [];
            foreach ($data['paint_finishes'] as $finish) {
                if (is_array($finish) && isset($finish['name'])) {
                    $transformedPaintFinishes[] = $finish['name'];
                } else {
                    $transformedPaintFinishes[] = $finish;
                }
            }
            $data['paint_finishes'] = $transformedPaintFinishes;
        }

        return $data;
    }

    /**
     * Update finishes
     *
     * @param array<string, mixed> $data The finishes data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateFinishes(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/finishes', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/finishes', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Get PDF text configuration
     *
     * @return array<string, mixed> PDF text configuration data
     */
    public function getPdfTextConfig(): array
    {
        return $this->processApiCall('/api/v1/config/pdf_text_config', function () {
            return $this->client->get('/api/v1/config/pdf_text_config');
        });
    }

    /**
     * Get options
     *
     * @return array<string, mixed> Options data
     */
    public function getOptions(): array
    {
        // Try to get options from the API if the endpoint exists
        return $this->processApiCall('/api/v1/config/options', function () {
            return $this->client->get('/api/v1/config/options');
        });
    }


    /**
     * Update options
     *
     * @param array<string, mixed> $data The options data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updateOptions(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/options', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/options', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Update PDF text configuration
     *
     * @param array<string, mixed> $data The PDF text configuration data to update
     * @param bool $partial Whether to perform a partial update (true) or full replacement (false)
     * @return array<string, mixed> The API response with success/error information
     */
    public function updatePdfTextConfig(array $data, bool $partial = true): array
    {
        return $this->processApiCall('/api/v1/config/pdf_text_config', function () use ($data, $partial) {
            return $this->client->put('/api/v1/config/pdf_text_config', [
                'json' => $data,
                'query' => ['partial' => $partial]
            ]);
        }, false);
    }

    /**
     * Generate quotation
     *
     * @param array<string, mixed> $data The quotation data to send to the API
     * @return array<string, mixed> The API response
     */
    public function generateQuotation(array $data): array
    {
        // Log the data being sent to the API for debugging
        Log::info('Sending quotation data to API', ['data' => json_encode($data)]);

        // Ensure options field is properly formatted for each window
        if (isset($data['windows']) && is_array($data['windows'])) {
            foreach ($data['windows'] as &$window) {
                // Ensure options is set (default to 1 if not set)
                if (!isset($window['options'])) {
                    $window['options'] = 1;
                }

                // If options is an empty array, set it to 1
                if (is_array($window['options']) && empty($window['options'])) {
                    $window['options'] = 1;
                }
            }
        }

        try {
            $response = $this->processApiCall('/api/v1/quotations', function () use ($data) {
                return $this->client->post('/api/v1/quotations', [
                    'json' => $data
                ]);
            }, false);

            // If we get here, the API call was successful
            Log::info('Quotation generated successfully');

            // Get the raw response from the client
            $rawResponse = $this->client->post('/api/v1/quotations', [
                'json' => $data
            ]);

            return [
                'success' => true,
                'data' => $rawResponse->body(),
                'headers' => $rawResponse->headers()
            ];
        } catch (RequestException $e) {
            Log::error('API returned error for quotation generation', [
                'status' => $e->response->status(),
                'error' => $e->response->json()
            ]);

            return [
                'success' => false,
                'error' => $e->response->json()
            ];
        } catch (Exception $e) {
            Log::error('Generate Quotation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
