import { select as d3_select } from 'd3-selection';


// toggles the visibility of ui elements, using a combination of the
// hide class, which sets display=none, and a d3 transition for opacity.
// this will cause blinking when called repeatedly, so check that the
// value actually changes between calls.
//
// When the selection is a direct child of a <details> element, the
// parent's `open` property is used instead of the `hide` class.
export function uiToggle(show, callback) {
    return function(selection) {
        var parent = selection.node().parentNode;
        var isDetails = parent && parent.tagName === 'DETAILS';

        // ensure content is visible before animating
        if (isDetails) {
            if (show) parent.open = true;
        } else {
            selection.classed('hide', false);
        }

        selection
            .style('opacity', show ? 0 : 1)
            .transition()
            .style('opacity', show ? 1 : 0)
            .on('end', function() {
                d3_select(this).style('opacity', null);
                // hide content after fade-out completes
                if (isDetails) {
                    if (!show) parent.open = false;
                } else {
                    d3_select(this).classed('hide', !show);
                }
                if (callback) callback.apply(this);
            });
    };
}
