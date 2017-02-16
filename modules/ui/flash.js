import * as d3 from 'd3';


export function uiFlash(showDuration, fadeDuration) {
    showDuration = showDuration || 1500;
    fadeDuration = fadeDuration || 250;

    d3.select('#flash').selectAll('.content')
        .interrupt();

    var content = d3.select('#flash').selectAll('.content')
        .data([0]);

    content = content.enter()
        .append('div')
        .attr('class', 'content fillD')
        .merge(content);

    content
        .transition()
        .delay(showDuration)
        .duration(fadeDuration)
        .style('opacity', 0)
        .style('transform', 'scaleY(.1)')
        .on('interrupt end', function() {
            content.remove();
        });

    return content;
}
