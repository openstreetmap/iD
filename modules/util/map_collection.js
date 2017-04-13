import _ from 'lodash';
export function freezeMap(mapObj) {
    if (mapObj instanceof Map) {
        mapObj.set = function(key) {
            throw new Error(
                "Can't add property " + key + ', map is not extensible'
            );
        };

        mapObj.delete = function(key) {
            throw new Error("Can't delete property " + key + ', map is frozen');
        };

        mapObj.clear = function() {
            throw new Error("Can't clear map, map is frozen");
        };
    }

    Object.freeze(mapObj);
}

export function getKeys(mapObj) {
    if (mapObj instanceof Map) {
        var keys = [];
        mapObj.forEach(function(v, k) {
            keys.push(k);
        });
        return keys;
    }
    console.error('not map');
    return Object.keys(mapObj);
}
// goes left to right
export function assign() {
    var map = new Map();
    for (var i = 0; i < arguments.length; i++) {
        var m = arguments[m];
        if (m) {
            if (!(m instanceof Map)) throw new Error('expects a map obj');
            m.forEach(function(v, k) {
                map.set(k, v);
            });
        }
    }
    return map;
}
export function omit(mapObj, paths) {
    var map = new Map();
    if (typeof paths === 'function') {
        mapObj.forEach(function (v, k) {
            if (paths(v, k)) {
                map.set(k, v);
            }
        });
    }
    if (typeof paths === 'string') {
        paths = [paths];
    }
    for (var i = 0; i < paths.length; i++) {
        if (typeof paths[i] !== 'string') {
            throw new Error('expecting a flat array');
        }
    }
    mapObj.forEach(function(v, k) {
        if (paths.indexOf(k) === -1) {
            map.set(k, v);
        }
    });
    return map;
}

export function d3MapEntries(mapObj) {
    if (mapObj instanceof Map) {
        var entries = [];
        mapObj.forEach(function(v, k) {
            entries.push({
                key: k,
                value: v
            });
        });
        return entries;
    }
    console.error('not map');
}

export function convertToMap(obj) {
    var pairs = _.toPairs(obj);
    var map = new Map();
    pairs.forEach(function(p) {
        map.set(p[0], p[1]);
    });
    return map;
}
