<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    /**
     * Display the main landing dashboard.
     * Note: Estimates are now stored in PouchDB/CouchDB, not SQL database.
     * The frontend will handle loading recent estimates from PouchDB.
     */
    public function index(): InertiaResponse
    {
        return Inertia::render('Dashboard/Index', [
            'recentEstimates' => [], // Will be loaded from PouchDB on frontend
            'statistics' => [
                'total_estimates' => 0, // Will be calculated from PouchDB on frontend
                'estimates_this_month' => 0, // Will be calculated from PouchDB on frontend
            ],
            'usePouchDB' => true,
        ]);
    }
}
