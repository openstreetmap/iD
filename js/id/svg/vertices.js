iD.svg.Vertices = function(projection, context) {
    var radiuses = {
        //       z16-, z17, z18+, tagged
        shadow: [6,    7.5,   7.5,  11.5],
        stroke: [2.5,  3.5,   3.5,  7],
        fill:   [1,    1.5,   1.5,  1.5]
    };

    var hover;

    function visibleVertices() {
        var visible = {};

        function addChildVertices(entity, klass) {
            var i;
            if (entity.type === 'way') {
                for (i = 0; i < entity.nodes.length; i++) {
                    visible[entity.nodes[i]] = klass;
                }
            } else if (entity.type === 'relation') {
                for (i = 0; i < entity.members.length; i++) {
                    var member = context.entity(entity.members[i].id);
                    if (member) {
                        addChildVertices(member, klass);
                    }
                }
            } else {
                visible[entity.id] = klass;
            }
        }

        function addSiblingAndChildVertices(id, klass) {
            var entity = context.entity(id);
            if (entity && entity.type === 'vertex') {
                visible[hover.id] = klass;
                context.parentWays(entity).forEach(function(entity) {
                    addChildVertices(entity, klass);
                });
            } else if (entity) {
                addChildVertices(entity, klass);
            }
        }

        if (hover) {
            addSiblingAndChildVertices(hover.id, 'vertex-hover');
        }

        context.selection().forEach(function(id) {
            addSiblingAndChildVertices(id, 'vertex-selected');
        });

        return visible;
    }

    function drawVertices(surface, graph, zoom) {
        var visible = visibleVertices();

        function rendered(entity) {
            if (entity.geometry(graph) !== 'vertex')
                return false;
            if (entity.id in visible)
                return true;
            if (entity.hasInterestingTags())
                return true;
        }

        var entities = context.intersects(context.map().extent()),
            vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (rendered(entity)) {
                vertices.push(entity)
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.vertex')
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
            .classed('vertex-hover', function(entity) { return visible[entity.id] === 'vertex-hover'; })
            .classed('vertex-selected', function(entity) { return visible[entity.id] === 'vertex-selected'; })
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
    }

    drawVertices.hover = function(_) {
        if (!arguments.length) return hover;
        hover = _;
        return drawVertices;
    };

    return drawVertices;
};
