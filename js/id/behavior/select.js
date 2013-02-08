iD.behavior.Select = function(context) {

    var behavior = function(selection) {

        var timeout = null,
            // the position of the first mousedown
            pos = null;

        function click(event) {
            d3.event = event;
            var datum = d3.event.target.__data__;
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
            var datum = d3.event.target.__data__;
            pos = [d3.event.x, d3.event.y];
            if (datum instanceof iD.Entity || (datum && datum.type === 'midpoint')) {
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
        }

        // allow mousemoves to cancel the click
        function mousemove() {
            if (iD.geo.dist([d3.event.x, d3.event.y], pos) > 4) {
                window.clearTimeout(timeout);
                timeout = null;
            }
        }

        function mouseup() {
            selection.on('mousemove.select', null);
            if (d3.event.x === pos[0] && d3.event.y === pos[1] &&
                !(d3.event.target.__data__ instanceof iD.Entity)) {
                context.enter(iD.modes.Browse(context));
            }
        }

        selection
            .on('mousedown.select', mousedown)
            .on('mouseup.select', mouseup)
            .on('touchstart.select', mousedown);
    };

    behavior.off = function(selection) {
        selection.on('mousedown.select', null);
    };

    return behavior;
};
