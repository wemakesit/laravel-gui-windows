import React from 'react';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// Initialize PWA Service
import { pwaService } from './Services/PWAService';

// Add type augmentation for import.meta
interface ImportMetaEnv {
  VITE_APP_NAME?: string;
}

// Augment the existing ImportMeta interface from Vite
interface ImportMeta {
  readonly glob: (path: string) => Record<string, () => Promise<any>>;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Log PWA initialization
console.log('App: PWA Service initialized', pwaService);

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
