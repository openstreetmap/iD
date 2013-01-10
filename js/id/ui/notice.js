iD.notice = function(selection) {
    var message = '',
        notice = {};

    notice.message = function(_) {
        selection.attr('class', 'notice inner');
        if (!arguments.length) return _;
        if (!message && _) {
            selection
                .text(_)
                .transition()
                .style('display', 'auto');
        } else if (_ && message !== _) {
            selection.text(_);
        } else if (!_) {
            selection
                .text('')
                .transition()
                .style('display', 'none');
        }
        message = _;
        return notice;
    };

    return notice;
};
