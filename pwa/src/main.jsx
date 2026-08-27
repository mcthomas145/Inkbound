import React from 'react';
import { createRoot } from 'react-dom/client';
import { installStorageShim } from './storage.js';
import InkboundApp from './Inkbound.jsx';

installStorageShim();

/* Keep the screen awake during a fight. Supported on Android Chrome and
   iOS 16.4+; silently does nothing elsewhere. */
async function keepAwake() {
  try {
    if ('wakeLock' in navigator) {
      let lock = await navigator.wakeLock.request('screen');
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          try { lock = await navigator.wakeLock.request('screen'); } catch (e) { /* ignore */ }
        }
      });
    }
  } catch (e) { /* ignore */ }
}

/* Android + desktop honour this and will hard-lock to landscape once the app
   is installed. iOS ignores it, which is why the game also ships its own
   "turn your device" screen. */
async function lockLandscape() {
  try { await screen.orientation.lock('landscape'); } catch (e) { /* ignore */ }
}

const start = () => { keepAwake(); lockLandscape(); };
window.addEventListener('pointerdown', start, { once: true });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InkboundApp />
  </React.StrictMode>
);
