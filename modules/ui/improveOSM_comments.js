import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { services } from '../services';
import { utilDetect } from '../util/detect';

export function uiImproveOsmComments() {
    var _error;


    function errorComments(selection) {
        // make the div immediately so it appears above the buttons
        var comments = selection.selectAll('.comments-container')
            .data([0]);

        comments = comments.enter()
            .append('div')
            .attr('class', 'comments-container')
            .merge(comments);

        // must retrieve comments from API before they can be displayed
        services.improveOSM.getComments(_error, function(err, d) {
            if (!d.comments) { return; } // nothing to do here

            var commentEnter = comments.selectAll('.comment')
                .data(d.comments)
                .enter()
                .append('div')
                .attr('class', 'comment');

            commentEnter
                .append('div')
                .attr('class', 'comment-avatar')
                .call(svgIcon('#iD-icon-avatar', 'comment-avatar-icon'));

            var mainEnter = commentEnter
                .append('div')
                .attr('class', 'comment-main');

            var metadataEnter = mainEnter
                .append('div')
                .attr('class', 'comment-metadata');

            metadataEnter
                .append('div')
                .attr('class', 'comment-author')
                .each(function(d) {
                    var selection = d3_select(this);
                    var osm = services.osm;
                    if (osm && d.username) {
                        selection = selection
                            .append('a')
                            .attr('class', 'comment-author-link')
                            .attr('href', osm.userURL(d.username))
                            .attr('tabindex', -1)
                            .attr('target', '_blank');
                    }
                    selection
                        .text(function(d) { return d.username; });
                });

            metadataEnter
                .append('div')
                .attr('class', 'comment-date')
                .text(function(d) {
                    return t('note.status.commented', { when: localeDateString(d.timestamp) });
                });

            mainEnter
                .append('div')
                .attr('class', 'comment-text')
                .append('p')
                .text(function(d) { return d.text; });
        });
    }

    function localeDateString(s) {
        if (!s) return null;
        var detected = utilDetect();
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        var d = new Date(s * 1000); // timestamp is served in seconds, date takes ms
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }

    errorComments.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return errorComments;
    };

    return errorComments;
}
