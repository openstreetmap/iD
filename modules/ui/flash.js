import * as d3 from 'd3';

var timer;

export function uiFlash(showDuration, fadeDuration) {
    showDuration = showDuration || 1500;
    fadeDuration = fadeDuration || 250;

    // d3.select('#flash').selectAll('.content')
    //     .interrupt();

    if (timer) {
        timer.stop();
    }

    d3.select('#footer-wrap')
        .attr('class', 'footer-hide');
    d3.select('#flash')
        .attr('class', 'footer-show');

    var content = d3.select('#flash').selectAll('.content')
        .data([0]);

    content = content.enter()
        .append('div')
        .attr('class', 'content')
        .merge(content);

    timer = d3.timeout(function() {
        timer = null;
        d3.select('#footer-wrap')
            .attr('class', 'footer-show');
        d3.select('#flash')
            .attr('class', 'footer-hide');
    }, showDuration);


    // content
    //     .transition()
    //     .delay(showDuration)
    //     .duration(fadeDuration)
    //     .style('opacity', 0)
    //     .style('transform', 'scaleY(.1)')
    //     .on('interrupt end', function() {
    //         content.remove();
    //         d3.select('#footer-wrap')
    //             .attr('class', 'footer-show');
    //     });

    return content;
}
