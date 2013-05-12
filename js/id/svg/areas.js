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
        var path = d3.geo.path().projection(projection),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            if (multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph)) {
                areas[multipolygon.id] = {
                    entity: multipolygon.mergeTags(entity.tags),
                    area: Math.abs(path.area(entity.asGeoJSON(graph, true)))
                };
            } else if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(path.area(entity.asGeoJSON(graph, true)))
                };
            }
        }

        areas = d3.values(areas);
        areas.sort(function(a, b) { return b.area - a.area; });
        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        function drawPaths(areas, klass, closeWay) {
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
                .attr('d', function(entity) { return path(entity.asGeoJSON(graph, closeWay)); });

            if (klass === 'fill') paths.call(setPattern);

            paths.exit()
                .remove();

            return paths;
        }

        drawPaths(strokes, 'shadow');
        drawPaths(strokes, 'stroke');

        drawPaths(areas, 'fill', true);
    };
};
