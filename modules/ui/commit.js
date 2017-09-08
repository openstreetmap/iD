import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';
import { osmChangeset } from '../osm';
import { uiChangesetEditor } from './changeset_editor';
import { uiCommitChanges } from './commit_changes';
import { uiCommitWarnings } from './commit_warnings';
import { uiRawTagEditor } from './raw_tag_editor';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util';


var changeset;
var readOnlyTags = [
    /^changesets_count$/,
    /^created_by$/,
    /^ideditor:/,
    /^imagery_used$/,
    /^host$/,
    /^locale$/
];


export function uiCommit(context) {
    var dispatch = d3.dispatch('cancel', 'save'),
        userDetails,
        _selection;

    var changesetEditor = uiChangesetEditor(context)
        .on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context)
        .on('change', changeTags);
    var commitChanges = uiCommitChanges(context);
    var commitWarnings = uiCommitWarnings(context);


    function commit(selection) {
        _selection = selection;

        var osm = context.connection();
        if (!osm) return;

        var comment = context.storage('comment') || '',
            commentDate = +context.storage('commentDate') || 0,
            hashtags = context.storage('hashtags'),
            currDate = Date.now(),
            cutoff = 2 * 86400 * 1000;   // 2 days

        // expire stored comment and hashtags after cutoff datetime - #3947
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            comment = '';
            hashtags = undefined;
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

            if (hashtags) {
                tags.hashtags = hashtags;
            }

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
        body.call(commitWarnings);


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

            userDetails = user;

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


        // Change summary
        body.call(commitChanges);


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
            if (!onInput) {
                context.storage('comment', changed.comment);
                context.storage('commentDate', Date.now());
            }
        }

        updateChangeset(changed, onInput);

        if (_selection) {
            _selection.call(commit);
        }
    }


    function findHashtags(tags) {
        return _.unionBy(commentTags(), hashTags(), function (s) {
            return s.toLowerCase();
        });

        // Extract hashtags from `comment`
        function commentTags() {
            return tags.comment.match(/#[^\s\#]+/g);
        }

        // Extract and clean hashtags from `hashtags`
        function hashTags() {
            var t = tags.hashtags || '';
            return t
                .split(/[,;\s]+/)
                .map(function (s) {
                    if (s[0] !== '#') { s = '#' + s; }    // prepend '#'
                    var matched = s.match(/#[^\s\#]+/g);  // match valid hashtags
                    return matched && matched[0];
                }).filter(Boolean);                       // exclude falsey
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

        if (!onInput) {
            var arr = findHashtags(tags);
            if (arr.length) {
                tags.hashtags = arr.join(';').substr(0, 255);
                context.storage('hashtags', tags.hashtags);
            } else {
                delete tags.hashtags;
                context.storage('hashtags', null);
            }
        }

        // always update userdetails, just in case user reauthenticates as someone else
        if (userDetails && userDetails.changesets_count !== undefined) {
            var changesetsCount = parseInt(userDetails.changesets_count, 10) + 1;  // #4283
            tags.changesets_count = String(changesetsCount);

            // first 100 edits - new user
            if (changesetsCount <= 100) {
                var s;
                s = context.storage('walkthrough_completed');
                if (s) {
                    tags['ideditor:walkthrough_completed'] = s;
                }

                s = context.storage('walkthrough_progress');
                if (s) {
                    tags['ideditor:walkthrough_progress'] = s;
                }

                s = context.storage('walkthrough_started');
                if (s) {
                    tags['ideditor:walkthrough_started'] = s;
                }
            }
        } else {
            delete tags.changesets_count;
        }

        if (!_.isEqual(changeset.tags, tags)) {
            changeset = changeset.update({ tags: tags });
        }
    }


    commit.reset = function() {
        changeset = null;
    };


    return utilRebind(commit, dispatch, 'on');
}
