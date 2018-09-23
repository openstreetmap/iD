import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { services } from '../services';
import { actionNoop } from '../actions';
import { behaviorEdit, behaviorDrag } from '../behavior';
import { geoVecSubtract, geoViewportEdge } from '../geo';
import { modeSelectNote } from './index';


export function modeDragNote(context) {
    var mode = {
        id: 'drag-note',
        button: 'browse'
    };

    var edit = behaviorEdit(context);

    var _nudgeInterval;
    var _lastLoc;


    function startNudge(note, nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
            doMove(note, nudge);
        }, 50);
    }


    function stopNudge() {
        if (_nudgeInterval) {
            window.clearInterval(_nudgeInterval);
            _nudgeInterval = null;
        }
    }


    function origin(note) {
        return context.projection(note.loc);
    }


    function start(note) {
        context.surface().selectAll('.note-' + note.id)
            .classed('active', true);

        context.perform(actionNoop());
        context.enter(mode);
        context.selectedNoteID(note.id);
    }


    function move(note) {
        d3_event.sourceEvent.stopPropagation();
        _lastLoc = context.projection.invert(d3_event.point);

        doMove(note);
        var nudge = geoViewportEdge(d3_event.point, context.map().dimensions());
        if (nudge) {
            startNudge(note, nudge);
        } else {
            stopNudge();
        }
    }


    function doMove(note, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3_event && d3_event.point) || context.projection(_lastLoc);
        var currMouse = geoVecSubtract(currPoint, nudge);
        var loc = context.projection.invert(currMouse);

        note = note.move(loc);

        var osm = services.osm;
        if (osm) {
            osm.replaceNote(note);  // update note cache
        }

        context.replace(actionNoop());   // trigger redraw
    }


    function end(note) {
        context.replace(actionNoop());   // trigger redraw

        context
            .selectedNoteID(note.id)
            .enter(modeSelectNote(context, note.id));
    }


    var drag = behaviorDrag()
        .selector('.layer-notes .new')
        .surface(d3_select('#map').node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);


    mode.enter = function() {
        context.install(edit);
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(edit);

        context.surface()
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };

    mode.behavior = drag;

    return mode;
}
