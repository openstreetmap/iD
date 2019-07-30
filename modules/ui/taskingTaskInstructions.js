import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { services } from '../services';
import { utilDetect } from '../util/detect';


export function uiTaskInstructions() {
    var _task;


    function taskInstructions(selection) {
        if (!_task) return;

        var instructions = selection.selectAll('.instructions-container')
            .data([0]);

        instructions = instructions.enter()
            .append('div')
            .attr('class', 'instructions-container')
            .merge(instructions);

        instructions
            .append('p')
            .attr('class', 'task-instructions')
            .text(_task.instructions());

        instructions
            .append('h3')
            .attr('class', 'perTaskInstructions-header')
            .text(function () {
                return _task.perTaskInstructions().length ?
                t('tasking.task.tabs.instructions.perTaskInstructions') :
                '';
            });

        instructions
            .append('p')
            .attr('class', 'task-instructions')
            .text(_task.perTaskInstructions());
    }


    function replaceAvatars(selection) {
        var osm = services.osm;
        if (!osm) return;

        // TODO: parse history objects first!

        var uids = {};  // gather uids in the comment thread
        _task.history.forEach(function(d) {
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
        // s = s.replace(/-/g, '/'); // fix browser-specific Date() issues
        var d = new Date(Date.parse(s));

        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }


    taskInstructions.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return taskInstructions;
    };


    return taskInstructions;
}
