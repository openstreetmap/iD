iD.svg.Vertices = function(projection, context) {
    var radiuses = {
        //       z16-, z17, z18+, tagged
        shadow: [6,    7.5,   7.5,  11.5],
        stroke: [2.5,  3.5,   3.5,  7],
        fill:   [1,    1.5,   1.5,  1.5]
    };

    var hover;

    function siblingAndChildVertices(ids, graph) {
        var vertices = {};

        function addChildVertices(entity) {
            var i;
            if (entity.type === 'way') {
                for (i = 0; i < entity.nodes.length; i++) {
                    vertices[entity.nodes[i]] = graph.entity(entity.nodes[i]);
                }
            } else if (entity.type === 'relation') {
                for (i = 0; i < entity.members.length; i++) {
                    var member = context.hasEntity(entity.members[i].id);
                    if (member) {
                        addChildVertices(member);
                    }
                }
            } else {
                vertices[entity.id] = entity;
            }
        }

        ids.forEach(function(id) {
            var entity = context.hasEntity(id);
            if (entity && entity.type === 'node') {
                vertices[entity.id] = entity;
                context.graph().parentWays(entity).forEach(function(entity) {
                    addChildVertices(entity);
                });
            } else if (entity) {
                addChildVertices(entity);
            }
        });

        return vertices;
    }

    function draw(groups, vertices, klass, graph, zoom) {
        groups = groups.data(vertices, function(entity) {
            return iD.Entity.key(entity) + ',' + zoom;
        });

        if (zoom < 17) {
            zoom = 0;
        } else if (zoom < 18) {
            zoom = 1;
        } else {
            zoom = 2;
        }

        var icons = {};
        function icon(entity) {
            if (entity.id in icons) return icons[entity.id];
            return icons[entity.id] = (zoom !== 0 &&
                entity.hasInterestingTags() &&
                context.presets().match(entity, graph).icon);
        }

        function circle(klass) {
            var rads = radiuses[klass];
            return function(entity) {
                var i = icon(entity),
                    c = i ? 0.5 : 0,
                    r = rads[i ? 3 : zoom];
                this.setAttribute('class', 'node vertex ' + klass + ' ' + entity.id);
                this.setAttribute('cx', c);
                this.setAttribute('cy', -c);
                this.setAttribute('r', r);
            }
        }

        var enter = groups.enter().append('g')
            .attr('class', function(d) { return 'node vertex ' + klass + ' ' + d.id; });

        enter.append('circle')
            .each(circle('shadow'));

        enter.append('circle')
            .each(circle('stroke'));

        // Vertices with icons get a `use`.
        enter.filter(function(d) { return icon(d); })
            .append('use')
            .attr('transform', 'translate(-6, -6)')
            .attr('clip-path', 'url(#clip-square-12)')
            .attr('xlink:href', function(d) { return '#maki-' + icon(d) + '-12'; });

        // Vertices with tags get a `circle`.
        enter.filter(function(d) { return !icon(d) && d.hasInterestingTags(); })
            .append('circle')
            .each(circle('fill'));

        groups
            .attr('transform', iD.svg.PointTransform(projection))
            .classed('shared', function(entity) { return graph.isShared(entity); });

        groups.exit()
            .remove();
    }

    function drawVertices(surface, graph, entities, filter, zoom) {
        var selected = siblingAndChildVertices(context.selection(), graph),
            vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.geometry(graph) !== 'vertex')
                continue;

            if (entity.id in selected ||
                entity.hasInterestingTags() ||
                entity.isIntersection(graph)) {
                vertices.push(entity)
            }
        }

        surface.select('.layer-hit').selectAll('g.vertex.vertex-persistent')
            .filter(filter)
            .call(draw, vertices, 'vertex-persistent', graph, zoom);

        drawHover(surface, graph, zoom);
    }

    function drawHover(surface, graph, zoom) {
        var hovered = hover ? siblingAndChildVertices([hover.id], graph) : {};

        surface.select('.layer-hit').selectAll('g.vertex.vertex-hover')
            .call(draw, d3.values(hovered), 'vertex-hover', graph, zoom);
    }

    drawVertices.drawHover = function(surface, graph, _, zoom) {
        if (hover !== _) {
            hover = _;
            drawHover(surface, graph, zoom);
        }
    };

    return drawVertices;
};
