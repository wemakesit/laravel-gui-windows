<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Log;

class ApiService
{
    protected string $baseUrl;
    protected PendingRequest $client;

    public function __construct()
    {
        // Use environment variable if available, otherwise default to localhost:8001
        $this->baseUrl = env('API_BASE_URL', 'http://localhost:8001');

        // Configure HTTP client with more detailed options
        $this->client = Http::baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30)
            ->withOptions([
                'verify' => false, // Disable SSL verification for local development
                'connect_timeout' => 5, // Set connection timeout
            ]);

        Log::info('ApiService initialized with base URL: ' . $this->baseUrl);
    }

    /**
     * Get health status of the API
     */
    public function getHealth()
    {
        try {
            $response = $this->client->get('/api/v1/health');
            return $response->json();
        } catch (\Exception $e) {
            Log::error('API Health Check Error: ' . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Get company information
     */
    public function getCompanyInfo()
    {
        try {
            $response = $this->client->get('/api/v1/config/company_info');
            $data = $response->json();

            if (isset($data['error'])) {
                return $this->getMockCompanyInfo();
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Get Company Info Error: ' . $e->getMessage());
            return $this->getMockCompanyInfo();
        }
    }

    /**
     * Get mock company info data
     */
    private function getMockCompanyInfo()
    {
        return [
            'name' => 'Premium Windows Ltd',
            'address' => [
                'line1' => '123 Window Street',
                'line2' => 'London, SW1A 1AA',
                'country' => 'United Kingdom'
            ],
            'contact' => [
                'phone' => '020 1234 5678',
                'email' => 'info@premiumwindows.example.com',
                'website' => 'www.premiumwindows.example.com'
            ],
            'registration' => [
                'company_number' => '12345678',
                'vat_number' => 'GB123456789'
            ],
            'logo' => 'images/logo.png'
        ];
    }

    /**
     * Update company information
     */
    public function updateCompanyInfo(array $data, bool $partial = true)
    {
        try {
            $response = $this->client->put('/api/v1/config/company_info', $data, [
                'query' => ['partial' => $partial]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Update Company Info Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get window types
     */
    public function getWindowTypes()
    {
        try {
            $response = $this->client->get('/api/v1/config/window_types');
            $data = $response->json();

            // If there's an error or the API returns an error response, use mock data
            if (isset($data['error']) || !$response->successful()) {
                Log::warning('Using mock window types data due to API error');
                return $this->getMockWindowTypes();
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Get Window Types Error: ' . $e->getMessage());
            return $this->getMockWindowTypes();
        }
    }

    /**
     * Get mock window types data
     */
    private function getMockWindowTypes()
    {
        return [
            'window_types' => [
                [
                    'Type' => 'Softwood Sash Window S',
                    'Description' => 'Softwood Sash Window with traditional styling',
                    'BasePrice' => 1350.0
                ],
                [
                    'Type' => 'Softwood Casement Window S',
                    'Description' => 'Softwood Casement Window with traditional styling',
                    'BasePrice' => 1150.0
                ],
                [
                    'Type' => 'Accoya Sash Window S',
                    'Description' => 'Accoya Sash Window with traditional styling',
                    'BasePrice' => 1850.0
                ],
                [
                    'Type' => 'Accoya Casement Window S',
                    'Description' => 'Accoya Casement Window with traditional styling',
                    'BasePrice' => 1650.0
                ]
            ]
        ];
    }

    /**
     * Update window types
     */
    public function updateWindowTypes(array $data, bool $partial = true)
    {
        try {
            $response = $this->client->put('/api/v1/config/window_types', $data, [
                'query' => ['partial' => $partial]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Update Window Types Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get extras
     */
    public function getExtras()
    {
        try {
            $response = $this->client->get('/api/v1/config/extras');
            $data = $response->json();

            if (isset($data['error'])) {
                return $this->getMockExtras();
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Get Extras Error: ' . $e->getMessage());
            return $this->getMockExtras();
        }
    }

    /**
     * Get mock extras data
     */
    private function getMockExtras()
    {
        return [
            'extras' => [
                [
                    'Name' => 'Satin Glass',
                    'Description' => 'Privacy glass with a frosted appearance',
                    'Cost' => 50.0
                ],
                [
                    'Name' => 'Sapele Hardwood Sill',
                    'Description' => 'Premium hardwood sill for enhanced durability',
                    'Cost' => 135.0
                ],
                [
                    'Name' => 'Windowboard',
                    'Description' => 'Interior windowboard to match your window',
                    'Cost' => 66.0
                ]
            ]
        ];
    }

    /**
     * Update extras
     */
    public function updateExtras(array $data, bool $partial = true)
    {
        try {
            $response = $this->client->put('/api/v1/config/extras', $data, [
                'query' => ['partial' => $partial]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Update Extras Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get finishes
     */
    public function getFinishes()
    {
        try {
            $response = $this->client->get('/api/v1/config/finishes');
            $data = $response->json();

            if (isset($data['error'])) {
                return $this->getMockFinishes();
            }

            // Transform complex objects to simple strings if needed
            if (isset($data['glass_specifications']) && is_array($data['glass_specifications'])) {
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

            if (isset($data['paint_finishes']) && is_array($data['paint_finishes'])) {
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
        } catch (\Exception $e) {
            Log::error('Get Finishes Error: ' . $e->getMessage());
            return $this->getMockFinishes();
        }
    }

    /**
     * Get mock finishes data
     */
    private function getMockFinishes()
    {
        return [
            'glass_specifications' => [
                '24mm Double Glazed Unit',
                '28mm Triple Glazed Unit',
                'Acoustic Glass',
                'Low-E Glass'
            ],
            'paint_finishes' => [
                'White',
                'Cream',
                'Green',
                'Black',
                'Grey'
            ],
            'hardware_finishes' => [
                [
                    'name' => 'Polished Brass',
                    'images' => [
                        'sash' => [
                            'images/ironmongery/sash/brass/sash-fastener.jpg',
                            'images/ironmongery/sash/brass/sash-lift.jpg'
                        ],
                        'casement' => [
                            'images/ironmongery/casement/brass/casement-handle.jpg',
                            'images/ironmongery/casement/brass/casement-lock.jpg'
                        ]
                    ]
                ],
                [
                    'name' => 'Chrome',
                    'images' => [
                        'sash' => [
                            'images/ironmongery/sash/chrome/sash-fastener.jpg',
                            'images/ironmongery/sash/chrome/sash-lift.jpg'
                        ],
                        'casement' => [
                            'images/ironmongery/casement/chrome/casement-handle.jpg',
                            'images/ironmongery/casement/chrome/casement-lock.jpg'
                        ]
                    ]
                ],
                [
                    'name' => 'Satin Chrome',
                    'images' => [
                        'sash' => [
                            'images/ironmongery/sash/satin/sash-fastener.jpg',
                            'images/ironmongery/sash/satin/sash-lift.jpg'
                        ],
                        'casement' => [
                            'images/ironmongery/casement/satin/casement-handle.jpg',
                            'images/ironmongery/casement/satin/casement-lock.jpg'
                        ]
                    ]
                ]
            ]
        ];
    }

    /**
     * Update finishes
     */
    public function updateFinishes(array $data, bool $partial = true)
    {
        try {
            $response = $this->client->put('/api/v1/config/finishes', $data, [
                'query' => ['partial' => $partial]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Update Finishes Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get PDF text configuration
     */
    public function getPdfTextConfig()
    {
        try {
            $response = $this->client->get('/api/v1/config/pdf_text_config');
            $data = $response->json();

            if (isset($data['error'])) {
                return $this->getMockPdfTextConfig();
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Get PDF Text Config Error: ' . $e->getMessage());
            return $this->getMockPdfTextConfig();
        }
    }

    /**
     * Get mock PDF text config data
     */
    private function getMockPdfTextConfig()
    {
        return [
            'header' => 'Thank you for choosing Premium Windows',
            'footer' => 'All our windows come with a 10-year guarantee',
            'terms_and_conditions' => [
                'This quotation is valid for 30 days from the date of issue.',
                'A 50% deposit is required to confirm your order.',
                'The balance is due on completion of installation.',
                'All measurements are subject to survey.',
                'Delivery times may vary depending on material availability.'
            ],
            'formats' => [
                'date_format' => 'd/m/Y',
                'currency_symbol' => '£',
                'vat_rate' => 0.2
            ]
        ];
    }

    /**
     * Update PDF text configuration
     */
    public function updatePdfTextConfig(array $data, bool $partial = true)
    {
        try {
            $response = $this->client->put('/api/v1/config/pdf_text_config', $data, [
                'query' => ['partial' => $partial]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Update PDF Text Config Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate quotation
     */
    public function generateQuotation(array $data)
    {
        try {
            $response = $this->client->post('/api/v1/quotations', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->body(),
                    'headers' => $response->headers()
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()
            ];
        } catch (\Exception $e) {
            Log::error('Generate Quotation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
