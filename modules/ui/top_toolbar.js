import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import _debounce from 'lodash-es/debounce';

import { presetManager } from '../presets';
import { utilFunctor } from '../util/util';

import { uiToolAddFavorite, uiToolAddFeature, uiToolAddRecent, uiToolNotes, uiToolSave, uiToolUndoRedo } from './tools';
import { uiToolAddAddablePresets } from './tools/quick_presets_addable';
import { uiToolAddGeneric } from './tools/quick_presets_generic';
import { uiToolWaySegments } from './tools/way_segments';
import { uiToolRepeatAdd } from './tools/repeat_add';
import { uiToolStructure } from './tools/structure';
import { uiToolStopDraw } from './tools/stop_draw';
import { uiToolToolbox } from './tools/toolbox';
import { uiToolAddingGeometry } from './tools/adding_geometry';
import { uiToolPowerSupport } from './tools/power_support';

export function uiTopToolbar(context) {

    var toolbox = uiToolToolbox(context),
        addAddable = uiToolAddAddablePresets(context),
        addFeature = uiToolAddFeature(context),
        addGeneric = uiToolAddGeneric(context),
        addFavorite = uiToolAddFavorite(context),
        addRecent = uiToolAddRecent(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context),
        waySegments = uiToolWaySegments(context),
        structure = uiToolStructure(context),
        repeatAdd = uiToolRepeatAdd(context),
        stopDraw = uiToolStopDraw(context),
        addingGeometry = uiToolAddingGeometry(context),
        powerSupport = uiToolPowerSupport(context);

    function allowedTools() {

        var mode = context.mode();
        if (!mode) return [];

        var tools;

        if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area' ||
            mode.id === 'draw-line' || mode.id === 'draw-area') {

            tools = [
                toolbox,
                addingGeometry,
                'spacer',
                structure,
                powerSupport,
                'spacer',
                waySegments,
                'spacer',
                repeatAdd,
                undoRedo,
                stopDraw
            ];

        } else {

            tools = [
                toolbox,
                'spacer',
                addFeature,
                addAddable,
                addGeneric,
                addFavorite,
                addRecent,
                'spacer',
                notes,
                'spacer',
                undoRedo,
                save
            ];
        }

        tools = tools.filter(function(tool) {
            return !tool.allowed || tool.allowed();
        });

        return tools;
    }

    function topToolbar(bar) {

        bar.on('wheel.topToolbar', function() {
            if (!d3_event.deltaX) {
                // translate vertical scrolling into horizontal scrolling in case
                // the user doesn't have an input device that can scroll horizontally
                bar.node().scrollLeft += d3_event.deltaY;
            }
        });

        var debouncedUpdate = _debounce(update, 250, { leading: true, trailing: true });
        context.layers()
            .on('change.topToolbar', debouncedUpdate);

        context.on('enter.topToolbar', update);

        presetManager
            .on('favoritePreset.topToolbar', update)
            .on('recentsChange.topToolbar', update);

        toolbox.onChange = function() {
            update();
        };

        update();

        function update() {

            var tools = allowedTools();

            toolbox.setAllowedTools(tools);

            tools = tools.filter(function(tool) {
                return tool.userToggleable === false || tool.isToggledOn !== false;
            });

            var deduplicatedTools = [];
            // remove adjacent duplicates (i.e. spacers)
            tools.forEach(function(tool) {
                if (!deduplicatedTools.length || deduplicatedTools[deduplicatedTools.length - 1] !== tool) {
                    deduplicatedTools.push(tool);
                }
            });
            tools = deduplicatedTools;

            var toolbarItems = bar.selectAll('.toolbar-item')
                .data(tools, function(d) {
                    return d.id || d;
                });

            toolbarItems.exit()
                .each(function(d) {
                    if (d.uninstall) {
                        d.uninstall();
                    }
                })
                .remove();

            var itemsEnter = toolbarItems
                .enter()
                .each(function(d) {
                    if (d.install) {
                        d.install();
                    }
                })
                .append('div')
                .attr('class', function(d) {
                    var classes = 'toolbar-item ' + (d.id || d).replace('_', '-');
                    if (d.itemClass) classes += ' ' + d.itemClass;
                    return classes;
                });

            var actionableItems = itemsEnter.filter(function(d) { return typeof d !== 'string'; });

            actionableItems
                .append('div')
                .attr('class', function(d) {
                    var classes = 'item-content';
                    if (d.contentClass) classes += ' ' + d.contentClass;
                    return classes;
                });

            actionableItems
                .append('div')
                .attr('class', 'item-label');

            toolbarItems = toolbarItems.merge(itemsEnter)
                .each(function(d){
                    if (d.render) d3_select(this).select('.item-content').call(d.render, bar);
                });

            toolbarItems.selectAll('.item-label')
                .text(function(d) {
                    return utilFunctor(d.label)();
                });
        }

    }

    return topToolbar;
}
