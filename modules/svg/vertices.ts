import { deepEqual } from 'fast-equals';
import { select as d3_select } from 'd3-selection';

import { presetManager } from '../presets';
import { geoScaleToZoom, type geoExtent } from '../geo';
import { osmIdManager, type EntityId, type NodeId, type OsmEntity, type osmNode } from '../osm';
import { svgPassiveVertex, svgPointTransform } from './helpers';
import { getRadiiInPixels, type coreContext, type coreGraph } from '../core';
import { svgTagClasses } from './tag_classes';
import type { Projection } from '../geo/raw_mercator';
import type { Feature, Point } from 'geojson';
import type { PointsGroup } from './osm';
import type { TouchLayer } from './touch';

type VertexFeature = Feature<Point, {
    target: true;
    nope?: true;
    entity: osmNode;
}>;

interface VertexSets {
    /** important vertices (render always) */
    persistent: Record<NodeId, osmNode>;
    /** selected + siblings of selected (render always) */
    selected: Record<NodeId, osmNode>;
    /** hovered + siblings of hovered (render only in draw modes) */
    hovered: Record<NodeId, osmNode>;
}

interface Direction {
    type: 'side' | 'direction';
    angle: number;
}

export function svgVertices(projection: Projection, context: coreContext) {
    var radiuses = {
        //       z16-, z17,   z18+,  w/icon
        shadow: [6,    7.5,   7.5,   12],
        stroke: [2.5,  3.5,   3.5,   8],
        fill:   [1,    1.5,   1.5,   1.5]
    };

    var _currHoverTarget: VertexFeature | undefined | null;
    var _currPersistent: Record<NodeId, osmNode> = {};
    var _currHover: Record<NodeId, osmNode> = {};
    var _prevHover: Record<NodeId, osmNode> = {};
    var _currSelected: Record<NodeId, osmNode> = {};
    var _prevSelected: Record<NodeId, osmNode> = {};
    var _radii: Record<NodeId, number> = {};


    function sortY(a: osmNode, b: osmNode) {
        return b.loc[1] - a.loc[1];
    }

    // Avoid exit/enter if we're just moving stuff around.
    // The node will get a new version but we only need to run the update selection.
    function fastEntityKey(d: osmNode) {
        var mode = context.mode();
        var isMoving = mode && /^(add|draw|drag|move|rotate)/.test(mode.id);
        return isMoving ? d.id : osmIdManager.key(d);
    }


    function draw(selection: d3.Selection<SVGGElement>, graph: coreGraph, vertices: osmNode[], sets: VertexSets, filter: (node: osmNode) => boolean) {
        var icons: Record<NodeId, string | false | undefined> = {};
        var directions: Record<NodeId, Direction[]> = {};
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = geoScaleToZoom(projection.scale());
        var z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);
        var activeID = context.activeID();
        var base = context.history().base();


        function getIcon(d: osmNode) {
            // always check latest entity, as fastEntityKey avoids enter/exit now
            var entity = graph.entity(d.id);
            if (entity.id in icons) return icons[entity.id];

            icons[entity.id] =
                entity.hasInterestingTags() &&
                presetManager.match(entity, graph).icon;

            return icons[entity.id];
        }


        // memoize directions results
        function getDirections(entity: osmNode) {
            return directions[entity.id] ||= entity.directions(graph, projection);
        }


        function updateAttributes(selection: d3.Selection<SVGGElement>) {
            (['shadow', 'stroke', 'fill'] as const).forEach(function(klass) {
                var rads = radiuses[klass];
                selection.selectAll<SVGCircleElement, osmNode>('.' + klass)
                    .each(function(entity) {
                        var i = z && getIcon(entity);
                        var r = rads[i ? 3 : z];

                        // slightly increase the size of unconnected endpoints #3775
                        if (entity.id !== activeID && entity.isEndpoint(graph) && !entity.isConnected(graph)) {
                            r += 1.5;
                        }

                        if (klass === 'shadow') {   // remember this value, so we don't need to
                            _radii[entity.id] = r;  // recompute it when we draw the touch targets
                        }

                        d3_select(this)
                            .attr('r', r)
                            .attr('visibility', (i && klass === 'fill') ? 'hidden' : null);
                    });
            });
        }

        vertices.sort(sortY);

        var groups = selection.selectAll<SVGGElement, osmNode>('g.vertex')
            .filter(filter)
            .data(vertices, fastEntityKey);

        // exit
        groups.exit()
            .remove();

        // enter
        var enter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'node vertex ' + d.id; })
            .order();

        enter
            .append('circle')
            .attr('class', 'shadow');

        enter
            .append('circle')
            .attr('class', 'stroke');

        // Vertices with tags get a fill.
        enter.filter(function(d) { return d.hasInterestingTags(); })
            .append('circle')
            .attr('class', 'fill');

        // update
        groups = groups
            .merge(enter)
            .attr('transform', svgPointTransform(projection))
            .classed('sibling', function(d) { return d.id in sets.selected; })
            .classed('shared', function(d) { return graph.isShared(d); })
            .classed('endpoint', function(d) { return d.isEndpoint(graph); })
            .classed('added', function(d) {
                return !base.entities[d.id]; // if it doesn't exist in the base graph, it's new
            })
            .classed('moved', function(d) {
                return !!base.entities[d.id] && !deepEqual(graph.entity(d.id).loc, base.entity(d.id).loc);
            })
            .classed('retagged', function(d) {
                return !!base.entities[d.id] && !deepEqual(graph.entity(d.id).tags, base.entity(d.id).tags);
            })
            .call(svgTagClasses())
            .call(updateAttributes);

        // Vertices with icons get a `use`.
        var iconUse = groups
            .selectAll<SVGUseElement, osmNode>('.icon')
            .data(function data(d) { return zoom >= 17 && getIcon(d) ? [d] : []; }, fastEntityKey);

        // exit
        iconUse.exit()
            .remove();

        // enter
        iconUse.enter()
            .append('use')
            .attr('class', 'icon')
            .attr('width', '12px')
            .attr('height', '12px')
            .attr('transform', 'translate(-6, -6)')
            .attr('xlink:href', function(d) {
                var picon = getIcon(d);
                return picon ? '#' + picon : '';
            });

        // Highlighted vertices with a radius/diameter get a circle
        const circles = groups
            .selectAll<SVGCircleElement, number>('.radius')
            .data((d) => context.selectedIDs().includes(d.id) ? getRadiiInPixels(d, projection) : []);

        circles.exit()
            .remove();

        circles.enter()
            .insert('circle', '.shadow')
            .attr('class', 'radius')
            .merge(circles)
            .attr('r', d => d);


        // Vertices with directions get viewfields
        var dgroups = groups
            .selectAll<SVGGElement, osmNode>('.viewfieldgroup')
            .data(function data(d) { return zoom >= 18 && getDirections(d).length ? [d] : []; }, fastEntityKey);

        // exit
        dgroups.exit()
            .remove();

        // enter/update
        dgroups = dgroups.enter()
            .insert('g', '.shadow')
            .attr('class', 'viewfieldgroup')
            .merge(dgroups);

        var viewfields = dgroups.selectAll<SVGPathElement, Direction>('.viewfield')
            .data(getDirections);

        // exit
        viewfields.exit()
            .remove();

        // enter/update
        viewfields.enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('d', 'M0,0H0')
            .merge(viewfields)
            .attr('marker-start', d => 'url(#ideditor-viewfield-marker' + (d.type === 'side' ? '-side' : '') + (wireframe ? '-wireframe' : '') + ')')
            .attr('transform', d => `rotate(${d.angle})`);
    }


    function drawTargets(selection: d3.Selection<SVGGElement>, graph: coreGraph, entities: osmNode[], filter: (node: osmNode) => boolean) {
        var targetClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var nopeClass = context.getDebug('target') ? 'red ' : 'nocolor ';
        var getTransform = svgPointTransform(projection).geojson;
        var activeID = context.activeID();
        var data: { targets: VertexFeature[]; nopes: VertexFeature[]; } = { targets: [], nopes: [] };

        entities.forEach(function(node) {
            if (activeID === node.id) return;   // draw no target on the activeID

            var vertexType = svgPassiveVertex(node, graph, activeID);
            if (vertexType !== 0) {     // passive or adjacent - allow to connect
                data.targets.push({
                    type: 'Feature',
                    id: node.id,
                    properties: {
                        target: true,
                        entity: node
                    },
                    geometry: node.asGeoJSON()
                });
            } else {
                data.nopes.push({
                    type: 'Feature',
                    id: node.id + '-nope',
                    properties: {
                        nope: true,
                        target: true,
                        entity: node
                    },
                    geometry: node.asGeoJSON()
                });
            }
        });

        // Targets allow hover and vertex snapping
        var targets = selection.selectAll<SVGCircleElement, VertexFeature>('.vertex.target-allowed')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(data.targets, function key(d) { return d.id!; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('circle')
            .attr('r', function(d) {
                return _radii[d.properties.entity.id]
                  || radiuses.shadow[3];
            })
            .merge(targets)
            .attr('class', function(d) {
                return 'node vertex target target-allowed '
                + targetClass + d.id;
            })
            .attr('transform', getTransform);


        // NOPE
        var nopes = selection.selectAll<SVGCircleElement, VertexFeature>('.vertex.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(data.nopes, function key(d) { return d.id!; });

        // exit
        nopes.exit()
            .remove();

        // enter/update
        nopes.enter()
            .append('circle')
            .attr('r', function(d) { return (_radii[d.properties.entity.id] || radiuses.shadow[3]); })
            .merge(nopes)
            .attr('class', function(d) { return 'node vertex target target-nope ' + nopeClass + d.id; })
            .attr('transform', getTransform);
    }


    // Points can also render as vertices:
    // 1. in wireframe mode or
    // 2. at higher zooms if they have a direction
    function renderAsVertex(entity: osmNode, graph: coreGraph, wireframe: boolean, zoom: number) {
        var geometry = entity.geometry(graph);
        return geometry === 'vertex' || (geometry === 'point' && (
            wireframe || (zoom >= 18 && entity.directions(graph, projection).length)
        ));
    }


    function isEditedNode(node: osmNode, base: coreGraph, head: coreGraph) {
        var baseNode = base.hasEntity(node.id);
        var headNode = head.hasEntity(node.id);
        return !headNode ||
            !baseNode ||
            !deepEqual(headNode.tags, baseNode.tags) ||
            !deepEqual(headNode.loc, baseNode.loc);
    }


    function getSiblingAndChildVertices(ids: EntityId[], graph: coreGraph, wireframe: boolean, zoom: number) {
        var results: Record<NodeId, osmNode> = {};

        var seenIds: Record<EntityId, true> = {};

        function addChildVertices(entity: OsmEntity) {

            // avoid redundant work and infinite recursion of circular relations
            if (seenIds[entity.id]) return;
            seenIds[entity.id] = true;

            var geometry = entity.geometry(graph);
            if (!context.features().isHiddenFeature(entity, graph, geometry)) {
                var i;
                if (entity.type === 'way') {
                    for (i = 0; i < entity.nodes.length; i++) {
                        var child = graph.hasEntity(entity.nodes[i]);
                        if (child) {
                            addChildVertices(child);
                        }
                    }
                } else if (entity.type === 'relation') {
                    for (i = 0; i < entity.members.length; i++) {
                        var member = graph.hasEntity(entity.members[i].id);
                        if (member) {
                            addChildVertices(member);
                        }
                    }
                } else if (renderAsVertex(entity, graph, wireframe, zoom)) {
                    results[entity.id] = entity;
                }
            }
        }

        ids.forEach(function(id) {
            var entity = graph.hasEntity(id);
            if (!entity) return;

            if (entity.type === 'node') {
                if (renderAsVertex(entity, graph, wireframe, zoom)) {
                    results[entity.id] = entity;
                    graph.parentWays(entity).forEach(function(entity) {
                        addChildVertices(entity);
                    });
                }
            } else {  // way, relation
                addChildVertices(entity);
            }
        });

        return results;
    }


    function drawVertices(selection: d3.Selection<SVGSVGElement>, graph: coreGraph, entities: OsmEntity[], filter: (node: osmNode) => boolean, extent: geoExtent, fullRedraw: boolean) {
        var wireframe = context.surface().classed('fill-wireframe');
        var visualDiff = context.surface().classed('highlight-edited');
        var zoom = geoScaleToZoom(projection.scale());
        var mode = context.mode();
        var isMoving = mode && /^(add|draw|drag|move|rotate)/.test(mode.id);
        var base = context.history().base();

        var drawLayer = selection.selectAll<SVGGElement, PointsGroup>('.layer-osm.points .points-group.vertices');
        var touchLayer = selection.selectAll<SVGGElement, TouchLayer>('.layer-touch.points');

        if (fullRedraw) {
            _currPersistent = {};
            _radii = {};
        }

        // Collect important vertices from the `entities` list..
        // (during a partial redraw, it will not contain everything)
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.type !== 'node') continue;

            var geometry = entity.geometry(graph);
            var keep = false;

            // a point that looks like a vertex..
            if ((geometry === 'point') && renderAsVertex(entity, graph, wireframe, zoom)) {
                _currPersistent[entity.id] = entity;
                keep = true;

            // a vertex of some importance..
            } else if (geometry === 'vertex' &&
                (entity.hasInterestingTags() || entity.isEndpoint(graph) || entity.isConnected(graph)
                || (visualDiff && isEditedNode(entity, base, graph)))) {
                _currPersistent[entity.id] = entity;
                keep = true;
            }

            // whatever this is, it's not a persistent vertex..
            if (!keep && !fullRedraw) {
                delete _currPersistent[entity.id];
            }
        }

        // 3 sets of vertices to consider:
        var sets: VertexSets = {
            persistent: _currPersistent,  // persistent = important vertices (render always)
            selected: _currSelected,      // selected + siblings of selected (render always)
            hovered: _currHover           // hovered + siblings of hovered (render only in draw modes)
        };

        var all = Object.assign({}, (isMoving ? _currHover : {}), _currSelected, _currPersistent);

        // Draw the vertices..
        // The filter function controls the scope of what objects d3 will touch (exit/enter/update)
        // Adjust the filter function to expand the scope beyond whatever entities were passed in.
        var filterRendered = function(d: osmNode) {
            return d.id in _currPersistent || d.id in _currSelected || d.id in _currHover || filter(d);
        };
        drawLayer
            .call(draw, graph, currentVisible(all), sets, filterRendered);

        // Draw touch targets..
        // When drawing, render all targets (not just those affected by a partial redraw)
        var filterTouch = function(d: osmNode) {
            return isMoving ? true : filterRendered(d);
        };
        touchLayer
            .call(drawTargets, graph, currentVisible(all), filterTouch);


        function currentVisible(which: typeof _currSelected) {
            return Object.keys(which)
                .map(graph.hasEntity<osmNode>, graph)     // the current version of this entity
                .filter(Boolean)
                .filter(function (entity) { return entity && entity.intersects(extent, graph); });
        }
    }


    // partial redraw - only update the selected items..
    drawVertices.drawSelected = function(selection: d3.Selection<SVGSVGElement>, graph: coreGraph, extent: geoExtent) {
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = geoScaleToZoom(projection.scale());

        _prevSelected = _currSelected || {};
        if (context.map().isInWideSelection()) {
            _currSelected = {};
            context.selectedIDs().forEach(function(id) {
                var entity = graph.hasEntity(id);
                if (!entity) return;

                if (entity.type === 'node') {
                    if (renderAsVertex(entity, graph, wireframe, zoom)) {
                        _currSelected[entity.id] = entity;
                    }
                }
            });

        } else {
            _currSelected = getSiblingAndChildVertices(context.selectedIDs(), graph, wireframe, zoom);
        }

        // note that drawVertices will add `_currSelected` automatically if needed..
        var filter = function(d: osmNode) { return d.id in _prevSelected; };
        drawVertices(selection, graph, Object.values(_prevSelected), filter, extent, false);
    };


    drawVertices.clearSelected = (selection: d3.Selection<SVGSVGElement>) => {
        selection.selectAll('.radius').remove();
    };


    // partial redraw - only update the hovered items..
    drawVertices.drawHover = function(selection: d3.Selection<SVGSVGElement>, graph: coreGraph, target: VertexFeature | undefined | null, extent: geoExtent) {
        if (target === _currHoverTarget) return;  // continue only if something changed

        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = geoScaleToZoom(projection.scale());

        _prevHover = _currHover || {};
        _currHoverTarget = target;
        var entity = target && target.properties && target.properties.entity;

        if (entity) {
            _currHover = getSiblingAndChildVertices([entity.id], graph, wireframe, zoom);
        } else {
            _currHover = {};
        }

        // note that drawVertices will add `_currHover` automatically if needed..
        var filter = function(d: osmNode) { return d.id in _prevHover; };
        drawVertices(selection, graph, Object.values(_prevHover), filter, extent, false);
    };

    return drawVertices;
}

export interface svgVertices extends ReturnType<typeof svgVertices> {}
