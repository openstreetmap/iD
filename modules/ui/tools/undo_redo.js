import _debounce from 'lodash-es/debounce';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';


export function uiToolUndoRedo(context) {

    var tool = {
        id: 'undo_redo',
        label: t('toolbar.undo_redo'),
        iconName: textDirection === 'rtl' ? 'iD-icon-redo' : 'iD-icon-undo',
        userToggleable: false
    };

    var commands = [{
        id: 'undo',
        cmd: uiCmd('⌘Z'),
        action: function() { if (editable()) context.undo(); },
        annotation: function() { return context.history().undoAnnotation(); }
    }, {
        id: 'redo',
        cmd: uiCmd('⌘⇧Z'),
        action: function() { if (editable()) context.redo(); },
        annotation: function() { return context.history().redoAnnotation(); }
    }];


    function editable() {
        return context.mode() && context.mode().id !== 'save' && context.map().editableDataEnabled(true /* ignore min zoom */);
    }

    var tooltipBehavior = uiTooltip()
        .placement('bottom')
        .title(function (d) {
            return d.annotation() ?
                t(d.id + '.tooltip', {action: d.annotation()}) :
                t(d.id + '.nothing');
        })
        .keys(function(d) {
            return [d.cmd];
        })
        .scrollContainer(context.container().select('.top-toolbar'));

    var buttons;

    tool.render = function(selection) {

        buttons = selection.selectAll('button')
            .data(commands);

        var buttonsEnter = buttons
            .enter()
            .append('button')
            .attr('class', function(d) { return 'disabled ' + d.id + '-button bar-button'; })
            .on('click', function(d) { return d.action(); })
            .call(tooltipBehavior);

        buttonsEnter.each(function(d) {
            var iconName;
            if (textDirection === 'rtl') {
                // reverse the icons for right-to-left layout
                iconName = d.id === 'undo' ? 'redo' : 'undo';
            } else {
                iconName = d.id;
            }
            d3_select(this)
                .call(svgIcon('#iD-icon-' + iconName));
        });

        buttons = buttonsEnter.merge(buttons);
    };

    function update() {
        buttons
            .property('disabled', !editable())
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

    tool.allowed = function() {
        return context.mode().id !== 'save';
    };

    tool.install = function() {
        context.keybinding()
            .on(commands[0].cmd, function() { d3_event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3_event.preventDefault(); commands[1].action(); });

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
