import { geoBounds as d3_geoBounds } from 'd3-geo';

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

import { geoExtent } from '../geo';
import { modeBrowse, modeDragNode, modeDragNote } from '../modes';
import { uiDataEditor } from '../ui';
import { utilKeybinding } from '../util';


export function modeSelectData(context, selectedDatum) {
    var mode = {
        id: 'select-data',
        button: 'browse'
    };

    var keybinding = utilKeybinding('select-data');
    var dataEditor = uiDataEditor(context);

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];


    // class the data as selected, or return to browse mode if the data is gone
    function selectData(drawn) {
        var selection = context.surface().selectAll('.layer-mapdata .data' + selectedDatum.__featurehash__);

        if (selection.empty()) {
            // Return to browse mode if selected DOM elements have
            // disappeared because the user moved them out of view..
            var source = d3_event && d3_event.type === 'zoom' && d3_event.sourceEvent;
            if (drawn && source && (source.type === 'mousemove' || source.type === 'touchmove')) {
                context.enter(modeBrowse(context));
            }
        } else {
            selection.classed('selected', true);
        }
    }


    function esc() {
        if (d3_select('.combobox').size()) return;
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        behaviors.forEach(context.install);
        keybinding.on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectData();

        var sidebar = context.ui().sidebar;
        sidebar.show(dataEditor.datum(selectedDatum));

        // expand the sidebar, avoid obscuring the data if needed
        var extent = geoExtent(d3_geoBounds(selectedDatum));
        sidebar.expand(sidebar.intersects(extent));

        context.map()
            .on('drawn.select-data', selectData);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.layer-mapdata .selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select-data', null);

        context.ui().sidebar
            .hide();
    };


    return mode;
}
