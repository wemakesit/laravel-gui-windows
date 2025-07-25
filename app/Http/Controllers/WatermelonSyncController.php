<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\WatermelonCustomer;
use App\Models\WatermelonEstimate;
use App\Models\WatermelonWindow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WatermelonSyncController extends Controller
{
    /**
     * Sync a specific estimate with all related data
     */
    public function syncEstimate(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->all();
            Log::info('WatermelonDB: Syncing estimate data', $data);

            // Sync customer first
            if ($data['customer']) {
                $this->syncCustomer($data['customer']);
            }

            // Sync estimate
            if ($data['estimate']) {
                $this->syncEstimateData($data['estimate']);
            }

            // Sync windows
            if (!empty($data['windows'])) {
                foreach ($data['windows'] as $windowData) {
                    $this->syncWindow($windowData);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Estimate synced successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('WatermelonDB: Estimate sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all estimates for frontend
     */
    public function getEstimates(): JsonResponse
    {
        try {
            $estimates = WatermelonEstimate::with(['customer', 'windows'])
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedEstimates = $estimates->map(function ($estimate) {
                return [
                    '_id' => $estimate->watermelon_id,
                    'reference_number' => $estimate->reference_number,
                    'customer_name' => $estimate->customer?->name ?? 'Unknown Customer',
                    'customer_email' => $estimate->customer?->email ?? '',
                    'customer_phone' => $estimate->customer?->phone ?? '',
                    'customer_address' => $estimate->customer?->full_address ?? '',
                    'window_count' => $estimate->windows->count(),
                    'total_amount' => $estimate->final_amount ?? 0,
                    'status' => $estimate->status,
                    'created_at' => $estimate->created_at->toISOString(),
                    'has_file' => !empty($estimate->pdf_url),
                    'synced' => true, // Mark as synced since it's from server
                ];
            });

            return response()->json([
                'success' => true,
                'estimates' => $formattedEstimates,
            ]);

        } catch (\Exception $e) {
            Log::error('WatermelonDB: Failed to get estimates', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get specific estimate details
     */
    public function getEstimate(string $watermelonId): JsonResponse
    {
        try {
            $estimate = WatermelonEstimate::where('watermelon_id', $watermelonId)
                ->with(['customer', 'windows'])
                ->first();

            if (!$estimate) {
                return response()->json([
                    'success' => false,
                    'error' => 'Estimate not found',
                ], 404);
            }

            $estimateData = [
                '_id' => $estimate->watermelon_id,
                'reference_number' => $estimate->reference_number,
                'customer_name' => $estimate->customer?->name ?? 'Unknown Customer',
                'customer_email' => $estimate->customer?->email ?? '',
                'customer_phone' => $estimate->customer?->phone ?? '',
                'customer_address' => $estimate->customer?->full_address ?? '',
                'windows' => $estimate->windows->map(function ($window) {
                    return [
                        'id' => $window->watermelon_id,
                        'room' => $window->room,
                        'windowType' => $window->window_type,
                        'width' => $window->width,
                        'height' => $window->height,
                        'quantity' => $window->quantity,
                        'finish' => $window->finish,
                        'glassType' => $window->glass_type,
                        'openingType' => $window->opening_type,
                        'notes' => $window->notes,

                    ];
                }),
                'total_amount' => $estimate->final_amount ?? 0,
                'status' => $estimate->status,
                'created_at' => $estimate->created_at->toISOString(),
                'has_file' => !empty($estimate->pdf_url),
                'pdf_url' => $estimate->pdf_url,
                'synced' => true,
            ];

            return response()->json([
                'success' => true,
                'estimate' => $estimateData,
            ]);

        } catch (\Exception $e) {
            Log::error('WatermelonDB: Failed to get estimate', [
                'watermelon_id' => $watermelonId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync customer data
     */
    private function syncCustomer(array $customerData): void
    {
        WatermelonCustomer::updateOrCreate(
            ['watermelon_id' => $customerData['watermelon_id']],
            [
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'phone' => $customerData['phone'],
                'address_line_1' => $customerData['address_line_1'],
                'address_line_2' => $customerData['address_line_2'],
                'city' => $customerData['city'],
                'county' => $customerData['county'],
                'postcode' => $customerData['postcode'],
                'country' => $customerData['country'] ?? 'UK',
            ]
        );
    }

    /**
     * Sync estimate data
     */
    private function syncEstimateData(array $estimateData): void
    {
        WatermelonEstimate::updateOrCreate(
            ['watermelon_id' => $estimateData['watermelon_id']],
            [
                'customer_id' => $estimateData['customer_id'],
                'reference_number' => $estimateData['reference_number'],
                'status' => $estimateData['status'],
                'total_amount' => $estimateData['total_amount'],
                'discount_amount' => $estimateData['discount_amount'],
                'vat_amount' => $estimateData['vat_amount'],
                'final_amount' => $estimateData['final_amount'],
                'notes' => $estimateData['notes'],
                'valid_until' => $estimateData['valid_until'] ? new \DateTime($estimateData['valid_until']) : null,
                'pdf_generated_at' => $estimateData['pdf_generated_at'] ? new \DateTime($estimateData['pdf_generated_at']) : null,
                'pdf_url' => $estimateData['pdf_url'],
                'is_synced' => $estimateData['is_synced'] ?? true,
            ]
        );
    }

    /**
     * Sync window data
     */
    private function syncWindow(array $windowData): void
    {
        WatermelonWindow::updateOrCreate(
            ['watermelon_id' => $windowData['watermelon_id']],
            [
                'estimate_id' => $windowData['estimate_id'],
                'room' => $windowData['room'],
                'window_type' => $windowData['window_type'],
                'width' => $windowData['width'],
                'height' => $windowData['height'],
                'quantity' => $windowData['quantity'] ?? 1,
                'finish' => $windowData['finish'],
                'glass_type' => $windowData['glass_type'],
                'opening_type' => $windowData['opening_type'],
                'notes' => $windowData['notes'],

            ]
        );
    }
}
