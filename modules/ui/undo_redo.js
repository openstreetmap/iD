import _debounce from 'lodash-es/debounce';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiUndoRedo(context) {
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
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }


    return function(selection) {
        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return uiTooltipHtml(d.annotation() ?
                    t(d.id + '.tooltip', {action: d.annotation()}) :
                    t(d.id + '.nothing'), d.cmd);
            });

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter()
            .append('button')
            .attr('class', function(d) { return 'disabled ' + d.id + '-button'; })
            .on('click', function(d) { return d.action(); })
            .call(tooltipBehavior);

        buttons.each(function(d) {
            var iconName = d.id;
            if (textDirection === 'rtl') {
                if (iconName === 'undo') {
                    iconName = 'redo';
                } else if (iconName === 'redo') {
                    iconName = 'undo';
                }
            }
            d3_select(this)
                .call(svgIcon('#iD-icon-' + iconName));
        });

        context.keybinding()
            .on(commands[0].cmd, function() { d3_event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3_event.preventDefault(); commands[1].action(); });


        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.undo_redo', debouncedUpdate)
            .on('drawn.undo_redo', debouncedUpdate);

        context.history()
            .on('change.undo_redo', update);

        context
            .on('enter.undo_redo', update);


        function update() {
            buttons
                .property('disabled', !editable())
                .classed('disabled', function(d) { return !d.annotation(); })
                .each(function() {
                    var selection = d3_select(this);
                    if (selection.property('tooltipVisible')) {
                        selection.call(tooltipBehavior.show);
                    }
                });
        }
    };
}
