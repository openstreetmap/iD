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


    function saving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }


    function save() {
        d3_event.preventDefault();
        if (!context.inIntro() && !saving() && history.hasChanges()) {
            context.enter(modeSave(context));
        }
    }


    function getBackground(numChanges) {
        var step;
        if (numChanges === 0) {
            return null;
        } else if (numChanges <= 50) {
            step = numChanges / 50;
            return d3_interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
        } else {
            step = Math.min((numChanges - 50) / 50, 1.0);
            return d3_interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
        }
    }


    return function(selection) {
        var numChanges = 0;

        function updateCount() {
            var _ = history.difference().summary().length;
            if (_ === numChanges) return;
            numChanges = _;

            tooltipBehavior
                .title(uiTooltipHtml(
                    t(numChanges > 0 ? 'save.help' : 'save.no_changes'), key)
                );

            var background = getBackground(numChanges);

            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0)
                .style('background', background);

            button.select('span.count')
                .text(numChanges);
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
                button.property('disabled', saving());
                if (saving()) button.call(tooltipBehavior.hide);
            });
    };
}
