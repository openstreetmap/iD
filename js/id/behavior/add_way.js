iD.behavior.AddWay = function(mode) {
    var map = mode.map,
        controller = mode.controller,
        event = d3.dispatch('start', 'startFromWay', 'startFromNode', 'startFromMidpoint'),
        draw = iD.behavior.Draw(map);

    var addWay = function(surface) {
        draw.on('click', event.start)
            .on('clickWay', event.startFromWay)
            .on('clickNode', event.startFromNode)
            .on('clickMidpoint', event.startFromMidpoint)
            .on('cancel', addWay.cancel)
            .on('finish', addWay.cancel);

        map.fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw);
    };

    addWay.off = function(surface) {
        map.fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            map.dblclickEnable(true);
        }, 1000);

        surface.call(draw.off);
    };

    addWay.cancel = function() {
        controller.enter(iD.modes.Browse());
    };

    return d3.rebind(addWay, event, 'on');
};
