import { t } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiTooltip } from '../tooltip';

export function uiToolRepeatAdd(context) {

    var key = t('toolbar.repeat.key');

    var tool = {
        id: 'repeat_add',
        label: t('toolbar.repeat.title'),
        iconName: 'iD-icon-repeat'
    };

    var button;

    var tooltipBehavior = uiTooltip()
        .placement('bottom')
        .keys([key])
        .scrollContainer(context.container().select('.top-toolbar'));

    tool.render = function(selection) {

        var mode = context.mode();
        var geom = mode.id.indexOf('point') !== -1 ? 'point' : 'way';

        tooltipBehavior.title(t('toolbar.repeat.tooltip.' + geom, {
            feature: '<strong>' + mode.title + '</strong>'
        }));

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
            .call(svgIcon('#' + tool.iconName))
            .merge(button);
    };

    function toggleRepeat() {
        var mode = context.mode();
        mode.repeatAddedFeature(!mode.repeatAddedFeature());
        button.classed('active', mode.repeatAddedFeature());
    }

    tool.allowed = function() {
        var mode = context.mode();
        if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area') return true;
        return (mode.id === 'draw-line' || mode.id === 'draw-area') && !mode.isContinuing();
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
