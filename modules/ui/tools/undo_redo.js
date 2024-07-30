import _debounce from 'lodash-es/debounce';

import {
    select as d3_select
} from 'd3-selection';

import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';


export function uiToolUndoRedo(context) {

    var tool = {
        id: 'undo_redo',
        label: t.append('toolbar.undo_redo')
    };

    var commands = [{
        id: 'undo',
        cmd: uiCmd('⌘Z'),
        action: function() {
            context.undo();
        },
        annotation: function() {
            return context.history().undoAnnotation();
        },
        icon: 'iD-icon-' + (localizer.textDirection() === 'rtl' ? 'redo' : 'undo')
    }, {
        id: 'redo',
        cmd: uiCmd('⌘⇧Z'),
        action: function() {
            context.redo();
        },
        annotation: function() {
            return context.history().redoAnnotation();
        },
        icon: 'iD-icon-' + (localizer.textDirection() === 'rtl' ? 'undo' : 'redo')
    }];


    function editable() {
        return context.mode() && context.mode().id !== 'save' && context.map().editableDataEnabled(true /* ignore min zoom */);
    }


    tool.render = function(selection) {
        var tooltipBehavior = uiTooltip()
            .placement('bottom')
            .title(function (d) {
                return d.annotation() ?
                    t.append(d.id + '.tooltip', { action: d.annotation() }) :
                    t.append(d.id + '.nothing');
            })
            .keys(function(d) {
                return [d.cmd];
            })
            .scrollContainer(context.container().select('.top-toolbar'));

        var lastPointerUpType;

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter()
            .append('button')
            .attr('class', function(d) { return 'disabled ' + d.id + '-button bar-button'; })
            .on('pointerup', function(d3_event) {
                // `pointerup` is always called before `click`
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();

                var annotation = d.annotation();

                if (editable() && annotation) {
                    d.action();
                }

                if (editable() && (
                    lastPointerUpType === 'touch' ||
                    lastPointerUpType === 'pen')
                ) {
                    // there are no tooltips for touch interactions so flash feedback instead

                    var label = annotation ?
                        t.append(d.id + '.tooltip', { action: annotation }) :
                        t.append(d.id + '.nothing');
                    context.ui().flash
                        .duration(2000)
                        .iconName('#' + d.icon)
                        .iconClass(annotation ? '' : 'disabled')
                        .label(label)();
                }
                lastPointerUpType = null;
            })
            .call(tooltipBehavior);

        buttons.each(function(d) {
            d3_select(this)
                .call(svgIcon('#' + d.icon));
        });

        context.keybinding()
            .on(commands[0].cmd, function(d3_event) {
                d3_event.preventDefault();
                if (editable()) commands[0].action();
            })
            .on(commands[1].cmd, function(d3_event) {
                d3_event.preventDefault();
                if (editable()) commands[1].action();
            });


        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.undo_redo', debouncedUpdate)
            .on('drawn.undo_redo', debouncedUpdate);

        context.history()
            .on('change.undo_redo', function(difference) {
                if (difference) update();
            });

        context
            .on('enter.undo_redo', update);


        function update() {
            buttons
                .classed('disabled', function(d) {
                    return !editable() || !d.annotation();
                })
                .each(function() {
                    var selection = d3_select(this);
                    if (!selection.select('.tooltip.in').empty()) {
                        selection.call(tooltipBehavior.updateContent);
                    }
                });
        }
    };

    tool.uninstall = function() {
        context.keybinding()
            .off(commands[0].cmd)
            .off(commands[1].cmd);

        context.map()
            .on('move.undo_redo', null)
            .on('drawn.undo_redo', null);

        context.history()
            .on('change.undo_redo', null);

        context
            .on('enter.undo_redo', null);
    };

    return tool;
}
