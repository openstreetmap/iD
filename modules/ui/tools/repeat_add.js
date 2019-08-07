
import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolRepeatAdd(context) {

    var key = t('toolbar.repeat.key');

    var tool = {
        id: 'repeat_add',
        label: t('toolbar.repeat.title')
    };

    var button;

    var tooltipBehavior = tooltip()
        .placement('bottom')
        .html(true);

    tool.render = function(selection) {

        var mode = context.mode();
        var geom = mode.id.indexOf('point') !== -1 ? 'point' : 'way';

        tooltipBehavior.title(uiTooltipHtml(t('toolbar.repeat.tooltip.' + geom, { feature: '<strong>' + mode.title + '</strong>' }), key));

        button = selection
            .selectAll('.bar-button')
            .data([0]);

        button = button
            .enter()
            .append('button')
            .attr('class', 'bar-button wide')
            .classed('active', mode.repeatAddedFeature())
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', function() {
                toggleRepeat();
            })
            .call(svgIcon('#iD-icon-repeat'))
            .merge(button);
    };

    function toggleRepeat() {
        var mode = context.mode();
        mode.repeatAddedFeature(!mode.repeatAddedFeature());
        button.classed('active', mode.repeatAddedFeature());
    }

    tool.available = function() {
        var mode = context.mode();
        if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area') return true;
        return (mode.id === 'draw-line' || mode.id === 'draw-area') && !mode.isContinuing;
    };

    tool.install = function() {
        context.keybinding()
            .on(key, toggleRepeat, true);
    };

    tool.uninstall = function() {
        context.keybinding()
            .off(key, true);

        button = null;
    };

    return tool;
}
