import * as d3 from 'd3';
import { setTransform } from '../util/index';
import { getDimensions } from '../util/dimensions';
export function Tail() {
    var text,
        container,
        xmargin = 25,
        tooltipSize = [0, 0],
        selectionSize = [0, 0];

    function tail(selection) {
        if (!text) return;

        d3.select(window)
            .on('resize.tail', function() { selectionSize = getDimensions(selection); });

        function show() {
            container.style('display', 'block');
            tooltipSize = getDimensions(container);
        }

        function mousemove() {
            if (container.style('display') === 'none') show();
            var xoffset = ((d3.event.clientX + tooltipSize[0] + xmargin) > selectionSize[0]) ?
                -tooltipSize[0] - xmargin : xmargin;
            container.classed('left', xoffset > 0);
            setTransform(container, d3.event.clientX + xoffset, d3.event.clientY);
        }

        function mouseleave() {
            if (d3.event.relatedTarget !== container.node()) {
                container.style('display', 'none');
            }
        }

        function mouseenter() {
            if (d3.event.relatedTarget !== container.node()) {
                show();
            }
        }

        container = d3.select(document.body)
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

        tooltipSize = getDimensions(container);
        selectionSize = getDimensions(selection);
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

        d3.select(window)
            .on('resize.tail', null);
    };

    tail.text = function(_) {
        if (!arguments.length) return text;
        text = _;
        return tail;
    };

    return tail;
}
