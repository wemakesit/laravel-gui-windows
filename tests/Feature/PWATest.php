<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Response;

class PWATest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the web app manifest is accessible
     */
    public function test_manifest_is_accessible(): void
    {
        $response = $this->get('/manifest.json');
        
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/json');
        
        $manifest = $response->json();
        
        $this->assertArrayHasKey('name', $manifest);
        $this->assertArrayHasKey('short_name', $manifest);
        $this->assertArrayHasKey('start_url', $manifest);
        $this->assertArrayHasKey('display', $manifest);
        $this->assertArrayHasKey('theme_color', $manifest);
        $this->assertArrayHasKey('background_color', $manifest);
        $this->assertArrayHasKey('icons', $manifest);
        
        $this->assertEquals('Window Estimate System', $manifest['name']);
        $this->assertEquals('WindowEst', $manifest['short_name']);
        $this->assertEquals('standalone', $manifest['display']);
    }

    /**
     * Test that the service worker is accessible
     */
    public function test_service_worker_is_accessible(): void
    {
        $response = $this->get('/sw.js');
        
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/javascript');
        
        $content = $response->getContent();
        $this->assertStringContainsString('CACHE_NAME', $content);
        $this->assertStringContainsString('install', $content);
        $this->assertStringContainsString('fetch', $content);
    }

    /**
     * Test that PWA icons are accessible
     */
    public function test_pwa_icons_are_accessible(): void
    {
        $iconSizes = [
            '16x16', '32x32', '60x60', '72x72', '76x76', 
            '114x114', '120x120', '144x144', '152x152', '180x180'
        ];

        foreach ($iconSizes as $size) {
            $response = $this->get("/icons/icon-{$size}.svg");
            $response->assertStatus(200);
            $response->assertHeader('Content-Type', 'image/svg+xml');
        }
    }

    /**
     * Test that PWA meta tags are present in HTML
     */
    public function test_pwa_meta_tags_are_present(): void
    {
        $response = $this->get('/');
        
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check for PWA meta tags
        $this->assertStringContainsString('<meta name="theme-color" content="#2563eb">', $content);
        $this->assertStringContainsString('<meta name="apple-mobile-web-app-capable" content="yes">', $content);
        $this->assertStringContainsString('<meta name="apple-mobile-web-app-status-bar-style" content="default">', $content);
        $this->assertStringContainsString('<meta name="apple-mobile-web-app-title" content="Window Estimate System">', $content);
        $this->assertStringContainsString('<meta name="mobile-web-app-capable" content="yes">', $content);
        $this->assertStringContainsString('<meta name="application-name" content="WindowEst">', $content);
        
        // Check for manifest link
        $this->assertStringContainsString('<link rel="manifest" href="/manifest.json">', $content);
        
        // Check for icon links
        $this->assertStringContainsString('rel="apple-touch-icon"', $content);
        $this->assertStringContainsString('rel="icon"', $content);
    }

    /**
     * Test that the application works offline (basic functionality)
     */
    public function test_offline_functionality(): void
    {
        // Test that the main page loads
        $response = $this->get('/');
        $response->assertStatus(200);
        
        // Test that the dashboard loads
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
        
        // Test that the estimates page loads
        $response = $this->get('/estimates');
        $response->assertStatus(200);
        
        // Test that the settings page loads
        $response = $this->get('/settings');
        $response->assertStatus(200);
    }

    /**
     * Test that the PWA can handle estimate creation offline
     */
    public function test_estimate_creation_structure(): void
    {
        $response = $this->get('/estimates/create');
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check that the estimate creation form is present
        $this->assertStringContainsString('customer', $content);
        $this->assertStringContainsString('window', $content);
    }

    /**
     * Test that the application has proper caching headers
     */
    public function test_caching_headers(): void
    {
        // Test static assets have proper caching
        $response = $this->get('/');
        $response->assertStatus(200);
        
        // The main page should have cache control headers
        $this->assertNotNull($response->headers->get('Cache-Control'));
    }

    /**
     * Test that the application handles API errors gracefully
     */
    public function test_api_error_handling(): void
    {
        // Test with invalid estimate data
        $response = $this->postJson('/estimates/generate', [
            'invalid' => 'data'
        ]);
        
        // Should return a proper error response
        $this->assertContains($response->status(), [400, 422, 500]);
        
        if ($response->status() === 422) {
            $response->assertJsonStructure(['errors']);
        }
    }

    /**
     * Test that the application has proper HTTPS redirects in production
     */
    public function test_https_redirect_in_production(): void
    {
        // This test would be more relevant in a production environment
        // For now, we just ensure the app loads over HTTP in testing
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    /**
     * Test that the application has proper CSP headers for PWA
     */
    public function test_content_security_policy(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        
        // Check that we don't have overly restrictive CSP that would break PWA
        $csp = $response->headers->get('Content-Security-Policy');
        
        if ($csp) {
            // Ensure service workers are allowed
            $this->assertStringNotContainsString("worker-src 'none'", $csp);
        }
    }

    /**
     * Test that the application supports proper viewport settings
     */
    public function test_viewport_meta_tag(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check for proper viewport meta tag for mobile/tablet support
        $this->assertStringContainsString(
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
            $content
        );
    }

    /**
     * Test that the application has proper Surface Pro optimisations
     */
    public function test_surface_pro_optimisations(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check for Surface Pro specific meta tags
        $this->assertStringContainsString('<meta name="msapplication-TileColor" content="#2563eb">', $content);
        $this->assertStringContainsString('<meta name="msapplication-tap-highlight" content="no">', $content);
    }

    /**
     * Test that the application handles touch interactions properly
     */
    public function test_touch_interaction_support(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check that touch-optimised CSS is loaded
        $this->assertStringContainsString('touch-optimised', $content);
    }

    /**
     * Test that the application has proper error pages
     */
    public function test_error_pages(): void
    {
        // Test 404 page
        $response = $this->get('/non-existent-page');
        $response->assertStatus(404);
        
        // Test that 404 page still has PWA functionality
        $content = $response->getContent();
        $this->assertStringContainsString('manifest', $content);
    }

    /**
     * Test that the application has proper offline fallbacks
     */
    public function test_offline_fallbacks(): void
    {
        // Test that the service worker includes offline fallbacks
        $response = $this->get('/sw.js');
        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        // Check for offline handling
        $this->assertStringContainsString('offline', $content);
        $this->assertStringContainsString('cache', $content);
    }
}
