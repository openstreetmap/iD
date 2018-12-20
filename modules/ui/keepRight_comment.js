import { t } from '../util/locale';


export function uiKeepRightComment() {
    var _error;

    function keepRightComment(selection) {
        if (!_error.comment) return;
        var comment = selection.selectAll('.comments-container')
            .data([0]);

        var comment_details = comment.enter()
            .append('div')
            .attr('class', 'kr_error-comment-container');

        comment_details
            .append('h4')
            .text(t('QA.keepRight.comment_header'));

        comment_details
            .append('div')
            .text(_error.comment);
    }

    keepRightComment.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightComment;
    };


    return keepRightComment;
}
