import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { svgIcon } from '../svg';


export function uiModal(selection, blocking) {
    var keybinding = d3_keybinding('modal');
    var previous = selection.select('div.modal');
    var animate = previous.empty();

    previous.transition()
        .duration(200)
        .style('opacity', 0)
        .remove();

    var shaded = selection
        .append('div')
        .attr('class', 'shaded')
        .style('opacity', 0);

    shaded.close = function() {
        shaded
            .transition()
            .duration(200)
            .style('opacity',0)
            .remove();

        modal
            .transition()
            .duration(200)
            .style('top','0px');

        keybinding.off();
    };


    var modal = shaded
        .append('div')
        .attr('class', 'modal fillL col6');

    if (!blocking) {
        shaded.on('click.remove-modal', function() {
            if (d3_event.target === this) {
                shaded.close();
            }
        });

        modal.append('button')
            .attr('class', 'close')
            .on('click', shaded.close)
            .call(svgIcon('#icon-close'));

        keybinding
            .on('⌫', shaded.close)
            .on('⎋', shaded.close);

        d3_select(document)
            .call(keybinding);
    }

    modal
        .append('div')
        .attr('class', 'content');

    if (animate) {
        shaded.transition().style('opacity', 1);
    } else {
        shaded.style('opacity', 1);
    }


    return shaded;
}
