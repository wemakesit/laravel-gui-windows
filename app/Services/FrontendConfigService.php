<?php

namespace App\Services;

class FrontendConfigService
{
    /**
     * Get configuration values that should be available to the frontend
     */
    public static function getConfig(): array
    {
        return [
            'api' => config('frontend.api'),
            'watermelon' => config('frontend.watermelon'),
            'pwa' => config('frontend.pwa'),
            'camera' => config('frontend.camera'),
            'ui' => config('frontend.ui'),
            'debug' => config('frontend.debug'),
            'external_apis' => config('frontend.external_apis'),
            'app' => [
                'name' => config('app.name'),
                'env' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
            ],
        ];
    }

    /**
     * Get configuration as JSON string for injection into HTML
     */
    public static function getConfigJson(): string
    {
        return json_encode(self::getConfig(), JSON_UNESCAPED_SLASHES);
    }

    /**
     * Get specific configuration section
     */
    public static function getSection(string $section): array
    {
        $config = self::getConfig();
        return $config[$section] ?? [];
    }
}
