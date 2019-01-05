import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    behaviorBreathe,
    behaviorHover,
    behaviorLasso,
    behaviorSelect
} from '../behavior';

import { services } from '../services';
import { modeBrowse, modeDragNode, modeDragNote } from '../modes';
import { uiKeepRightEditor } from '../ui';
import { utilKeybinding } from '../util';


export function modeSelectError(context, selectedErrorID) {
    var mode = {
        id: 'select-error',
        button: 'browse'
    };

    var keepRight = services.keepRight;
    var keybinding = utilKeybinding('select-error');
    var keepRightEditor = uiKeepRightEditor(context)
        .on('change', function() {
            context.map().pan([0,0]);  // trigger a redraw
            var error = checkSelectedID();
            if (!error) return;
            context.ui().sidebar
                .show(keepRightEditor.error(error));
        });

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];


    function checkSelectedID() {
        if (!keepRight) return;
        var error = keepRight.getError(selectedErrorID);
        if (!error) {
            context.enter(modeBrowse(context));
        }
        return error;
    }


    mode.enter = function() {

        // class the error as selected, or return to browse mode if the error is gone
        function selectError(drawn) {
            if (!checkSelectedID()) return;

            var selection = context.surface()
                .selectAll('.kr_error-' + selectedErrorID);

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

                context.selectedErrorID(selectedErrorID);
            }
        }

        function esc() {
            if (d3_select('.combobox').size()) return;
            context.enter(modeBrowse(context));
        }

        var error = checkSelectedID();
        if (!error) return;

        behaviors.forEach(context.install);
        keybinding.on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectError();

        var sidebar = context.ui().sidebar;
        sidebar.show(keepRightEditor.error(error));

        context.map()
            .on('drawn.select-error', selectError);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.kr_error.selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select-error', null);

        context.ui().sidebar
            .hide();

        context.selectedErrorID(null);
    };


    return mode;
}
