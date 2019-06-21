import {
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../../svg/icon';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolSegemented(context) {

    var tool = {
        contentClass: 'joined'
    };

    tool.items = [];

    // populate the items array
    tool.loadItems = function() {
        // override in subclass
    };

    // set the active item
    tool.chooseItem = function(/* item */) {
        // override in subclass
    };

    // return the chosen item
    tool.activeItem = function() {
        // override in subclass
    };

    tool.shouldShow = function() {
        tool.loadItems();
        return tool.items.length > 1;
    };

    var container = d3_select(null);

    tool.render = function(selection) {
        container = selection;
        var active = tool.activeItem();

        var buttons = selection.selectAll('.bar-button')
            .data(tool.items)
            .enter();

        buttons
            .append('button')
            .attr('class', function(d) {
                return 'bar-button ' + d.id + ' ' + (d === active ? 'active' : '');
            })
            .attr('tabindex', -1)
            .on('click', function(d) {
                if (d3_select(this).classed('active')) return;

                setActiveItem(d);
            })
            .each(function(d) {
                var tooltipBehavior = tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(uiTooltipHtml(d.label, tool.key));
                d3_select(this)
                    .call(tooltipBehavior)
                    .call(svgIcon('#' + d.icon, 'icon-30'));
            });

        if (tool.key) {
            context.keybinding()
                .on(tool.key, toggleItem, true);
        }
    };

    function setActiveItem(d) {
        tool.chooseItem(d);
        setButtonStates();
    }

    function setButtonStates() {
        container.selectAll('.bar-button.active')
            .classed('active', false);
        container.selectAll('.bar-button.' + tool.activeItem().id)
            .classed('active', true);
    }

    function toggleItem() {
        if (tool.items.length === 0) return;

        var active = tool.activeItem();
        var index = tool.items.indexOf(active);
        if (index === tool.items.length - 1) {
            index = 0;
        } else {
            index += 1;
        }

        setActiveItem(tool.items[index]);
    }

    tool.uninstall = function() {
        if (tool.key) {
            context.keybinding()
                .off(tool.key, true);
        }
    };

    return tool;
}
