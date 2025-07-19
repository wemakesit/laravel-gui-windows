<?php

namespace App\Http\Controllers;

use App\Models\Estimate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    /**
     * Display the main landing dashboard.
     */
    public function index(): InertiaResponse
    {
        // Get recent estimates for the dashboard
        $recentEstimates = Estimate::with('file')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($estimate) {
                return [
                    'id' => $estimate->id,
                    'reference_number' => $estimate->reference_number,
                    'customer_name' => $estimate->customer_name,
                    'created_at' => $estimate->created_at->format('d/m/Y H:i'),
                    'window_count' => $estimate->window_count,
                    'total_amount' => $estimate->total_amount,
                    'has_file' => $estimate->file !== null,
                ];
            });

        // Get some basic statistics
        $totalEstimates = Estimate::count();
        $estimatesThisMonth = Estimate::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return Inertia::render('Dashboard/Index', [
            'recentEstimates' => $recentEstimates,
            'statistics' => [
                'total_estimates' => $totalEstimates,
                'estimates_this_month' => $estimatesThisMonth,
            ],
        ]);
    }
}
