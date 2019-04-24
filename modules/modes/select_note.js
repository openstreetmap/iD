import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { behaviorBreathe } from '../behavior/breathe';
import { behaviorHover } from '../behavior/hover';
import { behaviorLasso } from '../behavior/lasso';
import { behaviorSelect } from '../behavior/select';

import { t } from '../util/locale';

import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';
import { services } from '../services';
import { uiNoteEditor } from '../ui/note_editor';
import { utilKeybinding } from '../util';


export function modeSelectNote(context, selectedNoteID) {
    var mode = {
        id: 'select-note',
        button: 'browse'
    };

    var osm = services.osm;
    var keybinding = utilKeybinding('select-note');
    var noteEditor = uiNoteEditor(context)
        .on('change', function() {
            context.map().pan([0,0]);  // trigger a redraw
            var note = checkSelectedID();
            if (!note) return;
            context.ui().sidebar
                .show(noteEditor.note(note));
        });

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];

    var newFeature = false;


    function checkSelectedID() {
        if (!osm) return;
        var note = osm.getNote(selectedNoteID);
        if (!note) {
            context.enter(modeBrowse(context));
        }
        return note;
    }


    // class the note as selected, or return to browse mode if the note is gone
    function selectNote(drawn) {
        if (!checkSelectedID()) return;

        var selection = context.surface().selectAll('.layer-notes .note-' + selectedNoteID);

        if (selection.empty()) {
            // Return to browse mode if selected DOM elements have
            // disappeared because the user moved them out of view..
            var source = d3_event && d3_event.type === 'zoom' && d3_event.sourceEvent;
            if (drawn && source && (source.type === 'mousemove' || source.type === 'touchmove')) {
                context.enter(modeBrowse(context));
            }

        } else {
            selection
                .classed('selected', true);

            context.selectedNoteID(selectedNoteID);
        }
    }


    function esc() {
        if (d3_select('.combobox').size()) return;
        context.enter(modeBrowse(context));
    }


    mode.zoomToSelected = function() {
        if (!osm) return;
        var note = osm.getNote(selectedNoteID);
        if (note) {
            context.map().centerZoomEase(note.loc, 20);
        }
    };


    mode.newFeature = function(val) {
        if (!arguments.length) return newFeature;
        newFeature = val;
        return mode;
    };


    mode.enter = function() {
        var note = checkSelectedID();
        if (!note) return;

        behaviors.forEach(context.install);

        keybinding
            .on(t('inspector.zoom_to.key'), mode.zoomToSelected)
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectNote();

        var sidebar = context.ui().sidebar;
        sidebar.show(noteEditor.note(note));

        // expand the sidebar, avoid obscuring the note if needed
        sidebar.expand(sidebar.intersects(note.extent()));

        context.map()
            .on('drawn.select', selectNote);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.layer-notes .selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select', null);

        context.ui().sidebar
            .hide();

        context.selectedNoteID(null);
    };


    return mode;
}
