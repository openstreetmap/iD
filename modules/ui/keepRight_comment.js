import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { services } from '../services';
import { utilDetect } from '../util/detect';


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

    keepRightComment.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightComment;
    };


    return keepRightComment;
}
