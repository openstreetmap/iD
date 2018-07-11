import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { services } from '../services';
import { utilDetect } from '../util/detect';


export function uiNoteComments() {
    var commentLimit = 600;  // add a "more" link to comments longer than this length
    var _note;


    function noteComments(selection) {
        var comments = selection.selectAll('.comments')
            .data([0]);

        comments = comments.enter()
            .append('div')
            .attr('class', 'comments')
            .merge(comments);

        var commentEnter = comments.selectAll('.comment')
            .data(_note.comments)
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
            .attr('class', function(d) {
                var trunc = (d.text.length > commentLimit);
                return 'comment-text' + (trunc ? ' truncated' : '');
            })
            .text(function(d) {
                var trunc = (d.text.length > commentLimit);
                return trunc ? d.text.slice(0, commentLimit) + '…' : d.text;
            });

        mainEnter
            .each(function(d) {
                var selection = d3_select(this);
                var trunc = (d.text.length > commentLimit);
                if (!trunc) return;

                selection
                    .append('a')
                    .attr('class', 'comment-toggle-more')
                    .attr('href', '#')
                    .attr('tabindex', -1)
                    .attr('target', '_blank')
                    .text(t('note.more'))
                    .on('click', toggleMore);
            });

        comments
            .call(replaceAvatars);
    }


    function toggleMore() {
        d3_event.preventDefault();

        var selection = d3_select(this.parentNode);  // select .comment-main
        var commentText = selection.selectAll('.comment-text');
        var commentToggle = selection.selectAll('.comment-toggle-more');
        var trunc = !commentText.classed('truncated');

        commentText
            .classed('truncated', trunc)
            .text(function(d) {
                return trunc ? d.text.slice(0, commentLimit) + '…' : d.text;
            });

        commentToggle
            .text(t('note.' + (trunc ? 'more' : 'less')));
    }


    function replaceAvatars(selection) {
        var osm = services.osm;
        if (!osm) return;

        var uids = {};  // gather uids in the comment thread
        _note.comments.forEach(function(d) {
            if (d.uid) uids[d.uid] = true;
        });

        Object.keys(uids).forEach(function(uid) {
            osm.user(uid, function(err, user) {
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
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }


    noteComments.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteComments;
    };


    return noteComments;
}
