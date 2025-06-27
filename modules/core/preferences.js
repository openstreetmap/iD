// https://github.com/openstreetmap/iD/issues/772
import { get, set } from 'idb-keyval';

/** @type {Storage} */
let _storage;
try { _storage = localStorage; } catch {}  // eslint-disable-line no-empty
_storage = _storage || (() => {
  let s = {};
  return {
    getItem: (k) => s[k],
    setItem: (k, v) => s[k] = v,
    removeItem: (k) => delete s[k]
  };
})();

const _listeners = {};

//
// corePreferences is an interface for persisting basic key-value strings
// within and between iD sessions on the same site.
//
/**
 * @param {string} k
 * @param {string?} [v]
 * @returns {boolean} true if the action succeeded
 */
function corePreferences(k, v) {
  try {
    if (v === undefined) return _storage.getItem(k);
    else if (v === null) _storage.removeItem(k);
    else _storage.setItem(k, v);

    if (_listeners[k]) {
      _listeners[k].forEach(handler => handler(v));
    }

    return true;
  } catch {
    /* eslint-disable no-console */
    if (typeof console !== 'undefined') {
      console.error('localStorage quota exceeded');
    }
    /* eslint-enable no-console */
    return false;
  }
}

// adds an event listener which is triggered whenever a preference changes
corePreferences.onChange = function(k, handler) {
  _listeners[k] = _listeners[k] || [];
  _listeners[k].push(handler);
};

export { corePreferences as prefs };

export const asyncPrefs = {
  async get(key) {
    let value = await get(key);

    if (value === undefined) {
      const localValue = corePreferences(key);
      if (localValue !== null) {
        try {
          value = JSON.parse(localValue);
        } catch {
          value = localValue;
        }

        await set(key, value);
        corePreferences(key, null);
      }
    }

    return value;
  },

  async set(key, value) {
    await set(key, value);
  }
};

export async function migrateHistoryData() {
  const historyKeyPattern = /^iD_.*_saved_history$/;
  const keysToMigrate = [];

  for (let i = 0; i < _storage.length; i++) {
    const key = _storage.key(i);
    if (key && historyKeyPattern.test(key)) {
      keysToMigrate.push(key);
    }
  }

  if (keysToMigrate.length === 0) {
    return;
  }

  const migrationPromises = keysToMigrate.map(async (key) => {
    const value = _storage.getItem(key);
    if (value !== null) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      await set(key, parsedValue);
      _storage.removeItem(key);
    }
  });

  await Promise.all(migrationPromises);
}
