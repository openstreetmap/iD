import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';
import { event as d3_event } from 'd3-selection';

import { t } from '../util/locale';
import { modeSave } from '../modes';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiSave(context) {
    var history = context.history();
    var key = uiCmd('⌘S');
    var _numChanges = 0;


    return function(selection) {


        function isSaving() {
            var mode = context.mode();
            return mode && mode.id === 'save';
        }


        function isDisabled() {
            return _numChanges === 0 || isSaving();
        }


        function save() {
            d3_event.preventDefault();
            if (!context.inIntro() && !isSaving() && history.hasChanges()) {
                context.enter(modeSave(context));
            }
        }


        function bgColor() {
            var step;
            if (_numChanges === 0) {
                return null;
            } else if (_numChanges <= 50) {
                step = _numChanges / 50;
                return d3_interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
            } else {
                step = Math.min((_numChanges - 50) / 50, 1.0);
                return d3_interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
            }
        }


        function updateCount() {
            var val = history.difference().summary().length;
            if (val === _numChanges) return;
            _numChanges = val;

            tooltipBehavior
                .title(uiTooltipHtml(
                    t(_numChanges > 0 ? 'save.help' : 'save.no_changes'), key)
                );

            button
                .classed('disabled', isDisabled())
                .style('background', bgColor(_numChanges));

            button.select('span.count')
                .text(_numChanges);
        }


        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(uiTooltipHtml(t('save.no_changes'), key));

        var button = selection
            .append('button')
            .attr('class', 'save disabled')
            .attr('tabindex', -1)
            .on('click', save)
            .call(tooltipBehavior);

        button
            .call(svgIcon('#iD-icon-save'));

        button
            .append('span')
            .attr('class', 'label')
            .text(t('save.title'));

        button
            .append('span')
            .attr('class', 'count')
            .text('0');

        updateCount();


        context.keybinding()
            .on(key, save, true);

        context.history()
            .on('change.save', updateCount);

        context
            .on('enter.save', function() {
                button
                    .classed('disabled', isDisabled());

                if (isSaving()) {
                    button.call(tooltipBehavior.hide);
                }
            });
    };
}
