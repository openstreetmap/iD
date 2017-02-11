import * as d3 from 'd3';

var timeout;


export function uiFlash() {
    var content = d3.select('#flash').selectAll('.content')
        .data([0]);

    content = content.enter()
        .append('div')
        .attr('class', 'content fillD')
        .merge(content);

    if (timeout) {
        window.clearTimeout(timeout);
    }

    timeout = window.setTimeout(function() {
        content
            .transition()
            .duration(250)
            .style('opacity', 0)
            .style('transform', 'scaleY(.1)')
            .on('end', function() {
                content.remove();
                timeout = null;
            });

        return true;
    }, 1500);


    return content;
}
