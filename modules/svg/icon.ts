import { type BaseType } from 'd3';

export function svgIcon<T extends BaseType = HTMLElement>(name: string, svgklass: string, useklass?: string) {
    return function drawIcon(selection: d3.Selection<T>) {
        selection.selectAll('svg.icon' + (svgklass ? '.' + svgklass.split(' ')[0] : ''))
            .data([0])
            .enter()
            .append('svg')
            .attr('class', 'icon ' + (svgklass || ''))
            .append('use')
            .attr('xlink:href', name)
            .attr('class', useklass!);
    };
}
