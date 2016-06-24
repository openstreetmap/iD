export function lanes(field, context) {
    var dispatch = d3.dispatch('change'),
        LANE_WIDTH = 40,
        LANE_HEIGHT = 200,
        wayID,
        laneData;

    function processData(raw) {
        var laneCount = raw.tagged.lanes.count || raw.defaults.lanes.count;
        var lanesArray = [];

        for (var i = 0; i < laneCount; i++) {
            lanesArray.push({ key: i });
        }

        if (raw.tagged.oneway) {
            lanesArray.forEach(function(l) {
                l.forward = true;
                l.backward = false;
            });
        } else {
            var countForward = raw.tagged.lanes.forward || 0;
            var countBackward = raw.tagged.lanes.backward || 0;

            if (countForward + countBackward === 0) {
                countForward = laneCount/2;
                countBackward = laneCount/2;
            }

            for (i = 0; i < countForward; i++) {
                lanesArray[i].forward = true;
                lanesArray[i].backward = false;
            }
            for (i = 0; i < countBackward; i++) {
                lanesArray[countForward + i].forward = false;
                lanesArray[countForward + i].backward = true;
            }
        }

        return lanesArray;
    }
    function lanes(selection) {
        laneData = processData(context.entity(wayID).lanes());

        var laneCount = laneData.length;

        // if form field is hidden or has detached from dom, clean up.
        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap');

        var surface =  wrap.selectAll('.surface')
            .data([0]);

        var d = wrap.dimensions();
        var freeSpace = d[0] - laneCount*LANE_WIDTH*1.5 + LANE_WIDTH*0.5;

        surface.enter()
            .append('svg')
            .attr('width', d[0])
            .attr('height', 300)
            .attr('class', 'surface');

        var lanesSelection = surface.selectAll('.lanes')
            .data([0]);

        lanesSelection.enter()
            .append('g')
            .attr('class', 'lanes');

        lanesSelection
            .attr('transform', function () {
                return 'translate(' + (freeSpace/2)+ ', 0)';
            });

        var lane = lanesSelection.selectAll('.lane')
           .data(laneData);

        var enter = lane.enter()
            .append('g')
            .attr('class', 'lane');

        enter
            .append('g')
            .append('rect')
            .attr('y', 50)
            .attr('width', LANE_WIDTH)
            .attr('height', LANE_HEIGHT);

        enter
            .append('g')
            .attr('class', 'forward')
            .append('text')
            .attr('y', 40)
            .attr('x', 14)
            .text('▲');

        enter
            .append('g')
            .attr('class', 'backward')
            .append('text')
            .attr('y', 40)
            .attr('x', 14)
            .text('▼');

        lane.exit().remove();

        lane
            .attr('transform', function(d) {
                return 'translate(' + (LANE_WIDTH*d.key*1.5)+ ', 0)';
            });

        lane.select('.forward')
            .style('visibility', function(d) { return d.forward ? 'visible' : 'hidden'; });

        lane.select('.backward')
            .style('visibility', function(d) { return d.backward ? 'visible' : 'hidden'; });
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
