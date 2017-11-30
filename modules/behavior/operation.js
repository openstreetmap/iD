import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { uiFlash } from '../ui';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation() {
    var which, keybinding;


    function drawIcon(selection) {
        var button = selection
            .append('svg')
            .attr('class', 'operation-icon')
            .append('g')
            .attr('class', 'radial-menu-item radial-menu-item-' + which.id)
            .attr('transform', 'translate(10,10)')
            .classed('disabled', which.disabled());

        button
            .append('circle')
            .attr('r', 9);

        button
            .append('use')
            .attr('transform', 'translate(-7,-7)')
            .attr('width', '14')
            .attr('height', '14')
            .attr('xlink:href', '#operation-' + which.id);

        return selection;
    }


    var behavior = function () {
        if (which && which.available()) {
            keybinding = d3_keybinding('behavior.key.' + which.id);
            keybinding.on(which.keys, function() {
                d3_event.preventDefault();
                var disabled = which.disabled();

                if (disabled) {
                    uiFlash(3000)
                        .html('')
                        .call(drawIcon)
                        .append('div')
                        .attr('class', 'operation-tip')
                        .text(which.tooltip);

                } else {
                    uiFlash(1500)
                        .html('')
                        .call(drawIcon)
                        .append('div')
                        .attr('class', 'operation-tip')
                        .text(which.annotation() || which.title);

                    which();
                }
            });
            d3_select(document).call(keybinding);
        }
        return behavior;
    };


    behavior.off = function() {
        if (keybinding) {
            d3_select(document).call(keybinding.off);
        }
    };


    behavior.which = function (_) {
        if (!arguments.length) return which;
        which = _;
        return behavior;
    };


    return behavior;
}
