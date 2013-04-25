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

        function addSiblingAndChildVertices(id) {
            var entity = context.hasEntity(id);
            if (entity && entity.type === 'node') {
                vertices[entity.id] = entity;
                context.graph().parentWays(entity).forEach(function(entity) {
                    addChildVertices(entity);
                });
            } else if (entity) {
                addChildVertices(entity);
            }
        }

        ids.forEach(function(id) {
            addSiblingAndChildVertices(id, 'vertex-selected');
        });

        return vertices;
    }

    function isIntersection(entity, graph) {
        return graph.parentWays(entity).filter(function (parent) {
            return parent.geometry(graph) === 'line';
        }).length > 1;
    }

    function draw(groups, graph, zoom) {
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
            if (icon(entity)) {
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
                return radiuses.shadow[icon(entity) ? 3 : zoom];
            });

        groups.select('circle.stroke')
            .each(center)
            .attr('r', function(entity) {
                return radiuses.stroke[icon(entity) ? 3 : zoom];
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
    }

    function drawVertices(surface, graph, entities, zoom) {
        var selected = siblingAndChildVertices(context.selection(), graph),
            vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.geometry(graph) !== 'vertex')
                continue;

            if (entity.id in selected ||
                entity.hasInterestingTags() ||
                isIntersection(entity, graph)) {
                vertices.push(entity)
            }
        }

        surface.select('.layer-hit').selectAll('g.vertex.vertex-persistent')
            .data(vertices, iD.Entity.key)
            .call(draw, graph, zoom)
            .classed('vertex-persistent', true);

        drawHover(surface, graph, zoom);
    }

    function drawHover(surface, graph, zoom) {
        var hovered = hover ? siblingAndChildVertices([hover.id], graph) : {};

        surface.select('.layer-hit').selectAll('g.vertex.vertex-hover')
            .data(d3.values(hovered), iD.Entity.key)
            .call(draw, graph, zoom)
            .classed('vertex-hover', true);
    }

    drawVertices.drawHover = function(surface, graph, _, zoom) {
        if (hover !== _) {
            hover = _;
            drawHover(surface, graph, zoom);
        }
    };

    return drawVertices;
};
