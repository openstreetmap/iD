import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import _ from 'lodash';
import { utilGetSetValue } from '../../util/get_set_value';
import { uiTurnLanes } from './lanes/turn';
import { uiLaneInfo } from './lanes/laneInfo';

export function uiFieldLanes(field, context) {
    var dispatch = d3.dispatch('change'),
        // TODO: currentLane if big like 6 goes crazy if other wayID has less than 6 lanes
        curLane = 0,
        curDir = 'unspecified',
        wayID,
        lanesData,
        metadata;

    var turnLanes = uiTurnLanes(field, context)
        .on('change', change);

    var lanesInfo = uiLaneInfo(field, context)
        .on('change', change);
    // var lanes 

    function lanes(selection) {
        lanesData = context.entity(wayID).lanes();
        metadata = lanesData.metadata;
        
        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        selection.call(lanesInfo, metadata, curDir, curLane);

        var laneSelector = selection.selectAll('.lane-selector').data([0]);

        laneSelector = laneSelector.enter()
            .append('div')
            .attr('class', 'lane-selector localized-wrap')
            .merge(laneSelector);
        
        laneSelector.call(laneSelectorUI);

        selection.call(turnLanes, metadata, curDir, curLane);

        var wrap = selection.selectAll('.lane-input-wrap')
            .data([0]);

        wrap.enter()
            .append('div')
            .attr('class', 'lane-input-wrap')
            .merge(wrap);

        function render() {
            if (context.hasEntity(wayID)) {
                lanes(selection);
            }
        }

        function laneSelectorUI(selection) {
            var items;
            var metadata = lanesData.metadata;
            var oneway = metadata.oneway;
            var len = metadata.count;
            // TODO: clean up this mess of vvvvv
            if (oneway) len = metadata.count;
            else len = metadata.forward + metadata.backward;

            selection.selectAll('.form-label')
                .data([0])
                .enter()
                .append('label')
                .attr('class', 'form-label entry')
                .text('Select Lane');

            var wrap = selection.selectAll('.preset-input-wrap')
                .data([0]);

            wrap = wrap.enter()
                .append('div')
                .attr('class', 'lane-tags preset-input-wrap checkselect')
                .merge(wrap);

            var list = wrap.selectAll('ul')
                .data([0]);

            list = list.enter()
                .append('ul')
                .merge(list);

            items = list.selectAll('.lane-item')
                .data(_.fill(Array(len), 0).map(function (n, i) {
                    return i;
                }));

            items.enter()
                .append('div')
                .attr('class', 'lane-item')
                .attr('id', function (d) {
                    return 'lane-' + d;
                })
                .append('span');

            var input = selection.selectAll('.lane-item');

            input.selectAll('span')
                .text(function (d) {
                    if (metadata.oneway) return d + 1;
                    if (d < metadata.forward) {
                        return (d + 1) + '▲';
                    }
                    return (d - metadata.forward + 1) + '▼';
                });

            input.classed('active', function (d) {
                if (metadata.oneway) return d === curLane;
                if (curDir === 'forward') {
                    return d === curLane;
                }
                return curLane + metadata.forward === d;
            });
            input.on('click', function (d) {
                if (metadata.oneway) {
                    curLane = d;
                    curDir = 'unspecified';
                } else {
                    if (d < metadata.forward) {
                        curLane = d;
                        curDir = 'forward';
                    } else {
                        curLane = d - metadata.forward;
                        curDir = 'backward';
                    }
                }


                render();
            });
            items.exit().remove();
        }
    }

    function change(t, onInput) {
        var tag = {};

        if (metadata.oneway) {
            curDir = 'unspecified';
            curLane = curLane >= metadata.count ? 0 : curLane;

            tag.lanes = Number(metadata.count).toString();

            tag['lanes:forward'] = undefined;
            tag['lanes:backward'] = undefined;

            tag['turn:lanes'] = formPipes(metadata.turnLanes.unspecified, metadata.count, 'none');
            tag['turn:lanes:forward'] = undefined;
            tag['turn:lanes:backward'] = undefined;
        } else {
            curLane = curLane >= metadata[curDir] ? 0 : curLane;
    
            tag.lanes = metadata.forward + metadata.backward + metadata.bothways + '';
            tag['lanes:forward'] = metadata.forward + '';
            tag['lanes:backward'] = metadata.backward + '';

            tag['turn:lanes'] = undefined;
            tag['turn:lanes:forward'] = formPipes(metadata.turnLanes.forward, metadata.forward, 'none');
            tag['turn:lanes:backward'] = formPipes(metadata.turnLanes.backward, metadata.backward, 'none');
        }
        dispatch.call('change', this, tag, onInput);
    }

    lanes.entity = function (_) {
        if (!wayID) {
            if (wayID !== _.id) {
                curLane = 0;
                wayID = _.id;
            }
            if (_.isOneWay()) {
                curDir = 'unspecified';
            } else {
                curDir = 'forward';
            }
        }
    };

    lanes.tags = function () {
    };
    lanes.focus = function () { };
    lanes.off = function () { };

    return utilRebind(lanes, dispatch, 'on');
}

export function formPipes(data, len, nullKey) {
    var piped = data.slice(0, len);

    // Makes sure it fills any undefined as nullKey
    for (var i = 0; i < len; i++) {
        if (!piped[i]) {
            piped[i] = [nullKey];
        }
    }

    var isEmpty = _.every(piped, function (i) {
        if (!_.isArray(i)) throw new exception('I is not array');
        return i.indexOf(nullKey) > -1;
    });

    var str = piped.map(function (lane) {
        return lane.join(';');
    });

    str = str.join('|');
    return isEmpty ? undefined : str;
}