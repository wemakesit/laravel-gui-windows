<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsNavigationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the settings page is accessible for authenticated users.
     */
    public function test_settings_page_is_accessible_for_authenticated_users(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Settings/Index'));
    }

    /**
     * Test that the settings page redirects unauthenticated users to login.
     */
    public function test_settings_page_redirects_unauthenticated_users(): void
    {
        $response = $this->get('/settings');

        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /**
     * Test that the dashboard contains a link to settings.
     */
    public function test_dashboard_contains_settings_link(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200);
        $response->assertSee('/settings');
    }

    /**
     * Test that the main navigation contains a settings link.
     */
    public function test_navigation_contains_settings_link(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200);
        // The settings link should be present in the navigation
        $response->assertSee('Settings');
    }

    /**
     * Test that settings route is properly named and accessible.
     */
    public function test_settings_route_is_properly_named(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('settings.index'));

        $response->assertStatus(200);
    }
}
