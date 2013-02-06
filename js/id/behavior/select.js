iD.behavior.Select = function(context) {

    var behavior = function(selection) {

        var timeout = null,
            // the position of the first mousedown
            pos = null;

        function click(event) {
            d3.event = event;
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                if (d3.event.shiftKey) {
                    context.enter(iD.modes.Select(context, context.selection().concat([datum.id])));
                } else {
                    context.enter(iD.modes.Select(context, [datum.id]));
                }
            } else if (!d3.event.shiftKey) {
                context.enter(iD.modes.Browse(context));
            }
        }

        function mousedown() {
            pos = d3.mouse(context.surface().node());
            selection
                .on('mousemove.select', mousemove)
                .on('touchmove.select', mousemove);

            // we've seen a mousedown within 400ms of this one, so ignore
            // both because they will be a double click
            if (timeout !== null) {
                window.clearTimeout(timeout);
                selection.on('mousemove.select', null);
                timeout = null;
            } else {
                // queue the click handler to fire in 400ms if no other clicks
                // are detected
                timeout = window.setTimeout((function(event) {
                    return function() {
                        click(event);
                        timeout = null;
                        selection.on('mousemove.select', null);
                    };
                // save the event for the click handler
                })(d3.event), 200);
            }
        }

        // allow mousemoves to cancel the click
        function mousemove() {
            if (iD.geo.dist(d3.mouse(context.surface().node()), pos) > 4) {
                window.clearTimeout(timeout);
                timeout = null;
            }
        }

        selection
            .on('mousedown.select', mousedown)
            .on('touchstart.select', mousedown);
    };

    behavior.off = function(selection) {
        selection.on('mousedown.select', null);
    };

    return behavior;
};
