import * as d3 from 'd3';
import _ from 'lodash';
import { OneWaySegments, Path, RelationMemberTags, TagClasses } from './index';
import { Detect } from '../util/detect';
import { Entity } from '../core/index';
import { simpleMultipolygonOuterMember } from '../geo/index';

export function Lines(projection) {

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

    function waystack(a, b) {
        var as = 0, bs = 0;

        if (a.tags.highway) { as -= highway_stack[a.tags.highway]; }
        if (b.tags.highway) { bs -= highway_stack[b.tags.highway]; }
        return as - bs;
    }

    return function drawLines(surface, graph, entities, filter) {
        var ways = [], pathdata = {}, onewaydata = {},
            getPath = Path(projection, graph);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i],
                outer = simpleMultipolygonOuterMember(entity, graph);
            if (outer) {
                ways.push(entity.mergeTags(outer.tags));
            } else if (entity.geometry(graph) === 'line') {
                ways.push(entity);
            }
        }

        ways = ways.filter(getPath);

        pathdata = _.groupBy(ways, function(way) { return way.layer(); });

        _.forOwn(pathdata, function(v, k) {
            onewaydata[k] = _(v)
                .filter(function(d) { return d.isOneWay(); })
                .map(OneWaySegments(projection, graph, 35))
                .flatten()
                .valueOf();
        });

        var layergroup = surface
            .selectAll('.layer-lines')
            .selectAll('g.layergroup')
            .data(d3.range(-10, 11));

        layergroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer layergroup layer' + String(d); });


        var linegroup = layergroup
            .selectAll('g.linegroup')
            .data(['shadow', 'casing', 'stroke']);

        linegroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer linegroup line-' + d; });


        var lines = linegroup
            .selectAll('path')
            .filter(filter)
            .data(
                function() { return pathdata[this.parentNode.parentNode.__data__] || []; },
                Entity.key
            );

        // Optimization: call simple TagClasses only on enter selection. This
        // works because Entity.key is defined to include the entity v attribute.
        lines.enter()
            .append('path')
            .attr('class', function(d) { return 'way line ' + this.parentNode.__data__ + ' ' + d.id; })
            .call(TagClasses());

        lines
            .sort(waystack)
            .attr('d', getPath)
            .call(TagClasses().tags(RelationMemberTags(graph)));

        lines.exit()
            .remove();


        var onewaygroup = layergroup
            .selectAll('g.onewaygroup')
            .data(['oneway']);

        onewaygroup.enter()
            .append('g')
            .attr('class', 'layer onewaygroup');


        var oneways = onewaygroup
            .selectAll('path')
            .filter(filter)
            .data(
                function() { return onewaydata[this.parentNode.parentNode.__data__] || []; },
                function(d) { return [d.id, d.index]; }
            );

        oneways.enter()
            .append('path')
            .attr('class', 'oneway')
            .attr('marker-mid', 'url(#oneway-marker)');

        oneways
            .attr('d', function(d) { return d.d; });

        if (Detect().ie) {
            oneways.each(function() { this.parentNode.insertBefore(this, this); });
        }

        oneways.exit()
            .remove();

    };
}
