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

    function setPattern(selection) {
        selection.each(function(d) {
            for (var i = 0; i < patternKeys.length; i++) {
                if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                    this.style.fill = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                    return;
                }
            }
            this.style.fill = '';
        });
    }

    return function drawAreas(surface, graph, entities, filter) {
        var path = iD.svg.Path(projection, graph),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            if (multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph)) {
                areas[multipolygon.id] = {
                    entity: multipolygon.mergeTags(entity.tags),
                    area: Math.abs(path.area(entity))
                };
            } else if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(path.area(entity))
                };
            }
        }

        areas = d3.values(areas).filter(function hasPath(a) { return path(a.entity); });
        areas.sort(function areaSort(a, b) { return b.area - a.area; });
        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function isWay(area) {
            return area.type === 'way';
        });

        function drawPaths(areas, klass, path) {
            var paths = surface.select('.layer-' + klass)
                .selectAll('path.area')
                .filter(filter)
                .data(areas, iD.Entity.key);

            var enter = paths.enter()
                .append('path')
                .attr('class', function(d) { return d.type + ' area ' + klass + ' ' + d.id; });

            // Optimization: call simple TagClasses only on enter selection. This
            // works because iD.Entity.key is defined to include the entity v attribute.
            if (klass !== 'stroke') {
                enter.call(iD.svg.TagClasses());
            } else {
                paths.call(iD.svg.TagClasses()
                    .tags(iD.svg.MultipolygonMemberTags(graph)));
            }

            paths
                .order()
                .attr('d', path);

            if (klass === 'fill') paths.call(setPattern);

            paths.exit()
                .remove();

            return paths;
        }

        drawPaths(strokes, 'shadow', path);
        drawPaths(strokes, 'stroke', path);
        drawPaths(areas, 'fill', path);
    };
};
