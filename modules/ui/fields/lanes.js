import { dispatch as d3_dispatch } from 'd3-dispatch';

import { utilRebind } from '../../util/rebind';
import { utilGetDimensions } from '../../util/dimensions';


export function uiFieldLanes(field, context) {
    const dispatch = d3_dispatch('change');
    const LANE_WIDTH = 40;
    const LANE_HEIGHT = 200;
    let _entityIDs = [];

    function lanes(selection) {
        const lanesData = context.entity(_entityIDs[0]).lanes();

        if (!context.container().select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        let wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        let surface =  wrap.selectAll('.surface')
            .data([0]);

        const d = utilGetDimensions(wrap);
        const freeSpace = d[0] - lanesData.lanes.length * LANE_WIDTH * 1.5 + LANE_WIDTH * 0.5;

        surface = surface.enter()
            .append('svg')
            .attr('width', d[0])
            .attr('height', 300)
            .attr('class', 'surface')
            .merge(surface);


        let lanesSelection = surface.selectAll('.lanes')
            .data([0]);

        lanesSelection = lanesSelection.enter()
            .append('g')
            .attr('class', 'lanes')
            .merge(lanesSelection);

        lanesSelection
            .attr('transform', function () {
                return 'translate(' + (freeSpace / 2) + ', 0)';
            });


        let lane = lanesSelection.selectAll('.lane')
           .data(lanesData.lanes);

        lane.exit()
            .remove();

        const enter = lane.enter()
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


    lanes.entityIDs = function(val) {
        _entityIDs = val;
    };

    lanes.tags = function() {};
    lanes.focus = function() {};
    lanes.off = function() {};

    return utilRebind(lanes, dispatch, 'on');
}

uiFieldLanes.supportsMultiselection = false;
