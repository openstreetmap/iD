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


const readOnlyTags = [
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
    /^closed:osmose:/
];

// treat most punctuation (except -, _, +, &) as hashtag delimiters - #4398
// from https://stackoverflow.com/a/25575009
const hashtagRegex = /([#＃][^\u2000-\u206F\u2E00-\u2E7F\s\\'!"#$%()*,.\/:;<=>?@\[\]^`{|}~]+)/g;


export function uiCommit(context) {
    const dispatch = d3_dispatch('cancel');
    let _userDetails;
    let _selection;

    const changesetEditor = uiChangesetEditor(context)
        .on('change', changeTags);
    const rawTagEditor = uiSectionRawTagEditor('changeset-tag-editor', context)
        .on('change', changeTags)
        .readOnlyTags(readOnlyTags);
    const commitChanges = uiSectionChanges(context);
    const commitWarnings = uiCommitWarnings(context);


    function commit(selection) {
        _selection = selection;

        // Initialize changeset if one does not exist yet.
        if (!context.changeset) initChangeset();

        loadDerivedChangesetTags();

        selection.call(render);
    }

    function initChangeset() {

        // expire stored comment, hashtags, source after cutoff datetime - #3947 #4899
        const commentDate = +prefs('commentDate') || 0;
        const currDate = Date.now();
        const cutoff = 2 * 86400 * 1000;   // 2 days
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

        const detected = utilDetect();
        const tags = {
            comment: prefs('comment') || '',
            created_by: context.cleanTagValue('iD ' + context.version),
            host: context.cleanTagValue(detected.host),
            locale: context.cleanTagValue(localizer.localeCode())
        };

        // call findHashtags initially - this will remove stored
        // hashtags if any hashtags are found in the comment - #4304
        findHashtags(tags, true);

        const hashtags = prefs('hashtags');
        if (hashtags) {
            tags.hashtags = hashtags;
        }

        const source = prefs('source');
        if (source) {
            tags.source = source;
        }
        const photoOverlaysUsed = context.history().photoOverlaysUsed();
        if (photoOverlaysUsed.length) {
            const sources = (tags.source || '').split(';');

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

            tags.source = context.cleanTagValue(sources.filter(Boolean).join(';'));
        }

        context.changeset = new osmChangeset({ tags: tags });
    }

    // Calculates read-only metadata tags based on the user's editing session and applies
    // them to the changeset.
    function loadDerivedChangesetTags() {

        const osm = context.connection();
        if (!osm) return;

        const tags = Object.assign({}, context.changeset.tags);   // shallow copy

        // assign tags for imagery used
        const imageryUsed = context.cleanTagValue(context.history().imageryUsed().join(';'));
        tags.imagery_used = imageryUsed || 'None';

        // assign tags for closed issues and notes
        const osmClosed = osm.getClosedIDs();
        let itemType;
        if (osmClosed.length) {
            tags['closed:note'] = context.cleanTagValue(osmClosed.join(';'));
        }
        if (services.keepRight) {
            const krClosed = services.keepRight.getClosedIDs();
            if (krClosed.length) {
                tags['closed:keepright'] = context.cleanTagValue(krClosed.join(';'));
            }
        }
        if (services.osmose) {
            const osmoseClosed = services.osmose.getClosedCounts();
            for (itemType in osmoseClosed) {
                tags['closed:osmose:' + itemType] = context.cleanTagValue(osmoseClosed[itemType].toString());
            }
        }

        // remove existing issue counts
        for (const key in tags) {
            if (key.match(/(^warnings:)|(^resolved:)/)) {
                delete tags[key];
            }
        }

        function addIssueCounts(issues, prefix) {
            const issuesByType = utilArrayGroupBy(issues, 'type');
            for (const issueType in issuesByType) {
                const issuesOfType = issuesByType[issueType];
                if (issuesOfType[0].subtype) {
                    const issuesBySubtype = utilArrayGroupBy(issuesOfType, 'subtype');
                    for (const issueSubtype in issuesBySubtype) {
                        const issuesOfSubtype = issuesBySubtype[issueSubtype];
                        tags[prefix + ':' + issueType + ':' + issueSubtype] = context.cleanTagValue(issuesOfSubtype.length.toString());
                    }
                } else {
                    tags[prefix + ':' + issueType] = context.cleanTagValue(issuesOfType.length.toString());
                }
            }
        }

        // add counts of warnings generated by the user's edits
        const warnings = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeIgnored: true, includeDisabledRules: true })
            .warning
            .filter(function(issue) { return issue.type !== 'help_request'; });    // exclude 'fixme' and similar - #8603

        addIssueCounts(warnings, 'warnings');

        // add counts of issues resolved by the user's edits
        const resolvedIssues = context.validator().getResolvedIssues();
        addIssueCounts(resolvedIssues, 'resolved');

        context.changeset = context.changeset.update({ tags: tags });
    }

    function render(selection) {

        const osm = context.connection();
        if (!osm) return;

        const header = selection.selectAll('.header')
            .data([0]);

        const headerTitle = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerTitle
            .append('div')
            .append('h2')
            .call(t.append('commit.title'));

        headerTitle
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.close'))
            .on('click', function() {
                dispatch.call('cancel', this);
            })
            .call(svgIcon('#iD-icon-close'));

        let body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);


        // Changeset Section
        let changesetSection = body.selectAll('.changeset-editor')
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
        let saveSection = body.selectAll('.save-section')
            .data([0]);

        saveSection = saveSection.enter()
            .append('div')
            .attr('class','modal-section save-section fillL')
            .merge(saveSection);

        let prose = saveSection.selectAll('.commit-info')
            .data([0]);

        if (prose.enter().size()) {   // first time, make sure to update user details in prose
            _userDetails = null;
        }

        prose = prose.enter()
            .append('p')
            .attr('class', 'commit-info')
            .call(t.append('commit.upload_explanation'))
            .merge(prose);

        // always check if this has changed, but only update prose.html()
        // if needed, because it can trigger a style recalculation
        osm.userDetails(function(err, user) {
            if (err) return;

            if (_userDetails === user) return;  // no change
            _userDetails = user;

            const userLink = d3_select(document.createElement('div'));

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
                .html(t.html('commit.upload_explanation_with_user', { user: { html: userLink.html() } }));
        });


        // Request Review
        let requestReview = saveSection.selectAll('.request-review')
            .data([0]);

        // Enter
        const requestReviewEnter = requestReview.enter()
            .append('div')
            .attr('class', 'request-review');

        const requestReviewDomId = utilUniqueDomId('commit-input-request-review');

        const labelEnter = requestReviewEnter
            .append('label')
            .attr('for', requestReviewDomId);

        if (!labelEnter.empty()) {
            labelEnter
                .call(uiTooltip()
                    .title(() => t.append('commit.request_review_info'))
                    .placement('top'));
        }

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', requestReviewDomId);

        labelEnter
            .append('span')
            .call(t.append('commit.request_review'));

        // Update
        requestReview = requestReview
            .merge(requestReviewEnter);

        const requestReviewInput = requestReview.selectAll('input')
            .property('checked', isReviewRequested(context.changeset.tags))
            .on('change', toggleRequestReview);


        // Buttons
        let buttonSection = saveSection.selectAll('.buttons')
            .data([0]);

        // enter
        const buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons fillL');

        buttonEnter
            .append('button')
            .attr('class', 'secondary-action button cancel-button')
            .append('span')
            .attr('class', 'label')
            .call(t.append('commit.cancel'));

        const uploadButton = buttonEnter
            .append('button')
            .attr('class', 'action button save-button');

        uploadButton.append('span')
            .attr('class', 'label')
            .call(t.append('commit.save'));

        const uploadBlockerTooltipText = getUploadBlockerMessage();

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

                    for (const key in context.changeset.tags) {
                        // remove any empty keys before upload
                        if (!key) delete context.changeset.tags[key];
                    }

                    context.uploader().save(context.changeset);
                }
            });

        // remove any existing tooltip
        uiTooltip().destroyAny(buttonSection.selectAll('.save-button'));

        if (uploadBlockerTooltipText) {
            buttonSection.selectAll('.save-button')
                .call(uiTooltip()
                    .title(() => uploadBlockerTooltipText)
                    .placement('top'));
        }

        // Raw Tag Editor
        let tagSection = body.selectAll('.tag-section.raw-tag-editor')
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

        let changesSection = body.selectAll('.commit-changes-section')
            .data([0]);

        changesSection = changesSection.enter()
            .append('div')
            .attr('class', 'modal-section commit-changes-section')
            .merge(changesSection);

        // Change summary
        changesSection.call(commitChanges.render);


        function toggleRequestReview() {
            const rr = requestReviewInput.property('checked');
            updateChangeset({ review_requested: (rr ? 'yes' : undefined) });

            tagSection
                .call(rawTagEditor
                    .tags(Object.assign({}, context.changeset.tags))   // shallow copy
                    .render
                );
        }
    }


    function getUploadBlockerMessage() {
        const errors = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all' }).error;

        if (errors.length) {
            return t.append('commit.outstanding_errors_message', { count: errors.length });
        } else {
            const hasChangesetComment = context.changeset && context.changeset.tags.comment && context.changeset.tags.comment.trim().length;
            if (!hasChangesetComment) {
                return t.append('commit.comment_needed_message');
            }
        }
        return null;
    }


    function changeTags(_, changed, onInput) {
        if (changed.hasOwnProperty('comment')) {
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
        let detectedHashtags = commentHashtags();

        if (detectedHashtags.length) {
            // always remove stored hashtags if there are hashtags in the comment - #4304
            prefs('hashtags', null);
        }
        if (!detectedHashtags.length || !commentOnly) {
            detectedHashtags = detectedHashtags.concat(hashtagHashtags());
        }

        const allLowerCase = new Set();
        return detectedHashtags.filter(function(hashtag) {
            // Compare tags as lowercase strings, but keep original case tags
            const lowerCase = hashtag.toLowerCase();
            if (!allLowerCase.has(lowerCase)) {
                allLowerCase.add(lowerCase);
                return true;
            }
            return false;
        });

        // Extract hashtags from `comment`
        function commentHashtags() {
            const matches = (tags.comment || '')
                .replace(/http\S*/g, '')  // drop anything that looks like a URL - #4289
                .match(hashtagRegex);

            return matches || [];
        }

        // Extract and clean hashtags from `hashtags`
        function hashtagHashtags() {
            const matches = (tags.hashtags || '')
                .split(/[,;\s]+/)
                .map(function (s) {
                    if (s[0] !== '#') { s = '#' + s; }    // prepend '#'
                    const matched = s.match(hashtagRegex);
                    return matched && matched[0];
                }).filter(Boolean);                       // exclude falsy

            return matches || [];
        }
    }


    function isReviewRequested(tags) {
        let rr = tags.review_requested;
        if (rr === undefined) return false;
        rr = rr.trim().toLowerCase();
        return !(rr === '' || rr === 'no');
    }


    function updateChangeset(changed, onInput) {
        const tags = Object.assign({}, context.changeset.tags);   // shallow copy

        Object.keys(changed).forEach(function(k) {
            const v = changed[k];
            k = context.cleanTagKey(k);
            if (readOnlyTags.indexOf(k) !== -1) return;

            if (v === undefined) {
                delete tags[k];
            } else if (onInput) {
                tags[k] = v;
            } else {
                tags[k] = context.cleanTagValue(v);
            }
        });

        if (!onInput) {
            // when changing the comment, override hashtags with any found in comment.
            const commentOnly = changed.hasOwnProperty('comment') && (changed.comment !== '');
            const arr = findHashtags(tags, commentOnly);
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
            const changesetsCount = parseInt(_userDetails.changesets_count, 10) + 1;  // #4283
            tags.changesets_count = String(changesetsCount);

            // first 100 edits - new user
            if (changesetsCount <= 100) {
                let s;
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
