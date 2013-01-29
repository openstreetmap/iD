iD.ui.notice = function(selection) {
    var event = d3.dispatch('zoom'),
        message = '',
        notice = {};

    var div = selection.append('div')
        .attr('class', 'notice')
        .append('div')
        .attr('class', 'notice-inner');

    div.append('button')
        .attr('class', 'zoom-to')
        .on('click', function() {
            event.zoom();
        })
        .append('span')
        .attr('class', 'icon invert zoom-in');

    div.append('span')
        .attr('class', 'notice-text')
        .text(t('zoom_in_edit'));

    notice.message = function(_) {
        if (_) {
            selection.select('.button-wrap').style('display', 'none');
            div.style('display', 'block');
        } else {
            selection.select('.button-wrap').style('display', 'block');
            div.style('display', 'none');
        }
        return notice;
    };

    return d3.rebind(notice, event, 'on');
};
