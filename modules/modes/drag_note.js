import { dispatch as d3_dispatch } from 'd3-dispatch';

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
    actionMoveNote,
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
import { osmJoinWays, osmNote } from '../osm';
import { uiFlash } from '../ui';


export function modeDragNote(context) {
    var mode = {
        id: 'drag-note',
        button: 'browse'
    };
    var hover = behaviorHover(context).altDisables(true)
        .on('hover', context.ui().sidebar.hover);
    var edit = behaviorEdit(context);

    var _nudgeInterval;
    var _restoreSelectedNoteIDs = [];
    var _wasMidpoint = false;
    var _isCancelled = false;
    var _activeEntity;
    var _startLoc;
    var _lastLoc;

    var dispatch = d3_dispatch('change');


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
        console.log('entity')
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
        _activeEntity = entity;
        _startLoc = entity.loc;

        context.surface().selectAll('.note-' + _activeEntity.id)
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
            var target = d;
            var targetLoc = target && target.loc;
            var targetNotes = d;
            var edge;

            // if (targetLoc) {   // snap to node/vertex - a point target with `.loc`
            //     loc = targetLoc;

            // } else if (targetNodes) {   // snap to way - a line target with `.nodes`
            //     edge = geoChooseEdge(targetNodes, context.mouse(), context.projection, end.id);
            //     if (edge) {
            //         loc = edge.loc;
            //     }
            // }
        }

        actionMoveNote(entity.id, loc);
        dispatch.call('change');

        var nope = context.surface().classed('nope');
        if (isInvalid === 'relation' || isInvalid === 'restriction') {
            if (!nope) {   // about to nope - show hint
                uiFlash()
                    .duration(4000)
                    .text(t('operations.connect.' + isInvalid,
                        { relation: context.presets().item('type/restriction').name() }
                    ))();
            }
        } else {
            if (nope) {   // about to un-nope, remove hint
                uiFlash()
                    .duration(1)
                    .text('')();
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
                // connectAnnotation(target) TODO: - likely replace
            );

        } else if (target && target.type === 'node') {
            context.replace(
                actionConnect([target.id, entity.id]),
                // connectAnnotation(target) TODO: - likely replace
            );

        } else if (_wasMidpoint) {
            context.replace(
                actionNoop(),
                t('operations.add.annotation.vertex')
            );

        } else {
            context.replace(
                actionNoop(),
                // moveAnnotation(entity) TODO: - likely replace
            );
        }

        var reselection = _restoreSelectedNoteIDs.filter(function(id) {
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
        .selector('.layer-notes .note')
        .surface(d3_select('#map').node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);


    mode.enter = function() {
        context.install(hover);
        context.install(edit);

        // d3_select(window)
        //     .on('keydown.drawWay', keydown)
        //     .on('keyup.drawWay', keyup);

        // context.history()
        //     .on('undone.drag-node', cancel);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        // d3_select(window)
        //     .on('keydown.hover', null)
        //     .on('keyup.hover', null);

        // context.history()
        //     .on('undone.drag-node', null);

        // context.map()
        //     .on('drawn.drag-node', null);

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


    mode.restoreSelectedNoteIDs = function(_) {
        if (!arguments.length) return _restoreSelectedNoteIDs;
        _restoreSelectedNoteIDs = _;
        return mode;
    };


    mode.behavior = drag;


    return mode;
}
