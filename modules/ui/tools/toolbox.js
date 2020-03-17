import {
    event as d3_event,
    select as d3_select,
} from 'd3-selection';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { tooltip } from '../../util/tooltip';
import { popover } from '../../util/popover';
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
        list = d3_select(null),
        poplist = popover('poplist fillL')
            .displayType('clickFocus')
            .placement('bottom')
            .alignment('leading')
            .hasArrow(false)
            .scrollContainer(d3_select('#bar'));

    tool.render = function(selection) {

        button = selection.selectAll('.bar-button')
            .data([0]);

        var buttonEnter = button
            .enter()
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .call(poplist)
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(t('toolbar.toolbox.tooltip'))
                .scrollContainer(d3_select('#bar'))
            )
            .call(svgIcon('#fas-toolbox'));

        buttonEnter
            .append('span')
            .call(svgIcon('#iD-icon-down', 'disclosure-icon'));

        button = buttonEnter.merge(button);

        updateToolList();
    };

    poplist.content(function() {
        return function(selection) {

            var poplistContent = selection.selectAll('.poplist-content')
                .data([0]);

            var poplistEnter = poplistContent.enter()
                .append('div')
                .attr('class', 'poplist-content')
                .on('mousedown', function() {
                    // don't blur the search input (and thus close results)
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                });

            poplistEnter
                .append('div')
                .attr('class', 'list');

            poplistContent = poplistContent.merge(poplistEnter);

            list = poplistContent.select('.list');

            updateToolList();
        };
    });

    function updateToolList() {

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
                list.selectAll('.list .list-item.focused')
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
                d3_event.preventDefault();
                d3_event.stopPropagation();

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
