iD.behavior.AddWay = function(mode) {
    var map = mode.map,
        controller = mode.controller,
        event = d3.dispatch('startFromNode', 'startFromWay', 'start'),
        draw = iD.behavior.Draw(map);

    var addWay = function(surface) {
        draw.on('click', event.start)
            .on('clickNode', event.startFromNode)
            .on('clickWay', event.startFromWay)
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
        controller.exit();
    };

    return d3.rebind(addWay, event, 'on');
};
