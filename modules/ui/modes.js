import _debounce from 'lodash-es/debounce';

import { select as d3_select } from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeAddNote,
    modeBrowse
} from '../modes';

import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiModes(context) {
    var modes = [
        modeAddPoint(context),
        modeAddLine(context),
        modeAddArea(context),
        modeAddNote(context)
    ];


    function editable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function notesEditable() {
        var mode = context.mode();
        return context.map().notesEditable() && mode && mode.id !== 'save';
    }


    return function(selection) {
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

        modes.forEach(function(mode) {
            context.keybinding().on(mode.key, function() {
                if (mode.id === 'add-note' && !(notesEnabled() && notesEditable())) return;
                if (mode.id !== 'add-note' && !editable()) return;

                if (mode.id === context.mode().id) {
                    context.enter(modeBrowse(context));
                } else {
                    context.enter(mode);
                }
            });
        });


        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.modes', debouncedUpdate)
            .on('drawn.modes', debouncedUpdate);

        context
            .on('enter.modes', update);

        update();


        function update() {
            var showNotes = notesEnabled();
            var data = showNotes ? modes : modes.slice(0, 3);

            var buttons = selection.selectAll('button.add-button')
                .data(data, function(d) { return d.id; });

            // exit
            buttons.exit()
                .remove();

            // enter
            var buttonsEnter = buttons.enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d) { return d.id + ' add-button'; })
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
                .property('disabled', function(d) {
                    return d.id === 'add-note' ? !notesEditable() : !editable();
                });
        }
    };
}
