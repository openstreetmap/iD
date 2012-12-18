iD.notice = function(selection) {
    var message = '',
        notice = {};

    notice.message = function(_) {
        selection.attr('class','inner')
        if (!arguments.length) return _;
        if (!message && _) {
            selection
                .text(_)
                .transition()
                .style('opacity', 1);
        } else if (_ && message !== _) {
            selection.text(_);
        } else if (!_) {
            selection
                .text('')
                .transition()
                .style('opacity', 0);
        }
        message = _;
        return notice;
    };

    return notice;
};
