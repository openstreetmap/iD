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

        comment = comment.enter()
            .append('div')
            .attr('class', 'comments-container')
            .merge(comment);

        var commentEnter = comment.selectAll('.comment')
            .data(_error.comment)
            .enter()
            .append('div')
            .attr('class', 'comment');

        commentEnter
            .append('div')
            .attr('class', function(d) { return 'comment-avatar user-' + d.uid; })
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
                if (osm && d.user) {
                    selection = selection
                        .append('a')
                        .attr('class', 'comment-author-link')
                        .attr('href', osm.userURL(d.user))
                        .attr('tabindex', -1)
                        .attr('target', '_blank');
                }
                selection
                    .text(function(d) { return d.user || t('note.anonymous'); });
            });

        metadataEnter
            .append('div')
            .attr('class', 'comment-date')
            .text(function(d) { return d.action + ' ' + localeDateString(d.date); });

        mainEnter
            .append('div')
            .attr('class', 'comment-text')
            .html(function(d) { return d.html; });

        comment
            .call(replaceAvatars);
    }


    function replaceAvatars(selection) {
        var osm = services.osm;
        if (!osm) return;

        var uids = {};  // gather uids in the comment thread
        _error.comment.forEach(function(d) {
            if (d.uid) uids[d.uid] = true;
        });

        Object.keys(uids).forEach(function(uid) {
            osm.loadUser(uid, function(err, user) {
                if (!user || !user.image_url) return;

                selection.selectAll('.comment-avatar.user-' + uid)
                    .html('')
                    .append('img')
                    .attr('class', 'icon comment-avatar-icon')
                    .attr('src', user.image_url)
                    .attr('alt', user.display_name);
            });
        });
    }


    function localeDateString(s) {
        if (!s) return null;
        var detected = utilDetect();
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        s = s.replace(/-/g, '/'); // fix browser-specific Date() issues
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }


    keepRightComment.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightComment;
    };


    return keepRightComment;
}
