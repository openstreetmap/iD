import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { utilSetTransform } from '../util';
import { utilGetDimensions } from '../util/dimensions';


export function behaviorTail() {
    var text,
        container,
        xmargin = 25,
        tooltipSize = [0, 0],
        selectionSize = [0, 0];


    function tail(selection) {
        if (!text) return;

        d3_select(window)
            .on('resize.tail', function() { selectionSize = utilGetDimensions(selection); });

        container = d3_select(document.body)
            .append('div')
            .style('display', 'none')
            .attr('class', 'tail tooltip-inner');

        container.append('div')
            .text(text);

        selection
            .on('mousemove.tail', mousemove)
            .on('mouseenter.tail', mouseenter)
            .on('mouseleave.tail', mouseleave);

        container
            .on('mousemove.tail', mousemove);

        tooltipSize = utilGetDimensions(container);
        selectionSize = utilGetDimensions(selection);


        function show() {
            container.style('display', 'block');
            tooltipSize = utilGetDimensions(container);
        }


        function mousemove() {
            if (container.style('display') === 'none') show();
            var xoffset = ((d3_event.clientX + tooltipSize[0] + xmargin) > selectionSize[0]) ?
                -tooltipSize[0] - xmargin : xmargin;
            container.classed('left', xoffset > 0);
            utilSetTransform(container, d3_event.clientX + xoffset, d3_event.clientY);
        }


        function mouseleave() {
            if (d3_event.relatedTarget !== container.node()) {
                container.style('display', 'none');
            }
        }


        function mouseenter() {
            if (d3_event.relatedTarget !== container.node()) {
                show();
            }
        }
    }


    tail.off = function(selection) {
        if (!text) return;

        container
            .on('mousemove.tail', null)
            .remove();

        selection
            .on('mousemove.tail', null)
            .on('mouseenter.tail', null)
            .on('mouseleave.tail', null);

        d3_select(window)
            .on('resize.tail', null);
    };


    tail.text = function(_) {
        if (!arguments.length) return text;
        text = _;
        return tail;
    };


    return tail;
}
