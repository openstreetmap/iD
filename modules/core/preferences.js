
// https://github.com/openstreetmap/iD/issues/772
// http://mathiasbynens.be/notes/localstorage-pattern#comment-9
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

// adds an event listener which is triggered whenever
corePreferences.onChange = function(k, handler) {
  _listeners[k] = _listeners[k] || [];
  _listeners[k].push(handler);
};

class AsyncPreferences {
  /** @private @type {Record<string, FileSystemWritableFileStream>} */
  writableCache = {};

  /** @param {string} key */
  async get(key) {
    try {
      const rootFolder = await navigator.storage.getDirectory();
      const fileHandle = await rootFolder.getFileHandle(key, {
        create: true,
      });
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      // async storage is not available, so fallback to localStorage
      return /** @type {string | null} */ (corePreferences(key));
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    try {
      this.writableCache[key] ||= await navigator.storage
        .getDirectory()
        .then(rootFolder => rootFolder.getFileHandle(key, { create: true }))
        .then(fileHandle => fileHandle.createWritable());

      await this.writableCache[key].write(new Blob([value]));
      return true;
    } catch {
      // async storage is not available, so fallback to localStorage
      return corePreferences(key, value);
    }
  }
};

export const asyncPrefs = new AsyncPreferences();


export { corePreferences as prefs };
