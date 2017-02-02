import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import { utilGetDimensions } from '../../util/dimensions';
import _ from 'lodash';
import { utilGetSetValue } from '../../util/get_set_value';
import { validTurnLanes } from '../../osm/lanes';

export function uiFieldLanes(field, context) {
    var dispatch = d3.dispatch('change'),
        LANE_WIDTH = 40,
        // TODO: currentLane if big like 6 goes crazy if other wayID has less than 6 lanes
        currentLane = 0,
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

        var turnLanes = selection.selectAll('.turn-lanes').data([0]);
        turnLanes = turnLanes.enter()
                .append('div')
                .attr('class', 'turn-lanes localized-wrap')
                .merge(turnLanes);
        turnLanes.call(turnLanesUI);

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
                .attr('class', function(d) { return 'cf preset-access-' + d; });

            enter
                .append('span')
                .attr('class', 'col6 label preset-label-')
                .attr('for', function(d) { return 'preset-input-' + d; })
                .text(function(d) { return d; });

            enter
                .append('div')
                .attr('class', 'col6 preset-input-lanes-wrap')
                .append('input')
                .attr('type', 'text')
                .attr('class', 'preset-input-lanes')
                .attr('id', function(d) { return 'preset-input-lanes-' + d; })
                .each(function(d) {
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
                    .on('change',change)
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
            selection.selectAll('.form-label')
                    .data([0])
                    .enter()
                    .append('label')
                    .attr('class','form-label entry')
                    .text('Turn Lanes');
            
            var wrap = selection.selectAll('.preset-input-wrap')
                .data([0]);
                
            wrap = wrap.enter()
                .append('div')
                .attr('class', 'lane-tags preset-input-wrap checkselect');


            var label = wrap.selectAll('.label')
                .data(validTurnLanes);

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
            var input = selection.selectAll('input');
            input.property('checked', function (d) {
                if (turnLanes[curDirection] && _.isArray(turnLanes[curDirection][currentLane])) {
                    return turnLanes[curDirection][currentLane].filter(function (el) {
                        return el === d;
                    }).length === 1;
                } 
                return false;
            })
            .property('direction', function (d) {return d;});
 

            input.on('click', change);

            function change() {
                d3.event.stopPropagation();
                var direction = d3.select(this).property('direction'); 
                
                var newDirs = [];
                input.each(function (d, i) {
                    var value = d3.select(this).property('checked');  
                    if (value) {
                        newDirs.push(d);
                    }
                });

                if (direction === 'none' || newDirs.length === 0) {
                     newDirs = ['none'];
                } else {
                   _.pull(newDirs, 'none');
                }

                turnLanes[curDirection][currentLane] = newDirs;

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
                    .attr('class','form-label entry')
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
                if (metadata.oneway) return d === currentLane;
                if (curDirection === 'forward') {
                    return d === currentLane;
                }
                return currentLane + metadata.forward === d;
            });
            input.on('click', function (d) {
                if (metadata.oneway) {
                    currentLane = d;
                    curDirection = 'unspecified';
                } else {
                    if (d < metadata.forward) {
                        currentLane = d;
                        curDirection = 'forward';
                    } else {
                        currentLane = d - metadata.forward;
                        curDirection = 'backward';
                    }
                }
              
                
                render();
            });
            items.exit().remove();
        }

        function megaChange() {
            var tag = {};
            var metadata = lanesData.metadata;


            tag.lanes = Number(metadata.count).toString();
 
            // Explanation: Removing tags on the basis of oneway tagging, 
            // assuming if it is a oneway, the forward and backward tags
            // would be pruned, vice versa for oneway=no.
            if (metadata.oneway) {

                if (metadata.reverse) tag.oneway = '-1';
                else tag.oneway = 'yes';

                tag['lanes:forward'] = undefined;
                tag['lanes:backward'] = undefined;

                tag['turn:lanes'] = formPipes(metadata.turnLanes.unspecified, metadata.count, 'none');
                tag['turn:lanes:forward'] = undefined;
                tag['turn:lanes:backward'] = undefined;
            } else {
                tag.lanes = (metadata.forward + metadata.backward) + ''; //TODO: add bothways

                tag['lanes:forward'] = metadata.forward + '';
                tag['lanes:backward'] = metadata.backward + '';
                
                tag['turn:lanes'] = undefined;
                tag['turn:lanes:forward'] = formPipes(metadata.turnLanes.forward, metadata.forward, 'none');
                tag['turn:lanes:backward'] = formPipes(metadata.turnLanes.backward, metadata.backward, 'none');
            }

            console.log('final tag', tag);
            console.log('turn:lane ===',tag['turn:lanes']);
            console.log('turn:lane;forward ==',tag['turn:lanes:forward']);
            console.log('turn:lane;backward ==',tag['turn:lanes:backward']);

            // TODO: need to prune unwanted things, and lane:forward,backward would be zero if oneway
            dispatch.call('change', this, tag);
        }

        function formPipes(data, len, nullKey) {
            var str = data.map(function (lane) {
                return lane.join(';');
            });
            while (str.length < len) {
                str.push(nullKey);
            }
            str = str.join('|');
            return str === '' ? undefined: str;
        }

        function pruneStr(str, s) {

        }
    }

   

    lanes.entity = function(_) {
        if (!wayID) {
            if (wayID !== _.id) {
                currentLane = 0;
                wayID = _.id;
            }
            if (_.isOneWay()) {
                curDirection = 'unspecified';
            } else {
                curDirection = 'forward';
            }
        }
    };

    lanes.tags = function(tags) {
    };
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
