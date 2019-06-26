import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolSimpleButton(id, label, iconName, onClick, tooltipText, tooltipKey, klass) {

    var tool = {
        id: id,
        label: label
    };

    var tooltipBehavior = tooltip()
        .placement('bottom')
        .html(true)
        .title(uiTooltipHtml(tooltipText, tooltipKey));

    tool.render = function(selection) {
        selection
            .selectAll('.bar-button')
            .data([0])
            .enter()
            .append('button')
            .attr('class', 'bar-button ' + (klass || ''))
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', onClick)
            .call(svgIcon('#' + iconName));
    };

    return tool;
}
