import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';
import { utilFunctor } from '../../util/util';

export function uiToolSimpleButton(id, label, iconName, onClick, tooltipText, tooltipKey, barButtonClass) {

    var tool = {
        id: id,
        label: label,
        iconName: iconName,
        onClick: onClick,
        tooltipText: tooltipText,
        tooltipKey: tooltipKey,
        barButtonClass: barButtonClass
    };

    tool.render = function(selection) {

        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(uiTooltipHtml(utilFunctor(tool.tooltipText)(), utilFunctor(tool.tooltipKey)()));

        selection
            .selectAll('.bar-button')
            .data([0])
            .enter()
            .append('button')
            .attr('class', 'bar-button ' + (utilFunctor(tool.barButtonClass)() || ''))
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', tool.onClick)
            .call(svgIcon('#' + utilFunctor(tool.iconName)()));
    };

    return tool;
}
