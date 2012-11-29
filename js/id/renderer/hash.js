iD.Hash = function() {
    var hash = {},
        s0, // cached location.hash
        lat = 90 - 1e-8, // allowable latitude range
        hadHash,
        map;

    function qs(str) {
        return str.split('&').reduce(function(obj, pair){
            var parts = pair.split('=');
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
            return obj;
        }, {});
    }

    var parser = function(map, s) {
        var q = qs(s);
        var args = (q.map || '').split("/").map(Number);
        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash
        } else {
            map.setZoom(args[0])
                .center([args[2], Math.min(lat, Math.max(-lat, args[1]))]);
        }
    };

    var formatter = function(map) {
        var center = map.center(),
            zoom = map.getZoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return '#?map=' + zoom.toFixed(2) +
            '/' + center[1].toFixed(precision) +
            '/' + center[0].toFixed(precision);
    };

    var move = _.throttle(function() {
        var s1 = formatter(map);
        if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
    }, 1000);

    function hashchange() {
        if (location.hash === s0) return; // ignore spurious hashchange events
        if (parser(map, (s0 = location.hash).substring(1)))
            move(); // replace bogus hash
    }

    hash.map = function(x) {
        if (!arguments.length) return map;
        if (map) {
            map.off("move", move);
            window.removeEventListener("hashchange", hashchange, false);
        }
        map = x;
        if (x) {
            map.on("move", move);
            window.addEventListener("hashchange", hashchange, false);
            if (location.hash) {
                hashchange();
                hadHash = true;
            }
        }
        return hash;
    };

    hash.hadHash = hadHash;

    return hash;
};
