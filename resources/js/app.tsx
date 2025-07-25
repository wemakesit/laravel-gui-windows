import React from 'react';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

console.log('App: Starting app.tsx initialization...');

// Initialize PWA Service
console.log('App: Importing PWA Service...');
import { pwaService } from './Services/PWAService';
console.log('App: PWA Service imported successfully');

// Initialize WatermelonDB
console.log('App: Importing WatermelonDB Service...');
import { watermelonDBService } from './Services/WatermelonDBService';
console.log('App: WatermelonDB Service imported successfully');

// Initialize Storage Management
console.log('App: Importing Storage Management Service...');
import StorageManagementService from './Services/StorageManagementService';
console.log('App: Storage Management Service imported successfully');

// Register service worker from Vite PWA plugin
import { registerSW } from 'virtual:pwa-register';

// Add type augmentation for import.meta
interface ImportMetaEnv {
  VITE_APP_NAME?: string;
}

// Augment the existing ImportMeta interface from Vite
interface ImportMeta {
  readonly glob: (path: string) => Record<string, () => Promise<any>>;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize services
console.log('App: About to initialize services...');
console.log('App: PWA Service initialized', pwaService);
console.log('App: PWA Service type:', typeof pwaService);
console.log('App: PWA Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pwaService)));

// Initialize WatermelonDB
console.log('App: Initializing WatermelonDB...');
watermelonDBService.initialize().catch(error => {
  console.error('Failed to initialize WatermelonDB:', error);
});
console.log('App: WatermelonDB initialization started');

// Expose services to window for testing immediately
if (typeof window !== 'undefined') {
  console.log('Exposing services to window for testing');
  (window as any).watermelonDBService = watermelonDBService;
  (window as any).pwaService = pwaService;
  console.log('Services exposed:', {
    watermelonDBService: !!watermelonDBService,
    pwaService: !!pwaService
  });

  // Also expose after a short delay to ensure they're available
  setTimeout(() => {
    (window as any).watermelonDBService = watermelonDBService;
    (window as any).pwaService = pwaService;
    console.log('Services re-exposed after delay');
  }, 100);
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('PWA: App update available');
      // You can show a toast or modal here to ask user to refresh
    },
    onOfflineReady() {
      console.log('PWA: App ready to work offline');
      // You can show a toast here to inform user that app is ready for offline use
    },
  });
}

createInertiaApp({
  title: (title: string) => `${title} - ${appName}`,
  resolve: (name: string) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob('./Pages/**/*.tsx')
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);

    // Initialize storage monitoring
    StorageManagementService.initializeStorageMonitoring();

    root.render(<App {...props} />);
  },
  progress: {
    color: '#4B5563',
  },
});
