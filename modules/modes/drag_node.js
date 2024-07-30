import {
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { t } from '../core/localizer';

import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionConnect } from '../actions/connect';
import { actionMoveNode } from '../actions/move_node';
import { actionNoop } from '../actions/noop';

import { behaviorDrag } from '../behavior/drag';
import { behaviorEdit } from '../behavior/edit';
import { behaviorHover } from '../behavior/hover';

import {
    geoChooseEdge,
    geoHasLineIntersections,
    geoHasSelfIntersections,
    geoVecSubtract,
    geoViewportEdge
} from '../geo';

import { modeBrowse } from './browse';
import { modeSelect } from './select';
import { osmJoinWays, osmNode } from '../osm';
import { utilArrayIntersection, utilKeybinding } from '../util';



export function modeDragNode(context) {
    var mode = {
        id: 'drag-node',
        button: 'browse'
    };
    var hover = behaviorHover(context).altDisables(true)
        .on('hover', context.ui().sidebar.hover);
    var edit = behaviorEdit(context);

    var _nudgeInterval;
    var _restoreSelectedIDs = [];
    var _wasMidpoint = false;
    var _isCancelled = false;
    var _activeEntity;
    var _startLoc;
    var _lastLoc;


    function startNudge(d3_event, entity, nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.map().pan(nudge);
            doMove(d3_event, entity, nudge);
        }, 50);
    }


    function stopNudge() {
        if (_nudgeInterval) {
            window.clearInterval(_nudgeInterval);
            _nudgeInterval = null;
        }
    }


    function moveAnnotation(entity) {
        return t('operations.move.annotation.' + entity.geometry(context.graph()));
    }


    function connectAnnotation(nodeEntity, targetEntity) {
        var nodeGeometry = nodeEntity.geometry(context.graph());
        var targetGeometry = targetEntity.geometry(context.graph());
        if (nodeGeometry === 'vertex' && targetGeometry === 'vertex') {
            var nodeParentWayIDs = context.graph().parentWays(nodeEntity);
            var targetParentWayIDs = context.graph().parentWays(targetEntity);
            var sharedParentWays = utilArrayIntersection(nodeParentWayIDs, targetParentWayIDs);
            // if both vertices are part of the same way
            if (sharedParentWays.length !== 0) {
                // if the nodes are next to each other, they are merged
                if (sharedParentWays[0].areAdjacent(nodeEntity.id, targetEntity.id)) {
                    return t('operations.connect.annotation.from_vertex.to_adjacent_vertex');
                }
                return t('operations.connect.annotation.from_vertex.to_sibling_vertex');
            }
        }
        return t('operations.connect.annotation.from_' + nodeGeometry + '.to_' + targetGeometry);
    }


    function shouldSnapToNode(target) {
        if (!_activeEntity) return false;
        return _activeEntity.geometry(context.graph()) !== 'vertex' ||
            (target.geometry(context.graph()) === 'vertex' || presetManager.allowsVertex(target, context.graph()));
    }


    function origin(entity) {
        return context.projection(entity.loc);
    }


    function keydown(d3_event) {
        if (d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            if (context.surface().classed('nope')) {
                context.surface()
                    .classed('nope-suppressed', true);
            }
            context.surface()
                .classed('nope', false)
                .classed('nope-disabled', true);
        }
    }


    function keyup(d3_event) {
        if (d3_event.keyCode === utilKeybinding.modifierCodes.alt) {
            if (context.surface().classed('nope-suppressed')) {
                context.surface()
                    .classed('nope', true);
            }
            context.surface()
                .classed('nope-suppressed', false)
                .classed('nope-disabled', false);
        }
    }


    function start(d3_event, entity) {
        _wasMidpoint = entity.type === 'midpoint';
        var hasHidden = context.features().hasHiddenConnections(entity, context.graph());
        _isCancelled = !context.editable() || d3_event.shiftKey || hasHidden;


        if (_isCancelled) {
            if (hasHidden) {
                context.ui().flash
                    .duration(4000)
                    .iconName('#iD-icon-no')
                    .label(t.append('modes.drag_node.connected_to_hidden'))();
            }
            return drag.cancel();
        }

        if (_wasMidpoint) {
            var midpoint = entity;
            entity = osmNode();
            context.perform(actionAddMidpoint(midpoint, entity));
            entity = context.entity(entity.id);   // get post-action entity

            var vertex = context.surface().selectAll('.' + entity.id);
            drag.targetNode(vertex.node())
                .targetEntity(entity);

        } else {
            context.perform(actionNoop());
        }

        _activeEntity = entity;
        _startLoc = entity.loc;

        hover.ignoreVertex(entity.geometry(context.graph()) === 'vertex');

        context.surface().selectAll('.' + _activeEntity.id)
            .classed('active', true);

        context.enter(mode);
    }


    // related code
    // - `behavior/draw.js` `datum()`
    function datum(d3_event) {
        if (!d3_event || d3_event.altKey) {
            return {};
        } else {
            // When dragging, snap only to touch targets..
            // (this excludes area fills and active drawing elements)
            var d = d3_event.target.__data__;
            return (d && d.properties && d.properties.target) ? d : {};
        }
    }


    function doMove(d3_event, entity, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3_event && d3_event.point) || context.projection(_lastLoc);
        var currMouse = geoVecSubtract(currPoint, nudge);
        var loc = context.projection.invert(currMouse);

        var target, edge;

        if (!_nudgeInterval) {   // If not nudging at the edge of the viewport, try to snap..
            // related code
            // - `mode/drag_node.js`     `doMove()`
            // - `behavior/draw.js`      `click()`
            // - `behavior/draw_way.js`  `move()`
            var d = datum(d3_event);
            target = d && d.properties && d.properties.entity;
            var targetLoc = target && target.loc;
            var targetNodes = d && d.properties && d.properties.nodes;

            if (targetLoc) {   // snap to node/vertex - a point target with `.loc`
                if (shouldSnapToNode(target)) {
                    loc = targetLoc;
                }

            } else if (targetNodes) {   // snap to way - a line target with `.nodes`
                edge = geoChooseEdge(targetNodes, context.map().mouse(), context.projection, end.id);
                if (edge) {
                    loc = edge.loc;
                }
            }
        }

        context.replace(
            actionMoveNode(entity.id, loc)
        );

        // Below here: validations
        var isInvalid = false;

        // Check if this connection to `target` could cause relations to break..
        if (target) {
            isInvalid = hasRelationConflict(entity, target, edge, context.graph());
        }

        // Check if this drag causes the geometry to break..
        if (!isInvalid) {
            isInvalid = hasInvalidGeometry(entity, context.graph());
        }


        var nope = context.surface().classed('nope');
        if (isInvalid === 'relation' || isInvalid === 'restriction') {
            if (!nope) {   // about to nope - show hint
                context.ui().flash
                    .duration(4000)
                    .iconName('#iD-icon-no')
                    .label(t.append('operations.connect.' + isInvalid,
                        { relation: presetManager.item('type/restriction').name() }
                    ))();
            }
        } else if (isInvalid) {
            var errorID = isInvalid === 'line' ? 'lines' : 'areas';
            context.ui().flash
                .duration(3000)
                .iconName('#iD-icon-no')
                .label(t.append('self_intersection.error.' + errorID))();
        } else {
            if (nope) {   // about to un-nope, remove hint
                context.ui().flash
                    .duration(1)
                    .label('')();
            }
        }


        var nopeDisabled = context.surface().classed('nope-disabled');
        if (nopeDisabled) {
            context.surface()
                .classed('nope', false)
                .classed('nope-suppressed', isInvalid);
        } else {
            context.surface()
                .classed('nope', isInvalid)
                .classed('nope-suppressed', false);
        }

        _lastLoc = loc;
    }


    // Uses `actionConnect.disabled()` to know whether this connection is ok..
    function hasRelationConflict(entity, target, edge, graph) {
        var testGraph = graph.update();  // copy

        // if snapping to way - add midpoint there and consider that the target..
        if (edge) {
            var midpoint = osmNode();
            var action = actionAddMidpoint({
                loc: edge.loc,
                edge: [target.nodes[edge.index - 1], target.nodes[edge.index]]
            }, midpoint);

            testGraph = action(testGraph);
            target = midpoint;
        }

        // can we connect to it?
        var ids = [entity.id, target.id];
        return actionConnect(ids).disabled(testGraph);
    }


    function hasInvalidGeometry(entity, graph) {
        var parents = graph.parentWays(entity);
        var i, j, k;

        for (i = 0; i < parents.length; i++) {
            var parent = parents[i];
            var nodes = [];
            var activeIndex = null;    // which multipolygon ring contains node being dragged

            // test any parent multipolygons for valid geometry
            var relations = graph.parentRelations(parent);
            for (j = 0; j < relations.length; j++) {
                if (!relations[j].isMultipolygon()) continue;

                var rings = osmJoinWays(relations[j].members, graph);

                // find active ring and test it for self intersections
                for (k = 0; k < rings.length; k++) {
                    nodes = rings[k].nodes;
                    if (nodes.find(function(n) { return n.id === entity.id; })) {
                        activeIndex = k;
                        if (geoHasSelfIntersections(nodes, entity.id)) {
                            return 'multipolygonMember';
                        }
                    }
                    rings[k].coords = nodes.map(function(n) { return n.loc; });
                }

                // test active ring for intersections with other rings in the multipolygon
                for (k = 0; k < rings.length; k++) {
                    if (k === activeIndex) continue;

                    // make sure active ring doesn't cross passive rings
                    if (geoHasLineIntersections(rings[activeIndex].nodes, rings[k].nodes, entity.id)) {
                        return 'multipolygonRing';
                    }
                }
            }


            // If we still haven't tested this node's parent way for self-intersections.
            // (because it's not a member of a multipolygon), test it now.
            if (activeIndex === null) {
                nodes = parent.nodes.map(function(nodeID) { return graph.entity(nodeID); });
                if (nodes.length && geoHasSelfIntersections(nodes, entity.id)) {
                    return parent.geometry(graph);
                }
            }

        }

        return false;
    }


    function move(d3_event, entity, point) {
        if (_isCancelled) return;
        d3_event.stopPropagation();

        context.surface().classed('nope-disabled', d3_event.altKey);

        _lastLoc = context.projection.invert(point);

        doMove(d3_event, entity);
        var nudge = geoViewportEdge(point, context.map().dimensions());
        if (nudge) {
            startNudge(d3_event, entity, nudge);
        } else {
            stopNudge();
        }
    }

    function end(d3_event, entity) {
        if (_isCancelled) return;

        var wasPoint = entity.geometry(context.graph()) === 'point';

        var d = datum(d3_event);
        var nope = (d && d.properties && d.properties.nope) || context.surface().classed('nope');
        var target = d && d.properties && d.properties.entity;   // entity to snap to

        if (nope) {   // bounce back
            context.perform(
                _actionBounceBack(entity.id, _startLoc)
            );

        } else if (target && target.type === 'way') {
            var choice = geoChooseEdge(context.graph().childNodes(target), context.map().mouse(), context.projection, entity.id);
            context.replace(
                actionAddMidpoint({
                    loc: choice.loc,
                    edge: [target.nodes[choice.index - 1], target.nodes[choice.index]]
                }, entity),
                connectAnnotation(entity, target)
            );

        } else if (target && target.type === 'node' && shouldSnapToNode(target)) {
            context.replace(
                actionConnect([target.id, entity.id]),
                connectAnnotation(entity, target)
            );

        } else if (_wasMidpoint) {
            context.replace(
                actionNoop(),
                t('operations.add.annotation.vertex')
            );

        } else {
            context.replace(
                actionNoop(),
                moveAnnotation(entity)
            );
        }

        if (wasPoint) {
            context.enter(modeSelect(context, [entity.id]));

        } else {
            var reselection = _restoreSelectedIDs.filter(function(id) {
                return context.graph().hasEntity(id);
            });

            if (reselection.length) {
                context.enter(modeSelect(context, reselection));
            } else {
                context.enter(modeBrowse(context));
            }
        }
    }


    function _actionBounceBack(nodeID, toLoc) {
        var moveNode = actionMoveNode(nodeID, toLoc);
        var action = function(graph, t) {
            // last time through, pop off the bounceback perform.
            // it will then overwrite the initial perform with a moveNode that does nothing
            if (t === 1) context.pop();
            return moveNode(graph, t);
        };
        action.transitionable = true;
        return action;
    }


    function cancel() {
        drag.cancel();
        context.enter(modeBrowse(context));
    }


    var drag = behaviorDrag()
        .selector('.layer-touch.points .target')
        .surface(context.container().select('.main-map').node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);


    mode.enter = function() {
        context.install(hover);
        context.install(edit);

        d3_select(window)
            .on('keydown.dragNode', keydown)
            .on('keyup.dragNode', keyup);

        context.history()
            .on('undone.drag-node', cancel);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        d3_select(window)
            .on('keydown.dragNode', null)
            .on('keyup.dragNode', null);

        context.history()
            .on('undone.drag-node', null);

        _activeEntity = null;

        context.surface()
            .classed('nope', false)
            .classed('nope-suppressed', false)
            .classed('nope-disabled', false)
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };


    mode.selectedIDs = function() {
        if (!arguments.length) return _activeEntity ? [_activeEntity.id] : [];
        // no assign
        return mode;
    };


    mode.activeID = function() {
        if (!arguments.length) return _activeEntity && _activeEntity.id;
        // no assign
        return mode;
    };


    mode.restoreSelectedIDs = function(_) {
        if (!arguments.length) return _restoreSelectedIDs;
        _restoreSelectedIDs = _;
        return mode;
    };


    mode.behavior = drag;


    return mode;
}
