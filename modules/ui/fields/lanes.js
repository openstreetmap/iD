import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { utilRebind } from '../../util/rebind';
import { utilGetDimensions } from '../../util/dimensions';


export function uiFieldLanes(field, context) {
    var dispatch = d3_dispatch('change'),
        LANE_WIDTH = 40,
        LANE_HEIGHT = 200,
        wayID,
        lanesData;

    function lanes(selection) {
        lanesData = context.entity(wayID).lanes();

        if (!d3_select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap')
            .merge(wrap);

        var surface =  wrap.selectAll('.surface')
            .data([0]);

        var d = utilGetDimensions(wrap);
        var freeSpace = d[0] - lanesData.lanes.length * LANE_WIDTH * 1.5 + LANE_WIDTH * 0.5;

        surface = surface.enter()
            .append('svg')
            .attr('width', d[0])
            .attr('height', 300)
            .attr('class', 'surface')
            .merge(surface);


        var lanesSelection = surface.selectAll('.lanes')
            .data([0]);

        lanesSelection = lanesSelection.enter()
            .append('g')
            .attr('class', 'lanes')
            .merge(lanesSelection);

        lanesSelection
            .attr('transform', function () {
                return 'translate(' + (freeSpace / 2) + ', 0)';
            });


        var lane = lanesSelection.selectAll('.lane')
           .data(lanesData.lanes);

        lane.exit()
            .remove();

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
            .attr('class', 'bothways')
            .append('text')
            .attr('y', 40)
            .attr('x', 14)
            .text('▲▼');

        enter
            .append('g')
            .attr('class', 'backward')
            .append('text')
            .attr('y', 40)
            .attr('x', 14)
            .text('▼');


        lane = lane
            .merge(enter);

        lane
            .attr('transform', function(d) {
                return 'translate(' + (LANE_WIDTH * d.index * 1.5) + ', 0)';
            });

        lane.select('.forward')
            .style('visibility', function(d) {
                return d.direction === 'forward' ? 'visible' : 'hidden';
            });

        lane.select('.bothways')
            .style('visibility', function(d) {
                return d.direction === 'bothways' ? 'visible' : 'hidden';
            });

        lane.select('.backward')
            .style('visibility', function(d) {
                return d.direction === 'backward' ? 'visible' : 'hidden';
            });
    }


    lanes.entity = function(_) {
        if (!wayID || wayID !== _.id) {
            wayID = _.id;
        }
    };

    lanes.tags = function() {};
    lanes.focus = function() {};
    lanes.off = function() {};

    return utilRebind(lanes, dispatch, 'on');
}
