import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { t } from '../util/locale';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg/icon';
import { services } from '../services';
import { tooltip } from '../util/tooltip';
import { uiChangesetEditor } from './changeset_editor';
import { uiSectionChanges } from './sections/changes';
import { uiCommitWarnings } from './commit_warnings';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';
import { utilArrayGroupBy, utilRebind } from '../util';
import { utilDetect } from '../util/detect';


var _changeset;
var readOnlyTags = [
    /^changesets_count$/,
    /^created_by$/,
    /^ideditor:/,
    /^imagery_used$/,
    /^host$/,
    /^locale$/,
    /^warnings:/,
    /^resolved:/,
    /^closed:note$/,
    /^closed:keepright$/,
    /^closed:improveosm:/,
    /^closed:osmose:/
];

// treat most punctuation (except -, _, +, &) as hashtag delimiters - #4398
// from https://stackoverflow.com/a/25575009
var hashtagRegex = /(#[^\u2000-\u206F\u2E00-\u2E7F\s\\'!"#$%()*,.\/:;<=>?@\[\]^`{|}~]+)/g;


export function uiCommit(context) {
    var dispatch = d3_dispatch('cancel');
    var _userDetails;
    var _selection;

    var changesetEditor = uiChangesetEditor(context)
        .on('change', changeTags);
    var rawTagEditor = uiSectionRawTagEditor('changeset-tag-editor', context)
        .on('change', changeTags)
        .readOnlyTags(readOnlyTags);
    var commitChanges = uiSectionChanges(context);
    var commitWarnings = uiCommitWarnings(context);


    function commit(selection) {
        _selection = selection;

        var osm = context.connection();
        if (!osm) return;

        var tagCharLimit = context.maxCharsForTagValue();

        // expire stored comment, hashtags, source after cutoff datetime - #3947 #4899
        var commentDate = +context.storage('commentDate') || 0;
        var currDate = Date.now();
        var cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            context.storage('comment', null);
            context.storage('hashtags', null);
            context.storage('source', null);
        }

        var tags;
        // Initialize changeset if one does not exist yet.
        // Also pull values from local storage.
        if (!_changeset) {

            // load in the URL hash values, if any
            var hash = context.ui().hash;
            if (hash.comment) {
                context.storage('comment', hash.comment);
                context.storage('commentDate', Date.now());
            }
            if (hash.source) {
                context.storage('source', hash.source);
                context.storage('commentDate', Date.now());
            }
            if (hash.hashtags) {
                context.storage('hashtags', hash.hashtags);
            }

            var detected = utilDetect();
            tags = {
                comment: context.storage('comment') || '',
                created_by: ('iD ' + context.version).substr(0, tagCharLimit),
                host: detected.host.substr(0, tagCharLimit),
                locale: detected.locale.substr(0, tagCharLimit)
            };

            // call findHashtags initially - this will remove stored
            // hashtags if any hashtags are found in the comment - #4304
            findHashtags(tags, true);

            var hashtags = context.storage('hashtags');
            if (hashtags) {
                tags.hashtags = hashtags;
            }

            var source = context.storage('source');
            if (source) {
                tags.source = source;
            }
            var photoOverlaysUsed = context.history().photoOverlaysUsed();
            if (photoOverlaysUsed.length) {
                var sources = (tags.source || '').split(';');

                // include this tag for any photo layer
                if (sources.indexOf('streetlevel imagery') === -1) {
                    sources.push('streetlevel imagery');
                }

                // add the photo overlays used during editing as sources
                photoOverlaysUsed.forEach(function(photoOverlay) {
                    if (sources.indexOf(photoOverlay) === -1) {
                        sources.push(photoOverlay);
                    }
                });

                tags.source = sources.join(';').substr(0, tagCharLimit);
            }

            _changeset = new osmChangeset({ tags: tags });
        }

        tags = Object.assign({}, _changeset.tags);   // shallow copy

        // assign tags for imagery used
        var imageryUsed = context.history().imageryUsed().join(';').substr(0, tagCharLimit);
        tags.imagery_used = imageryUsed || 'None';

        // assign tags for closed issues and notes
        var osmClosed = osm.getClosedIDs();
        var itemType;
        if (osmClosed.length) {
            tags['closed:note'] = osmClosed.join(';').substr(0, tagCharLimit);
        }
        if (services.keepRight) {
            var krClosed = services.keepRight.getClosedIDs();
            if (krClosed.length) {
                tags['closed:keepright'] = krClosed.join(';').substr(0, tagCharLimit);
            }
        }
        if (services.improveOSM) {
            var iOsmClosed = services.improveOSM.getClosedCounts();
            for (itemType in iOsmClosed) {
                tags['closed:improveosm:' + itemType] = iOsmClosed[itemType].toString().substr(0, tagCharLimit);
            }
        }
        if (services.osmose) {
            var osmoseClosed = services.osmose.getClosedCounts();
            for (itemType in osmoseClosed) {
                tags['closed:osmose:' + itemType] = osmoseClosed[itemType].toString().substr(0, tagCharLimit);
            }
        }

        // remove existing issue counts
        for (var key in tags) {
            if (key.match(/(^warnings:)|(^resolved:)/)) {
                delete tags[key];
            }
        }

        function addIssueCounts(issues, prefix) {
            var issuesByType = utilArrayGroupBy(issues, 'type');
            for (var issueType in issuesByType) {
                var issuesOfType = issuesByType[issueType];
                if (issuesOfType[0].subtype) {
                    var issuesBySubtype = utilArrayGroupBy(issuesOfType, 'subtype');
                    for (var issueSubtype in issuesBySubtype) {
                        var issuesOfSubtype = issuesBySubtype[issueSubtype];
                        tags[prefix + ':' + issueType + ':' + issueSubtype] = issuesOfSubtype.length.toString().substr(0, tagCharLimit);
                    }
                } else {
                    tags[prefix + ':' + issueType] = issuesOfType.length.toString().substr(0, tagCharLimit);
                }
            }
        }

        // add counts of warnings generated by the user's edits
        var warnings = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeIgnored: true, includeDisabledRules: true }).warning;
        addIssueCounts(warnings, 'warnings');

        // add counts of issues resolved by the user's edits
        var resolvedIssues = context.validator().getResolvedIssues();
        addIssueCounts(resolvedIssues, 'resolved');

        _changeset = _changeset.update({ tags: tags });

        var header = selection.selectAll('.header')
            .data([0]);

        var headerTitle = header.enter()
            .append('div')
            .attr('class', 'header fillL header-container');

        headerTitle
            .append('div')
            .attr('class', 'header-block header-block-outer');

        headerTitle
            .append('div')
            .attr('class', 'header-block')
            .append('h3')
            .text(t('commit.title'));

        headerTitle
            .append('div')
            .attr('class', 'header-block header-block-outer header-block-close')
            .append('button')
            .attr('class', 'close')
            .on('click', function() {
                dispatch.call('cancel', this);
            })
            .call(svgIcon('#iD-icon-close'));

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
                .changesetID(_changeset.id)
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

        if (prose.enter().size()) {   // first time, make sure to update user details in prose
            _userDetails = null;
        }

        prose = prose.enter()
            .append('p')
            .attr('class', 'commit-info')
            .text(t('commit.upload_explanation'))
            .merge(prose);

        // always check if this has changed, but only update prose.html()
        // if needed, because it can trigger a style recalculation
        osm.userDetails(function(err, user) {
            if (err) return;

            if (_userDetails === user) return;  // no change
            _userDetails = user;

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
            .property('checked', isReviewRequested(_changeset.tags))
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
            .attr('class', 'secondary-action button cancel-button')
            .append('span')
            .attr('class', 'label')
            .text(t('commit.cancel'));

        var uploadButton = buttonEnter
            .append('button')
            .attr('class', 'action button save-button');

        uploadButton.append('span')
            .attr('class', 'label')
            .text(t('commit.save'));

        var uploadBlockerTooltipText = getUploadBlockerMessage();

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.selectAll('.cancel-button')
            .on('click.cancel', function() {
                dispatch.call('cancel', this);
            });

        buttonSection.selectAll('.save-button')
            .classed('disabled', uploadBlockerTooltipText !== null)
            .on('click.save', function() {
                if (!d3_select(this).classed('disabled')) {
                    this.blur();    // avoid keeping focus on the button - #4641
                    context.uploader().save(_changeset);
                }
            });

        // remove any existing tooltip
        tooltip().destroyAny(buttonSection.selectAll('.save-button'));

        if (uploadBlockerTooltipText) {
            buttonSection.selectAll('.save-button')
                .call(tooltip().title(uploadBlockerTooltipText).placement('top'));
        }

        // Raw Tag Editor
        var tagSection = body.selectAll('.tag-section.raw-tag-editor')
            .data([0]);

        tagSection = tagSection.enter()
            .append('div')
            .attr('class', 'modal-section tag-section raw-tag-editor')
            .merge(tagSection);

        tagSection
            .call(rawTagEditor
                .tags(Object.assign({}, _changeset.tags))   // shallow copy
                .render
            );

        var changesSection = body.selectAll('.commit-changes-section')
            .data([0]);

        changesSection = changesSection.enter()
            .append('div')
            .attr('class', 'modal-section commit-changes-section')
            .merge(changesSection);

        // Change summary
        changesSection.call(commitChanges.render);


        function toggleRequestReview() {
            var rr = requestReviewInput.property('checked');
            updateChangeset({ review_requested: (rr ? 'yes' : undefined) });

            tagSection
                .call(rawTagEditor
                    .tags(Object.assign({}, _changeset.tags))   // shallow copy
                    .render
                );
        }
    }


    function getUploadBlockerMessage() {
        var errors = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all' }).error;

        if (errors.length) {
            return t('commit.outstanding_errors_message', { count: errors.length });

        } else {
            var n = d3_select('#preset-input-comment').node();
            var hasChangesetComment = n && n.value.length > 0;
            if (!hasChangesetComment) {
                return t('commit.comment_needed_message');
            }
        }
        return null;
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
        if (changed.hasOwnProperty('source')) {
            if (changed.source === undefined) {
                context.storage('source', null);
            } else if (!onInput) {
                context.storage('source', changed.source);
                context.storage('commentDate', Date.now());
            }
        }

        updateChangeset(changed, onInput);

        if (_selection) {
            _selection.call(commit);
        }
    }


    function findHashtags(tags, commentOnly) {
        var inComment = commentTags();
        var inHashTags = hashTags();

        if (inComment !== null) {                    // when hashtags are detected in comment...
            context.storage('hashtags', null);       // always remove stored hashtags - #4304
            if (commentOnly) { inHashTags = []; }    // optionally override hashtags field
        }

        // keep only one copy of the tags
        var all = new Set();
        var keepTags = [];
        inComment.forEach(checkTag);
        inHashTags.forEach(checkTag);
        return keepTags;

        // Compare tags as lowercase strings, but keep original case tags
        function checkTag(s) {
            var compare = s.toLowerCase();
            if (!all.has(compare)) {
                all.add(compare);
                keepTags.push(s);
            }
        }

        // Extract hashtags from `comment`
        function commentTags() {
            var matches = (tags.comment || '')
                .replace(/http\S*/g, '')  // drop anything that looks like a URL - #4289
                .match(hashtagRegex);

            return (matches || []);
        }

        // Extract and clean hashtags from `hashtags`
        function hashTags() {
            var matches = (tags.hashtags || '')
                .split(/[,;\s]+/)
                .map(function (s) {
                    if (s[0] !== '#') { s = '#' + s; }    // prepend '#'
                    var matched = s.match(hashtagRegex);
                    return matched && matched[0];
                }).filter(Boolean);                       // exclude falsy

            return (matches || []);
        }
    }


    function isReviewRequested(tags) {
        var rr = tags.review_requested;
        if (rr === undefined) return false;
        rr = rr.trim().toLowerCase();
        return !(rr === '' || rr === 'no');
    }


    function updateChangeset(changed, onInput) {
        var tags = Object.assign({}, _changeset.tags);   // shallow copy

        var tagCharLimit = context.maxCharsForTagValue();

        Object.keys(changed).forEach(function(k) {
            var v = changed[k];
            k = k.trim().substr(0, tagCharLimit);
            if (readOnlyTags.indexOf(k) !== -1) return;

            if (k !== '' && v !== undefined) {
                if (onInput) {
                    tags[k] = v;
                } else {
                    tags[k] = v.trim().substr(0, tagCharLimit);
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
                tags.hashtags = arr.join(';').substr(0, tagCharLimit);
                context.storage('hashtags', tags.hashtags);
            } else {
                delete tags.hashtags;
                context.storage('hashtags', null);
            }
        }

        // always update userdetails, just in case user reauthenticates as someone else
        if (_userDetails && _userDetails.changesets_count !== undefined) {
            var changesetsCount = parseInt(_userDetails.changesets_count, 10) + 1;  // #4283
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

        if (!deepEqual(_changeset.tags, tags)) {
            _changeset = _changeset.update({ tags: tags });
        }
    }


    commit.reset = function() {
        _changeset = null;
    };


    return utilRebind(commit, dispatch, 'on');
}
