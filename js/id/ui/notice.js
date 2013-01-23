iD.ui.notice = function(selection) {
    var message = '',
        notice = {};

    var div = selection.append('div')
        .attr('class', 'notice')
        .style('display', 'none');

    var txt = div.append('div')
        .attr('class', 'notice-text');

    function replace(a, b) {
        a.style('opacity', 1)
            .transition()
            .each('end', function() {
                a.style('display', 'none');
                b.style('display', 'inline-block')
                    .style('opacity', 0)
                    .transition()
                    .style('opacity', 1);
            })
            .style('opacity', 0);
    }

    notice.message = function(_) {
        div.attr('class', 'notice inner');
        if (!arguments.length) return _;
        if (!message && _) {
            txt.text(_);
            replace(selection.select('.button-wrap'), div);
        } else if (_ && message !== _) {
            txt.text(_);
            selection.select('.button-wrap').style('display', 'none');
        } else if (!_) {
            txt.text('');
            if (message) {
                replace(div, selection.select('.button-wrap'));
            }
        }
        message = _;
        return notice;
    };

    return notice;
};
