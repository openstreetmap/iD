import * as d3 from 'd3';
import _ from 'lodash';
import { Path, TagClasses } from './index';
import { Entity } from '../core/index';
import { isSimpleMultipolygonOuterMember } from '../geo/index';

export function Areas(projection) {
    // Patterns only work in Firefox when set directly on element.
    // (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
    var patterns = {
        wetland: 'wetland',
        beach: 'beach',
        scrub: 'scrub',
        construction: 'construction',
        military: 'construction',
        cemetery: 'cemetery',
        grave_yard: 'cemetery',
        meadow: 'meadow',
        farm: 'farmland',
        farmland: 'farmland',
        orchard: 'orchard'
    };

    var patternKeys = ['landuse', 'natural', 'amenity'];

    function setPattern(d) {
        for (var i = 0; i < patternKeys.length; i++) {
            if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                this.style.fill = this.style.stroke = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                return;
            }
        }
        this.style.fill = this.style.stroke = '';
    }

    return function drawAreas(surface, graph, entities, filter) {
        var path = Path(projection, graph, true),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            multipolygon = isSimpleMultipolygonOuterMember(entity, graph);
            if (multipolygon) {
                areas[multipolygon.id] = {
                    entity: multipolygon.mergeTags(entity.tags),
                    area: Math.abs(entity.area(graph))
                };
            } else if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(entity.area(graph))
                };
            }
        }

        areas = d3.values(areas).filter(function hasPath(a) { return path(a.entity); });
        areas.sort(function areaSort(a, b) { return b.area - a.area; });
        areas = _.map(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        var data = {
            clip: areas,
            shadow: strokes,
            stroke: strokes,
            fill: areas
        };

        var clipPaths = surface.selectAll('defs').selectAll('.clipPath')
           .filter(filter)
           .data(data.clip, Entity.key);

        clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath')
           .attr('id', function(entity) { return entity.id + '-clippath'; })
           .append('path');

        clipPaths.selectAll('path')
           .attr('d', path);

        clipPaths.exit()
           .remove();

        var areagroup = surface
            .selectAll('.layer-areas')
            .selectAll('g.areagroup')
            .data(['fill', 'shadow', 'stroke']);

        areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer areagroup area-' + d; });

        var paths = areagroup
            .selectAll('path')
            .filter(filter)
            .data(function(layer) { return data[layer]; }, Entity.key);

        // Remove exiting areas first, so they aren't included in the `fills`
        // array used for sorting below (https://github.com/openstreetmap/iD/issues/1903).
        paths.exit()
            .remove();

        var fills = surface.selectAll('.area-fill path.area')[0];

        var bisect = d3.bisector(function(node) {
            return -node.__data__.area(graph);
        }).left;

        function sortedByArea(entity) {
            if (this.__data__ === 'fill') {
                return fills[bisect(fills, -entity.area(graph))];
            }
        }

        paths.enter()
            .insert('path', sortedByArea)
            .each(function(entity) {
                var layer = this.parentNode.__data__;

                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    this.setAttribute('clip-path', 'url(#' + entity.id + '-clippath)');
                    setPattern.apply(this, arguments);
                }
            })
            .call(TagClasses());

        paths
            .attr('d', path);
    };
}
