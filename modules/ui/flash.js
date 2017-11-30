import { select as d3_select } from 'd3-selection';
import { timeout as d3_timeout } from 'd3-timer';

var timer;


export function uiFlash(showDuration) {
    showDuration = showDuration || 1500;

    if (timer) {
        timer.stop();
    }

    d3_select('#footer-wrap')
        .attr('class', 'footer-hide');
    d3_select('#flash-wrap')
        .attr('class', 'footer-show');

    var content = d3_select('#flash-wrap').selectAll('.content')
        .data([0]);

    content = content.enter()
        .append('div')
        .attr('class', 'content')
        .merge(content);

    timer = d3_timeout(function() {
        timer = null;
        d3_select('#footer-wrap')
            .attr('class', 'footer-show');
        d3_select('#flash-wrap')
            .attr('class', 'footer-hide');
    }, showDuration);


    return content;
}
