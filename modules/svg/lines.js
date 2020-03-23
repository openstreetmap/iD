import deepEqual from 'fast-deep-equal';
import { range as d3_range } from 'd3-array';

import {
    svgMarkerSegments, svgPath, svgRelationMemberTags, svgSegmentWay
} from './helpers';
import { svgTagClasses } from './tag_classes';

import { osmEntity, osmOldMultipolygonOuterMember } from '../osm';
import { utilArrayFlatten, utilArrayGroupBy } from '../util';
import { utilDetect } from '../util/detect';

export function svgLines(projection, context) {
    var detected = utilDetect();

    var highway_stack = {
        motorway: 0,
        motorway_link: 1,
        trunk: 2,
        trunk_link: 3,
        primary: 4,
        primary_link: 5,
        secondary: 6,
        tertiary: 7,
        unclassified: 8,
        residential: 9,
        service: 10,
        footway: 11
    };


    function drawTargets(selection, graph, entities, filter) {
        var targetClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var nopeClass = context.getDebug('target') ? 'red ' : 'nocolor ';
        var getPath = svgPath(projection).geojson;
        var activeID = context.activeID();
        var base = context.history().base();

        // The targets and nopes will be MultiLineString sub-segments of the ways
        var data = { targets: [], nopes: [] };

        entities.forEach(function(way) {
            var features = svgSegmentWay(way, graph, activeID);
            data.targets.push.apply(data.targets, features.passive);
            data.nopes.push.apply(data.nopes, features.active);
        });


        // Targets allow hover and vertex snapping
        var targetData = data.targets.filter(getPath);
        var targets = selection.selectAll('.line.target-allowed')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(targetData, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        var segmentWasEdited = function(d) {
            var wayID = d.properties.entity.id;
            // if the whole line was edited, don't draw segment changes
            if (!base.entities[wayID] ||
                !deepEqual(graph.entities[wayID].nodes, base.entities[wayID].nodes)) {
                return false;
            }
            return d.properties.nodes.some(function(n) {
                return !base.entities[n.id] ||
                       !deepEqual(graph.entities[n.id].loc, base.entities[n.id].loc);
            });
        };

        // enter/update
        targets.enter()
            .append('path')
            .merge(targets)
            .attr('d', getPath)
            .attr('class', function(d) {
                return 'way line target target-allowed ' + targetClass + d.id;
            })
            .classed('segment-edited', segmentWasEdited);

        // NOPE
        var nopeData = data.nopes.filter(getPath);
        var nopes = selection.selectAll('.line.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(nopeData, function key(d) { return d.id; });

        // exit
        nopes.exit()
            .remove();

        // enter/update
        nopes.enter()
            .append('path')
            .merge(nopes)
            .attr('d', getPath)
            .attr('class', function(d) {
                return 'way line target target-nope ' + nopeClass + d.id;
            })
            .classed('segment-edited', segmentWasEdited);
    }


    function drawLines(selection, graph, entities, filter) {
        var base = context.history().base();

        function waystack(a, b) {
            var selected = context.selectedIDs();
            var scoreA = selected.indexOf(a.id) !== -1 ? 20 : 0;
            var scoreB = selected.indexOf(b.id) !== -1 ? 20 : 0;

            if (a.tags.highway) { scoreA -= highway_stack[a.tags.highway]; }
            if (b.tags.highway) { scoreB -= highway_stack[b.tags.highway]; }
            return scoreA - scoreB;
        }


        function drawLineGroup(selection, klass, isSelected) {
            // Note: Don't add `.selected` class in draw modes
            var mode = context.mode();
            var isDrawing = mode && /^draw/.test(mode.id);
            var selectedClass = (!isDrawing && isSelected) ? 'selected ' : '';

            var lines = selection
                .selectAll('path')
                .filter(filter)
                .data(getPathData(isSelected), osmEntity.key);

            lines.exit()
                .remove();

            // Optimization: Call expensive TagClasses only on enter selection. This
            // works because osmEntity.key is defined to include the entity v attribute.
            lines.enter()
                .append('path')
                .attr('class', function(d) {

                    var prefix = 'way line';

                    // if this line isn't styled by its own tags
                    if (!d.hasInterestingTags()) {

                        var parentRelations = graph.parentRelations(d);
                        var parentMultipolygons = parentRelations.filter(function(relation) {
                            return relation.isMultipolygon();
                        });

                        // and if it's a member of at least one multipolygon relation
                        if (parentMultipolygons.length > 0 &&
                            // and only multipolygon relations
                            parentRelations.length === parentMultipolygons.length) {
                            // then fudge the classes to style this as an area edge
                            prefix = 'relation area';
                        }
                    }

                    var oldMPClass = oldMultiPolygonOuters[d.id] ? 'old-multipolygon ' : '';
                    return prefix + ' ' + klass + ' ' + selectedClass + oldMPClass + d.id;
                })
                .classed('added', function(d) {
                    return !base.entities[d.id];
                })
                .classed('geometry-edited', function(d) {
                    return graph.entities[d.id] &&
                        base.entities[d.id] &&
                        !deepEqual(graph.entities[d.id].nodes, base.entities[d.id].nodes);
                })
                .classed('retagged', function(d) {
                    return graph.entities[d.id] &&
                        base.entities[d.id] &&
                        !deepEqual(graph.entities[d.id].tags, base.entities[d.id].tags);
                })
                .call(svgTagClasses())
                .merge(lines)
                .sort(waystack)
                .attr('d', getPath)
                .call(svgTagClasses().tags(svgRelationMemberTags(graph)));

            return selection;
        }


        function getPathData(isSelected) {
            return function() {
                var layer = this.parentNode.__data__;
                var data = pathdata[layer] || [];
                return data.filter(function(d) {
                    if (isSelected)
                        return context.selectedIDs().indexOf(d.id) !== -1;
                    else
                        return context.selectedIDs().indexOf(d.id) === -1;
                });
            };
        }

        function addMarkers(layergroup, pathclass, groupclass, groupdata, marker) {
            var markergroup = layergroup
                .selectAll('g.' + groupclass)
                .data([pathclass]);

            markergroup = markergroup.enter()
                .append('g')
                .attr('class', groupclass)
                .merge(markergroup);

            var markers = markergroup
                .selectAll('path')
                .filter(filter)
                .data(
                    function data() { return groupdata[this.parentNode.__data__] || []; },
                    function key(d) { return [d.id, d.index]; }
                );

            markers.exit()
                .remove();

            markers = markers.enter()
                .append('path')
                .attr('class', pathclass)
                .merge(markers)
                .attr('marker-mid', marker)
                .attr('d', function(d) { return d.d; });

            if (detected.ie) {
                markers.each(function() { this.parentNode.insertBefore(this, this); });
            }
        }


        var getPath = svgPath(projection, graph);
        var ways = [];
        var onewaydata = {};
        var sideddata = {};
        var oldMultiPolygonOuters = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var outer = osmOldMultipolygonOuterMember(entity, graph);
            if (outer) {
                ways.push(entity.mergeTags(outer.tags));
                oldMultiPolygonOuters[outer.id] = true;
            } else if (entity.geometry(graph) === 'line') {
                ways.push(entity);
            }
        }

        ways = ways.filter(getPath);
        var pathdata = utilArrayGroupBy(ways, function(way) { return way.layer(); });

        Object.keys(pathdata).forEach(function(k) {
            var v = pathdata[k];
            var onewayArr = v.filter(function(d) { return d.isOneWay(); });
            var onewaySegments = svgMarkerSegments(
                projection, graph, 35,
                function shouldReverse(entity) { return entity.tags.oneway === '-1'; },
                function bothDirections(entity) {
                    return entity.tags.oneway === 'reversible' || entity.tags.oneway === 'alternating';
                }
            );
            onewaydata[k] = utilArrayFlatten(onewayArr.map(onewaySegments));

            var sidedArr = v.filter(function(d) { return d.isSided(); });
            var sidedSegments = svgMarkerSegments(
                projection, graph, 30,
                function shouldReverse() { return false; },
                function bothDirections() { return false; }
            );
            sideddata[k] = utilArrayFlatten(sidedArr.map(sidedSegments));
        });


        var covered = selection.selectAll('.layer-osm.covered');     // under areas
        var uncovered = selection.selectAll('.layer-osm.lines');     // over areas
        var touchLayer = selection.selectAll('.layer-touch.lines');

        // Draw lines..
        [covered, uncovered].forEach(function(selection) {
            var range = (selection === covered ? d3_range(-10,0) : d3_range(0,11));
            var layergroup = selection
                .selectAll('g.layergroup')
                .data(range);

            layergroup = layergroup.enter()
                .append('g')
                .attr('class', function(d) { return 'layergroup layer' + String(d); })
                .merge(layergroup);

            layergroup
                .selectAll('g.linegroup')
                .data(['shadow', 'casing', 'stroke', 'shadow-highlighted', 'casing-highlighted', 'stroke-highlighted'])
                .enter()
                .append('g')
                .attr('class', function(d) { return 'linegroup line-' + d; });

            layergroup.selectAll('g.line-shadow')
                .call(drawLineGroup, 'shadow', false);
            layergroup.selectAll('g.line-casing')
                .call(drawLineGroup, 'casing', false);
            layergroup.selectAll('g.line-stroke')
                .call(drawLineGroup, 'stroke', false);

            layergroup.selectAll('g.line-shadow-highlighted')
                .call(drawLineGroup, 'shadow', true);
            layergroup.selectAll('g.line-casing-highlighted')
                .call(drawLineGroup, 'casing', true);
            layergroup.selectAll('g.line-stroke-highlighted')
                .call(drawLineGroup, 'stroke', true);

            addMarkers(layergroup, 'oneway', 'onewaygroup', onewaydata, 'url(#ideditor-oneway-marker)');
            addMarkers(layergroup, 'sided', 'sidedgroup', sideddata,
                function marker(d) {
                    var category = graph.entity(d.id).sidednessIdentifier();
                    return 'url(#ideditor-sided-marker-' + category + ')';
                }
            );
        });

        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, ways, filter);
    }


    return drawLines;
}
