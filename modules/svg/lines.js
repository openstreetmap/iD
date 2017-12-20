import _groupBy from 'lodash-es/groupBy';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _forOwn from 'lodash-es/forOwn';
import _map from 'lodash-es/map';

import { geoPath as d3_geoPath } from 'd3-geo';
import { range as d3_range } from 'd3-array';

import {
    svgOneWaySegments,
    svgPath,
    svgRelationMemberTags,
    svgTagClasses
} from './index';

import { osmEntity, osmSimpleMultipolygonOuterMember } from '../osm';
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
        var getPath = svgPath(projection, graph).geojson;
        // var getPath = d3_geoPath(projection);

        var activeID = context.activeID();

        // Rather than drawing lines directly, we'll cut out pieces
        // depending on which parts are active.
        var data = { targets: [], nopes: [] };

        // Touch targets control which other vertices we can drag a vertex onto.
        // - the activeID - nope
        // - next to the activeID - yes (vertices will be merged)
        // - 2 away from the activeID - nope (would create a self intersecting segment)
        // - all others on a closed way - nope (would create a self intersecting polygon)
        //
        // 0 = active vertex - no touch/connect
        // 1 = passive vertex - yes touch/connect
        // 2 = adjacent vertex - special rules
        function passive(d) {
            if (!activeID) return 1;
            if (activeID === d.id) return 0;

            var parents = graph.parentWays(d);
            var i, j;

            for (i = 0; i < parents.length; i++) {
                var nodes = parents[i].nodes;
                var isClosed = parents[i].isClosed();
                for (j = 0; j < nodes.length; j++) {   // find this vertex, look nearby
                    if (nodes[j] === d.id) {
                        var ix1 = j - 2;
                        var ix2 = j - 1;
                        var ix3 = j + 1;
                        var ix4 = j + 2;

                        if (isClosed) {  // wraparound if needed
                            var max = nodes.length - 1;
                            if (ix1 < 0)   ix1 = max + ix1;
                            if (ix2 < 0)   ix2 = max + ix2;
                            if (ix3 > max) ix3 = ix3 - max;
                            if (ix4 > max) ix4 = ix4 - max;
                        }

                        if (nodes[ix1] === activeID) return 0;        // prevent self intersect
                        else if (nodes[ix2] === activeID) return 2;   // adjacent - ok!
                        else if (nodes[ix3] === activeID) return 2;   // adjacent - ok!
                        else if (nodes[ix4] === activeID) return 0;   // prevent self intersect
                        else if (isClosed && nodes.indexOf(activeID) !== -1) return 0;  // prevent self intersect
                    }
                }
            }

            return 1;
        }

        entities.forEach(function(way) {
            var coordGroups = { passive: [], active: [] };
            var segment = [];
            var startType = null;   // 0 = active, 1 = passive, 2 = adjacent
            var currType = null;
            var node;

            for (var i = 0; i < way.nodes.length; i++) {

                if (way.nodes[i] === activeID) {    // vertex is the activeID
                    segment = [];                      // draw no segment here
                    startType = null;
                    continue;
                }

                node = graph.entity(way.nodes[i]);
                currType = passive(node);

                if (startType === null) {
                    startType = currType;
                }

                if (currType !== startType) {    // line changes here - try to save a segment

                    if (segment.length > 0) {         // finish previous segment
                        segment.push(node.loc);

                        if (startType === 2 || currType === 2) {            // one adjacent vertex
                            coordGroups.active.push(segment);
                        } else if (startType === 0 && currType === 0) {     // both active vertices
                            coordGroups.active.push(segment);
                        } else {
                            coordGroups.passive.push(segment);
                        }
                    }

                    segment = [];
                    startType = currType;
                }

                segment.push(node.loc);
            }

            // complete whatever segment we ended on
            if (segment.length > 1) {
                if (startType === 2 || currType === 2) {            // one adjacent vertex
                    coordGroups.active.push(segment);
                } else if (startType === 0 && currType === 0) {     // both active vertices
                    coordGroups.active.push(segment);
                } else {
                    coordGroups.passive.push(segment);
                }
            }

            if (coordGroups.passive.length) {
                data.targets.push({
                    'type': 'Feature',
                    'id': way.id,
                    'geometry': {
                        'type': 'MultiLineString',
                        'coordinates': coordGroups.passive
                    }
                });
            }

            if (coordGroups.active.length) {
                data.nopes.push({
                    'type': 'Feature',
                    'id': way.id + '-nope',   // break the ids on purpose
                    'geometry': {
                        'type': 'MultiLineString',
                        'coordinates': coordGroups.active
                    }
                });
            }
        });


        // Places to hover and connect
        var targets = selection.selectAll('.line.target-allowed')
            .filter(filter)
            .data(data.targets, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('path')
            .merge(targets)
            .attr('d', getPath)
            .attr('class', function(d) { return 'way line target target-allowed ' + targetClass + d.id; });


        // NOPE
        var nopes = selection.selectAll('.line.target-nope')
            .data(data.nopes, function key(d) { return d.id; });

        // exit
        nopes.exit()
            .remove();

        // enter/update
        nopes.enter()
            .append('path')
            .merge(nopes)
            .attr('d', getPath)
            .attr('class', function(d) { return 'way line target target-nope ' + nopeClass + d.id; });

    }


    function drawLines(selection, graph, entities, filter) {

        function waystack(a, b) {
            var selected = context.selectedIDs();
            var scoreA = selected.indexOf(a.id) !== -1 ? 20 : 0;
            var scoreB = selected.indexOf(b.id) !== -1 ? 20 : 0;

            if (a.tags.highway) { scoreA -= highway_stack[a.tags.highway]; }
            if (b.tags.highway) { scoreB -= highway_stack[b.tags.highway]; }
            return scoreA - scoreB;
        }


        function drawLineGroup(selection, klass, isSelected) {
            var lines = selection
                .selectAll('path')
                .filter(filter)
                .data(getPathData(isSelected), osmEntity.key);

            lines.exit()
                .remove();

            // Optimization: call simple TagClasses only on enter selection. This
            // works because osmEntity.key is defined to include the entity v attribute.
            lines.enter()
                .append('path')
                .attr('class', function(d) {
                    return 'way line ' + klass + ' ' + d.id + (isSelected ? ' selected' : '') +
                        (oldMultiPolygonOuters[d.id] ? ' old-multipolygon' : '');
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


        var getPath = svgPath(projection, graph);
        var ways = [];
        var pathdata = {};
        var onewaydata = {};
        var oldMultiPolygonOuters = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var outer = osmSimpleMultipolygonOuterMember(entity, graph);
            if (outer) {
                ways.push(entity.mergeTags(outer.tags));
                oldMultiPolygonOuters[outer.id] = true;
            } else if (entity.geometry(graph) === 'line') {
                ways.push(entity);
            }
        }

        ways = ways.filter(getPath);
        pathdata = _groupBy(ways, function(way) { return way.layer(); });

        _forOwn(pathdata, function(v, k) {
            var arr = _filter(v, function(d) { return d.isOneWay(); });
            onewaydata[k] = _flatten(_map(arr, svgOneWaySegments(projection, graph, 35)));
        });


        var layer = selection.selectAll('.layer-lines .layer-lines-lines');

        var layergroup = layer
            .selectAll('g.layergroup')
            .data(d3_range(-10, 11));

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


        var onewaygroup = layergroup
            .selectAll('g.onewaygroup')
            .data(['oneway']);

        onewaygroup = onewaygroup.enter()
            .append('g')
            .attr('class', 'onewaygroup')
            .merge(onewaygroup);

        var oneways = onewaygroup
            .selectAll('path')
            .filter(filter)
            .data(
                function data() { return onewaydata[this.parentNode.__data__] || []; },
                function key(d) { return [d.id, d.index]; }
            );

        oneways.exit()
            .remove();

        oneways = oneways.enter()
            .append('path')
            .attr('class', 'oneway')
            .attr('marker-mid', 'url(#oneway-marker)')
            .merge(oneways)
            .attr('d', function(d) { return d.d; });

        if (detected.ie) {
            oneways.each(function() { this.parentNode.insertBefore(this, this); });
        }


        // touch targets
        selection.selectAll('.layer-lines .layer-lines-targets')
            .call(drawTargets, graph, ways, filter);
    }


    return drawLines;
}
