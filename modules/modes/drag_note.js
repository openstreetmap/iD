
import { services } from '../services';
import { actionNoop } from '../actions/noop';
import { behaviorDrag } from '../behavior/drag';
import { behaviorEdit } from '../behavior/edit';
import { geoVecSubtract, geoViewportEdge } from '../geo';
import { modeSelectNote } from './select_note';


export function modeDragNote(context) {
    var mode = {
        id: 'drag-note',
        button: 'browse'
    };

    var edit = behaviorEdit(context);

    var _nudgeInterval;
    var _lastLoc;
    var _note;    // most current note.. dragged note may have stale datum.


    function startNudge(d3_event, nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.map().pan(nudge);
            doMove(d3_event, nudge);
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


    function start(d3_event, note) {
        _note = note;
        var osm = services.osm;
        if (osm) {
            // Get latest note from cache.. The marker may have a stale datum bound to it
            // and dragging it around can sometimes delete the users note comment.
            _note = osm.getNote(_note.id);
        }

        context.surface().selectAll('.note-' + _note.id)
            .classed('active', true);

        context.perform(actionNoop());
        context.enter(mode);
        context.selectedNoteID(_note.id);
    }


    function move(d3_event, entity, point) {
        d3_event.stopPropagation();
        _lastLoc = context.projection.invert(point);

        doMove(d3_event);
        var nudge = geoViewportEdge(point, context.map().dimensions());
        if (nudge) {
            startNudge(d3_event, nudge);
        } else {
            stopNudge();
        }
    }


    function doMove(d3_event, nudge) {
        nudge = nudge || [0, 0];

        var currPoint = (d3_event && d3_event.point) || context.projection(_lastLoc);
        var currMouse = geoVecSubtract(currPoint, nudge);
        var loc = context.projection.invert(currMouse);

        _note = _note.move(loc);

        var osm = services.osm;
        if (osm) {
            osm.replaceNote(_note);  // update note cache
        }

        context.replace(actionNoop());   // trigger redraw
    }


    function end() {
        context.replace(actionNoop());   // trigger redraw

        context
            .selectedNoteID(_note.id)
            .enter(modeSelectNote(context, _note.id));
    }


    var drag = behaviorDrag()
        .selector('.layer-touch.markers .target.note.new')
        .surface(context.container().select('.main-map').node())
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
