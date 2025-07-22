<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- PWA Meta Tags -->
        <meta name="theme-color" content="#2563eb">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Window Estimate System">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="WindowEst">

        <!-- Surface Pro Optimisation -->
        <meta name="msapplication-TileColor" content="#2563eb">
        <meta name="msapplication-tap-highlight" content="no">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- PWA Icons -->
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg">
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg">
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.svg">
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg">
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.svg">
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.svg">
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-114x114.svg">
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76x76.svg">
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.svg">
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/icon-60x60.svg">
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/icon-57x57.svg">



        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
