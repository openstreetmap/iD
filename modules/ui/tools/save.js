import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';
import { event as d3_event, select as d3_select } from 'd3-selection';
import { t } from '../../util/locale';
import { modeSave } from '../../modes';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';


export function uiToolSave(context) {

    var tool = {
        id: 'save',
        label: t('save.title'),
        userToggleable: false
    };

    var button = null;
    var tooltipBehavior = tooltip()
        .placement('bottom')
        .html(true)
        .title(uiTooltipHtml(t('save.no_changes'), key))
        .scrollContainer(d3_select('#bar'));
    var history = context.history();
    var key = uiCmd('⌘S');
    var _numChanges;

    function isSaving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }

    function isDisabled() {
        return !_numChanges || isSaving();
    }

    function save() {
        d3_event.preventDefault();
        if (!context.inIntro() && !isSaving() && history.hasChanges()) {
            context.enter(modeSave(context));
        }
    }

    function bgColor(count) {
        var step;
        if (count === 0) {
            return null;
        } else if (count <= 50) {
            step = count / 50;
            return d3_interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
        } else {
            step = Math.min((count - 50) / 50, 1.0);
            return d3_interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
        }
    }


    function updateCount() {
        var val = history.difference().summary().length;
        if (val === _numChanges) return;
        _numChanges = val;

        if (tooltipBehavior) {
            tooltipBehavior
                .title(uiTooltipHtml(
                    t(val > 0 ? 'save.help' : 'save.no_changes'), key)
                );
        }

        if (button) {
            button
                .classed('disabled', isDisabled())
                .style('background', bgColor(val));

            button.select('span.count')
                .text(val);
        }
    }


    tool.render = function(selection) {

        button = selection
            .selectAll('.bar-button')
            .data([0]);

        var buttonEnter = button
            .enter()
            .append('button')
            .attr('class', 'save disabled bar-button')
            .on('click', save)
            .call(tooltipBehavior);

        buttonEnter
            .call(svgIcon('#iD-icon-save'));

        buttonEnter
            .append('span')
            .attr('class', 'count')
            .attr('aria-hidden', 'true')
            .text('0');

        button = buttonEnter.merge(button);

        updateCount();
    };

    var disallowedModes = new Set([
        'save',
        'add-point',
        'add-line',
        'add-area',
        'draw-line',
        'draw-area'
    ]);

    tool.allowed = function() {
        return !disallowedModes.has(context.mode().id);
    };

    tool.install = function() {
        context.keybinding()
            .on(key, save, true);

        context.history()
            .on('change.save', updateCount);

        context
            .on('enter.save', function() {
                if (button) {
                    button
                        .classed('disabled', isDisabled());

                    if (isSaving()) {
                        button.call(tooltipBehavior.hide);
                    }
                }
            });
    };


    tool.uninstall = function() {

        _numChanges = null;

        context.keybinding()
            .off(key, true);

        context.history()
            .on('change.save', null);

        context
            .on('enter.save', null);

        button = null;
    };

    return tool;
}
