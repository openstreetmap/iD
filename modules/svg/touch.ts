import type { SvgLayer } from './layers';

export function svgTouch(): SvgLayer {

    function drawTouch(selection: d3.Selection<SVGGElement>) {
        selection.selectAll('.layer-touch')
            .data(['areas', 'lines', 'points', 'turns', 'markers'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-touch ' + d; });
    }

    return drawTouch;
}
