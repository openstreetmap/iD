import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

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
    geoLineIntersection,
    geoVecEquals,
    geoVecSubtract,
    geoViewportEdge
} from '../geo';

import { modeBrowse, modeSelect } from './index';
import { osmNode } from '../osm';
import { svgBlocker } from '../svg';
import { uiFlash } from '../ui';


export function modeDragNode(context) {
    var mode = {
        id: 'drag-node',
        button: 'browse'
    };
    var hover = behaviorHover(context).altDisables(true)
        .on('hover', context.ui().sidebar.hover);
    var edit = behaviorEdit(context);
    var blocker = svgBlocker(context.projection, context);

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
            entity = context.entity(entity.id);  // get post-action entity

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


    function datum() {
        var event = d3_event && d3_event.sourceEvent;
        if (!event || event.altKey || !d3_select(event.target).classed('target')) {
            return {};
        } else {
            return event.target.__data__ || {};
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
            var target = d && d.id && context.hasEntity(d.id);

            if (target && target.type === 'node') {
                loc = target.loc;
            } else if (target && target.type === 'way') {
                var choice = geoChooseEdge(
                    context.childNodes(target), context.mouse(), context.projection, entity.id
                );
                if (choice) {
                    loc = choice.loc;
                }
            }
        }

        context.replace(
            actionMoveNode(entity.id, loc),
            moveAnnotation(entity)
        );


        checkGeometry(entity);
        _lastLoc = loc;
    }


    function checkGeometry(entity) {
        var doBlock = false;
        var graph = context.graph();
        var parents = graph.parentWays(entity);

        function checkSelfIntersections(way, activeID) {
            // check active (dragged) segments against inactive segments
            var actives = [];
            var inactives = [];
            var j, k;
            for (j = 0; j < way.nodes.length - 1; j++) {
                var n1 = graph.entity(way.nodes[j]);
                var n2 = graph.entity(way.nodes[j+1]);
                var segment = [n1.loc, n2.loc];
                if (n1.id === activeID || n2.id === activeID) {
                    actives.push(segment);
                } else {
                    inactives.push(segment);
                }
            }
            for (j = 0; j < actives.length; j++) {
                for (k = 0; k < inactives.length; k++) {
                    var p = actives[j];
                    var q = inactives[k];
                    // skip if segments share an endpoint
                    if (geoVecEquals(p[1], q[0]) || geoVecEquals(p[0], q[1]) ||
                        geoVecEquals(p[0], q[0]) || geoVecEquals(p[1], q[1]) ) {
                        continue;
                    } else if (geoLineIntersection(p, q)) {
                        return true;
                    }
                }
            }
            return false;
        }

        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];
            if (parent.isClosed()) {   // check for self intersections
                if (checkSelfIntersections(parent, entity.id)) {
                    doBlock = true;
                    break;
                }
            }
        }

        d3_select('.data-layer-osm')
            .call(doBlock ? blocker : blocker.off);
    }


    function move(entity) {
        if (_isCancelled) return;

        d3_event.sourceEvent.stopPropagation();
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
        var nope = d && d.id && /-nope$/.test(d.id);        // can't drag here
        var target = d && d.id && context.hasEntity(d.id);   // entity to snap to

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

        context.history()
            .on('undone.drag-node', cancel);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        context.history()
            .on('undone.drag-node', null);

        context.map()
            .on('drawn.drag-node', null);

        _activeEntity = null;

        d3_select('.data-layer-osm')
            .call(blocker.off);

        context.surface()
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
