import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';
import { osmChangeset } from '../osm';
import { modeSelect } from '../modes';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { uiChangesetEditor } from './changeset_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { utilDetect } from '../util/detect';
import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector,
    utilRebind
} from '../util';


var changeset;
var readOnlyTags = ['created_by', 'imagery_used', 'host', 'locale'];


export function uiCommit(context) {
    var dispatch = d3.dispatch('cancel', 'save'),
        _selection;

    var changesetEditor = uiChangesetEditor(context)
        .on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context)
        .on('change', changeTags);


    function commit(selection) {
        _selection = selection;

        var osm = context.connection();
        if (!osm) return;

        var changes = context.history().changes(),
            summary = context.history().difference().summary(),
            comment = context.storage('comment') || '',
            commentDate = +context.storage('commentDate') || 0,
            currDate = Date.now(),
            cutoff = 2 * 86400 * 1000;   // 2 days

        // expire the stored comment if it is too old - #3947
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            comment = '';
        }

        var tags;
        if (!changeset) {
            var detected = utilDetect();
            tags = {
                comment: comment,
                created_by: ('iD ' + context.version).substr(0, 255),
                imagery_used: context.history().imageryUsed().join(';').substr(0, 255),
                host: detected.host.substr(0, 255),
                locale: detected.locale.substr(0, 255)
            };

            changeset = new osmChangeset({ tags: tags });
        }

        tags = _.clone(changeset.tags);

        var header = selection.selectAll('.header')
            .data([0]);

        header.enter()
            .append('div')
            .attr('class', 'header fillL')
            .append('h3')
            .text(t('commit.title'));

        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);


        // Changeset Section
        var changesetSection = body.selectAll('.changeset-editor')
            .data([0]);

        changesetSection = changesetSection.enter()
            .append('div')
            .attr('class', 'modal-section changeset-editor')
            .merge(changesetSection);

        changesetSection
            .call(changesetEditor
                .changesetID(changeset.id)
                .tags(tags)
            );


        // Warnings
        var warnings = context.history().validate(changes);
        var warningSection = body.selectAll('div.warning-section')
            .data(warnings.length ? [0] : []);

        warningSection.exit()
            .remove();

        var warningEnter = warningSection.enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2');

        warningEnter
            .append('h3')
            .text(t('commit.warnings'));

        warningEnter
            .append('ul')
            .attr('class', 'changeset-list');

        warningSection = warningEnter
            .merge(warningSection);


        var warningItems = warningSection.select('ul').selectAll('li')
            .data(warnings);

        warningItems.exit()
            .remove();

        warningItems = warningItems.enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick)
            .merge(warningItems);

        warningItems
            .call(svgIcon('#icon-alert', 'pre-text'));

        warningItems
            .append('strong')
            .text(function(d) { return d.message; });

        warningItems.filter(function(d) { return d.tooltip; })
            .call(tooltip()
                .title(function(d) { return d.tooltip; })
                .placement('top')
            );


        // Upload Explanation
        var saveSection = body.selectAll('.save-section')
            .data([0]);

        saveSection = saveSection.enter()
            .append('div')
            .attr('class','modal-section save-section fillL cf')
            .merge(saveSection);

        var prose = saveSection.selectAll('.commit-info')
            .data([0]);

        prose = prose.enter()
            .append('p')
            .attr('class', 'commit-info')
            .text(t('commit.upload_explanation'))
            .merge(prose);

        osm.userDetails(function(err, user) {
            if (err) return;

            var userLink = d3.select(document.createElement('div'));

            if (user.image_url) {
                userLink
                    .append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon pre-text user-icon');
            }

            userLink
                .append('a')
                .attr('class','user-info')
                .text(user.display_name)
                .attr('href', osm.userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose
                .html(t('commit.upload_explanation_with_user', { user: userLink.html() }));
        });


        var requestReview = saveSection.selectAll('.request-review')
            .data([0]);

        requestReview = requestReview.enter()
            .append('p')
            .attr('class', 'request-review')
            .text(t('commit.request_review'))
            .merge(requestReview);

        var requestReviewField = requestReview.selectAll('input')
            .data([0]);

        requestReviewField = requestReviewField.enter()
            .append('input')
            .attr('type', 'checkbox')
            .merge(requestReviewField);

        requestReviewField
            .property('checked', isReviewRequested(changeset.tags))
            .on('change', toggleRequestReview);


        // Buttons
        var buttonSection = saveSection.selectAll('.buttons')
            .data([0]);

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons fillL cf');

        buttonEnter
            .append('button')
            .attr('class', 'secondary-action col5 button cancel-button')
            .append('span')
            .attr('class', 'label')
            .text(t('commit.cancel'));

        buttonEnter
            .append('button')
            .attr('class', 'action col5 button save-button')
            .append('span')
            .attr('class', 'label')
            .text(t('commit.save'));

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.selectAll('.cancel-button')
            .on('click.cancel', function() {
                dispatch.call('cancel');
            });

        buttonSection.selectAll('.save-button')
            .attr('disabled', function() {
                var n = d3.select('#preset-input-comment').node();
                return (n && n.value.length) ? null : true;
            })
            .on('click.save', function() {
                dispatch.call('save', this, changeset);
            });


        // Raw Tag Editor
        var tagSection = body.selectAll('.tag-section.raw-tag-editor')
            .data([0]);

        tagSection = tagSection.enter()
            .append('div')
            .attr('class', 'modal-section tag-section raw-tag-editor')
            .merge(tagSection);

        var expanded = !tagSection.selectAll('a.hide-toggle.expanded').empty();
        tagSection
            .call(rawTagEditor
                .expanded(expanded)
                .readOnlyTags(readOnlyTags)
                .tags(_.clone(changeset.tags))
            );


// TODO check this below (maybe refactor to own module)...

        // Changes
        var changeSection = body.selectAll('.modal-section.commit-section')
            .data([0]);

        var changeEnter = changeSection.enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        changeEnter
            .append('h3')
            .text(t('commit.changes', { count: summary.length }));

        var li = changeEnter
            .append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(summary);

        li = li.enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity)
            .merge(li);

        li.each(function(d) {
            d3.select(this)
                .call(svgIcon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
        });

        li.append('span')
            .attr('class', 'change-type')
            .text(function(d) { return t('commit.' + d.changeType) + ' '; });

        li.append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var matched = context.presets().match(d.entity, d.graph);
                return (matched && matched.name()) || utilDisplayType(d.entity.id);
            });

        li.append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = utilDisplayName(d.entity) || '',
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
                    utilEntityOrMemberSelector([d.entity.id], context.graph())
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
                context.enter(modeSelect(context, [d.entity.id]));
            }
        }


        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }


        function toggleRequestReview() {
            var rr = requestReviewField.property('checked');
            updateChangeset({ review_requested: (rr ? 'yes' : undefined) });

            var expanded = !tagSection.selectAll('a.hide-toggle.expanded').empty();

            tagSection
                .call(rawTagEditor
                    .expanded(expanded)
                    .readOnlyTags(readOnlyTags)
                    .tags(_.clone(changeset.tags))
                );
        }

    }


    function changeTags(changed, onInput) {
        if (changed.hasOwnProperty('comment')) {
            if (changed.comment === undefined) {
                changed.comment = '';
            }
        }

        updateChangeset(changed, onInput);

        if (_selection) {
            _selection.call(commit);
        }
    }


    function isReviewRequested(tags) {
        var rr = tags.review_requested;
        if (rr === undefined) return false;
        rr = rr.trim().toLowerCase();
        return !(rr === '' || rr === 'no');
    }


    function updateChangeset(changed, onInput) {
        var tags = _.clone(changeset.tags);

        _.forEach(changed, function(v, k) {
            k = k.trim().substr(0, 255);
            if (readOnlyTags.indexOf(k) !== -1) return;

            if (k !== '' && v !== undefined) {
                if (onInput) {
                    tags[k] = v;
                } else {
                    tags[k] = v.trim().substr(0, 255);
                }
            } else {
                delete tags[k];
            }
        });

        if (!_.isEqual(changeset.tags, tags)) {
            changeset = changeset.update({ tags: tags });
        }
    }



    commit.reset = function() {
        changeset = null;
    };


    return utilRebind(commit, dispatch, 'on');
}
