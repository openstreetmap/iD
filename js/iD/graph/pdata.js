var pdata = {};

pdata.object = function(input) {

    var v = clone(input),
        proxy = {};

    function clone(x) {
        var v = {};
        for (var k in x) v[k] = x[k];
        return v;
    }

    // Remove a key from the object. This is like `delete`,
    // but does not delete the key in this closure's object
    proxy.remove = function(key) {
        var n = {}, k, i;
        if (typeof key === 'object') {
            var keys = {};
            for (i = 0; i < key.length; i++) keys[key[i]] = true;
            for (k in v) if (!keys[k]) n[k] = v[k];
        } else {
            for (k in v) if (k !== key) n[k] = v[k];
        }
        return pdata.object(n);
    };

    // Set a value or values in the object. Overwrites
    // existing values.
    proxy.set = function(vals) {
        var n = clone(v);
        for (var j in vals) {
            n[j] = vals[j];
        }
        return pdata.object(n);
    };

    // Get the contained object.
    proxy.get = function() {
        return clone(v);
    };

    return proxy;
};

if (typeof module !== 'undefined') module.exports = pdata;
