iD.ui.preset.lanes = function(field, context) {
    var dispatch = d3.dispatch('change'),
        wayID,
        laneData;


    function lanes(selection) {
        // if form field is hidden or has detached from dom, clean up.
        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap');

        enter
            .append('div')
            .attr('class', 'lane-help');

        laneData = context.entity(wayID).lanes();
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
};
