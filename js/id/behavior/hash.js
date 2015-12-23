iD.behavior.Hash = function(context) {
    var s0 = null, // cached location.hash
        lat = 90 - 1e-8; // allowable latitude range

    var parser = function(map, s) {
        var q = iD.util.stringQs(s);
        var args = (q.map || '').split('/').map(Number);
        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash
        } else if (s !== formatter(map).slice(1)) {
            map.centerZoom([args[1],
                Math.min(lat, Math.max(-lat, args[2]))], args[0]);
        }
    };

    var formatter = function(map) {
        var mode = context.mode(),
            center = map.center(),
            zoom = map.zoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
            q = _.omit(iD.util.stringQs(location.hash.substring(1)), 'comment'),
            newParams = {};

        if (mode && mode.id === 'browse') {
            delete q.id;
        } else {
            var selected = context.selectedIDs().filter(function(id) {
                return !context.entity(id).isNew();
            });
            if (selected.length) {
                newParams.id = selected.join(',');
            }
        }

        newParams.map = zoom.toFixed(2) +
                '/' + center[0].toFixed(precision) +
                '/' + center[1].toFixed(precision);

        return '#' + iD.util.qsString(_.assign(q, newParams), true);
    };

    function update() {
        if (context.inIntro()) return;
        var s1 = formatter(context.map());
        if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
    }

    var throttledUpdate = _.throttle(update, 500);

    function hashchange() {
        if (location.hash === s0) return; // ignore spurious hashchange events
        if (parser(context.map(), (s0 = location.hash).substring(1))) {
            update(); // replace bogus hash
        }
    }

    function hash() {
        context.map()
            .on('move.hash', throttledUpdate);

        context
            .on('enter.hash', throttledUpdate);

        d3.select(window)
            .on('hashchange.hash', hashchange);

        if (location.hash) {
            var q = iD.util.stringQs(location.hash.substring(1));
            if (q.id) context.zoomToEntity(q.id.split(',')[0], !q.map);
            if (q.comment) context.storage('comment', q.comment);
            hashchange();
            if (q.map) hash.hadHash = true;
        }
    }

    hash.off = function() {
        throttledUpdate.cancel();

        context.map()
            .on('move.hash', null);

        context
            .on('enter.hash', null);

        d3.select(window)
            .on('hashchange.hash', null);

        location.hash = '';
    };

    return hash;
};
