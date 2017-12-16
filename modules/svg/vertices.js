import _assign from 'lodash-es/assign';
import _values from 'lodash-es/values';

import { select as d3_select } from 'd3-selection';

import { dataFeatureIcons } from '../../data';
import { osmEntity } from '../osm';
import { svgPointTransform } from './index';


var TAU = 2 * Math.PI;
function ktoz(k) { return Math.log(k * TAU) / Math.LN2 - 8; }


export function svgVertices(projection, context) {
    var radiuses = {
        //       z16-, z17,   z18+,  tagged
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


    function sortY(a, b) {
        return b.loc[1] - a.loc[1];
    }


    function draw(selection, graph, vertices, sets, filter) {
        sets = sets || { selected: {}, important: {}, hovered: {} };
        var icons = {};
        var directions = {};
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = ktoz(projection.scale());
        var z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);


        function getIcon(entity) {
            if (entity.id in icons) return icons[entity.id];

            icons[entity.id] =
                entity.hasInterestingTags() &&
                context.presets().match(entity, graph).icon;
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
                        if (entity.isEndpoint(graph) && !entity.isConnected(graph)) {
                            r += 1.5;
                        }

                        d3_select(this)
                            .attr('r', r)
                            .attr('visibility', ((i && klass === 'fill') ? 'hidden' : null));
                    });
            });

            selection.selectAll('use')
                .attr('visibility', (z === 0 ? 'hidden' : null));
        }

        vertices.sort(sortY);

        var groups = selection.selectAll('g.vertex')
            .filter(filter)
            .data(vertices, osmEntity.key);

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

        // Vertices with icons get a `use`.
        enter.filter(function(d) { return getIcon(d); })
            .append('use')
            .attr('class', 'icon')
            .attr('width', '11px')
            .attr('height', '11px')
            .attr('transform', 'translate(-5.5, -5.5)')
            .attr('xlink:href', function(d) {
                var picon = getIcon(d);
                var isMaki = dataFeatureIcons.indexOf(picon) !== -1;
                return '#' + picon + (isMaki ? '-11' : '');
            });

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
            .call(updateAttributes);


        // Directional vertices get viewfields
        var dgroups = groups.filter(function(d) { return getDirections(d); })
            .selectAll('.viewfieldgroup')
            .data(function data(d) { return zoom < 18 ? [] : [d]; }, osmEntity.key);

        // exit
        dgroups.exit()
            .remove();

        // enter/update
        dgroups = dgroups.enter()
            .insert('g', '.shadow')
            .attr('class', 'viewfieldgroup')
            .merge(dgroups);

        var viewfields = dgroups.selectAll('.viewfield')
            .data(getDirections, function key(d) { return d; });

        // exit
        viewfields.exit()
            .remove();

        // enter/update
        viewfields.enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('d', 'M0,0H0')
            .merge(viewfields)
            .attr('marker-start', 'url(#viewfield-marker' + (wireframe ? '-wireframe' : '') + ')')
            .attr('transform', function(d) { return 'rotate(' + d + ')'; });
    }


    function drawTargets(selection, graph, entities, filter) {
        var debugClass = 'pink';
        var targets = selection.selectAll('.target')
            .filter(filter)
            .data(entities, osmEntity.key);

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('circle')
            .attr('r', radiuses.shadow[3])  // just use the biggest one for now
            .attr('class', function(d) { return 'node vertex target ' + d.id; })
            .merge(targets)
            .attr('transform', svgPointTransform(projection))
            .classed(debugClass, context.getDebug('target'));
    }


    // Points can also render as vertices:
    // 1. in wireframe mode or
    // 2. at higher zooms if they have a direction
    function renderAsVertex(entity, graph, wireframe, zoom) {
        var geometry = entity.geometry(graph);
        return geometry === 'vertex' || (geometry === 'point' && (
            wireframe || (zoom > 18 && entity.directions(graph, projection).length)
        ));
    }


    function getSiblingAndChildVertices(ids, graph, wireframe, zoom) {
        var results = {};

        function addChildVertices(entity) {
            var geometry = entity.geometry(graph);
            if (!context.features().isHiddenFeature(entity, graph, geometry)) {
                var i;
                if (entity.type === 'way') {
                    for (i = 0; i < entity.nodes.length; i++) {
                        var child = context.hasEntity(entity.nodes[i]);
                        if (child) {
                            addChildVertices(child);
                        }
                    }
                } else if (entity.type === 'relation') {
                    for (i = 0; i < entity.members.length; i++) {
                        var member = context.hasEntity(entity.members[i].id);
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
            var entity = context.hasEntity(id);
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
        var zoom = ktoz(projection.scale());
        var mode = context.mode();
        var isDrawing = mode && /^(add|draw|drag)/.test(mode.id);

        // Collect important vertices from the `entities` list..
        // (during a paritial redraw, it will not contain everything)
        if (fullRedraw) {
            _currPersistent = {};
        }

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var geometry = entity.geometry(graph);

            if ((geometry === 'point') && renderAsVertex(entity, graph, wireframe, zoom)) {
                _currPersistent[entity.id] = entity;

            } else if ((geometry === 'vertex') &&
                (entity.hasInterestingTags() || entity.isEndpoint(graph) || entity.isConnected(graph)) ) {
                _currPersistent[entity.id] = entity;

            } else if (!fullRedraw) {
                delete _currPersistent[entity.id];
            }
        }

        // 3 sets of vertices to consider:
        var sets = {
            persistent: _currPersistent,  // persistent = important vertices (render always)
            selected: _currSelected,      // selected + siblings of selected (render always)
            hovered: _currHover           // hovered + siblings of hovered (render only in draw modes)
        };

        var all = _assign({}, (isDrawing ? _currHover : {}), _currSelected, _currPersistent);

        // Draw the vertices..
        // The filter function controls the scope of what objects d3 will touch (exit/enter/update)
        // It's important to adjust the filter function to expand the scope beyond whatever entities were passed in.
        var filterRendered = function(d) {
            return d.id in _currPersistent || d.id in _currSelected || d.id in _currHover || filter(d);
        };
        selection.selectAll('.layer-points .layer-points-vertices')
            .call(draw, graph, currentVisible(all), sets, filterRendered);

        // Draw touch targets..
        selection.selectAll('.layer-points .layer-points-targets')
            .call(drawTargets, graph, currentVisible(all), filterRendered);


        function currentVisible(which) {
            return Object.keys(which)
                .map(context.hasEntity)   // the current version of this entity
                .filter(function (entity) { return entity && entity.intersects(extent, graph); });
        }
    }


    // partial redraw - only update the selected items..
    drawVertices.drawSelected = function(selection, graph, target, extent) {
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = ktoz(projection.scale());

        _prevSelected = _currSelected || {};
        _currSelected = getSiblingAndChildVertices(context.selectedIDs(), graph, wireframe, zoom);

        // note that drawVertices will add `_currSelected` automatically if needed..
        var filter = function(d) { return d.id in _prevSelected; };
        drawVertices(selection, graph, _values(_prevSelected), filter, extent, false);
    };


    // partial redraw - only update the hovered items..
    drawVertices.drawHover = function(selection, graph, target, extent) {
        if (target === _currHoverTarget) return;  // continue only if something changed

        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = ktoz(projection.scale());

        _prevHover = _currHover || {};
        _currHoverTarget = target;

        if (_currHoverTarget) {
            _currHover = getSiblingAndChildVertices([_currHoverTarget.id], graph, wireframe, zoom);
        } else {
            _currHover = {};
        }

        // note that drawVertices will add `_currHover` automatically if needed..
        var filter = function(d) { return d.id in _prevHover; };
        drawVertices(selection, graph, _values(_prevHover), filter, extent, false);
    };

    return drawVertices;
}
