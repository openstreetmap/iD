iD.behavior.AddWay = function(context) {
    var event = d3.dispatch('start', 'startFromWay', 'startFromNode'),
        draw = iD.behavior.Draw(context);

    var addWay = function(surface) {
        draw.on('click', event.start)
            .on('clickWay', event.startFromWay)
            .on('clickNode', event.startFromNode)
            .on('cancel', addWay.cancel)
            .on('finish', addWay.cancel);

        context.map()
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw);
    };

    addWay.off = function(surface) {
        context.map()
            .minzoom(0);

        surface.call(draw.off);
    };

    addWay.cancel = function() {
        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        context.enter(iD.modes.Browse(context));
    };

    addWay.tail = function(text) {
        draw.tail(text);
        return addWay;
    };

    return d3.rebind(addWay, event, 'on');
};
