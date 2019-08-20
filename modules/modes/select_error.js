import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { behaviorBreathe } from '../behavior/breathe';
import { behaviorHover } from '../behavior/hover';
import { behaviorLasso } from '../behavior/lasso';
import { behaviorSelect } from '../behavior/select';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';
import { utilKeybinding } from '../util';


export function modeSelectError(context, selectedErrorID, selectedErrorService) {
    var mode = {
        id: 'select-error',
        button: 'browse'
    };

    var keybinding = utilKeybinding('select-error');

    var errorService = services[selectedErrorService];

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];


    function checkSelectedID() {
        if (!errorService) return;
        var error = errorService.getError(selectedErrorID);
        if (!error) {
            context.enter(modeBrowse(context));
        }
        return error;
    }


    mode.selectedErrorService = function() {
        return selectedErrorService;
    };

    mode.selectedErrorID = function() {
        return selectedErrorID;
    };


    mode.zoomToSelected = function() {
        if (!errorService) return;
        var error = errorService.getError(selectedErrorID);
        if (error) {
            context.map().centerZoomEase(error.loc, 20);
        }
    };


    mode.enter = function() {
        var error = checkSelectedID();
        if (!error) return;

        behaviors.forEach(context.install);
        keybinding
            .on(t('inspector.zoom_to.key'), mode.zoomToSelected)
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectError();

        context.map()
            .on('drawn.select-error', selectError);


        // class the error as selected, or return to browse mode if the error is gone
        function selectError(drawn) {
            if (!checkSelectedID()) return;

            var selection = context.surface()
                .selectAll('.error_id-' + selectedErrorID + '.' + selectedErrorService);

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
            if (d3_select('.combobox').size()) return;
            context.enter(modeBrowse(context));
        }
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.qa_error.selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select-error', null);

        context.features().forceVisible([]);
    };


    return mode;
}
