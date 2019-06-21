import { geoBounds as d3_geoBounds } from 'd3-geo';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { behaviorBreathe } from '../behavior/breathe';
import { behaviorHover } from '../behavior/hover';
import { behaviorLasso } from '../behavior/lasso';
import { behaviorSelect } from '../behavior/select';

import { t } from '../util/locale';

import { geoExtent } from '../geo';
import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';
import { uiDataEditor } from '../ui/data_editor';
import { services } from '../services';
import { uiTasking } from '../ui/';
import { utilKeybinding } from '../util';


export function modeSelectTask(context, selectedTaskID) {
    var mode = {
        id: 'select-task',
        button: 'browse'
    };

    var tasks = services.tasks;
    var keybinding = utilKeybinding('select-task');
    var dataEditor = uiDataEditor(context);

    var tasking = uiTasking(context)
        .on('change', function() {
            context.map().pan([0,0]);  // trigger a redraw
            var task = checkSelectedTaskID();
            if (!task) return;
            context.ui().sidebar
                .show(tasking.task(task));
        });

    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];

    function checkSelectedTaskID() {
        var task = tasks.getTask(selectedTaskID);
        if (!task) {
            context.enter(modeBrowse(context));
        }
        return task;
    }


    // class the task as selected, or return to browse mode if the data is gone
    function selectTask(drawn) {
        var selection = context.surface().selectAll('.layer-maptask .data' + selectedTaskID.__featurehash__);

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


    mode.zoomToSelected = function() {
        var extent = geoExtent(d3_geoBounds(selectedTaskID));
        context.map().centerZoomEase(extent.center(), context.map().trimmedExtentZoom(extent));
    };


    mode.enter = function() {
        behaviors.forEach(context.install);

        keybinding
            .on(t('inspector.zoom_to.key'), mode.zoomToSelected)
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        selectTask();

        var sidebar = context.ui().sidebar;
        sidebar.show(dataEditor.datum(selectedTaskID));

        // expand the sidebar, avoid obscuring the data if needed
        var extent = geoExtent(d3_geoBounds(selectedTaskID));
        sidebar.expand(sidebar.intersects(extent));

        context.map()
            .on('drawn.select-data', selectTask);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.surface()
            .selectAll('.layer-maptask .selected')
            .classed('selected hover', false);

        context.map()
            .on('drawn.select-data', null);

        context.ui().sidebar
            .hide();
    };


    return mode;
}
