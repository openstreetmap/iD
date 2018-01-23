import _debounce from 'lodash-es/debounce';

import { select as d3_select } from 'd3-selection';
import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../modes';

import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiModes(context) {
    var modes = [
        modeAddPoint(context),
        modeAddLine(context),
        modeAddArea(context)
    ];


    function editable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }


    return function(selection) {
        var buttons = selection.selectAll('button.add-button')
            .data(modes);

        buttons = buttons.enter()
            .append('button')
            .attr('tabindex', -1)
            .attr('class', function(mode) { return mode.id + ' add-button col4'; })
            .on('click.mode-buttons', function(mode) {
                // When drawing, ignore accidental clicks on mode buttons - #4042
                var currMode = context.mode().id;
                if (currMode.match(/^draw/) !== null) return;

                if (mode.id === currMode) {
                    context.enter(modeBrowse(context));
                } else {
                    context.enter(mode);
                }
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(function(mode) {
                    return uiTooltipHtml(mode.description, mode.key);
                })
            );

        buttons
            .each(function(d) {
                d3_select(this)
                    .call(svgIcon('#icon-' + d.button, 'pre-text'));
            });

        buttons
            .append('span')
            .attr('class', 'label')
            .text(function(mode) { return mode.title; });

        context
            .on('enter.editor', function(entered) {
                selection.selectAll('button.add-button')
                    .classed('active', function(mode) { return entered.button === mode.button; });
                context.container()
                    .classed('mode-' + entered.id, true);
            });

        context
            .on('exit.editor', function(exited) {
                context.container()
                    .classed('mode-' + exited.id, false);
            });

        var keybinding = d3_keybinding('mode-buttons');

        modes.forEach(function(mode) {
            keybinding.on(mode.key, function() {
                if (editable()) {
                    if (mode.id === context.mode().id) {
                        context.enter(modeBrowse(context));
                    } else {
                        context.enter(mode);
                    }
                }
            });
        });

        d3_select(document)
            .call(keybinding);


        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.modes', debouncedUpdate)
            .on('drawn.modes', debouncedUpdate);

        context
            .on('enter.modes', update);



        function update() {
            selection.selectAll('button.add-button')
                .property('disabled', !editable());
        }
    };
}
