import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import {
    behaviorHover,
    behaviorLasso,
    behaviorSelect,
    behaviorDrag
} from '../behavior';


import { services } from '../services';
import { modeBrowse } from './browse';
import { modeDragNote } from './drag_note';
import { uiNoteEditor } from '../ui';


export function modeSelectNote(context, selectedNoteID) {
    var mode = {
        id: 'select_note',
        button: 'browse'
    };

    var osm = services.osm;
    var keybinding = d3_keybinding('select-note');
    var noteEditor = uiNoteEditor(context)
        .on('change', function() {
            context.map().pan([0,0]);  // trigger a redraw
            var note = checkSelectedID();
            if (!note) return;
            context.ui().sidebar
                .show(noteEditor.note(note));
        });

    var behaviors = [
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNote(context).restoreSelectedNoteIDs(selectedNoteID).behavior
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

    mode.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return mode;
    };

    mode.enter = function() {

        // class the note as selected, or return to browse mode if the note is gone
        function selectNote(drawn) {
            if (!checkSelectedID()) return;

            var selection = context.surface()
                .selectAll('.note-' + selectedNoteID);

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
            }
        }

        function esc() {
            context.enter(modeBrowse(context));
        }

        var note = checkSelectedID();
        if (!note) return;

        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        keybinding
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        context.ui().sidebar
            .show(noteEditor.note(note));

        context.map()
            .on('drawn.select', selectNote);

        selectNote();
    };


    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        keybinding.off();

        context.surface()
            .selectAll('.note.selected')
            .classed('selected hovered', false);

        context.map()
            .on('drawn.select', null);

        context.ui().sidebar
            .hide();

        context.selectedNoteID(null);
    };


    return mode;
}
