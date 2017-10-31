/* eslint no-console:off */
/* eslint no-empty:off */
import localforage from 'localforage';


export function coreStorage() {

    function stub() {
        var s = {};
        return {
            config: function() {},
            getItem: function(k) { return s[k]; },
            key: function() { return null; },
            removeItem: function(k) { delete s[k]; },
            setItem: function(k, v) { s[k] = v; },
            length: 0
        };
    }

    // https://github.com/openstreetmap/iD/issues/772
    // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
    // (these can fail if user has disabled their localstorage - e.g. incognito mode)
    var _localStorage;
    try { _localStorage = localStorage; } catch (e) {}
    _localStorage = _localStorage || stub();

    var _localForage = localforage;
    try { _localForage = localforage; } catch (e) {}
    _localForage = _localForage || stub();
    _localForage.config({name: 'iD'});


    function upgrade(k) {
        try {
            var v = _localStorage.getItem(k);
            if (v === null) return;
            if (['background-opacity', 'commentDate'].indexOf(k) !== -1) {
                v = +v;  // numeric
            }
            _localForage.setItem(k, v, function(err) {
                if (!err) {
                    _localStorage.removeItem(k);
                }
            });
        } catch (e) {}
    }

    // silently upgrade from localStorage to localForage if possible..
    (function upgradeAll() {
        if (!_localStorage.length) return;
        try {
            for (var i = 0; i < _localStorage.length; i++) {
                var k = _localStorage.key(i);
                if (k) {
                    upgrade(k);
                } else {
                    _localStorage.removeItem(k);
                }
            }
        } catch (e) {}
    })();


    var storage = {};


    // get the value for the given key
    // if key exists in localStorage, prefer that value, but try to upgrade to localForage
    // call *required* callback with any error and the requested value
    storage.getItem = function(k, callback) {
        try {
            var v = _localStorage.getItem(k);
            if (v) {              // still exists in localStorage
                upgrade(k);
                callback(null, v);
            } else {
                _localForage.getItem(k, callback);
            }
        } catch (e) {
            if (typeof console !== 'undefined') { console.error(e.message); }
            callback(e.message);
        }
    };


    // set the value for the given key
    // remove from localStorage if the setItem call completed without error
    // call *optional* callback with any error and the set value
    storage.setItem = function(k, v, callback) {
        try {
            _localForage.setItem(k, v, function (err, v) {
                if (!err) _localStorage.removeItem(k);
                if (callback) callback(err, v);
            });
        } catch (e) {
            if (typeof console !== 'undefined') { console.error(e.message); }
            if (callback) callback(e.message);
        }
    };


    // remove key from both localStorage and localForage
    // call *optional* callback with any error
    storage.removeItem = function(k, callback) {
        try {
            _localStorage.removeItem(k);
            _localForage.removeItem(k, function (err) {
                if (callback) callback(err);
            });
        } catch (e) {
            if (typeof console !== 'undefined') { console.error(e.message); }
            if (callback) callback(e.message);
        }
    };


    return storage;
}
