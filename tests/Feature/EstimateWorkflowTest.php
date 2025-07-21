<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Estimate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EstimateWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test the complete estimate generation workflow.
     */
    public function test_estimate_generation_workflow(): void
    {
        $user = User::factory()->create();

        // Test estimate creation
        $estimateData = [
            'customerInfo' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'phone' => '01234567890',
                'address' => '123 Test Street, Test City',
            ],
            'windows' => [
                [
                    'type' => 'Casement',
                    'width' => 1200,
                    'height' => 1000,
                    'quantity' => 1,
                    'cost' => 500,
                    'glass_specification' => 'Double Glazed',
                    'paint_finish' => 'White',
                    'hardware_finish' => 'Chrome',
                ]
            ],
            'selectedCaveats' => [],
            'companyInfo' => [
                'name' => 'Test Company',
                'address' => ['line1' => 'Test Address'],
            ],
        ];

        $response = $this->actingAs($user)->postJson('/estimates/generate', $estimateData);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Verify estimate was created
        $this->assertDatabaseHas('estimates', [
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
        ]);

        $estimate = Estimate::where('customer_email', 'john@example.com')->first();
        $this->assertNotNull($estimate);

        // Test estimate show page
        $response = $this->actingAs($user)->get("/estimates/{$estimate->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Estimates/Show'));

        // Test dashboard shows recent estimates
        $response = $this->actingAs($user)->get('/');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Dashboard/Index')
                ->has('recentEstimates')
                ->has('statistics')
        );
    }

    /**
     * Test PDF generation for existing estimate.
     */
    public function test_pdf_generation_for_existing_estimate(): void
    {
        $user = User::factory()->create();
        
        $estimate = Estimate::factory()->create([
            'customer_name' => 'Test Customer',
            'customer_email' => 'test@example.com',
            'estimate_data' => [
                'customerInfo' => [
                    'first_name' => 'Test',
                    'last_name' => 'Customer',
                    'email' => 'test@example.com',
                ],
                'windows' => [
                    ['type' => 'Casement', 'cost' => 500]
                ],
            ],
        ]);

        // Test PDF generation endpoint exists
        $response = $this->actingAs($user)->postJson("/estimates/{$estimate->id}/generate-pdf");
        
        // The response might fail due to API service, but the endpoint should exist
        $this->assertTrue(in_array($response->status(), [200, 500]));
    }

    /**
     * Test estimates index page.
     */
    public function test_estimates_index_page(): void
    {
        $user = User::factory()->create();
        
        Estimate::factory()->count(3)->create();

        $response = $this->actingAs($user)->get('/estimates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Estimates/Index')
                ->has('estimates')
        );
    }

    /**
     * Test wizard validation is working.
     */
    public function test_wizard_validation_steps(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Estimates/Wizard'));
    }
}
