import { rebind } from '../util/rebind';
import { d3combobox } from '../../js/lib/d3.combobox.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import { triggerEvent } from '../util/trigger_event';
import { tooltip } from '../util/tooltip';
import _ from 'lodash';
import { displayName, entityOrMemberSelector } from '../util/index';
import { Icon } from '../svg/index';
import { Select } from '../modes/index';

export function Commit(context) {
    var dispatch = d3.dispatch('cancel', 'save');

    function commit(selection) {
        var changes = context.history().changes(),
            summary = context.history().difference().summary();

        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(
                    entityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('h3')
            .text(t('commit.title'));

        var body = selection.append('div')
            .attr('class', 'body');


        // Comment Section
        var commentSection = body.append('div')
            .attr('class', 'modal-section form-field commit-form');

        commentSection.append('label')
            .attr('class', 'form-label')
            .text(t('commit.message_label'));

        var commentField = commentSection.append('textarea')
            .attr('placeholder', t('commit.description_placeholder'))
            .attr('maxlength', 255)
            .property('value', context.storage('comment') || '')
            .on('input.save', checkComment)
            .on('change.save', checkComment)
            .on('blur.save', function() {
                context.storage('comment', this.value);
            });

        function checkComment() {
            d3.selectAll('.save-section .save-button')
                .attr('disabled', (this.value.length ? null : true));

            var googleWarning = clippyArea
               .html('')
               .selectAll('a')
               .data(this.value.match(/google/i) ? [true] : []);

            googleWarning.exit().remove();

            googleWarning.enter()
               .append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .call(Icon('#icon-alert', 'inline'))
               .attr('href', t('commit.google_warning_link'))
               .append('span')
               .text(t('commit.google_warning'));
        }

        commentField.node().select();

        context.connection().userChangesets(function (err, changesets) {
            if (err) return;

            var comments = [];

            for (var i = 0; i < changesets.length; i++) {
                if (changesets[i].tags.comment) {
                    comments.push({
                        title: changesets[i].tags.comment,
                        value: changesets[i].tags.comment
                    });
                }
            }

            commentField.call(d3combobox().caseSensitive(true).data(comments));
        });

        var clippyArea = commentSection.append('div')
            .attr('class', 'clippy-area');


        var changeSetInfo = commentSection.append('div')
            .attr('class', 'changeset-info');

        changeSetInfo.append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(Icon('#icon-out-link', 'inline'))
            .attr('href', t('commit.about_changeset_comments_link'))
            .append('span')
            .text(t('commit.about_changeset_comments'));

        // Warnings
        var warnings = body.selectAll('div.warning-section')
            .data([context.history().validate(changes)])
            .enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2')
            .style('display', function(d) { return _.isEmpty(d) ? 'none' : null; })
            .style('background', '#ffb');

        warnings.append('h3')
            .text(t('commit.warnings'));

        var warningLi = warnings.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) { return d; })
            .enter()
            .append('li')
            .style()
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick);

        warningLi
            .call(Icon('#icon-alert', 'pre-text'));

        warningLi
            .append('strong').text(function(d) {
                return d.message;
            });

        warningLi.filter(function(d) { return d.tooltip; })
            .call(tooltip()
                .title(function(d) { return d.tooltip; })
                .placement('top')
            );


        // Upload Explanation
        var saveSection = body.append('div')
            .attr('class','modal-section save-section fillL cf');

        var prose = saveSection.append('p')
            .attr('class', 'commit-info')
            .html(t('commit.upload_explanation'));

        context.connection().userDetails(function(err, user) {
            if (err) return;

            var userLink = d3.select(document.createElement('div'));

            if (user.image_url) {
                userLink.append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon pre-text user-icon');
            }

            userLink.append('a')
                .attr('class','user-info')
                .text(user.display_name)
                .attr('href', context.connection().userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose.html(t('commit.upload_explanation_with_user', {user: userLink.html()}));
        });


        // Buttons
        var buttonSection = saveSection.append('div')
            .attr('class','buttons fillL cf');

        var cancelButton = buttonSection.append('button')
            .attr('class', 'secondary-action col5 button cancel-button')
            .on('click.cancel', function() { dispatch.call("cancel"); });

        cancelButton.append('span')
            .attr('class', 'label')
            .text(t('commit.cancel'));

        var saveButton = buttonSection.append('button')
            .attr('class', 'action col5 button save-button')
            .attr('disabled', function() {
                var n = d3.select('.commit-form textarea').node();
                return (n && n.value.length) ? null : true;
            })
            .on('click.save', function() {
                dispatch.call('save', this, {
                    comment: commentField.node().value
                });
            });

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('commit.save'));


        // Changes
        var changeSection = body.selectAll('div.commit-section')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        changeSection.append('h3')
            .text(t('commit.changes', {count: summary.length}));

        var li = changeSection.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(summary)
            .enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity);

        li.each(function(d) {
            d3.select(this)
                .call(Icon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
        });

        li.append('span')
            .attr('class', 'change-type')
            .text(function(d) {
                return t('commit.' + d.changeType) + ' ';
            });

        li.append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                return context.presets().match(d.entity, d.graph).name();
            });

        li.append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = displayName(d.entity) || '',
                    string = '';
                if (name !== '') string += ':';
                return string += ' ' + name;
            });

        li.style('opacity', 0)
            .transition()
            .style('opacity', 1);


        function mouseover(d) {
            if (d.entity) {
                context.surface().selectAll(
                    entityOrMemberSelector([d.entity.id], context.graph())
                ).classed('hover', true);
            }
        }

        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }

        function warningClick(d) {
            if (d.entity) {
                context.map().zoomTo(d.entity);
                context.enter(
                    Select(context, [d.entity.id])
                        .suppressMenu(true));
            }
        }

        // Call checkComment off the bat, in case a changeset
        // comment is recovered from localStorage
        triggerEvent(commentField, 'input');
    }

    return rebind(commit, dispatch, 'on');
}
