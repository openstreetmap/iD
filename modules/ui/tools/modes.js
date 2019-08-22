import _debounce from 'lodash-es/debounce';

import { select as d3_select } from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../../modes';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg';
import { tooltip } from '../../util/tooltip';
import { uiTooltipHtml } from '../tooltipHtml';

export function uiToolOldDrawModes(context) {

    var tool = {
        id: 'old_modes',
        label: t('toolbar.add_feature')
    };

    var modes = [
        modeAddPoint(context, {
            title: t('modes.add_point.title'),
            button: 'point',
            description: t('modes.add_point.description'),
            preset: context.presets().item('point'),
            key: '1'
        }),
        modeAddLine(context, {
            title: t('modes.add_line.title'),
            button: 'line',
            description: t('modes.add_line.description'),
            preset: context.presets().item('line'),
            key: '2'
        }),
        modeAddArea(context, {
            title: t('modes.add_area.title'),
            button: 'area',
            description: t('modes.add_area.description'),
            preset: context.presets().item('area'),
            key: '3'
        })
    ];


    function enabled() {
        return osmEditable();
    }

    function osmEditable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }

    modes.forEach(function(mode) {
        context.keybinding().on(mode.key, function() {
            if (!enabled(mode)) return;

            if (mode.id === context.mode().id) {
                context.enter(modeBrowse(context));
            } else {
                context.enter(mode);
            }
        });
    });

    tool.render = function(selection) {

        var wrap = selection
            .append('div')
            .attr('class', 'joined')
            .style('display', 'flex');

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


        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.modes', debouncedUpdate)
            .on('drawn.modes', debouncedUpdate);

        context
            .on('enter.modes', update);

        update();


        function update() {

            var buttons = wrap.selectAll('button.add-button')
                .data(modes, function(d) { return d.id; });

            // exit
            buttons.exit()
                .remove();

            // enter
            var buttonsEnter = buttons.enter()
                .append('button')
                .attr('class', function(d) { return d.id + ' add-button bar-button'; })
                .on('click.mode-buttons', function(d) {
                    if (!enabled(d)) return;

                    // When drawing, ignore accidental clicks on mode buttons - #4042
                    var currMode = context.mode().id;
                    if (/^draw/.test(currMode)) return;

                    if (d.id === currMode) {
                        context.enter(modeBrowse(context));
                    } else {
                        context.enter(d);
                    }
                })
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function(d) { return uiTooltipHtml(d.description, d.key); })
                );

            buttonsEnter
                .each(function(d) {
                    d3_select(this)
                        .call(svgIcon('#iD-icon-' + d.button));
                });

            buttonsEnter
                .append('span')
                .attr('class', 'label')
                .text(function(mode) { return mode.title; });

            // if we are adding/removing the buttons, check if toolbar has overflowed
            if (buttons.enter().size() || buttons.exit().size()) {
                context.ui().checkOverflow('#bar', true);
            }

            // update
            buttons = buttons
                .merge(buttonsEnter)
                .classed('disabled', function(d) { return !enabled(d); });
        }
    };

    return tool;
}
