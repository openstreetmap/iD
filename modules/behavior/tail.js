import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { utilSetTransform } from '../util';
import { utilGetDimensions } from '../util/dimensions';


export function behaviorTail() {
    var container;
    var xmargin = 25;
    var tooltipSize = [0, 0];
    var selectionSize = [0, 0];
    var _text;


    function behavior(selection) {
        if (!_text) return;

        d3_select(window)
            .on('resize.tail', function() { selectionSize = utilGetDimensions(selection); });

        container = d3_select(document.body)
            .append('div')
            .style('display', 'none')
            .attr('class', 'tail tooltip-inner');

        container.append('div')
            .text(_text);

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


    behavior.off = function(selection) {
        if (!_text) return;

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


    behavior.text = function(val) {
        if (!arguments.length) return _text;
        _text = val;
        return behavior;
    };


    return behavior;
}
