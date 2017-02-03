import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import _ from 'lodash';
import { utilGetSetValue } from '../../util/get_set_value';
import { validTurnLanes } from '../../osm/lanes';

export function uiFieldLanes(field, context) {
    var dispatch = d3.dispatch('change'),
        // TODO: currentLane if big like 6 goes crazy if other wayID has less than 6 lanes
        curLane = 0,
        curDirection = 'unspecified',
        wayID,
        lanesData;


    function lanes(selection) {
        lanesData = context.entity(wayID).lanes();
        window.lanesData = lanesData;

        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(lanes.off);
            return;
        }

        var lanesInfo = selection.selectAll('.lanes-info').data([0]);
        lanesInfo = lanesInfo.enter()
            .append('div')
            .attr('class', 'lanes-info')
            .merge(lanesInfo);
        lanesInfo.call(lanesInfoUI);

        var laneSelector = selection.selectAll('.lane-selector').data([0]);

        laneSelector = laneSelector.enter()
            .append('div')
            .attr('class', 'lane-selector localized-wrap')
            .merge(laneSelector);

        laneSelector.call(laneSelectorUI);

        // var turnLanes = selection.selectAll('.turn-lanes').data([0]);
       
        // turnLanes = turnLanes.enter()
        //     .append('div')
        //     .attr('class', 'turn-lanes localized-wrap')
        //     .merge(turnLanes);
        // turnLanes.call(turnLanesUI);
        selection.call(turnLanesUI);

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


        function lanesInfoUI(selection) {
            // TODO: make this thing dynamic and show keysConsidered
            // wrt to oneway.
            var wrap = selection.selectAll('.preset-input-wrap')
                .data([0]);
            var keysConsidered = ['count', 'forward', 'backward', 'reverse'];

            var metadata = lanesData.metadata;
            window.metadata = metadata;
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


            // selection.selectAll('.preset-access-count')
            //     .attr('hidden', function () {
            //         return metadata.oneway;
            //     });

            var input = items.selectAll('input');

            input
                .on('change', change)
                .on('blur', change);

            function change(d) {
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
                } else {
                    if (d === 'forward') {
                        var forward = utilGetSetValue(d3.select(this));
                        forward = parseInt(forward, 10);
                        if (!_.isNaN(forward)) metadata.forward = forward;
                    }
                    if (d === 'backward') {
                        var backward = utilGetSetValue(d3.select(this));
                        backward = parseInt(backward, 10);
                        if (!_.isNaN(forward)) metadata.backward = backward;
                    }
                }
                megaChange();
            }
        }

        function turnLanesUI(selection) {
            var turnLanes = lanesData.metadata.turnLanes;

            var data = validTurnLanes.map(function (t) {
                var dir = turnLanes[curDirection][curLane];
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
                .data(data);

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
                turnLanes[curDirection][curLane] = newDirs;
                megaChange();

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
                if (curDirection === 'forward') {
                    return d === curLane;
                }
                return curLane + metadata.forward === d;
            });
            input.on('click', function (d) {
                if (metadata.oneway) {
                    curLane = d;
                    curDirection = 'unspecified';
                } else {
                    if (d < metadata.forward) {
                        curLane = d;
                        curDirection = 'forward';
                    } else {
                        curLane = d - metadata.forward;
                        curDirection = 'backward';
                    }
                }


                render();
            });
            items.exit().remove();
        }

        function megaChange() {
            var tag = metadataToOSM(lanesData.metadata);
            dispatch.call('change', this, tag);
        }
    }



    lanes.entity = function (_) {
        if (!wayID) {
            if (wayID !== _.id) {
                curLane = 0;
                wayID = _.id;
            }
            if (_.isOneWay()) {
                curDirection = 'unspecified';
            } else {
                curDirection = 'forward';
            }
        }
    };

    lanes.tags = function () {
    };
    lanes.focus = function () { };
    lanes.off = function () { };

    return utilRebind(lanes, dispatch, 'on');
}

export function metadataToOSM(metadata) {
    var tag = {};

    if (metadata.oneway) {
        tag.lanes = Number(metadata.count).toString();

        tag['lanes:forward'] = undefined;
        tag['lanes:backward'] = undefined;

        tag['turn:lanes'] = formPipes(metadata.turnLanes.unspecified, metadata.count, 'none');
        tag['turn:lanes:forward'] = undefined;
        tag['turn:lanes:backward'] = undefined;
    } else {
        tag.lanes = metadata.forward + metadata.backward + metadata.bothways + '';
        tag['lanes:forward'] = metadata.forward + '';
        tag['lanes:backward'] = metadata.backward + '';

        tag['turn:lanes'] = undefined;
        tag['turn:lanes:forward'] = formPipes(metadata.turnLanes.forward, metadata.forward, 'none');
        tag['turn:lanes:backward'] = formPipes(metadata.turnLanes.backward, metadata.backward, 'none');
    }
    return tag;
}


function formPipes(data, len, nullKey) {
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