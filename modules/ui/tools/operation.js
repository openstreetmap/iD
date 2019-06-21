import {
    event as d3_event,
} from 'd3-selection';

import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolOperation() {

    var operation;

    var tool = {
        itemClass: 'operation'
    };

    var button,
        tooltipBehavior = tooltip()
        .placement('bottom')
        .html(true);

    tool.render = function(selection) {

        tooltipBehavior.title(uiTooltipHtml(operation.tooltip(), operation.keys[0]));

        button = selection
            .selectAll('.bar-button')
            .data([0]);

        var buttonEnter = button
            .enter()
            .append('button')
            .attr('class', 'bar-button wide')
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', function() {
                d3_event.stopPropagation();
                if (!operation || operation.disabled()) return;
                operation();
            })
            .call(svgIcon('#iD-operation-' + operation.id));

        button = buttonEnter.merge(button);

        button.classed('disabled', operation.disabled());
    };

    tool.setOperation = function(op) {
        operation = op;

        tool.id = operation.id;
        tool.label = operation.title;
    };

    tool.uninstall = function() {
        button = null;
        operation = null;
    };

    return tool;
}
