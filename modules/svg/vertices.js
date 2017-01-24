import * as d3 from 'd3';
import { osmEntity } from '../osm/index';
import { svgPointTransform } from './index';


export function svgVertices(projection, context) {
    var radiuses = {
        //       z16-, z17, z18+, tagged
        shadow: [6,    7.5,   7.5,  11.5],
        stroke: [2.5,  3.5,   3.5,  7],
        fill:   [1,    1.5,   1.5,  1.5]
    };

    var hover;


    function siblingAndChildVertices(ids, graph, extent) {
        var vertices = {};

        function addChildVertices(entity) {
            if (!context.features().isHiddenFeature(entity, graph, entity.geometry(graph))) {
                var i;
                if (entity.type === 'way') {
                    for (i = 0; i < entity.nodes.length; i++) {
                        addChildVertices(graph.entity(entity.nodes[i]));
                    }
                } else if (entity.type === 'relation') {
                    for (i = 0; i < entity.members.length; i++) {
                        var member = context.hasEntity(entity.members[i].id);
                        if (member) {
                            addChildVertices(member);
                        }
                    }
                } else if (entity.intersects(extent, graph)) {
                    vertices[entity.id] = entity;
                }
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


    function draw(selection, vertices, klass, graph, zoom) {

        function icon(entity) {
            if (entity.id in icons) return icons[entity.id];
            icons[entity.id] =
                entity.hasInterestingTags() &&
                context.presets().match(entity, graph).icon;
            return icons[entity.id];
        }

        function setClass(klass) {
            return function(entity) {
                this.setAttribute('class', 'node vertex ' + klass + ' ' + entity.id);
            };
        }

        function setAttributes(selection) {
            ['shadow','stroke','fill'].forEach(function(klass) {
                var rads = radiuses[klass];
                selection.selectAll('.' + klass)
                    .each(function(entity) {
                        var i = z && icon(entity),
                            c = i ? 0.5 : 0,
                            r = rads[i ? 3 : z];

                        // slightly increase the size of unconnected endpoints #3775
                        if (entity.isEndpoint(graph) && !entity.isConnected(graph)) {
                            r += 1.5;
                        }

                        this.setAttribute('cx', c);
                        this.setAttribute('cy', -c);
                        this.setAttribute('r', r);
                        if (i && klass === 'fill') {
                            this.setAttribute('visibility', 'hidden');
                        } else {
                            this.removeAttribute('visibility');
                        }
                    });
            });

            selection.selectAll('use')
                .each(function() {
                    if (z) {
                        this.removeAttribute('visibility');
                    } else {
                        this.setAttribute('visibility', 'hidden');
                    }
                });
        }


        var icons = {},
            z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);

        var groups = selection
            .data(vertices, osmEntity.key);

        groups.exit()
            .remove();

        var enter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'node vertex ' + klass + ' ' + d.id; });

        enter.append('circle')
            .each(setClass('shadow'));

        enter.append('circle')
            .each(setClass('stroke'));

        // Vertices with icons get a `use`.
        enter.filter(function(d) { return icon(d); })
            .append('use')
            .attr('transform', 'translate(-5, -6)')
            .attr('xlink:href', function(d) { return '#' + icon(d) + '-11'; })
            .attr('width', '11px')
            .attr('height', '11px')
            .each(setClass('icon'));

        // Vertices with tags get a fill.
        enter.filter(function(d) { return d.hasInterestingTags(); })
            .append('circle')
            .each(setClass('fill'));

        groups
            .merge(enter)
            .attr('transform', svgPointTransform(projection))
            .classed('shared', function(entity) { return graph.isShared(entity); })
            .classed('endpoint', function(entity) { return entity.isEndpoint(graph); })
            .call(setAttributes);
    }


    function drawVertices(selection, graph, entities, filter, extent, zoom) {
        var selected = siblingAndChildVertices(context.selectedIDs(), graph, extent),
            wireframe = context.surface().classed('fill-wireframe'),
            vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i],
                geometry = entity.geometry(graph);

            if (wireframe && geometry === 'point') {
                vertices.push(entity);
                continue;
            }

            if (geometry !== 'vertex')
                continue;

            if (entity.id in selected ||
                entity.hasInterestingTags() ||
                entity.isEndpoint(graph) ||
                entity.isConnected(graph)) {
                vertices.push(entity);
            }
        }

        var layer = selection.selectAll('.layer-hit');
        layer.selectAll('g.vertex.vertex-persistent')
            .filter(filter)
            .call(draw, vertices, 'vertex-persistent', graph, zoom);

        drawHover(selection, graph, extent, zoom);
    }


    function drawHover(selection, graph, extent, zoom) {
        var hovered = hover ? siblingAndChildVertices([hover.id], graph, extent) : {};
        var layer = selection.selectAll('.layer-hit');

        layer.selectAll('g.vertex.vertex-hover')
            .call(draw, d3.values(hovered), 'vertex-hover', graph, zoom);
    }


    drawVertices.drawHover = function(selection, graph, target, extent, zoom) {
        if (target === hover) return;
        hover = target;
        drawHover(selection, graph, extent, zoom);
    };

    return drawVertices;
}
