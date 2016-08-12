import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import _ from 'lodash';
import { tooltip } from '../util/tooltip';
import { AddArea, AddLine, AddPoint, Browse } from '../modes/index';
import { Icon } from '../svg/index';
import { tooltipHtml } from './tooltipHtml';

export function Modes(context) {
    var modes = [
        AddPoint(context),
        AddLine(context),
        AddArea(context)];

    function editable() {
        return context.editable() && context.mode().id !== 'save';
    }

    return function(selection) {
        var buttons = selection.selectAll('button.add-button')
            .data(modes);

       buttons.enter().append('button')
           .attr('tabindex', -1)
           .attr('class', function(mode) { return mode.id + ' add-button col4'; })
           .on('click.mode-buttons', function(mode) {
               if (mode.id === context.mode().id) {
                   context.enter(Browse(context));
               } else {
                   context.enter(mode);
               }
           })
           .call(tooltip()
               .placement('bottom')
               .html(true)
               .title(function(mode) {
                   return tooltipHtml(mode.description, mode.key);
               }));

        context.map()
            .on('move.modes', _.debounce(update, 500));

        context
            .on('enter.modes', update);

        buttons.each(function(d) {
            d3.select(this)
                .call(Icon('#icon-' + d.button, 'pre-text'));
        });

        buttons.append('span')
            .attr('class', 'label')
            .text(function(mode) { return mode.title; });

        context.on('enter.editor', function(entered) {
            buttons.classed('active', function(mode) { return entered.button === mode.button; });
            context.container()
                .classed('mode-' + entered.id, true);
        });

        context.on('exit.editor', function(exited) {
            context.container()
                .classed('mode-' + exited.id, false);
        });

        var keybinding = d3keybinding('mode-buttons');

        modes.forEach(function(m) {
            keybinding.on(m.key, function() { if (editable()) context.enter(m); });
        });

        d3.select(document)
            .call(keybinding);

        function update() {
            buttons.property('disabled', !editable());
        }
    };
}
