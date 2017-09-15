import * as d3 from 'd3';

var timer;

export function uiFlash(showDuration) {
    showDuration = showDuration || 1500;

    if (timer) {
        timer.stop();
    }

    d3.select('#footer-wrap')
        .attr('class', 'footer-hide');
    d3.select('#flash-wrap')
        .attr('class', 'footer-show');

    var content = d3.select('#flash-wrap').selectAll('.content')
        .data([0]);

    content = content.enter()
        .append('div')
        .attr('class', 'content')
        .merge(content);

    timer = d3.timeout(function() {
        timer = null;
        d3.select('#footer-wrap')
            .attr('class', 'footer-show');
        d3.select('#flash-wrap')
            .attr('class', 'footer-hide');
    }, showDuration);


    return content;
}
