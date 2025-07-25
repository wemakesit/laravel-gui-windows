import { Config } from 'ziggy-js';

declare global {
  interface Window {
    frontendConfig: any;
  }

  function route(): {
    current(name?: string): boolean;
  };
  function route(name: string, params?: any): string;

  var Ziggy: Config;

  namespace NodeJS {
    interface Timeout {}
  }

  // Process environment for PWA debug
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  var process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};
