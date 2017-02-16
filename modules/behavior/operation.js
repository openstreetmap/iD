import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { uiFlash } from '../ui';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var which, keybinding;


    function drawIcon(selection) {
        var button = selection
            .append('svg')
            .attr('class', 'operation-icon')
            .append('g')
            .attr('class', 'radial-menu-item radial-menu-item-' + which.id)
            .attr('transform', 'translate(18,18)')
            .classed('disabled', which.disabled());

        button
            .append('circle')
            .attr('r', 15);

        button
            .append('use')
            .attr('transform', 'translate(-10,-10)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', '#operation-' + which.id);

        return selection;
    }


    var behavior = function () {
        if (which && which.available() && !context.inIntro()) {
            keybinding = d3keybinding('behavior.key.' + which.id);
            keybinding.on(which.keys, function() {
                d3.event.preventDefault();
                var disabled = which.disabled();

                if (disabled) {
                    uiFlash(2500, 500)
                        .html('')
                        .call(drawIcon)
                        .append('div')
                        .attr('class', 'operation-tip')
                        .text(which.tooltip);

                } else {
                    uiFlash(1500, 250)
                        .html('')
                        .call(drawIcon)
                        .append('div')
                        .attr('class', 'operation-tip')
                        .text(which.annotation() || which.title);

                    which();
                }
            });
            d3.select(document).call(keybinding);
        }
        return behavior;
    };


    behavior.off = function() {
        if (keybinding) {
            d3.select(document).call(keybinding.off);
        }
    };


    behavior.which = function (_) {
        if (!arguments.length) return which;
        which = _;
        return behavior;
    };


    return behavior;
}
