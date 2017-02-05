import * as d3 from 'd3';
import { utilRebind } from '../../../util/rebind';
import { svgIcon } from '../../../svg/index';
import { t } from '../../../util/locale';

var validTurnLanes = [
    'left', 'right', 'slight_left', 'slight_right', 'sharp_left',
    'sharp_right', 'merge_to_left', 'merge_to_right', 'reverse', 'through'
];

export function uiTurnLanes() {
    var dispatch = d3.dispatch('change');

    function turnLanes(selection, metadata, curDirection, curLane) {
        var turnLanesData = metadata.turnLanes;
        var valid = validTurnLanes.map(function (d) {
            var directions = turnLanesData[curDirection][curLane];
            return {
                dir: d,
                active: directions && directions.indexOf(d) > -1
            };
        });
        var wrapper = selection
            .selectAll('.turn-lanes')
            .data([curLane]);

        wrapper.exit().remove();

        var enter = wrapper.enter()
            .append('div')
            .attr('class', 'turn-lanes localized-wrap');

        var label = enter
            .append('label')
            .attr('class', 'form-label entry')
            .text('Turn Lanes');

        var buttonWrap = label
            .append('div')
            .attr('class', 'form-label-button-wrap');

        buttonWrap.append('button')
            .attr('class', 'remove-icon')
            .attr('tabindex', -1)
            .call(svgIcon('#operation-delete'));

        enter
            .append('ul')
            .attr('class', 'turn-lane-tags preset-input-wrap checkselect');

        // Update
        wrapper = wrapper
            .merge(enter);

        wrapper.selectAll('.remove-icon')
            .on('click', remove);

        var dirWrapper = wrapper.selectAll('ul')
            .selectAll('.turn-lanes-direction')
            .data(valid);

        dirWrapper.exit().remove();

        var row = dirWrapper
            .enter()
            .append('li')
            .attr('class', 'label col6 turn-lanes-direction')
            .text(function (d) { return t('lanes.turn.' + d.dir); });

        dirWrapper = dirWrapper
            .merge(row);

        // Update
        dirWrapper
            .classed('active', function (d) { return d.active; })
             .classed('left-border', function(d, i) {
                return i%2 === 1; 
            })
            .on('click', change);

        function remove() {
            d3.event.stopPropagation();
            turnLanesData[curDirection][curLane] = ['none'];
            dispatch.call('change', this);
        }
        function change(d) {
            d3.event.stopPropagation();
            var newDirs = [];
            d.active = !d.active;
            valid.forEach(function (v) {
                if (v.active) newDirs.push(v.dir);
            });

            if (newDirs.length === 0) newDirs = ['none'];
            turnLanesData[curDirection][curLane] = newDirs;
            dispatch.call('change', this);
        }
    }
    return utilRebind(turnLanes, dispatch, 'on');
}