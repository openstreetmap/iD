iD.svg.Areas = function(projection) {
    // For fixing up rendering of multipolygons with tags on the outer member.
    // https://github.com/systemed/iD/issues/613
    function isSimpleMultipolygonOuterMember(entity, graph) {
        if (entity.type !== 'way')
            return false;

        var parents = graph.parentRelations(entity);
        if (parents.length !== 1)
            return false;

        var parent = parents[0];
        if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
            return false;

        var members = parent.members, member;
        for (var i = 0; i < members.length; i++) {
            member = members[i];
            if (member.id === entity.id && member.role && member.role !== 'outer')
                return false; // Not outer member
            if (member.id !== entity.id && (!member.role || member.role === 'outer'))
                return false; // Not a simple multipolygon
        }

        return parent;
    }

    return function drawAreas(surface, graph, entities, filter) {
        var path = d3.geo.path().projection(projection),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            if (multipolygon = isSimpleMultipolygonOuterMember(entity, graph)) {
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
