import _values from 'lodash-es/values';

import { dataFeatureIcons } from '../../data';
import { geoAngle } from '../geo';
import { osmEntity } from '../osm';
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


    function draw(selection, vertices, klass, graph, zoom, siblings) {
        siblings = siblings || {};
        var icons = {};
        var directions = {};
        var z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);


        function getIcon(entity) {
            if (entity.id in icons) return icons[entity.id];

            icons[entity.id] =
                entity.hasInterestingTags() &&
                context.presets().match(entity, graph).icon;
            return icons[entity.id];
        }

        function getDirections(entity) {
            if (entity.id in directions) return directions[entity.id];

            var dir = (entity.tags['traffic_signals:direction'] || entity.tags.direction || '').toLowerCase();
            var stop = (entity.tags.stop || '').toLowerCase();
            var goBackward = (dir === 'backward' || dir === 'both' || dir === 'all' || stop === 'all');
            var goForward = (dir === 'forward' || dir === 'both' || dir === 'all' || stop === 'all');
            if (!goForward && !goBackward) return;

            var nodeIds = {};
            graph.parentWays(entity).forEach(function (parent) {
                var nodes = parent.nodes;
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i] === entity.id) {  // match current entity
                        if (goBackward && i > 0) {
                            nodeIds[nodes[i - 1]] = true;
                        }
                        if (goForward && i < nodes.length - 1) {
                            nodeIds[nodes[i + 1]] = true;
                        }
                    }
                }
            });

            var dirAngles = Object.keys(nodeIds).map(function (nodeId) {
                return geoAngle(entity, graph.entity(nodeId), projection) * (180 / Math.PI);
            });
            directions[entity.id] = dirAngles;
            return directions[entity.id];
        }

        function setClass(klass) {
            return function(entity) {
                this.setAttribute('class', 'node vertex ' + klass + ' ' + entity.id);
            };
        }

        function updateAttributes(selection) {
            ['shadow','stroke','fill'].forEach(function(klass) {
                var rads = radiuses[klass];
                selection.selectAll('.' + klass)
                    .each(function(entity) {
                        var i = z && getIcon(entity),
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
                .attr('visibility', (z === 0 ? 'hidden' : null));

            selection.selectAll('.directiongroup')
                .attr('visibility', (zoom < 18 ? 'hidden' : null));
        }


        var groups = selection
            .data(vertices, osmEntity.key);

        groups.exit()
            .remove();

        var enter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'node vertex ' + klass + ' ' + d.id; });

        // Directional vertices get viewfields
        var directionsEnter = enter.filter(function(d) { return getDirections(d); })
            .append('g')
            .each(setClass('viewfieldgroup'));

        directionsEnter.selectAll('.viewfield')
            .data(function(d) { return getDirections(d); })
            .enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('transform', function(d) { return 'rotate(' + (d + 90) + ')'; })  // +90 because marker is oriented along Y not X
            .attr('d', 'M0,0H0')
            .attr('marker-start', 'url(#viewfield-marker)');

        enter
            .append('circle')
            .each(setClass('shadow'));

        enter
            .append('circle')
            .each(setClass('stroke'));

        // Vertices with icons get a `use`.
        enter.filter(function(d) { return getIcon(d); })
            .append('use')
            .attr('transform', 'translate(-5, -6)')
            .attr('xlink:href', function(d) {
                var picon = getIcon(d),
                    isMaki = dataFeatureIcons.indexOf(picon) !== -1;
                return '#' + picon + (isMaki ? '-11' : '');
            })
            .attr('width', '11px')
            .attr('height', '11px')
            .each(setClass('icon'));

        // Vertices with tags get a fill.
        enter.filter(function(d) { return d.hasInterestingTags(); })
            .append('circle')
            .each(setClass('fill'));

        // Update
        groups
            .merge(enter)
            .attr('transform', svgPointTransform(projection))
            .classed('sibling', function(entity) { return entity.id in siblings; })
            .classed('shared', function(entity) { return graph.isShared(entity); })
            .classed('endpoint', function(entity) { return entity.isEndpoint(graph); })
            .call(updateAttributes);
    }


    function drawVertices(selection, graph, entities, filter, extent, zoom) {
        var siblings = siblingAndChildVertices(context.selectedIDs(), graph, extent),
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

            if (entity.id in siblings ||
                entity.hasInterestingTags() ||
                entity.isEndpoint(graph) ||
                entity.isConnected(graph)) {
                vertices.push(entity);
            }
        }

        var layer = selection.selectAll('.layer-hit');
        layer.selectAll('g.vertex.vertex-persistent')
            .filter(filter)
            .call(draw, vertices, 'vertex-persistent', graph, zoom, siblings);

        drawHover(selection, graph, extent, zoom);
    }


    function drawHover(selection, graph, extent, zoom) {
        var hovered = hover ? siblingAndChildVertices([hover.id], graph, extent) : {};
        var layer = selection.selectAll('.layer-hit');

        layer.selectAll('g.vertex.vertex-hover')
            .call(draw, _values(hovered), 'vertex-hover', graph, zoom);
    }


    drawVertices.drawHover = function(selection, graph, target, extent, zoom) {
        if (target === hover) return;
        hover = target;
        drawHover(selection, graph, extent, zoom);
    };

    return drawVertices;
}
