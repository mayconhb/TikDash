// Fix for 'global' being expected by some libraries
if (typeof window !== 'undefined' && (window as any).global === undefined) {
  try {
    // Use a proxy to prevent 'Cannot set property fetch of #<Window>' errors
    // which happens when libraries try to polyfill fetch on the global object
    (window as any).global = new Proxy(window, {
      set(target: any, prop, value) {
        if (prop === 'fetch') return true; // Ignore assignments to fetch
        target[prop] = value;
        return true;
      },
      get(target, prop) {
        return target[prop as any];
      }
    });
  } catch (e) {
    (window as any).global = window;
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-center" richColors />
    <App />
  </StrictMode>,
);
