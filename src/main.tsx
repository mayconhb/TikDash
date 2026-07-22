// Fix for 'global' being expected by some libraries and preventing 'fetch' read-only errors
const protectFetch = (obj: any) => {
  if (typeof obj === 'undefined') return;
  try {
    const originalGlobal = obj.global;
    Object.defineProperty(obj, 'global', {
      get() { return this; },
      set(v) {
        // If someone tries to set fetch on the global object, ignore it if it's read-only
        if (v && v.fetch && typeof v.fetch === 'function') {
           // possible polyfill attempt
        }
      },
      configurable: true
    });

    // Use a proxy for the entire window/global if possible
    if (typeof Proxy !== 'undefined') {
      const handler = {
        set(target: any, prop: string | symbol, value: any) {
          if (prop === 'fetch') {
            console.warn('Prevented overwrite of read-only fetch property');
            return true;
          }
          target[prop] = value;
          return true;
        },
        get(target: any, prop: string | symbol) {
          const val = target[prop];
          if (typeof val === 'function') return val.bind(target);
          return val;
        }
      };
      (obj as any).global = new Proxy(obj, handler);
      (obj as any).globalThis = new Proxy(obj, handler);
    } else {
      (obj as any).global = obj;
      (obj as any).globalThis = obj;
    }
  } catch (e) {
    console.error('Failed to polyfill global/fetch protection', e);
  }
};

if (typeof window !== 'undefined') protectFetch(window);
if (typeof self !== 'undefined') protectFetch(self);

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
