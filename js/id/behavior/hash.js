iD.behavior.Hash = function(context) {
    var s0 = null, // cached location.hash
        lat = 90 - 1e-8; // allowable latitude range

    var parser = function(map, s) {
        var q = iD.util.stringQs(s);
        var args = (q.map || '').split("/").map(Number);
        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash
        } else if (s !== formatter(map).slice(1)) {
            map.centerZoom([args[1],
                Math.min(lat, Math.max(-lat, args[2]))], args[0]);
        }
    };

    var formatter = function(map) {
        var center = map.center(),
            zoom = map.zoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var q = iD.util.stringQs(location.hash.substring(1));
        return '#' + iD.util.qsString(_.assign(q, {
                map: zoom.toFixed(2) +
                    '/' + center[0].toFixed(precision) +
                    '/' + center[1].toFixed(precision)
            }), true);
    };

    var move = _.throttle(function() {
        var s1 = formatter(context.map());
        if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
    }, 500);

    function hashchange() {
        if (location.hash === s0) return; // ignore spurious hashchange events
        if (parser(context.map(), (s0 = location.hash).substring(1))) {
            move(); // replace bogus hash
        }
    }

    // the hash can declare that the map should select a feature, but it can
    // do so before any features are loaded. thus wait for the feature to
    // be loaded and then select
    function willselect(id) {
        context.connection().loadEntity(id, function(error, entity) {
            if (entity) {
                context.map().zoomTo(entity);
            }
        });

        context.map().on('drawn.hash', function() {
            if (!context.entity(id)) return;
            selectoff();
            context.enter(iD.modes.Select(context, [id]));
        });

        context.on('enter.hash', function() {
            if (context.mode().id !== 'browse') selectoff();
        });
    }

    function selectoff() {
        context.map().on('drawn.hash', null);
    }

    function hash() {
        context.map()
            .on('move.hash', move);

        d3.select(window)
            .on('hashchange.hash', hashchange);

        if (location.hash) {
            var q = iD.util.stringQs(location.hash.substring(1));
            if (q.id) willselect(q.id);
            hashchange();
            if (q.map) hash.hadHash = true;
        }
    }

    hash.off = function() {
        context.map()
            .on('move.hash', null);

        d3.select(window)
            .on('hashchange.hash', null);

        location.hash = "";
    };

    return hash;
};
