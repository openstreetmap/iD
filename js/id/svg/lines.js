iD.svg.Lines = function(projection) {

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
        if (!a || !b || !a.tags || !b.tags) return 0;
        if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
            return a.tags.layer - b.tags.layer;
        }
        if (a.tags.bridge) return 1;
        if (b.tags.bridge) return -1;
        if (a.tags.tunnel) return -1;
        if (b.tags.tunnel) return 1;
        var as = 0, bs = 0;
        if (a.tags.highway && b.tags.highway) {
            as -= highway_stack[a.tags.highway];
            bs -= highway_stack[b.tags.highway];
        }
        return as - bs;
    }

    return function drawLines(surface, graph, entities, filter) {
        var lines = [],
            path = iD.svg.Path(projection, graph);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i],
                outer = iD.geo.simpleMultipolygonOuterMember(entity, graph);
            if (outer) {
                lines.push(entity.mergeTags(outer.tags));
            } else if (entity.geometry(graph) === 'line') {
                lines.push(entity);
            }
        }

        lines = lines.filter(path);
        lines.sort(waystack);

        function drawPaths(klass) {
            var paths = surface.select('.layer-' + klass)
                .selectAll('path.line')
                .filter(filter)
                .data(lines, iD.Entity.key);

            var enter = paths.enter()
                .append('path')
                .attr('class', function(d) { return 'way line ' + klass + ' ' + d.id; });

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
                .attr('d', path)
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();
        }

        drawPaths('shadow');
        drawPaths('casing');
        drawPaths('stroke');

        var segments = _(lines)
            .filter(function(d) { return d.isOneWay(); })
            .map(iD.svg.OneWaySegments(projection, graph, 35))
            .flatten()
            .valueOf();

        var oneways = surface.select('.layer-oneway')
            .selectAll('path.oneway')
            .filter(filter)
            .data(segments, function(d) { return [d.id, d.index]; });

        oneways.enter()
            .append('path')
            .attr('class', 'oneway')
            .attr('marker-mid', 'url(#oneway-marker)');

        oneways
            .order()
            .attr('d', function(d) { return d.d; });

        oneways.exit()
            .remove();
    };
};
