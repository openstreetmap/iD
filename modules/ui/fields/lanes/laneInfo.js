import * as d3 from 'd3';
import { validTurnLanes } from '../../../osm/lanes';
import { utilRebind } from '../../../util/rebind';
import { formPipes } from '../lanes';
import { utilGetSetValue } from '../../../util/get_set_value';

import _ from 'lodash';

export function uiLaneInfo() {
    var dispatch = d3.dispatch('change');
    function laneInfo(selection, metadata, curDirection, curLane) {
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
            .merge(wrap);

        var list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .merge(list);


        var items = list.selectAll('li')
            .data(metadata.oneway ? ['count'] : ['forward', 'backward']);

        items.exit().remove();
        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', 'cf preset-lanes-info');

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-')
            .text(function (d) { return d; });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-lanes-wrap')
            .append('input')
            .attr('type', 'text');

        var spinEnter = enter
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



        // Update
        items = items.merge(enter);

        items.select('span')
            .text(function (d) { return d; });

        items.select('input')
            .each(function (d) {
                this.value = metadata[d];
            })
            .attr('name', function (d) {
                return d;
            })
            .on('change', change)
            .on('blur', change);

        items.selectAll('button')
            .on('click', function (d) {
                d3.event.preventDefault();
                var el = d3.select(this.parentNode.parentNode);
                el = el.selectAll('input');
                var num = parseInt(el.node().value || 0, 10);
                if (!isNaN(num) && num + d > 0 && num + d < 11)
                    el.node().value = num + d;
                change.call(el.node(),  el.attr('name'));
            });

        function change(d) {
            var tag = {};
            if (metadata.oneway) {
                if (d === 'count') {
                    var count = utilGetSetValue(d3.select(this));
                    count = parseInt(count, 10);
                    if (!_.isNaN(count)) metadata.count = count;
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
