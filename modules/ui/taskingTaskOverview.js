import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { uiTaskingCancel } from './taskingCancel';

import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { services } from '../services';
import { svgIcon } from '../svg/icon';

import {
    utilNoAuto
} from '../util';


export function uiTaskOverview(context) {
    var _statusList = d3_select(null);

    var _task;

    var osm = services.osm;
    var tasking = context.tasking();

    var statuses = ['mapped', 'badimagery'];

    var overviewDetails = ['editStatusOptions', 'leaveAComment', 'saveEdits'];

    // listeners
    var taskingCancel = uiTaskingCancel(context);


    function taskOverview(selection) {
        if (!_task) return;

        // add overview button
        var overview = selection.selectAll('.task-overview-container')
            .data([0]);

        overview = overview.enter()
            .append('div')
            .attr('class', 'task-overview-container')
            .merge(overview)
            .call(taskSaveSection);

    }

    function taskSaveSection(selection) {

        var taskSave = selection.selectAll('.task-save')
            .data([_task]);

        // exit
        taskSave.exit()
            .remove();

        taskSave.enter()
            .append('h3')
            .attr('class', 'task-overview-header')
            .text(function(d) {
                var status = d.status;
                var statusText = status === 'lockedForMapping' ? 'mapping' : status === 'lockedForValidation' ? 'validating' : '';

                return t('tasking.task.tabs.overview.header', { status: t('tasking.' + statusText) });
            });


        taskSave.enter()
            .append('ul')
            .attr('class', 'task-overview-details')
            .selectAll('li')
            .data(overviewDetails)
            .enter()
            .append('li')
            .attr('class', 'task-overview-details-item')
            .text(function(d) { return t('tasking.' + d); });


        // enter
        var taskSaveEnter = taskSave.enter()
            .append('div')
            .attr('class', 'task-save save-section cf');

        taskSaveEnter
            .append('h4')
            .attr('class', '.task-save-header')
            .text(t('tasking.comment'));

        taskSaveEnter
            .append('textarea')
            .attr('class', 'new-comment-input')
            .attr('placeholder', t('tasking.inputPlaceholder'))
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment; })
            .call(utilNoAuto)
            .on('keydown.task-comment-input', keydown)
            .on('input.task-comment-input', changeCommentInput)
            .on('blur.task-comment-input', changeCommentInput);

        // update
        taskSave = taskSaveEnter
            .merge(taskSave)
            .call(renderStatusList)
            // .call(userDetails) // TODO: TAH - add prose or comment to alert user of saving results
            .call(taskSaveButtons);


        // update buttons on history change
        context.history().on('change', function() {
            taskSave
                .call(taskSaveButtons);
        });


        function renderStatusList(selection) {
            var container = selection.selectAll('.layer-fill-list')
                .data([0]);

            _statusList = container.enter()
                .append('ul')
                .attr('class', 'layer-list layer-fill-list')
                .merge(container);

            _statusList
                .call(drawListItems, statuses, 'radio', 'statuses');
        }


        function drawListItems(selection, data, type, name) {
            var items = selection.selectAll('li')
                .data(data);

            // Exit
            items.exit()
                .remove();

            // Enter
            var enter = items.enter()
                .append('li')
                .call(tooltip()
                    .title(function(d) {
                        return t('tasking.task.tabs.overview.saving.statuses.' + d);
                    })
                    .placement('top')
                );

            var label = enter
                .append('label');

            label
                .append('input')
                .attr('type', type)
                .attr('name', name)
                .on('change', changeStatusInput);

            label
                .append('span')
                .text(function(d) { return t('tasking.task.statuses.' + d); });

            // Update
            items = items
                .merge(enter);
        }

        // fast submit if user presses cmd+enter
        function keydown() {
            if (!(d3_event.keyCode === 13 && d3_event.metaKey)) return;

            if (!osm) return;

            var hasAuth = osm.authenticated();
            if (!hasAuth) return;

            d3_event.preventDefault();

            d3_select(this)
                .on('keydown.task-comment-input', null);

            // focus on button and submit
            window.setTimeout(function() {
                clickSave(_task);
            }, 10);
        }


        function changeCommentInput() {
            var input = d3_select(this);
            var val = input.property('value').trim() || undefined;

            // store the unsaved comment with the task itself
            _task = _task.update({ newComment: val });

            if (tasking) {
                tasking.replaceTask(_task);  // update task cache
            }

            taskSave
                .call(taskSaveButtons);
        }

        function changeStatusInput(d) {

            // store the unsaved comment with the task itself
            _task = _task.update({ newStatus: d });

            if (tasking) {
                tasking.replaceTask(_task);  // update task cache
            }

            taskSave
                .call(taskSaveButtons);
        }
    }


    function userDetails(selection) {
        var detailSection = selection.selectAll('.detail-section')
            .data([0]);

        detailSection = detailSection.enter()
            .append('div')
            .attr('class', 'detail-section')
            .merge(detailSection);

        if (!osm) return;

        // Add warning if user is not logged in
        var hasAuth = osm.authenticated();
        var authWarning = detailSection.selectAll('.auth-warning')
            .data(hasAuth ? [] : [0]);

        authWarning.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        var authEnter = authWarning.enter()
            .insert('div', '.tag-reference-body')
            .attr('class', 'field-warning auth-warning')
            .style('opacity', 0);

        authEnter
            .call(svgIcon('#iD-icon-alert', 'inline'));

        authEnter
            .append('span')
            .text(t('tasking.login'));

        authEnter
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .append('span')
            .text(t('login'))
            .on('click.tasking-login', function() {
                d3_event.preventDefault();
                osm.authenticate();
            });

        authEnter
            .transition()
            .duration(200)
            .style('opacity', 1);


        var prose = detailSection.selectAll('.task-save-prose')
            .data(hasAuth ? [0] : []);

        prose.exit()
            .remove();

        prose = prose.enter()
            .append('p')
            .attr('class', 'task-save-prose')
            .text(t('tasking.upload_explanation'))
            .merge(prose);

        osm.userDetails(function(err, user) {
            if (err) return;

            var userLink = d3_select(document.createElement('div'));

            if (user.image_url) {
                userLink
                    .append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon pre-text user-icon');
            }

            userLink
                .append('a')
                .attr('class', 'user-info')
                .text(user.display_name)
                .attr('href', osm.userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose
                .html(t('tasking.upload_explanation_with_user', { user: userLink.html() }));
        });
    }


    function taskSaveButtons(selection) {
        var osm = services.osm;
        var hasAuth = osm && osm.authenticated();

        var buttonSection = selection.selectAll('.buttons')
            .data([_task], function(d) { return d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');


        buttonEnter
            .append('button')
            .attr('class', 'button status-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button cancel-button secondary-action')
            .text(t('confirm.cancel'));


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.cancel-button')   // select and propagate data
            .on('click.cancel', clickCancel);

        buttonSection.select('.status-button')   // select and propagate data
            .attr('disabled', (hasAuth ? null : true))
            .text(function(d) {
                var status = d.status;
                var statusText = status === 'lockedForMapping' ? 'mapping' : status === 'lockedForValidation' ? 'validating' : '';

                // TODO: TAH - create a HOTOSM TaskComment object when saving

                var andComment = (d.newComment ? '_comment' : '');
                return t('tasking.task.tabs.overview.saving.stop_' + statusText + andComment);
            })
            .attr('disabled', isSaveDisabled)
            .on('click.status', clickSave);


        function isSaveDisabled(d) {
            var status = d.status;

            return (
                hasAuth &&
                (status === 'lockedForMapping' || status === 'lockedForValidation') &&
                 context.history().hasChanges() &&
                 d.newStatus
            ) ? null : true;
        }
    }


    function clickCancel(d) {
        this.blur();    // avoid keeping focus on the button - #4641

        d3_event.preventDefault();
        context.container()
            .call(taskingCancel);
    }


    function clickSave(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        if (tasking) {
            tasking.postTaskUpdate(d);
        }
    }


    taskOverview.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;

        return this;
    };


    return taskOverview;
}
