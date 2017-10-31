import _clone from 'lodash-es/clone';
import _forEach from 'lodash-es/forEach';
import _isEqual from 'lodash-es/isEqual';
import _unionBy from 'lodash-es/unionBy';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

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

// treat most punctuation (except -, _, +, &) as hashtag delimiters - #4398
// from https://stackoverflow.com/a/25575009
var hashtagRegex = /(#[^\u2000-\u206F\u2E00-\u2E7F\s\\'!"#$%()*,.\/:;<=>?@\[\]^`{|}~]+)/g;


export function uiCommit(context) {
    var dispatch = d3_dispatch('cancel', 'save'),
        storedComment = '',
        storedCommentDate = 0,
        storedHashtags = null,
        storedWalkthrough = {},
        userDetails,
        _selection;

    var changesetEditor = uiChangesetEditor(context)
        .on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context)
        .on('change', changeTags);
    var commitChanges = uiCommitChanges(context);
    var commitWarnings = uiCommitWarnings(context);


    context.storage('comment', function(err, val) {
        storedComment = val || '';
    });
    context.storage('commentDate', function(err, val) {
        storedCommentDate = +val || 0;
    });
    context.storage('hashtags', function(err, val) {
        storedHashtags = val;
    });
    context.storage('walkthrough_completed', function(err, val) {
        storedWalkthrough.completed = val;
    });
    context.storage('walkthrough_progress', function(err, val) {
        storedWalkthrough.progress = val;
    });
    context.storage('walkthrough_started', function(err, val) {
        storedWalkthrough.started = val;
    });



    function commit(selection) {
        _selection = selection;

        var osm = context.connection();
        if (!osm) return;

        // expire stored comment and hashtags after cutoff datetime - #3947
        var commentDate = storedCommentDate,
            currDate = Date.now(),
            cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            storedComment = null;
            storedHashtags = null;
            context.storage('comment', null);
            context.storage('hashtags', null);
        }

        var tags;
        if (!changeset) {
            var detected = utilDetect();
            tags = {
                comment: storedComment,
                created_by: ('iD ' + context.version).substr(0, 255),
                host: detected.host.substr(0, 255),
                locale: detected.locale.substr(0, 255)
            };

            // call findHashtags initially - this will remove stored
            // hashtags if any hashtags are found in the comment - #4304
            findHashtags(tags, true);

            var hashtags = storedHashtags;
            if (hashtags) {
                tags.hashtags = hashtags;
            }

            changeset = new osmChangeset({ tags: tags });
        }

        tags = _clone(changeset.tags);
        tags.imagery_used = context.history().imageryUsed().join(';').substr(0, 255);
        changeset = changeset.update({ tags: tags });

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

            var userLink = d3_select(document.createElement('div'));

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


        // Request Review
        var requestReview = saveSection.selectAll('.request-review')
            .data([0]);

        // Enter
        var requestReviewEnter = requestReview.enter()
            .append('div')
            .attr('class', 'request-review');

        var labelEnter = requestReviewEnter
            .append('label')
            .attr('for', 'commit-input-request-review');

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', 'commit-input-request-review');

        labelEnter
            .append('span')
            .text(t('commit.request_review'));

        // Update
        requestReview = requestReview
            .merge(requestReviewEnter);

        var requestReviewInput = requestReview.selectAll('input')
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
                var n = d3_select('#preset-input-comment').node();
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
                .tags(_clone(changeset.tags))
            );


        // Change summary
        body.call(commitChanges);


        function toggleRequestReview() {
            var rr = requestReviewInput.property('checked');
            updateChangeset({ review_requested: (rr ? 'yes' : undefined) });

            var expanded = !tagSection.selectAll('a.hide-toggle.expanded').empty();

            tagSection
                .call(rawTagEditor
                    .expanded(expanded)
                    .readOnlyTags(readOnlyTags)
                    .tags(_clone(changeset.tags))
                );
        }
    }


    function changeTags(changed, onInput) {
        if (changed.hasOwnProperty('comment')) {
            if (changed.comment === undefined) {
                changed.comment = '';
            }
            if (!onInput) {
                storedComment = changed.comment;
                storedCommentDate = Date.now();
                context.storage('comment', storedComment);
                context.storage('commentDate', storedCommentDate);

            }
        }

        updateChangeset(changed, onInput);

        if (_selection) {
            _selection.call(commit);
        }
    }


    function findHashtags(tags, commentOnly) {
        var inComment = commentTags(),
            inHashTags = hashTags();

        if (inComment !== null) {                          // when hashtags are detected in comment...
            context.storage('hashtags', null);             // always remove stored hashtags - #4304
            storedHashtags = null;
            if (commentOnly) { inHashTags = null; }        // optionally override hashtags field
        }
        return _unionBy(inComment, inHashTags, function (s) {
            return s.toLowerCase();
        });

        // Extract hashtags from `comment`
        function commentTags() {
            return tags.comment
                .replace(/http\S*/g, '')  // drop anything that looks like a URL - #4289
                .match(hashtagRegex);
        }

        // Extract and clean hashtags from `hashtags`
        function hashTags() {
            var t = tags.hashtags || '';
            return t
                .split(/[,;\s]+/)
                .map(function (s) {
                    if (s[0] !== '#') { s = '#' + s; }    // prepend '#'
                    var matched = s.match(hashtagRegex);
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
        var tags = _clone(changeset.tags);

        _forEach(changed, function(v, k) {
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
            // when changing the comment, override hashtags with any found in comment.
            var commentOnly = changed.hasOwnProperty('comment') && (changed.comment !== '');
            var arr = findHashtags(tags, commentOnly);
            if (arr.length) {
                tags.hashtags = arr.join(';').substr(0, 255);
                storedHashtags = tags.hashtags;
            } else {
                delete tags.hashtags;
                storedHashtags = null;
            }
            context.storage('hashtags', storedHashtags);
        }

        // always update userdetails, just in case user reauthenticates as someone else
        if (userDetails && userDetails.changesets_count !== undefined) {
            var changesetsCount = parseInt(userDetails.changesets_count, 10) + 1;  // #4283
            tags.changesets_count = String(changesetsCount);

            // first 100 edits - new user
            if (changesetsCount <= 100) {
                var s;
                s = storedWalkthrough.completed;
                if (s) {
                    tags['ideditor:walkthrough_completed'] = s;
                }

                s = storedWalkthrough.progress;
                if (s) {
                    tags['ideditor:walkthrough_progress'] = s;
                }

                s = storedWalkthrough.started;
                if (s) {
                    tags['ideditor:walkthrough_started'] = s;
                }
            }
        } else {
            delete tags.changesets_count;
        }

        if (!_isEqual(changeset.tags, tags)) {
            changeset = changeset.update({ tags: tags });
        }
    }


    commit.reset = function() {
        changeset = null;
    };


    return utilRebind(commit, dispatch, 'on');
}
