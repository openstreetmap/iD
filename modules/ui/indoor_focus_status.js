import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


/**
 * A small, read-only status line in the top left corner of the map which
 * explains that features on other levels are currently dimmed because an
 * indoor feature is selected, see #12605.
 */
export function uiIndoorFocusStatus(context) {

    return function(selection) {
        var status = selection
            .append('div')
            .attr('class', 'indoor-focus-status hide')
            .attr('aria-live', 'polite');

        status
            .call(svgIcon('#iD-icon-layers', 'pre-text'));

        var label = status
            .append('span')
            .attr('class', 'label');


        function update(focus) {
            focus = focus || context.map().indoorFocusStatus();

            status.classed('hide', !focus.active);
            if (!focus.active) return;

            var targets = [];
            if (focus.levels.length) {
                targets.push(t('indoor_focus.level', { levels: focus.levels.join('; '), count: focus.levels.length }));
            }
            if (focus.layers.length) {
                targets.push(t('indoor_focus.layer', { layers: focus.layers.join('; '), count: focus.layers.length }));
            }
            label.text(t('indoor_focus.status', { target: targets.join(', ') }));
        }

        context.map()
            .on('changeIndoorFocus.indoor-focus-status', update);

        update();
    };
}
