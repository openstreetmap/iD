import {
    event as d3_event,
    select as d3_select,
} from 'd3-selection';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { tooltip } from '../../util/tooltip';
import { utilFunctor } from '../../util/util';

export function uiToolToolbox(context) {

    var tool = {
        id: 'toolbox',
        label: t('toolbar.toolbox.title'),
        itemClass: 'disclosing',
        userToggleable: false
    };

    var allowedTools = [];

    var button = d3_select(null),
        popover = d3_select(null);

    tool.render = function(selection) {

        button = selection.selectAll('.bar-button')
            .data([0]);

        var buttonEnter = button
            .enter()
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .on('mousedown', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('mouseup', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('click', function() {
                if (button.classed('disabled')) return;

                var isOpening = !button.classed('active');

                if (isOpening) {
                    button.classed('active', true);
                    selection.call(renderPopover);
                    popover.node().focus();
                } else {
                    popover.node().blur();
                }
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(t('toolbar.toolbox.tooltip'))
            )
            .call(svgIcon('#fas-toolbox'));

        buttonEnter
            .append('span')
            .call(svgIcon('#iD-icon-down', 'disclosure-icon'));

        button = buttonEnter.merge(button);

        updateToolList();
    };

    function renderPopover(selection) {
        popover = selection.selectAll('.popover')
            .data([0]);

        var popoverEnter = popover
            .enter()
            .append('div')
            .attr('class', 'tool-browser popover fillL')
            .attr('tabindex', '0')
            .on('blur', function() {
                button.classed('active', false);
                popover.remove();
            });

        popoverEnter
            .append('div')
            .attr('class', 'popover-content')
            .on('mousedown', function() {
                // don't blur the search input (and thus close results)
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .append('div')
            .attr('class', 'list');

        popover = popoverEnter.merge(popover);

        updateToolList();
    }

    function updateToolList() {

        var list = popover.selectAll('.list');

        if (list.empty()) return;

        var items = list.selectAll('.list-item')
            .data(allowedTools, function(d) { return d.id; });

        items.order();

        items.exit()
            .remove();

        var itemsEnter = items.enter()
            .append('div')
            .attr('class', 'list-item')
            .on('mouseover', function() {
                popover.selectAll('.list .list-item.focused')
                    .classed('focused', false);
                d3_select(this)
                    .classed('focused', true);
            })
            .on('mouseout', function() {
                d3_select(this)
                    .classed('focused', false);
            });

        var row = itemsEnter.append('div')
            .attr('class', 'row');

        row.append('button')
            .attr('class', 'choose')
            .on('click', function(d) {
                d.isToggledOn = !(d.isToggledOn !== false);
                context.storage('tool.' + d.id + '.toggledOn', d.isToggledOn);
                updateToolList();
                if (tool.onChange) tool.onChange();
            });

        row.each(function(d) {
            if (d.iconName) {
                d3_select(this).call(
                    svgIcon('#' + (utilFunctor(d.toolboxIconName)() || utilFunctor(d.iconName)()), 'item-icon ' + (d.iconClass || ''))
                );
            }
        });

        row.append('div')
            .attr('class', 'label')
            .text(function(d) {
                return utilFunctor(d.toolboxLabel)() || utilFunctor(d.label)();
            });

        row.append('div')
            .attr('class', 'accessory')
            .each(function() {
                d3_select(this).call(
                    svgIcon('#iD-icon-apply', 'checkmark')
                );
            });

        items = itemsEnter.merge(items);

        items.selectAll('.accessory')
            .classed('hide', function(d) {
                return d.isToggledOn === false;
            });
    }

    tool.setAllowedTools = function(newItems) {
        allowedTools = newItems.filter(function(item) {
            return typeof item === 'object' && item.userToggleable !== false;
        });

        allowedTools.forEach(function(d) {
            var isToggledOn = context.storage('tool.' + d.id + '.toggledOn');
            if (isToggledOn !== null) {
                d.isToggledOn = isToggledOn === 'true';
            }
        });
    };

    return tool;
}
