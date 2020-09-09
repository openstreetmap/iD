import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { prefs } from '../core/preferences';
import { t, localizer } from '../core/localizer';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg/icon';
import { services } from '../services';
import { uiTooltip } from './tooltip';
import { uiChangesetEditor } from './changeset_editor';
import { uiSectionChanges } from './sections/changes';
import { uiCommitWarnings } from './commit_warnings';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';
import { utilArrayGroupBy, utilRebind, utilUniqueDomId } from '../util';
import { utilDetect } from '../util/detect';


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

        // Initialize changeset if one does not exist yet.
        if (!context.changeset) initChangeset();

        loadDerivedChangesetTags();

        selection.call(render);
    }

    function initChangeset() {

        // expire stored comment, hashtags, source after cutoff datetime - #3947 #4899
        var commentDate = +prefs('commentDate') || 0;
        var currDate = Date.now();
        var cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            prefs('comment', null);
            prefs('hashtags', null);
            prefs('source', null);
        }

        // load in explicitly-set values, if any
        if (context.defaultChangesetComment()) {
            prefs('comment', context.defaultChangesetComment());
            prefs('commentDate', Date.now());
        }
        if (context.defaultChangesetSource()) {
            prefs('source', context.defaultChangesetSource());
            prefs('commentDate', Date.now());
        }
        if (context.defaultChangesetHashtags()) {
            prefs('hashtags', context.defaultChangesetHashtags());
            prefs('commentDate', Date.now());
        }

        var detected = utilDetect();
        var tags = {
            comment: prefs('comment') || '',
            created_by: context.cleanTagValue('iD ' + context.version),
            host: context.cleanTagValue(detected.host),
            locale: context.cleanTagValue(localizer.localeCode())
        };

        // call findHashtags initially - this will remove stored
        // hashtags if any hashtags are found in the comment - #4304
        findHashtags(tags, true);

        var hashtags = prefs('hashtags');
        if (hashtags) {
            tags.hashtags = hashtags;
        }

        var source = prefs('source');
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

            tags.source = context.cleanTagValue(sources.join(';'));
        }

        context.changeset = new osmChangeset({ tags: tags });
    }

    // Calculates read-only metadata tags based on the user's editing session and applies
    // them to the changeset.
    function loadDerivedChangesetTags() {

        var osm = context.connection();
        if (!osm) return;

        var tags = Object.assign({}, context.changeset.tags);   // shallow copy

        // assign tags for imagery used
        var imageryUsed = context.cleanTagValue(context.history().imageryUsed().join(';'));
        tags.imagery_used = imageryUsed || 'None';

        // assign tags for closed issues and notes
        var osmClosed = osm.getClosedIDs();
        var itemType;
        if (osmClosed.length) {
            tags['closed:note'] = context.cleanTagValue(osmClosed.join(';'));
        }
        if (services.keepRight) {
            var krClosed = services.keepRight.getClosedIDs();
            if (krClosed.length) {
                tags['closed:keepright'] = context.cleanTagValue(krClosed.join(';'));
            }
        }
        if (services.improveOSM) {
            var iOsmClosed = services.improveOSM.getClosedCounts();
            for (itemType in iOsmClosed) {
                tags['closed:improveosm:' + itemType] = context.cleanTagValue(iOsmClosed[itemType].toString());
            }
        }
        if (services.osmose) {
            var osmoseClosed = services.osmose.getClosedCounts();
            for (itemType in osmoseClosed) {
                tags['closed:osmose:' + itemType] = context.cleanTagValue(osmoseClosed[itemType].toString());
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
                        tags[prefix + ':' + issueType + ':' + issueSubtype] = context.cleanTagValue(issuesOfSubtype.length.toString());
                    }
                } else {
                    tags[prefix + ':' + issueType] = context.cleanTagValue(issuesOfType.length.toString());
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

        context.changeset = context.changeset.update({ tags: tags });
    }

    function render(selection) {

        var osm = context.connection();
        if (!osm) return;

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
                .changesetID(context.changeset.id)
                .tags(context.changeset.tags)
            );


        // Warnings
        body.call(commitWarnings);


        // Upload Explanation
        var saveSection = body.selectAll('.save-section')
            .data([0]);

        saveSection = saveSection.enter()
            .append('div')
            .attr('class','modal-section save-section fillL')
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

        var requestReviewDomId = utilUniqueDomId('commit-input-request-review');

        var labelEnter = requestReviewEnter
            .append('label')
            .attr('for', requestReviewDomId);

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', requestReviewDomId);

        labelEnter
            .append('span')
            .text(t('commit.request_review'));

        // Update
        requestReview = requestReview
            .merge(requestReviewEnter);

        var requestReviewInput = requestReview.selectAll('input')
            .property('checked', isReviewRequested(context.changeset.tags))
            .on('change', toggleRequestReview);


        // Buttons
        var buttonSection = saveSection.selectAll('.buttons')
            .data([0]);

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons fillL');

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
                    context.uploader().save(context.changeset);
                }
            });

        // remove any existing tooltip
        uiTooltip().destroyAny(buttonSection.selectAll('.save-button'));

        if (uploadBlockerTooltipText) {
            buttonSection.selectAll('.save-button')
                .call(uiTooltip().title(uploadBlockerTooltipText).placement('top'));
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
                .tags(Object.assign({}, context.changeset.tags))   // shallow copy
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
                    .tags(Object.assign({}, context.changeset.tags))   // shallow copy
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
            var hasChangesetComment = context.changeset && context.changeset.tags.comment && context.changeset.tags.comment.trim().length;
            if (!hasChangesetComment) {
                return t('commit.comment_needed_message');
            }
        }
        return null;
    }


    function changeTags(_, changed, onInput) {
        if (changed.hasOwnProperty('comment')) {
            if (changed.comment === undefined) {
                changed.comment = '';
            }
            if (!onInput) {
                prefs('comment', changed.comment);
                prefs('commentDate', Date.now());
            }
        }
        if (changed.hasOwnProperty('source')) {
            if (changed.source === undefined) {
                prefs('source', null);
            } else if (!onInput) {
                prefs('source', changed.source);
                prefs('commentDate', Date.now());
            }
        }
        // no need to update `prefs` for `hashtags` here since it's done in `updateChangeset`

        updateChangeset(changed, onInput);

        if (_selection) {
            _selection.call(render);
        }
    }


    function findHashtags(tags, commentOnly) {
        var detectedHashtags = commentHashtags();

        if (detectedHashtags.length) {
            // always remove stored hashtags if there are hashtags in the comment - #4304
            prefs('hashtags', null);
        }
        if (!detectedHashtags.length || !commentOnly) {
            detectedHashtags = detectedHashtags.concat(hashtagHashtags());
        }

        var allLowerCase = new Set();
        return detectedHashtags.filter(function(hashtag) {
            // Compare tags as lowercase strings, but keep original case tags
            var lowerCase = hashtag.toLowerCase();
            if (!allLowerCase.has(lowerCase)) {
                allLowerCase.add(lowerCase);
                return true;
            }
            return false;
        });

        // Extract hashtags from `comment`
        function commentHashtags() {
            var matches = (tags.comment || '')
                .replace(/http\S*/g, '')  // drop anything that looks like a URL - #4289
                .match(hashtagRegex);

            return matches || [];
        }

        // Extract and clean hashtags from `hashtags`
        function hashtagHashtags() {
            var matches = (tags.hashtags || '')
                .split(/[,;\s]+/)
                .map(function (s) {
                    if (s[0] !== '#') { s = '#' + s; }    // prepend '#'
                    var matched = s.match(hashtagRegex);
                    return matched && matched[0];
                }).filter(Boolean);                       // exclude falsy

            return matches || [];
        }
    }


    function isReviewRequested(tags) {
        var rr = tags.review_requested;
        if (rr === undefined) return false;
        rr = rr.trim().toLowerCase();
        return !(rr === '' || rr === 'no');
    }


    function updateChangeset(changed, onInput) {
        var tags = Object.assign({}, context.changeset.tags);   // shallow copy

        Object.keys(changed).forEach(function(k) {
            var v = changed[k];
            k = context.cleanTagKey(k);
            if (readOnlyTags.indexOf(k) !== -1) return;

            if (k !== '' && v !== undefined) {
                if (onInput) {
                    tags[k] = v;
                } else {
                    tags[k] = context.cleanTagValue(v);
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
                tags.hashtags = context.cleanTagValue(arr.join(';'));
                prefs('hashtags', tags.hashtags);
            } else {
                delete tags.hashtags;
                prefs('hashtags', null);
            }
        }

        // always update userdetails, just in case user reauthenticates as someone else
        if (_userDetails && _userDetails.changesets_count !== undefined) {
            var changesetsCount = parseInt(_userDetails.changesets_count, 10) + 1;  // #4283
            tags.changesets_count = String(changesetsCount);

            // first 100 edits - new user
            if (changesetsCount <= 100) {
                var s;
                s = prefs('walkthrough_completed');
                if (s) {
                    tags['ideditor:walkthrough_completed'] = s;
                }

                s = prefs('walkthrough_progress');
                if (s) {
                    tags['ideditor:walkthrough_progress'] = s;
                }

                s = prefs('walkthrough_started');
                if (s) {
                    tags['ideditor:walkthrough_started'] = s;
                }
            }
        } else {
            delete tags.changesets_count;
        }

        if (!deepEqual(context.changeset.tags, tags)) {
            context.changeset = context.changeset.update({ tags: tags });
        }
    }


    commit.reset = function() {
        context.changeset = null;
    };


    return utilRebind(commit, dispatch, 'on');
}
