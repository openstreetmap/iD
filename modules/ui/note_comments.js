import { select as d3_select } from 'd3-selection';

import { prefs } from '../core/preferences';
import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { services } from '../services';


export function uiNoteComments() {
    var _note;


    function noteComments(selection) {
        if (_note.isNew()) return; // don't draw .comments-container

        var comments = selection.selectAll('.comments-container')
            .data([0]);

        comments = comments.enter()
            .append('div')
            .attr('class', 'comments-container')
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
            .text(function(d) {
                return t('note.status.' + d.action, { when: localeDateString(d.date) });
            });

        mainEnter
            .append('div')
            .attr('class', 'comment-text')
            .html(function(d) { return d.html; })
            .selectAll('a')
                .attr('rel', 'noopener nofollow')
                .attr('target', '_blank');

        comments
            .call(replaceAvatars);
    }


    function replaceAvatars(selection) {
        var showThirdPartyIcons = prefs('preferences.privacy.thirdpartyicons') || 'true';
        var osm = services.osm;
        if (showThirdPartyIcons !== 'true' || !osm) return;

        var uids = {};  // gather uids in the comment thread
        _note.comments.forEach(function(d) {
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
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        s = s.replace(/-/g, '/'); // fix browser-specific Date() issues
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(localizer.localeCode(), options);
    }


    noteComments.note = function(val) {
        if (!arguments.length) return _note;
        _note = val;
        return noteComments;
    };


    return noteComments;
}
