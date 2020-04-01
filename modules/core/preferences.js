
// https://github.com/openstreetmap/iD/issues/772
// http://mathiasbynens.be/notes/localstorage-pattern#comment-9
let _storage;
try { _storage = localStorage; } catch (e) {}  // eslint-disable-line no-empty
_storage = _storage || (() => {
  let s = {};
  return {
    getItem: (k) => s[k],
    setItem: (k, v) => s[k] = v,
    removeItem: (k) => delete s[k]
  };
})();

//
// corePreferences is an interface for persisting basic key-value strings
// within and between iD sessions on the same site.
//
function corePreferences(k, v) {

  try {
    if (arguments.length === 1) return _storage.getItem(k);
    else if (v === null) _storage.removeItem(k);
    else _storage.setItem(k, v);
  } catch (e) {
    /* eslint-disable no-console */
    if (typeof console !== 'undefined') {
      console.error('localStorage quota exceeded');
    }
    /* eslint-enable no-console */
  }

}

export { corePreferences as prefs };
