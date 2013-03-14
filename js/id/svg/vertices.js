iD.svg.Vertices = function(projection, context) {
    var radiuses = {
        //       z16-, z17, z18+, tagged
        shadow: [6,    7.5,   7.5,  11.5],
        stroke: [2.5,  3.5,   3.5,  7],
        fill:   [1,    1.5,   1.5,  1.5]
    };

    return function drawVertices(surface, graph, entities, filter, zoom) {
        var vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'vertex') {
                vertices.push(entity);
            }
        }

        if (vertices.length > 2000) {
            return surface.select('.layer-hit').selectAll('g.vertex').remove();
        }

        var groups = surface.select('.layer-hit').selectAll('g.vertex')
            .filter(filter)
            .data(vertices, iD.Entity.key);

        var group = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'node vertex');

        if (zoom < 17) {
            zoom = 0;
        } else if (zoom < 18) {
            zoom = 1;
        } else {
            zoom = 2;
        }

        group.append('circle')
            .attr('class', 'node vertex shadow');

        group.append('circle')
            .attr('class', 'node vertex stroke');

        groups.attr('transform', iD.svg.PointTransform(projection))
            .call(iD.svg.TagClasses())
            .call(iD.svg.MemberClasses(graph))
            .classed('tagged', function(entity) { return entity.hasInterestingTags(); })
            .classed('shared', function(entity) { return graph.isShared(entity); });

        function icon(entity) {
            return zoom !== 0 &&
                entity.hasInterestingTags() &&
                context.presets().match(entity, graph).icon;
        }

        function center(entity) {
            if (zoom !== 0 && entity.hasInterestingTags()) {
                d3.select(this)
                    .attr('cx', 0.5)
                    .attr('cy', -0.5);
            } else {
                d3.select(this)
                    .attr('cy', 0)
                    .attr('cx', 0);
            }
        }

        groups.select('circle.shadow')
            .each(center)
            .attr('r', function(entity) {
                return radiuses.shadow[icon(entity) ? 3 : zoom]
            });

        groups.select('circle.stroke')
            .each(center)
            .attr('r', function(entity) {
                return radiuses.stroke[icon(entity) ? 3 : zoom]
            });

        // Each vertex gets either a circle or a use, depending
        // on if it has a icon or not.

        var fill = groups.selectAll('circle.fill')
            .data(function(entity) {
                return icon(entity) ? [] : [entity];
            }, iD.Entity.key);

        fill.enter().append('circle')
            .attr('class', 'node vertex fill')
            .each(center)
            .attr('r', radiuses.fill[zoom]);

        fill.exit()
            .remove();

        var use = groups.selectAll('use')
            .data(function(entity) {
                var i = icon(entity);
                return i ? [i] : [];
            }, function(d) {
                return d;
            });

        use.enter().append('use')
            .attr('transform', 'translate(-6, -6)')
            .attr('clip-path', 'url(#clip-square-12)')
            .attr('xlink:href', function(icon) { return '#maki-' + icon + '-12'; });

        use.exit()
            .remove();

        groups.exit()
            .remove();
    };
};
