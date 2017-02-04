import * as d3 from 'd3';
import { validTurnLanes } from '../../../osm/lanes';
import { utilRebind } from '../../../util/rebind';
import { formPipes } from '../lanes';
import _ from 'lodash';

export function uiTurnLanes(field) {
    var dispatch = d3.dispatch('change');

    function turnLanes(selection, metadata, curDirection, curLane) {
        var turnLanesData = metadata.turnLanes;
        var valid = validTurnLanes.map(function (t) {
            var dir = turnLanesData[curDirection][curLane];
            if (!dir) return false;
            return dir.indexOf(t) > -1;
        }); 

        var wrapper = selection
            .selectAll('.turn-lanes')
            .data([0]);

        wrapper.exit().remove();

        var enter = wrapper.enter()
            .append('div')
            .attr('class', 'turn-lanes localized-wrap');

        enter
            .append('label')
            .attr('class', 'form-label entry')
            .text('Turn Lanes');

        enter
            .append('div')
            .attr('class', 'lane-tags preset-input-wrap checkselect');

        wrapper = wrapper
            .merge(enter);

        var label = wrapper
            .selectAll('.lane-tags')
            .selectAll('label')
            .data(valid);

        label.exit()
            .remove();

        var labelEnter = label.enter()
            .append('label');

        labelEnter
            .append('input')
            .property('direction', function (d, i) { return validTurnLanes[i]; })
            .property('indeterminate', field.type === 'check')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);


        labelEnter
            .append('span')
            .text(function (d, i) { return validTurnLanes[i]; })
            .attr('class', 'value');

        label = label
            .merge(labelEnter)
            .select('input')
            .property('checked', function (d) {
                return d;
            })
            .on('click', change);

        function change() {
            d3.event.stopPropagation();
            var input = selection.selectAll('input');
            var direction = d3.select(this).property('direction');
            var newDirs = [];

            input.each(function (d, i) {
                var value = d3.select(this).property('checked');
                var direction = d3.select(this).property('direction');
                if (value) {
                    newDirs.push(direction);
                }
            });

            if (direction === 'none' || newDirs.length === 0) {
                newDirs = ['none'];
            } else {
                _.pull(newDirs, 'none');
            }

            turnLanesData[curDirection][curLane] = newDirs;

            dispatch.call('change', this);
        }
    }
    return utilRebind(turnLanes, dispatch, 'on');
}