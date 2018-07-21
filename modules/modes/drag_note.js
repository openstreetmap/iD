import _find from 'lodash-es/find';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { geoVecInterp } from '../geo';

import { t } from '../util/locale';

import { services } from '../services';


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

import { modeBrowse, modeSelectNote } from './index';
import { osmJoinWays, osmNode } from '../osm';
import { uiFlash } from '../ui';


export function modeDragNote(context) {
    var mode = {
        id: 'drag-note',
        button: 'browse'
    };
    var hover = behaviorHover(context).altDisables(true)
        .on('hover', context.ui().sidebar.hover);
    var edit = behaviorEdit(context);

    var dispatch = d3_dispatch('redraw', 'change');

    var _nudgeInterval;
    var _restoreSelectedNoteID = [];
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
        context.perform(actionNoop());

        _activeEntity = entity;
        _startLoc = entity.loc;

        context.surface().selectAll('.note-' + _activeEntity.id)
            .classed('active', true);

        context.enter(mode);
    }


    function move(entity) {
        if (_isCancelled) return;
        d3_event.sourceEvent.stopPropagation();

        context.surface().classed('nope-disabled', d3_event.sourceEvent.altKey);

        _lastLoc = context.projection.invert(d3_event.point);

        doMove(entity);
        // var nudge = geoViewportEdge(d3_event.point, context.map().dimensions());
        // if (nudge) {
        //     startNudge(entity, nudge);
        // } else {
        //     stopNudge();
        // }

    }


    function doMove(entity, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3_event && d3_event.point) || context.projection(_lastLoc);
        var currMouse = geoVecSubtract(currPoint, nudge);
        var loc = context.projection.invert(currMouse);

        entity = entity.move(geoVecInterp(entity.loc, loc, 1));

        var osm = services.osm;
        if (osm) {
            osm.replaceNote(entity);  // update note cache
        }
        dispatch.call('change', this, 'difference');
    }


    function end(entity) {
        context
                .selectedNoteID(entity.id)
                .enter(modeSelectNote(context, entity.id));
    }


    function cancel() {
        drag.cancel();
        context.enter(modeBrowse(context));
    }


    var drag = behaviorDrag()
        .selector('.layer-notes .new')
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
            .on('undone.drag-note', cancel);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        d3_select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null);

        context.history()
            .on('undone.drag-note', null);

        context.map()
            .on('drawn.drag-note', null);

        _activeEntity = null;

        context.surface()
            .classed('nope', false)
            .classed('nope-suppressed', false)
            .classed('nope-disabled', false)
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };


    mode.selectedNoteID = function() {
        if (!arguments.length) return _activeEntity ? [_activeEntity.id] : [];
        // no assign
        return mode;
    };


    mode.activeID = function() {
        if (!arguments.length) return _activeEntity && _activeEntity.id;
        // no assign
        return mode;
    };


    mode.restoreSelectedNoteID = function(_) {
        if (!arguments.length) return _restoreSelectedNoteID;
        _restoreSelectedNoteID = _;
        return mode;
    };


    mode.behavior = drag;


    return mode;
}
