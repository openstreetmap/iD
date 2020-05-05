import { svgIcon } from '../../svg/icon';
import { uiTooltip } from '../tooltip';
import { utilFunctor } from '../../util/util';

export function uiToolSimpleButton(context, protoTool) {

    var tool = protoTool || {};

    var tooltipBehavior = uiTooltip()
        .placement('bottom')
        .scrollContainer(context.container().select('.top-toolbar'));

    tool.render = function(selection) {

        tooltipBehavior
            .title(tool.tooltipText)
            .keys([utilFunctor(tool.tooltipKey)()]);

        var button = selection
            .selectAll('.bar-button')
            .data([0]);

        var buttonEnter = button
            .enter()
            .append('button')
            .attr('class', 'bar-button ' + (utilFunctor(tool.barButtonClass)() || ''))
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', tool.onClick)
            .call(svgIcon('#', utilFunctor(tool.iconClass)()));

        button = buttonEnter.merge(button);

        button.selectAll('.icon use')
            .attr('href', '#' + utilFunctor(tool.iconName)());
    };

    return tool;
}
