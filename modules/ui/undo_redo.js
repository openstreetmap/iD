import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { Icon } from '../svg/index';
import { cmd } from './cmd';
import { tooltipHtml } from './tooltipHtml';

export function UndoRedo(context) {
    var commands = [{
        id: 'undo',
        cmd: cmd('⌘Z'),
        action: function() { if (!(context.inIntro() || saving())) context.undo(); },
        annotation: function() { return context.history().undoAnnotation(); }
    }, {
        id: 'redo',
        cmd: cmd('⌘⇧Z'),
        action: function() {if (!(context.inIntro() || saving())) context.redo(); },
        annotation: function() { return context.history().redoAnnotation(); }
    }];

    function saving() {
        return context.mode().id === 'save';
    }

    return function(selection) {
        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return tooltipHtml(d.annotation() ?
                    t(d.id + '.tooltip', {action: d.annotation()}) :
                    t(d.id + '.nothing'), d.cmd);
            });

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter().append('button')
            .attr('class', 'col6 disabled')
            .on('click', function(d) { return d.action(); })
            .call(tooltipBehavior);

        buttons.each(function(d) {
            d3.select(this)
                .call(Icon('#icon-' + d.id));
        });

        var keybinding = d3keybinding('undo')
            .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

        d3.select(document)
            .call(keybinding);

        context.history()
            .on('change.undo_redo', update);

        context
            .on('enter.undo_redo', update);

        function update() {
            buttons
                .property('disabled', saving())
                .classed('disabled', function(d) { return !d.annotation(); })
                .each(function() {
                    var selection = d3.select(this);
                    if (selection.property('tooltipVisible')) {
                        selection.call(tooltipBehavior.show);
                    }
                });
        }
    };
}
