// https://github.com/openstreetmap/iD/issues/772
// http://mathiasbynens.be/notes/localstorage-pattern#comment-9
import { services } from '../services';
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
let _isInitializing = false;

function setInitialPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') return;
  
  _isInitializing = true;
  
  // don't sync to server during initial load
  Object.entries(preferences).forEach(([key, value]) => {
    try {
      _storage.setItem(key, value);
      if (_listeners[key]) {
        _listeners[key].forEach(handler => handler(value));
      }
    } catch {
      // ignore
    }
  });
  
  _isInitializing = false;
}

// Load preferences from server for development mode (when no preauth data is provided)
function loadPreferencesFromServer() {
  if (!services.osm || !services.osm.authenticated()) {
    return;
  }

  services.osm.getPreferences(function(err, serverPreferences) {
    if (err) {
      console.error('iD: Failed to load preferences from server:', err);
      return;
    }

    // Clear localStorage and replace with server preferences
    _isInitializing = true;
    
    // Clear all existing preferences from localStorage
    for (let i = _storage.length - 1; i >= 0; i--) {
      _storage.removeItem(_storage.key(i));
    }
    
    // Set server preferences in localStorage
    Object.entries(serverPreferences).forEach(([key, value]) => {
      try {
        _storage.setItem(key, value);
        if (_listeners[key]) {
          _listeners[key].forEach(handler => handler(value));
        }
      } catch {
        // ignore
      }
    });
    
    _isInitializing = false;
  });
}

function syncPreferenceToServer(key, value) {
  if (!services.osm || !services.osm.authenticated()) {
    // user not authenticated, skip sync
    return;
  }

  if (value === null) {
    services.osm.deletePreference(key, function(err) {
      if (err) {
        console.error('Failed to delete preference on server:', key, err);
      }
    });
  } else {
    services.osm.putPreference(key, String(value), function(err) {
      if (err) {
        console.error('Failed to update preference on server:', key, err);
      }
    });
  }
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

    // sync to server if not initializing and user is actually changing preferences
    if (!_isInitializing && v !== undefined) {
      syncPreferenceToServer(k, v);
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

corePreferences.setInitialPreferences = setInitialPreferences;
corePreferences.loadPreferencesFromServer = loadPreferencesFromServer;

export { corePreferences as prefs };
