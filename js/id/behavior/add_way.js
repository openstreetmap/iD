iD.behavior.AddWay = function(mode) {
    var map = mode.map,
        history = mode.history,
        controller = mode.controller,
        event = d3.dispatch('startFromNode', 'startFromWay', 'start'),
        hover, draw;

    function add() {
        var datum = d3.select(d3.event.target).datum() || {};

        if (datum.type === 'node') {
            event.startFromNode(datum);
        } else if (datum.type === 'way') {
            var choice = iD.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
            event.startFromWay(datum, choice.loc, choice.index);
        } else if (datum.midpoint) {
            var way = history.graph().entity(datum.way);
            event.startFromWay(way, datum.loc, datum.index);
        } else {
            event.start(map.mouseCoordinates());
        }
    }

    var addWay = function(surface) {
        map.fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(hover)
            .call(draw);
    };

    addWay.off = function(surface) {
        map.fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            map.dblclickEnable(true);
        }, 1000);

        surface.call(hover.off)
            .call(draw.off);
    };

    addWay.cancel = function() {
        controller.exit();
    };

    hover = iD.behavior.Hover();

    draw = iD.behavior.Draw()
        .on('add', add)
        .on('cancel', addWay.cancel)
        .on('finish', addWay.cancel);

    return d3.rebind(addWay, event, 'on');
};
