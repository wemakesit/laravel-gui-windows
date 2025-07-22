<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    /**
     * Display the main landing dashboard.
     * Note: Estimates are now stored in WatermelonDB locally, not SQL database.
     * The frontend will handle loading recent estimates from WatermelonDB.
     */
    public function index(): InertiaResponse
    {
        return Inertia::render('Dashboard/Index', [
            'recentEstimates' => [], // Will be loaded from WatermelonDB on frontend
            'statistics' => [
                'total_estimates' => 0, // Will be calculated from WatermelonDB on frontend
                'estimates_this_month' => 0, // Will be calculated from WatermelonDB on frontend
            ],
            'useOfflineMode' => true,
        ]);
    }
}
