import _find from 'lodash-es/find';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t } from '../util/locale';

import {
    actionAddMidpoint,
    actionConnect,
    actionMoveNode,
    actionNoop
} from '../actions';

import {
    behaviorEdit,
    behaviorHover,
    behaviorDrag
} from '../behavior';

import {
    geoChooseEdge,
    geoHasLineIntersections,
    geoHasSelfIntersections,
    geoVecSubtract,
    geoViewportEdge
} from '../geo';

import { modeBrowse, modeSelect } from './index';
import { osmJoinWays, osmNode } from '../osm';
import { uiFlash } from '../ui';


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


    function startNudge(entity, nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
            doMove(entity, nudge);
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


    function connectAnnotation(entity) {
        return t('operations.connect.annotation.' + entity.geometry(context.graph()));
    }


    function origin(entity) {
        return context.projection(entity.loc);
    }


    function keydown() {
        if (d3_event.keyCode === d3_keybinding.modifierCodes.alt) {
            if (context.surface().classed('nope')) {
                context.surface()
                    .classed('nope-suppressed', true);
            }
            context.surface()
                .classed('nope', false)
                .classed('nope-disabled', true);
        }
    }


    function keyup() {
        if (d3_event.keyCode === d3_keybinding.modifierCodes.alt) {
            if (context.surface().classed('nope-suppressed')) {
                context.surface()
                    .classed('nope', true);
            }
            context.surface()
                .classed('nope-suppressed', false)
                .classed('nope-disabled', false);
        }
    }


    function start(entity) {
        _wasMidpoint = entity.type === 'midpoint';
        var hasHidden = context.features().hasHiddenConnections(entity, context.graph());
        _isCancelled = d3_event.sourceEvent.shiftKey || hasHidden;


        if (_isCancelled) {
            if (hasHidden) {
                uiFlash().text(t('modes.drag_node.connected_to_hidden'))();
            }
            return drag.cancel();
        }

        if (_wasMidpoint) {
            var midpoint = entity;
            entity = osmNode();
            context.perform(actionAddMidpoint(midpoint, entity));
            entity = context.entity(entity.id);   // get post-action entity

            var vertex = context.surface().selectAll('.' + entity.id);
            drag.target(vertex.node(), entity);

        } else {
            context.perform(actionNoop());
        }

        _activeEntity = entity;
        _startLoc = entity.loc;

        context.surface().selectAll('.' + _activeEntity.id)
            .classed('active', true);

        context.enter(mode);
    }


    // related code
    // - `behavior/draw.js` `datum()`
    function datum() {
        var event = d3_event && d3_event.sourceEvent;
        if (!event || event.altKey) {
            return {};
        } else {
            // When dragging, snap only to touch targets..
            // (this excludes area fills and active drawing elements)
            var d = event.target.__data__;
            return (d && d.properties && d.properties.target) ? d : {};
        }
    }


    function doMove(entity, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3_event && d3_event.point) || context.projection(_lastLoc);
        var currMouse = geoVecSubtract(currPoint, nudge);
        var loc = context.projection.invert(currMouse);

        if (!_nudgeInterval) {   // If not nudging at the edge of the viewport, try to snap..
            // related code
            // - `mode/drag_node.js`     `doMode()`
            // - `behavior/draw.js`      `click()`
            // - `behavior/draw_way.js`  `move()`
            var d = datum();
            var targetLoc = d && d.properties && d.properties.entity && d.properties.entity.loc;
            var targetNodes = d && d.properties && d.properties.nodes;

            if (targetLoc) {   // snap to node/vertex - a point target with `.loc`
                loc = targetLoc;

            } else if (targetNodes) {   // snap to way - a line target with `.nodes`
                var choice = geoChooseEdge(targetNodes, context.mouse(), context.projection, end.id);
                if (choice) {
                    loc = choice.loc;
                }
            }
        }

        context.replace(
            actionMoveNode(entity.id, loc),
            moveAnnotation(entity)
        );


        // check if this movement causes the geometry to break
        var nopeDisabled = context.surface().classed('nope-disabled');
        var isInvalid = isInvalidGeometry(entity, context.graph());
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


    function isInvalidGeometry(entity, graph) {
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
                    if (_find(nodes, function(n) { return n.id === entity.id; })) {
                        activeIndex = k;
                        if (geoHasSelfIntersections(nodes, entity.id)) {
                            return true;
                        }
                    }
                    rings[k].coords = nodes.map(function(n) { return n.loc; });
                }

                // test active ring for intersections with other rings in the multipolygon
                for (k = 0; k < rings.length; k++) {
                    if (k === activeIndex) continue;

                    // make sure active ring doesnt cross passive rings
                    if (geoHasLineIntersections(rings[activeIndex].nodes, rings[k].nodes, entity.id)) {
                        return true;
                    }
                }
            }


            // If we still haven't tested this node's parent way for self-intersections.
            // (because it's not a member of a multipolygon), test it now.
            if (activeIndex === null) {
                nodes = parent.nodes.map(function(nodeID) { return graph.entity(nodeID); });
                if (nodes.length && geoHasSelfIntersections(nodes, entity.id)) {
                    return true;
                }
            }

        }

        return false;
    }


    function move(entity) {
        if (_isCancelled) return;
        d3_event.sourceEvent.stopPropagation();

        context.surface().classed('nope-disabled', d3_event.sourceEvent.altKey);

        _lastLoc = context.projection.invert(d3_event.point);

        doMove(entity);
        var nudge = geoViewportEdge(d3_event.point, context.map().dimensions());
        if (nudge) {
            startNudge(entity, nudge);
        } else {
            stopNudge();
        }
    }


    function end(entity) {
        if (_isCancelled) return;

        var d = datum();
        var nope = (d && d.properties && d.properties.nope) || context.surface().classed('nope');
        var target = d && d.properties && d.properties.entity;   // entity to snap to

        if (nope) {   // bounce back
            context.perform(
                _actionBounceBack(entity.id, _startLoc)
            );

        } else if (target && target.type === 'way') {
            var choice = geoChooseEdge(context.childNodes(target), context.mouse(), context.projection, entity.id);
            context.replace(
                actionAddMidpoint({
                    loc: choice.loc,
                    edge: [target.nodes[choice.index - 1], target.nodes[choice.index]]
                }, entity),
                connectAnnotation(target)
            );

        } else if (target && target.type === 'node') {
            context.replace(
                actionConnect([target.id, entity.id]),
                connectAnnotation(target)
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

        var reselection = _restoreSelectedIDs.filter(function(id) {
            return context.graph().hasEntity(id);
        });

        if (reselection.length) {
            context.enter(modeSelect(context, reselection));
        } else {
            context.enter(modeBrowse(context));
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
        .selector('.layer-points-targets .target')
        .surface(d3_select('#map').node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);


    mode.enter = function() {
        context.install(hover);
        context.install(edit);

        d3_select(window)
            .on('keydown.drawWay', keydown)
            .on('keyup.drawWay', keyup);

        context.history()
            .on('undone.drag-node', cancel);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        d3_select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);

        context.history()
            .on('undone.drag-node', null);

        context.map()
            .on('drawn.drag-node', null);

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
