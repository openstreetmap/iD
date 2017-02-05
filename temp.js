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
        var keysConsidered = ['count', 'forward', 'backward', 'reverse'];
        var s = selection.selectAll('.lanes-info').data([0]);
        s = s.enter()
            .append('div')
            .attr('class', 'lanes-info')
            .merge(s);

        var wrap = s.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap')
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
            .attr('class', function (d) { return 'cf preset-access-' + d; });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-')
            .attr('for', function (d) { return 'preset-input-' + d; })
            .text(function (d) { return d; });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-lanes-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-lanes')
            .attr('id', function (d) { return 'preset-input-lanes-' + d; })
            .each(function (d) {
                this.value = metadata[d];
            });

        // Update
        items = items.merge(enter);
        items.selectAll('input')
            .property('value', function (d) {
                return metadata[d];
            });

        var input = items.selectAll('input');

        input
            .on('change', change)
            .on('blur', change);

        function change(d) {
            var tag = {};
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