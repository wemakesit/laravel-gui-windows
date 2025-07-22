import React from 'react';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// Initialize PWA Service
import { pwaService } from './Services/PWAService';

// Initialize WatermelonDB
import { watermelonDBService } from './Services/WatermelonDBService';

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
console.log('App: PWA Service initialized', pwaService);

// Initialize WatermelonDB
watermelonDBService.initialize().catch(error => {
  console.error('Failed to initialize WatermelonDB:', error);
});

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

    root.render(<App {...props} />);
  },
  progress: {
    color: '#4B5563',
  },
});
