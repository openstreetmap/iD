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

    var container = d3_select(null);

    tool.render = function(selection) {
        container = selection;
        var activeItem = tool.activeItem();

        var buttons = selection.selectAll('.bar-button')
            .data(tool.items, function(d) { return d.id; });

        buttons.exit()
            .remove();

        var buttonsEnter = buttons
            .enter()
            .append('button')
            .attr('class', function(d) {
                return 'bar-button ' + d.id;
            })
            .attr('tabindex', -1)
            .on('click', function(d) {
                var button = d3_select(this);
                if (button.classed('active') || button.classed('disabled')) return;

                setActiveItem(d);
            })
            .each(function(d) {
                var title = tool.key ? uiTooltipHtml(d.label, tool.key) : d.label;
                var tooltipBehavior = tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(title)
                    .scrollContainer(d3_select('#bar'));
                d3_select(this)
                    .call(tooltipBehavior)
                    .call(svgIcon('#' + d.icon, d.iconClass));
            });

        buttons = buttonsEnter.merge(buttons);

        buttons
            .classed('active', function(d) {
                return d === activeItem;
            })
            .classed('disabled', function(d) {
                if (tool.isItemEnabled) {
                    return !tool.isItemEnabled(d);
                }
                return false;
            });
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
        var active = tool.activeItem();

        var enabledItems = tool.items.slice().filter(function(item) {
            return item === active || !tool.isItemEnabled || tool.isItemEnabled(item);
        });

        if (enabledItems === 0 ||
            (enabledItems.length === 1 && enabledItems[0] === active)) return;

        var index = enabledItems.indexOf(active);
        if (index === enabledItems.length - 1) {
            index = 0;
        } else {
            index += 1;
        }

        setActiveItem(tool.items[index]);
    }

    tool.allowed = function() {
        if (tool.loadItems) tool.loadItems();
        return tool.items.length > 0;
    };

    tool.install = function() {
        if (tool.key) {
            context.keybinding()
                .on(tool.key, toggleItem, true);
        }
    };

    tool.uninstall = function() {
        if (tool.key) {
            context.keybinding()
                .off(tool.key, true);
        }
    };

    return tool;
}
