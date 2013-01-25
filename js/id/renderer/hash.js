iD.Hash = function() {
    var hash = { hadHash: false },
        s0 = null, // cached location.hash
        lat = 90 - 1e-8, // allowable latitude range
        controller,
        map;

    var parser = function(map, s) {
        var q = iD.util.stringQs(s);
        var args = (q.map || '').split("/").map(Number);
        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash
        } else if (s !== formatter(map).slice(1)) {
            map.centerZoom([args[2],
                Math.min(lat, Math.max(-lat, args[1]))],
                args[0]);
        }
    };

    var formatter = function(map) {
        var center = map.center(),
            zoom = map.zoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var q = iD.util.stringQs(location.hash.substring(1));
        return '#' + iD.util.qsString(_.assign(q, {
                map: zoom.toFixed(2) +
                    '/' + center[1].toFixed(precision) +
                    '/' + center[0].toFixed(precision)
            }), true);
    };

    var move = _.throttle(function() {
        var s1 = formatter(map);
        if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
    }, 100);

    function hashchange() {
        if (location.hash === s0) return; // ignore spurious hashchange events
        if (parser(map, (s0 = location.hash).substring(1))) {
            move(); // replace bogus hash
        }
    }

    // the hash can declare that the map should select a feature, but it can
    // do so before any features are loaded. thus wait for the feature to
    // be loaded and then select
    function willselect(id) {
        map.on('drawn.hash', function() {
            var entity = map.history().graph().entity(id);
            if (entity === undefined) return;
            else selectoff();
            controller.enter(iD.modes.Select(entity));
            map.on('drawn.hash', null);
        });
        controller.on('enter.hash', function() {
            if (controller.mode.id !== 'browse') selectoff();
        });
    }

    function selectoff() {
        map.on('drawn.hash', null);
    }

    hash.controller = function(_) {
        if (!arguments.length) return controller;
        controller = _;
        return hash;
    };

    hash.map = function(x) {
        if (!arguments.length) return map;
        if (map) {
            map.on("move.hash", null);
            window.removeEventListener("hashchange", hashchange, false);
        }
        map = x;
        if (x) {
            map.on("move.hash", move);
            window.addEventListener("hashchange", hashchange, false);
            if (location.hash) {
                var q = iD.util.stringQs(location.hash.substring(1));
                if (q.id) {
                    willselect(q.id);
                }
                hashchange();
                hash.hadHash = true;
            }
        }
        return hash;
    };

    return hash;
};
