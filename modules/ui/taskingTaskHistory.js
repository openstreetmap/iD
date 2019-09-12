import { select as d3_select } from 'd3-selection';

import { currentLocale, t } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { services } from '../services';
import { utilDetect } from '../util/detect';


export function uiTaskHistory() {
    var _task;


    function taskHistory(selection) {
        if (!_task) return;

        var history = selection.selectAll('.task-history-container')
            .data([0]);

        history = history.enter()
            .append('div')
            .attr('class', 'task-history-container')
            .merge(history);

        var historyEnter = history.selectAll('.comment')
            .data(_task.historyStack)
            .enter()
            .append('div')
            .attr('class', 'comment');

        historyEnter
            .append('div')
            .attr('class', function(d) { return 'comment-avatar user-' + d.userId; })
            .call(svgIcon('#iD-icon-avatar', 'comment-avatar-icon'));

        var mainEnter = historyEnter
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
                if (osm && d.userId) {
                    selection = selection
                        .append('a')
                        .attr('class', 'comment-author-link')
                        .attr('href', osm.userURL(d.userId))
                        .attr('tabindex', -1)
                        .attr('target', '_blank');
                }
                selection
                    .text(function(d) {
                        return d.userId || t('tasking.task.author.anonymous');
                    });
            });

        if (!metadataEnter.empty()) {
            replaceAvatars();
        }

        metadataEnter
            .append('div')
            .attr('class', 'comment-date')
            .text(function(d) { return t('tasking.task.date', { when: localeDateString(d.date) }); });

        metadataEnter
            .append('div')
            .attr('class', 'comment-action')
            .text(function(d) {
                var text;

                if (d.stateChange) {
                    text = t('tasking.task.statuses.' + d.stateChange);
                } else if (d.action !== 'comment') {
                    text = t('tasking.task.actions.' + d.action);
                }

                return text;
            });

        mainEnter
            .append('div')
            .attr('class', 'comment-text')
            .html(function(d) { if (d.action === 'comment') { return d.text; } });

    }


    function replaceAvatars() {
        var osm = services.osm;
        if (!osm) return;

        var userIds = {};  // gather uids in the comment thread
        _task.historyStack.forEach(function(d) {
            if (d.userId) userIds[d.userId] = true;
        });

        Object.keys(userIds).forEach(function(userId) {
            osm.loadUser(userId, function(err, user) {
                if (!user || !user.image_url) return;

                selection.selectAll('.comment-avatar.user-' + userId)
                    .html('')
                    .append('img')
                    .attr('class', 'icon comment-avatar-icon')
                    .attr('src', user.image_url)
                    .attr('alt', user.display_name);
            });
        });
    }


    function localeDateString(date) {
        if (!date || isNaN(date.getTime())) return null;
        return date.toLocaleString(currentLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }


    taskHistory.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return taskHistory;
    };


    return taskHistory;
}
