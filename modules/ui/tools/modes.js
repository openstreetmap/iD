import _debounce from 'lodash-es/debounce';

import { select as d3_select } from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../../modes';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiTooltip } from '../tooltip';

export function uiToolDrawModes(context) {

    var tool = {
        id: 'old_modes',
        label: t.append('toolbar.add_feature')
    };

    var modes = [
        modeAddPoint(context, {
            title: t.append('modes.add_point.title'),
            button: 'point',
            description: t.append('modes.add_point.description'),
            preset: presetManager.item('point'),
            key: '1'
        }),
        modeAddLine(context, {
            title: t.append('modes.add_line.title'),
            button: 'line',
            description: t.append('modes.add_line.description'),
            preset: presetManager.item('line'),
            key: '2'
        }),
        modeAddArea(context, {
            title: t.append('modes.add_area.title'),
            button: 'area',
            description: t.append('modes.add_area.description'),
            preset: presetManager.item('area'),
            key: '3'
        })
    ];


    function enabled(
        // eslint-disable-next-line no-unused-vars
        _mode // parameter is currently not used, but might be at some point
    ) {
        return osmEditable();
    }

    function osmEditable() {
        return context.editable();
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
                .on('click.mode-buttons', function(d3_event, d) {
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
                .call(uiTooltip()
                    .placement('bottom')
                    .title(function(d) { return d.description; })
                    .keys(function(d) { return [d.key]; })
                    .scrollContainer(context.container().select('.top-toolbar'))
                );

            buttonsEnter
                .each(function(d) {
                    d3_select(this)
                        .call(svgIcon('#iD-icon-' + d.button));
                });

            buttonsEnter
                .append('span')
                .attr('class', 'label')
                .text('')
                .each(function(mode) { mode.title(d3_select(this)); });

            // if we are adding/removing the buttons, check if toolbar has overflowed
            if (buttons.enter().size() || buttons.exit().size()) {
                context.ui().checkOverflow('.top-toolbar', true);
            }

            // update
            buttons = buttons
                .merge(buttonsEnter)
                .attr('aria-disabled', function(d) { return !enabled(d); })
                .classed('disabled', function(d) { return !enabled(d); })
                .attr('aria-pressed', function(d) { return context.mode() && context.mode().button === d.button; })
                .classed('active', function(d) { return context.mode() && context.mode().button === d.button; });
        }
    };

    return tool;
}
