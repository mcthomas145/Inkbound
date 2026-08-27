/*
 * Inkbound is written against window.storage, the key/value API that exists
 * inside Claude artifacts. Outside of one it does not exist, so this shim
 * provides the same four methods backed by localStorage.
 *
 * Note: `shared: true` writes (the leaderboard) become per-device here.
 * Everyone who installs the build gets their own private board until you
 * point the shared branch at a real backend. See README.
 */
const PREFIX = 'inkbound:';
const key = (k, shared) => `${PREFIX}${shared ? 'shared:' : 'mine:'}${k}`;

export function installStorageShim() {
  if (typeof window === 'undefined' || window.storage) return;
  window.storage = {
    async get(k, shared = false) {
      const v = localStorage.getItem(key(k, shared));
      if (v === null) throw new Error(`no such key: ${k}`); // matches artifact behaviour
      return { key: k, value: v, shared };
    },
    async set(k, value, shared = false) {
      localStorage.setItem(key(k, shared), String(value));
      return { key: k, value: String(value), shared };
    },
    async delete(k, shared = false) {
      localStorage.removeItem(key(k, shared));
      return { key: k, deleted: true, shared };
    },
    async list(prefix = '', shared = false) {
      const head = key(prefix, shared);
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i);
        if (full && full.startsWith(head)) keys.push(full.slice(key('', shared).length));
      }
      return { keys, prefix, shared };
    },
  };
}
