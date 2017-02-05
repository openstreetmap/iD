import * as d3 from 'd3';
import { validTurnLanes } from '../../../osm/lanes';
import { utilRebind } from '../../../util/rebind';
import { formPipes } from '../lanes';
import { utilGetSetValue } from '../../../util/get_set_value';

import _ from 'lodash';

export function uiLaneInfo() {
    var dispatch = d3.dispatch('change');
    function laneInfo(selection, metadata, curDirection, curLane) {
        // TODO: make this thing dynamic and show keysConsidered
        // wrt to oneway.
        var oneway = metadata.oneway;

        var wrapper = selection
            .selectAll('.lanes-info')
            .data([0]);

        var enter = wrapper.enter()
            .append('div')
            .attr('class', 'lanes-info lanes-wrap preset-input-wrap');

        wrapper = wrapper
            .merge(enter);
        
        var input = wrapper.selectAll('.lanes-info')
            .data(oneway ? [{
                text: 'Lanes',
                dir: 'oneway'
            }] : [{
                text: 'Forward Lanes',
                dir: 'forward'
            },
            {
                text: 'Backward Lanes',
                dir: 'backward'
            }]);
    
        input.exit()
            .remove();
    
        input = input.enter()
            .append('input')
            .attr('class', 'lanes-info')
            .attr('type', 'lane-count')
            .merge(input); 
        
        input
            .attr('placeholder', function (d) {
                return d.text;
            })
            .attr('direction', function (d) {
                return d.dir;
            })
            .on('input', change)
            .on('blur', change)
            .on('change', change)
            .each(function (d) {
                if (d.dir === 'oneway') {
                    this.value = metadata.count;
                    return; 
                }
                this.value = metadata[d.dir];
            });


        var spinControl = wrapper.selectAll('.spin-control')
            .data([0]);


        var spinEnter = spinControl.enter()
            .append('div')
            .attr('class', 'spin-control');

        spinEnter
            .append('button')
            .datum(1)
            .attr('class', 'increment')
            .attr('tabindex', -1);

        spinEnter
            .append('button')
            .datum(-1)
            .attr('class', 'decrement')
            .attr('tabindex', -1);

        spinControl = spinControl
            .merge(spinEnter);

        spinControl.selectAll('button')
            .on('click', function (d) {
                d3.event.preventDefault();
                console.log(input.node().value);
                var num = parseInt(input.node().value || 0, 10);
                if (!isNaN(num)) input.node().value = num + d;
                
                change();
            });

        // var items = list.selectAll('li')
        //     .data(keysConsidered);

        // Enter
        // var enter = items.enter()
        //     .append('li')
        //     .attr('class', function (d) { return 'cf preset-access-' + d; });

        // enter
        //     .append('span')
        //     .attr('class', 'col6 label preset-label-')
        //     .attr('for', function (d) { return 'preset-input-' + d; })
        //     .text(function (d) { return d; });

        // enter
        //     .append('div')
        //     .attr('class', 'col6 preset-input-lanes-wrap')
        //     .append('input')
        //     .attr('type', 'text')
        //     .attr('class', 'preset-input-lanes')
        //     .attr('id', function (d) { return 'preset-input-lanes-' + d; })
        //     .each(function (d) {
        //         this.value = metadata[d];
        //     });

        // // Update
        // items = items.merge(enter);
        // items.selectAll('input')
        //     .property('value', function (d) {
        //         return metadata[d];
        //     });

        // var input = items.selectAll('input');

        // input
        //     .on('change', change)
        //     .on('blur', change);

        function change(d) {
            var tag = {};
            metadata.count = utilGetSetValue(selection.selectAll('input'));
            
            if (metadata.oneway) {
                if (d === 'count') {
                    var count = utilGetSetValue(d3.select(this));
                    count = parseInt(count, 10);
                    if (!_.isNaN(count)) metadata.count = count;
                }
                if (d === 'reverse') {
                    if (utilGetSetValue(d3.select(this)) === 'true') {
                        metadata.reverse = true;
                    } else {
                        metadata.reverse = false;
                    }
                }

                tag.lanes = Number(metadata.count).toString();
                tag['lanes:forward'] = undefined;
                tag['lanes:backward'] = undefined;

            } else {
                if (d === 'forward') {
                    var forward = utilGetSetValue(d3.select(this));
                    forward = parseInt(forward, 10);
                    if (!_.isNaN(forward)) metadata.forward = forward;
                }
                if (d === 'backward') {
                    var backward = utilGetSetValue(d3.select(this));
                    backward = parseInt(backward, 10);
                    if (!_.isNaN(backward)) metadata.backward = backward;
                }
            }

            dispatch.call('change', this);
        }
    }
    return utilRebind(laneInfo, dispatch, 'on');
}