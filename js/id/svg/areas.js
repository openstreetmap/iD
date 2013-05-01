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

        function drawPaths(group, areas, filter, klass, closeWay) {
            var tagClasses = iD.svg.TagClasses();

            if (klass === 'stroke') {
                tagClasses.tags(iD.svg.MultipolygonMemberTags(graph));
            }

            var paths = group.selectAll('path.area')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', function(d) { return d.type + ' area ' + klass; });

            paths
                .order()
                .attr('d', function(entity) { return path(entity.asGeoJSON(graph, closeWay)); })
                .call(tagClasses)
                .call(iD.svg.MemberClasses(graph));

            if (klass === 'fill') paths.call(setPattern);

            paths.exit()
                .remove();

            return paths;
        }

        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        var shadow = surface.select('.layer-shadow'),
            fill   = surface.select('.layer-fill'),
            stroke = surface.select('.layer-stroke');

        drawPaths(shadow, strokes, filter, 'shadow');
        drawPaths(fill, areas, filter, 'fill', true);
        drawPaths(stroke, strokes, filter, 'stroke');
    };
};
