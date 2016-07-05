export function lanes(field, context) {
    var dispatch = d3.dispatch('change'),
        wayID,
        laneData;

    function lanes(selection) {
        // if form field is hidden or has detached from dom, clean up.
        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        laneData = context.entity(wayID).lanes();

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap');

        enter
            .append('div')
            .attr('class', 'lane-count')
            .append('span');

        selection.selectAll('.lane-count')
          .text(laneData.tagged.lanes.count || laneData.defaults.lanes.count);

    }


    lanes.entity = function(_) {
        if (!wayID || wayID !== _.id) {
            wayID = _.id;
        }
    };

    lanes.tags = function() {};
    lanes.focus = function() {};
    lanes.off = function() {};

    return d3.rebind(lanes, dispatch, 'on');
}
