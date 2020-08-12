import deepEqual from 'fast-deep-equal';
import { select as d3_select } from 'd3-selection';

import { presetManager } from '../presets';
import { geoScaleToZoom } from '../geo';
import { osmEntity } from '../osm';
import { svgPassiveVertex, svgPointTransform } from './helpers';

export function svgVertices(projection, context) {
    var radiuses = {
        //       z16-, z17,   z18+,  w/icon
        shadow: [6,    7.5,   7.5,   12],
        stroke: [2.5,  3.5,   3.5,   8],
        fill:   [1,    1.5,   1.5,   1.5]
    };

    var _currHoverTarget;
    var _currPersistent = {};
    var _currHover = {};
    var _prevHover = {};
    var _currSelected = {};
    var _prevSelected = {};
    var _radii = {};


    function sortY(a, b) {
        return b.loc[1] - a.loc[1];
    }

    // Avoid exit/enter if we're just moving stuff around.
    // The node will get a new version but we only need to run the update selection.
    function fastEntityKey(d) {
        var mode = context.mode();
        var isMoving = mode && /^(add|draw|drag|move|rotate)/.test(mode.id);
        return isMoving ? d.id : osmEntity.key(d);
    }


    function draw(selection, graph, vertices, sets, filter) {
        sets = sets || { selected: {}, important: {}, hovered: {} };

        var icons = {};
        var directions = {};
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = geoScaleToZoom(projection.scale());
        var z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);
        var activeID = context.activeID();
        var base = context.history().base();


        function getIcon(d) {
            // always check latest entity, as fastEntityKey avoids enter/exit now
            var entity = graph.entity(d.id);
            if (entity.id in icons) return icons[entity.id];

            icons[entity.id] =
                entity.hasInterestingTags() &&
                presetManager.match(entity, graph).icon;

            return icons[entity.id];
        }


        // memoize directions results, return false for empty arrays (for use in filter)
        function getDirections(entity) {
            if (entity.id in directions) return directions[entity.id];

            var angles = entity.directions(graph, projection);
            directions[entity.id] = angles.length ? angles : false;
            return angles;
        }


        function updateAttributes(selection) {
            ['shadow', 'stroke', 'fill'].forEach(function(klass) {
                var rads = radiuses[klass];
                selection.selectAll('.' + klass)
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

        var groups = selection.selectAll('g.vertex')
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
                return base.entities[d.id] && !deepEqual(graph.entities[d.id].loc, base.entities[d.id].loc);
            })
            .classed('retagged', function(d) {
                return base.entities[d.id] && !deepEqual(graph.entities[d.id].tags, base.entities[d.id].tags);
            })
            .call(updateAttributes);

        // Vertices with icons get a `use`.
        var iconUse = groups
            .selectAll('.icon')
            .data(function data(d) { return zoom >= 17 && getIcon(d) ? [d] : []; }, fastEntityKey);

        // exit
        iconUse.exit()
            .remove();

        // enter
        iconUse.enter()
            .append('use')
            .attr('class', 'icon')
            .attr('width', '11px')
            .attr('height', '11px')
            .attr('transform', 'translate(-5.5, -5.5)')
            .attr('xlink:href', function(d) {
                var picon = getIcon(d);
                var isMaki = /^maki-/.test(picon);
                return '#' + picon + (isMaki ? '-11' : '');
            });


        // Vertices with directions get viewfields
        var dgroups = groups
            .selectAll('.viewfieldgroup')
            .data(function data(d) { return zoom >= 18 && getDirections(d) ? [d] : []; }, fastEntityKey);

        // exit
        dgroups.exit()
            .remove();

        // enter/update
        dgroups = dgroups.enter()
            .insert('g', '.shadow')
            .attr('class', 'viewfieldgroup')
            .merge(dgroups);

        var viewfields = dgroups.selectAll('.viewfield')
            .data(getDirections, function key(d) { return osmEntity.key(d); });

        // exit
        viewfields.exit()
            .remove();

        // enter/update
        viewfields.enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('d', 'M0,0H0')
            .merge(viewfields)
            .attr('marker-start', 'url(#ideditor-viewfield-marker' + (wireframe ? '-wireframe' : '') + ')')
            .attr('transform', function(d) { return 'rotate(' + d + ')'; });
    }


    function drawTargets(selection, graph, entities, filter) {
        var targetClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var nopeClass = context.getDebug('target') ? 'red ' : 'nocolor ';
        var getTransform = svgPointTransform(projection).geojson;
        var activeID = context.activeID();
        var data = { targets: [], nopes: [] };

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
        var targets = selection.selectAll('.vertex.target-allowed')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(data.targets, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('circle')
            .attr('r', function(d) {
                return _radii[d.id]
                  || radiuses.shadow[3];
            })
            .merge(targets)
            .attr('class', function(d) {
                return 'node vertex target target-allowed '
                + targetClass + d.id;
            })
            .attr('transform', getTransform);


        // NOPE
        var nopes = selection.selectAll('.vertex.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(data.nopes, function key(d) { return d.id; });

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
    function renderAsVertex(entity, graph, wireframe, zoom) {
        var geometry = entity.geometry(graph);
        return geometry === 'vertex' || (geometry === 'point' && (
            wireframe || (zoom >= 18 && entity.directions(graph, projection).length)
        ));
    }


    function isEditedNode(node, base, head) {
        var baseNode = base.entities[node.id];
        var headNode = head.entities[node.id];
        return !headNode ||
            !baseNode ||
            !deepEqual(headNode.tags, baseNode.tags) ||
            !deepEqual(headNode.loc, baseNode.loc);
    }


    function getSiblingAndChildVertices(ids, graph, wireframe, zoom) {
        var results = {};

        var seenIds = {};

        function addChildVertices(entity) {

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


    function drawVertices(selection, graph, entities, filter, extent, fullRedraw) {
        var wireframe = context.surface().classed('fill-wireframe');
        var visualDiff = context.surface().classed('highlight-edited');
        var zoom = geoScaleToZoom(projection.scale());
        var mode = context.mode();
        var isMoving = mode && /^(add|draw|drag|move|rotate)/.test(mode.id);
        var base = context.history().base();

        var drawLayer = selection.selectAll('.layer-osm.points .points-group.vertices');
        var touchLayer = selection.selectAll('.layer-touch.points');

        if (fullRedraw) {
            _currPersistent = {};
            _radii = {};
        }

        // Collect important vertices from the `entities` list..
        // (during a partial redraw, it will not contain everything)
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
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
        var sets = {
            persistent: _currPersistent,  // persistent = important vertices (render always)
            selected: _currSelected,      // selected + siblings of selected (render always)
            hovered: _currHover           // hovered + siblings of hovered (render only in draw modes)
        };

        var all = Object.assign({}, (isMoving ? _currHover : {}), _currSelected, _currPersistent);

        // Draw the vertices..
        // The filter function controls the scope of what objects d3 will touch (exit/enter/update)
        // Adjust the filter function to expand the scope beyond whatever entities were passed in.
        var filterRendered = function(d) {
            return d.id in _currPersistent || d.id in _currSelected || d.id in _currHover || filter(d);
        };
        drawLayer
            .call(draw, graph, currentVisible(all), sets, filterRendered);

        // Draw touch targets..
        // When drawing, render all targets (not just those affected by a partial redraw)
        var filterTouch = function(d) {
            return isMoving ? true : filterRendered(d);
        };
        touchLayer
            .call(drawTargets, graph, currentVisible(all), filterTouch);


        function currentVisible(which) {
            return Object.keys(which)
                .map(graph.hasEntity, graph)     // the current version of this entity
                .filter(function (entity) { return entity && entity.intersects(extent, graph); });
        }
    }


    // partial redraw - only update the selected items..
    drawVertices.drawSelected = function(selection, graph, extent) {
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
        var filter = function(d) { return d.id in _prevSelected; };
        drawVertices(selection, graph, Object.values(_prevSelected), filter, extent, false);
    };


    // partial redraw - only update the hovered items..
    drawVertices.drawHover = function(selection, graph, target, extent) {
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
        var filter = function(d) { return d.id in _prevHover; };
        drawVertices(selection, graph, Object.values(_prevHover), filter, extent, false);
    };

    return drawVertices;
}
