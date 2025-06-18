// https://github.com/openstreetmap/iD/issues/772
// http://mathiasbynens.be/notes/localstorage-pattern#comment-9
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
let _osmConnection = null;
let _syncPromise = null;
let _pendingSync = new Map();

function setOsmConnection(connection) {
  _osmConnection = connection;
}

async function syncPreferenceToServer(key, value) {
  if (!_osmConnection) {
    _pendingSync.set(key, value);
    return;
  }

  try {
    if (value === null || value === undefined) {
      await deleteServerPreference(key);
    } else {
      await putServerPreference(key, String(value));
    }
  } catch {
    _pendingSync.set(key, value);
  }
}

function putServerPreference(key, value) {
  return new Promise((resolve, reject) => {
    if (!_osmConnection?.oauth) {
      reject(new Error('No OSM connection available'));
      return;
    }

    _osmConnection.oauth.xhr({
      method: 'PUT',
      path: `/api/0.6/user/preferences/${encodeURIComponent(key)}`,
      options: { header: { 'Content-Type': 'text/plain' } },
      content: value
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function deleteServerPreference(key) {
  return new Promise((resolve, reject) => {
    if (!_osmConnection?.oauth) {
      reject(new Error('No OSM connection available'));
      return;
    }

    _osmConnection.oauth.xhr({
      method: 'DELETE',
      path: `/api/0.6/user/preferences/${encodeURIComponent(key)}`
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getServerPreferences() {
  return new Promise((resolve) => {
    if (!_osmConnection?.oauth) {
      resolve({});
      return;
    }

    _osmConnection.oauth.xhr({
      method: 'GET',
      path: '/api/0.6/user/preferences.json'
    }, (err, result) => {
      if (err) {
        resolve({});
        return;
      }

      try {
        const preferences = {};
        if (result && result.preferences) {
          Object.entries(result.preferences).forEach(([key, value]) => {
            preferences[key] = value;
          });
        }
        resolve(preferences);
      } catch {
        resolve({});
      }
    });
  });
}

async function performSync() {
  if (!_osmConnection) return;

  try {
    const serverPrefs = await getServerPreferences();

    Object.entries(serverPrefs).forEach(([key, value]) => {
      const localValue = _storage.getItem(key);
      if (localValue === null) {
        _storage.setItem(key, value);
        if (_listeners[key]) {
          _listeners[key].forEach(handler => handler(value));
        }
      }
    });

    if (_pendingSync.size > 0) {
      const syncPromises = Array.from(_pendingSync.entries()).map(([key, value]) =>
        syncPreferenceToServer(key, value).then(() => ({ key, success: true }))
          .catch(() => ({ key, success: false }))
      );

      const results = await Promise.allSettled(syncPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          _pendingSync.delete(result.value.key);
        }
      });
    }
  } catch {
    // Sync failed, will retry later
  }
}

function syncWithServer() {
  if (_syncPromise) return _syncPromise;

  _syncPromise = performSync().finally(() => {
    _syncPromise = null;
  });

  return _syncPromise;
}

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

    syncPreferenceToServer(k, v);

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

corePreferences.setOsmConnection = setOsmConnection;
corePreferences.syncWithServer = syncWithServer;

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
    syncPreferenceToServer(key, JSON.stringify(value));
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
