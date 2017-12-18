import _groupBy from 'lodash-es/groupBy';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _forOwn from 'lodash-es/forOwn';
import _map from 'lodash-es/map';

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
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var getPath = svgPath(projection, graph);

        var targets = selection.selectAll('.line.target')
            .filter(filter)
            .data(entities, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('path')
            .merge(targets)
            .attr('d', getPath)
            .attr('class', function(d) { return 'way line target  ' + fillClass + d.id; });
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
