import * as d3 from 'd3';
// toggles the visibility of ui elements, using a combination of the
// hide class, which sets display=none, and a d3 transition for opacity.
// this will cause blinking when called repeatedly, so check that the
// value actually changes between calls.
export function Toggle(show, callback) {
    return function(selection) {
        selection
            .style('opacity', show ? 0 : 1)
            .classed('hide', false)
            .transition()
            .style('opacity', show ? 1 : 0)
            .each('end', function() {
                d3.select(this)
                    .classed('hide', !show)
                    .style('opacity', null);
                if (callback) callback.apply(this);
            });
    };
}
