import _map from 'lodash-es/map';
import _values from 'lodash-es/values';

import { bisector as d3_bisector } from 'd3-array';

import { osmEntity, osmIsSimpleMultipolygonOuterMember } from '../osm';
import { svgPath, svgTagClasses } from './index';


export function svgAreas(projection, context) {
    // Patterns only work in Firefox when set directly on element.
    // (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
    var patterns = {
        beach: 'beach',
        cemetery: 'cemetery',
        construction: 'construction',
        farm: 'farmland',
        farmland: 'farmland',
        grave_yard: 'cemetery',
        meadow: 'meadow',
        military: 'construction',
        orchard: 'orchard',
        sand: 'beach',
        scrub: 'scrub',
        wetland: 'wetland',
    };

    var patternKeys = ['landuse', 'natural', 'amenity'];


    function setPattern(d) {
        for (var i = 0; i < patternKeys.length; i++) {
            if (d.tags.building && d.tags.building !== 'no') continue;

            if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                this.style.fill = this.style.stroke = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                return;
            }
        }
        this.style.fill = this.style.stroke = '';
    }


    return function drawAreas(selection, graph, entities, filter) {
        var path = svgPath(projection, graph, true),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            multipolygon = osmIsSimpleMultipolygonOuterMember(entity, graph);
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

        areas = _values(areas).filter(function hasPath(a) { return path(a.entity); });
        areas.sort(function areaSort(a, b) { return b.area - a.area; });
        areas = _map(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        var data = {
            clip: areas,
            shadow: strokes,
            stroke: strokes,
            fill: areas
        };

        var clipPaths = context.surface().selectAll('defs').selectAll('.clipPath')
           .filter(filter)
           .data(data.clip, osmEntity.key);

        clipPaths.exit()
           .remove();

        var clipPathsEnter = clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath')
           .attr('id', function(entity) { return entity.id + '-clippath'; });

        clipPathsEnter
           .append('path');

        clipPaths.merge(clipPathsEnter)
           .selectAll('path')
           .attr('d', path);


        var layer = selection.selectAll('.layer-areas');

        var areagroup = layer
            .selectAll('g.areagroup')
            .data(['fill', 'shadow', 'stroke']);

        areagroup = areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'areagroup area-' + d; })
            .merge(areagroup);

        var paths = areagroup
            .selectAll('path')
            .filter(filter)
            .data(function(layer) { return data[layer]; }, osmEntity.key);

        paths.exit()
            .remove();

        var fills = selection.selectAll('.area-fill path.area').nodes();

        var bisect = d3_bisector(function(node) {
            return -node.__data__.area(graph);
        }).left;

        function sortedByArea(entity) {
            if (this._parent.__data__ === 'fill') {
                return fills[bisect(fills, -entity.area(graph))];
            }
        }

        paths = paths.enter()
            .insert('path', sortedByArea)
            .merge(paths)
            .each(function(entity) {
                var layer = this.parentNode.__data__;

                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    this.setAttribute('clip-path', 'url(#' + entity.id + '-clippath)');
                    setPattern.apply(this, arguments);
                }
            })
            .call(svgTagClasses())
            .attr('d', path);
    };
}
