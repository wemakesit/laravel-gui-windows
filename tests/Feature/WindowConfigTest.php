<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WindowConfigTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the window configuration step validates properly.
     */
    public function test_window_config_step_validation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Estimates/Wizard'));
    }

    /**
     * Test that hardware images are not loaded in window config form.
     */
    public function test_hardware_images_removed_from_config(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/estimates/create');

        $response->assertStatus(200);
        // The response should not contain any references to hardware image loading
        $response->assertDontSee('Hardware Preview');
        $response->assertDontSee('via.placeholder.com');
    }
}
