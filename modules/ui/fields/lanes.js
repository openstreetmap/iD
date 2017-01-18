import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import { utilGetDimensions } from '../../util/dimensions';
import { uiFieldCheck } from './check';
import _ from 'lodash';
import { d3combobox } from '../../lib/d3.combobox.js';
import { utilGetSetValue } from '../../util/get_set_value';


function validLanes() {
    return [
        'left', 'slight_left', 'sharp_left', 'through', 'right', 'slight_right',
        'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none'
    ];
}

export function uiFieldLanes(field, context) {
    var dispatch = d3.dispatch('change'),
        LANE_WIDTH = 40,
        LANE_HEIGHT = 200,
        wayID,
        lanesData;
    
    function lanesInfoUI(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);
        var keysConsidered = ['count', 'forward', 'backward', 'maxspeed'];
        var metadata = lanesData.metadata;

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'cf preset-input-wrap')
            .append('ul')
            .merge(wrap);

        var list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .merge(list);


        var items = list.selectAll('li')
            .data(keysConsidered);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'cf preset-access-' + d; });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .text(function(d) { return d; });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-access-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-access')
            .attr('id', function(d) { return 'preset-input-access-' + d; })
            .each(function(d) {
                    this.value = metadata[d];
                   
                });

        // Update
        items = items.merge(enter);
        items.selectAll('input')
            .property('value', function (d) {
                return metadata[d];
            });

       items.selectAll('input')
            .on('change', change)
            .on('blur', change);
    }

    function turnLanesUI(selection) {
        
   
        var laneTags = selection.selectAll('.lane-tags').data([0]);

       
         laneTags
                .enter()
                .append('label')
                .attr('class','form-label')
                .text('Turn Lanes');

        var laneTagsEnter = laneTags
            .enter()
            .append('div')
            .attr('class', 'lane-tags cf preset-input-wrap')
            .classed('checkselect', 'true');

        var inputNumber = laneTagsEnter.append('input')
            .attr('type', 'field.type')
            .attr('id', 'fieldId')
            .attr('placeholder', 'inspector.unknown')
            .attr('type', 'text');

        var spinControl = laneTagsEnter.selectAll('.spin-control')
            .data([0]);

        var spinControlEnter = spinControl.enter()
            .append('div')
            .attr('class', 'spin-control');

        spinControlEnter
            .append('button')
            .datum(1)
            .attr('class', 'increment')
            .attr('tabindex', -1);

        spinControlEnter
            .append('button')
            .datum(-1)
            .attr('class', 'decrement')
            .attr('tabindex', -1);

        spinControl = spinControl
            .merge(spinControlEnter);

        spinControl.selectAll('button')
            .on('click', function(d) {
                d3.event.preventDefault();
                var num = parseInt(inputNumber.node().value || 0, 10);
                if (!isNaN(num) && num + d > 0 && num + d <= lanesData.metadata.count) inputNumber.node().value = num + d;
            });



        var label = laneTagsEnter.selectAll('.label')
            .data(validLanes());

        var labelEnter = label.enter()
            .append('label');

        labelEnter
            .append('input')
            .property('indeterminate', field.type === 'check')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        labelEnter
            .append('span')
            .text(function (d) { return d;})
            .attr('class', 'value');

        label = label.merge(labelEnter);
    }


    function lanes(selection) {
  
        lanesData = context.entity(wayID).lanes();
        var lanesArray = lanesData.lanesArray;

        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        var lanesInfo = selection.selectAll('.lanes-info').data([0]);
        lanesInfo = lanesInfo.enter()
            .append('div')
            .attr('class', 'lanes-info')
            .merge(lanesInfo);
        console.log('called', lanesData.metadata);
        lanesInfoUI(lanesInfo);

        var turnLanes = selection.selectAll('.turn-lanes').data([0]);
        turnLanes = turnLanes.enter()
            .append('div')
            .attr('class', 'turn-lanes')
            .merge(turnLanes);
        turnLanesUI(turnLanes);

        var wrap = selection.selectAll('.lane-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'lane-input-wrap')
            .merge(wrap);
            
            
        var surface =  wrap.selectAll('.surface')
            .data([0]);


        var d = utilGetDimensions(wrap);
        var freeSpace = d[0] - lanesData.metadata.count * LANE_WIDTH * 1.5 + LANE_WIDTH * 0.5;

       
    }

    function change(d) {
        var tag = {};
        if (d === 'count') {
            tag.lanes = utilGetSetValue(d3.select(this)) || undefined;
        }
        if (d === 'forward') {
            tag['lanes:forward'] = utilGetSetValue(d3.select(this)) || undefined;
        }
        if (d === 'backward') {
            tag['lanes:backward'] = utilGetSetValue(d3.select(this)) || undefined;
        }
        if (d === 'maxspeed') {
            tag['maxspeed:lanes'] = utilGetSetValue(d3.select(this)) || undefined;
        }
        if (d === 'oneway') {
            tag.oneway = utilGetSetValue(d3.select(this)) || undefined;
        }
        dispatch.call('change', this, tag);
    }

    lanes.entity = function(_) {
        if (!wayID || wayID !== _.id) {
            wayID = _.id;
        }
    };

    lanes.tags = function() {};
    lanes.focus = function() {};
    lanes.off = function() {};

    function laneSvg() {
         // surface = surface.enter()
        //     .append('svg')
        //     .attr('width', d[0])
        //     .attr('height', 300)
        //     .attr('class', 'surface')
        //     .merge(surface);


        // var lanesSelection = surface.selectAll('.lanes')
        //     .data([0]);

        // lanesSelection = lanesSelection.enter()
        //     .append('g')
        //     .attr('class', 'lanes')
        //     .merge(lanesSelection);

        // lanesSelection
        //     .attr('transform', function () {
        //         return 'translate(' + (freeSpace / 2) + ', 0)';
        //     });


        // // var lanesArray = 
        // var lane = lanesSelection.selectAll('.lane')
        //    .data(new Array(lanesData.metadata.count));

        // lane.exit()
        //     .remove();

        // var enter = lane.enter()
        //     .append('g')
        //     .attr('class', 'lane');

        // enter
        //     .append('g')
        //     .append('rect')
        //     .attr('y', 50)
        //     .attr('width', LANE_WIDTH)
        //     .attr('height', LANE_HEIGHT)
        //     .attr('transform', function (d, i) {
        //         return 'translate(' + LANE_WIDTH * i * 1.5+ ')'; 
        //     });

        // enter
        //     .append('g')
        //     .attr('class', 'forward')
        //     .append('text')
        //     .attr('y', 40)
        //     .attr('x', 14)
        //     .text('▲')
        //     .attr('transform', function (d, i) {
        //         return 'translate(' + LANE_WIDTH * i * 1.5+ ')'; 
        //     });

        // enter
        //     .append('g')
        //     .attr('class', 'bothways')
        //     .append('text')
        //     .attr('y', 40)
        //     .attr('x', 14)
        //     .text('▲▼')
        //     .attr('transform', function (d, i) {
        //         return 'translate(' + LANE_WIDTH * i * 1.5+ ')'; 
        //     });

        // enter
        //     .append('g')
        //     .attr('class', 'backward')
        //     .append('text')
        //     .attr('y', 40)
        //     .attr('x', 14)
        //     .text('▼')
        //     .attr('transform', function (d, i) {
        //         return 'translate(' + LANE_WIDTH * i * 1.5+ ')'; 
        //     });


        // lane = lane
        //     .merge(enter);

        // lane
        //     .attr('transform', function(d, i) {
        //         return 'translate(' + (LANE_WIDTH * i * 1.5) + ', 0)';
        //     });

        
        // var te = wrap.selectAll('.lane-text').data([0]);
        
        // te
        //     .enter()
        //     .append('div')
        //     .attr('class', 'lane-text')
        //     .text('check 123');

        // var sel = wrap.selectAll('.lane-text');

        // sel.on('click', function() {
        //         var t = {};
        //         t['kushan'] = 'joshi' + Math.random();
        //         dispatch.call('change', this, t);
        //         d3.event.stopPropagation();

        // });
        
       


        // te.exit().remove();
       
        // lane.select('.forward')
        //     .style('visibility', function(d) {
        //         return d.direction === 'forward' ? 'visible' : 'hidden';
        //     });

        // lane.select('.bothways')
        //     .style('visibility', function(d) {
        //         return d.direction === 'bothways' ? 'visible' : 'hidden';
        //     });

        // lane.select('.backward')
        //     .style('visibility', function(d) {
        //         return d.direction === 'backward' ? 'visible' : 'hidden';
        //     });
    }
    return utilRebind(lanes, dispatch, 'on');
}
