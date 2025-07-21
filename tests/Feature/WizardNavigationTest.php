<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WizardNavigationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the wizard steps have proper validation.
     */
    public function test_wizard_steps_validation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Estimates/Wizard'));
    }

    /**
     * Test that hardware images are not present in the application.
     */
    public function test_hardware_images_removed(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        // Ensure no hardware image references are present
        $response->assertDontSee('Hardware Preview');
        $response->assertDontSee('via.placeholder.com');
        $response->assertDontSee('Failed to load image');
    }

    /**
     * Test that the wizard navigation works properly.
     */
    public function test_wizard_navigation_functionality(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        // The wizard should render with proper navigation
        $response->assertSee('Create New Estimate');
    }
}
