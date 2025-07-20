<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class OfflineEstimateController extends Controller
{
    /**
     * Display the offline estimates listing page.
     */
    public function index(): InertiaResponse
    {
        return Inertia::render('Estimates/OfflineIndex');
    }

    /**
     * Display a specific offline estimate.
     */
    public function show(string $estimateId): InertiaResponse
    {
        return Inertia::render('Estimates/OfflineShow', [
            'estimateId' => $estimateId,
        ]);
    }
}
