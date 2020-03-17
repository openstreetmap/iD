import { select as d3_select } from 'd3-selection';
import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';
import { utilFunctor } from '../../util/util';

export function uiToolSimpleButton(protoTool) {

    var tool = protoTool || {};

    var tooltipBehavior = tooltip()
        .placement('bottom')
        .html(true)
        .scrollContainer(d3_select('#bar'));

    tool.render = function(selection) {

        tooltipBehavior.title(uiTooltipHtml(utilFunctor(tool.tooltipText)(), utilFunctor(tool.tooltipKey)()));

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
