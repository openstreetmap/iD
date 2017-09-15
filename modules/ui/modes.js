import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../modes/index';

import { svgIcon } from '../svg/index';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiModes(context) {
    var modes = [
        modeAddPoint(context),
        modeAddLine(context),
        modeAddArea(context)
    ];


    function editable() {
        return context.editable() && context.mode().id !== 'save';
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

        context.map()
            .on('move.modes', _.debounce(update, 500));

        context
            .on('enter.modes', update);

        buttons
            .each(function(d) {
                d3.select(this)
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

        var keybinding = d3keybinding('mode-buttons');

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

        d3.select(document)
            .call(keybinding);


        function update() {
            selection.selectAll('button.add-button')
                .property('disabled', !editable());
        }
    };
}
