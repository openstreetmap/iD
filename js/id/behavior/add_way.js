iD.behavior.AddWay = function(context) {
    var event = d3.dispatch('start', 'startFromWay', 'startFromNode', 'startFromMidpoint'),
        draw = iD.behavior.Draw(context);

    var addWay = function(surface) {
        draw.on('click', event.start)
            .on('clickWay', event.startFromWay)
            .on('clickNode', event.startFromNode)
            .on('clickMidpoint', event.startFromMidpoint)
            .on('cancel', addWay.cancel)
            .on('finish', addWay.cancel);

        context.map()
            .fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw);
    };

    addWay.off = function(surface) {
        context.map()
            .fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        surface.call(draw.off);
    };

    addWay.cancel = function() {
        context.enter(iD.modes.Browse(context));
    };

    return d3.rebind(addWay, event, 'on');
};
