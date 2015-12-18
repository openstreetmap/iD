iD.behavior.Breathe = function() {
    var duration = 1000,
        selector = '.selected.shadow, .selected .shadow',
        params = {},
        done, selection;

    function reset(selection) {
        return selection
            .style('fill-opacity', null)
            .style('r', null)
            .style('stroke-opacity', null)
            .style('stroke-width', null);
    }

    function reselect(surface) {
        return function() {
            if (done) return true;
            var currSelection = surface.selectAll(selector);
            if (_.isEqual(currSelection, selection)) return false;  // no change

            selection = currSelection;
            if (selection.empty()) return false;

            // reset styles, calculate animation params
            selection
                .call(reset)
                .each(function calcAnimationParams(d) {
                    if (params.hasOwnProperty(d.id)) return;

                    // determine default opacity and width
                    var s = d3.select(this),
                        tag = s.node().tagName,
                        p = {},
                        opacity, width;

                    if (tag === 'circle') {
                        opacity = parseFloat(s.style('fill-opacity') || 0.5);
                        width = parseFloat(s.style('r') || 15.5);
                    } else {
                        opacity = parseFloat(s.style('stroke-opacity') || 0.7);
                        width = parseFloat(s.style('stroke-width') || 10);
                    }

                    // calculate min/max interpolation params based on defaults..
                    p.tag = tag;
                    p.opacity0 = Math.max(opacity - 0.4, 0.1);
                    p.opacity1 = Math.min(opacity + 0.2, 1.0);
                    p.width0 = Math.max(width - (tag === 'circle' ? 1 : 2), 4);
                    p.width1 = width + 2;
                    params[d.id] = p;
                });

            inhale();
        };
    }

    function inhale() {
        if (done || selection.empty()) {
            selection.call(reset);
            return;
        }
        selection
            .transition()
            .style('stroke-opacity', function(d) { return params[d.id].opacity1; })
            .style('stroke-width', function(d) { return params[d.id].width1; })
            .style('fill-opacity', function(d) { return params[d.id].opacity1; })
            .style('r', function(d) { return params[d.id].width1; })
            .duration(duration)
            .each('end', exhale);
    }

    function exhale() {
        if (done || selection.empty()) {
            selection.call(reset);
            return;
        }
        selection
            .transition()
            .style('stroke-opacity', function(d) { return params[d.id].opacity0; })
            .style('stroke-width', function(d) { return params[d.id].width0; })
            .style('fill-opacity', function(d) { return params[d.id].opacity0; })
            .style('r', function(d) { return params[d.id].width0; })
            .duration(duration)
            .each('end', inhale);
    }

    var breathe = function(surface) {
        done = false;
        d3.timer(reselect(surface), 200);
    };

    breathe.off = function() {
        done = true;
        if (selection) {
            selection.call(reset);
        }
    };

    return breathe;
};
