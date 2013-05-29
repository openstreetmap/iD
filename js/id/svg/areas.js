iD.svg.Areas = function(projection) {
    // Patterns only work in Firefox when set directly on element
    var patterns = {
        wetland: 'wetland',
        beach: 'beach',
        scrub: 'scrub',
        construction: 'construction',
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
                this.style.fill = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                return;
            }
        }
        this.style.fill = '';
    }

    return function drawAreas(surface, graph, entities, filter) {
        var path = iD.svg.Path(projection, graph, true),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            if (multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph)) {
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
        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        var data = {
            shadow: strokes,
            stroke: strokes,
            fill: areas
        };

        var paths = surface.selectAll('.layer-shadow, .layer-stroke, .layer-fill')
            .selectAll('path.area')
            .filter(filter)
            .data(function(layer) { return data[layer]; }, iD.Entity.key);

        paths.enter()
            .append('path')
            .each(function(entity) {
                var layer = this.parentNode.__data__;

                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    setPattern.apply(this, arguments);
                }
            })
            .call(iD.svg.TagClasses());

        paths
            .order()
            .attr('d', path);

        paths.exit()
            .remove();
    };
};
