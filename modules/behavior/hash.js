import { throttle } from 'es-toolkit';

import { select as d3_select } from 'd3-selection';

import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect, modeSelectNote } from '../modes';
import { utilQsString, utilStringQs } from '../util';
import { utilArrayIdentical } from '../util/array';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { localizer, t } from '../core/localizer';
import { prefs } from '../core/preferences';

function getNewHash(arg) {
    const original = utilStringQs(window.location.hash);
    const update = typeof arg === 'function' ? arg(original) : arg;
    if (!update || typeof update !== 'object') return;

    const updated = { ...original, ...update };
    Object.keys(update)
        .filter(key => update[key] === null || update[key] === undefined)
        .forEach(key => delete updated[key]);

    return '#' + utilQsString(updated, true);
}

/**
 * Updates the URL hash by applying a partial patch.
 *
 * Keys with nullish values will be removed from the hash.
 *
 * @param {(?Object<string, any>|function (Object<string, any>): Object<string, any>)} updater Either
 * - a plain object of key/value pairs to merge into the hash, or
 * - a function `(currentHash) => patchObject` that returns such an object.
 * @returns {boolean} Whether the hash was updated.
 */
export function patchHash(updater) {
    if (!updater || !['function', 'object'].includes(typeof updater)) return false;

    const latestHash = getNewHash(updater);
    if (!latestHash || window.location.hash === latestHash) return false;

    // Update the URL hash without affecting the browser navigation stack,
    // though unavoidably creating a browser history entry
    window.history.replaceState(null, '', latestHash);

    // save last used map location for future
    const { map } = utilStringQs(latestHash);
    if (map) prefs('map-location', map);
    return true;
}

export function behaviorHash(context) {

    // allowable latitude range
    var _latitudeLimit = 90 - 1e-8;

    function computeHashUpdate() {
        if (context.inIntro()) return null;

        var map = context.map();
        var center = map.center();
        var zoom = map.zoom();
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        const newParams = {
            comment: null,
            source: null,
            hashtags: null,
            walkthrough: null,
            id: null
        };

        var selected = context.selectedIDs().filter(function(id) {
            return context.hasEntity(id);
        });
        if (selected.length) {
            newParams.id = selected.join(',');
        } else if (context.selectedNoteID()) {
            newParams.id = `note/${context.selectedNoteID()}`;
        }

        newParams.map = zoom.toFixed(2) +
            '/' + center[1].toFixed(precision) +
            '/' + center[0].toFixed(precision);

        return newParams;
    }

    function computedTitle(includeChangeCount) {

        var baseTitle = context.documentTitleBase() || 'iD';
        var contextual;
        var changeCount;
        var titleID;

        var selected = context.selectedIDs().filter(function(id) {
            return context.hasEntity(id);
        });
        if (selected.length) {
            var firstLabel = utilDisplayLabel(context.entity(selected[0]), context.graph());
            if (selected.length > 1) {
                contextual = t('title.labeled_and_more', {
                    labeled: firstLabel,
                    count: selected.length - 1
                });
            } else {
                contextual = firstLabel;
            }
            titleID = 'context';
        }

        if (includeChangeCount) {
            changeCount = context.history().difference().summary().length;
            if (changeCount > 0) {
                titleID = contextual ? 'changes_context' : 'changes';
            }
        }

        if (titleID) {
            return t('title.format.' + titleID, {
                changes: changeCount,
                base: baseTitle,
                context: contextual
            });
        }

        return baseTitle;
    }

    function updateTitle(includeChangeCount = true) {
        if (!context.setsDocumentTitle()) return;

        var newTitle = computedTitle(includeChangeCount);
        if (document.title !== newTitle) {
            document.title = newTitle;
        }
    }

    var _throttledUpdate = throttle(() => {
        patchHash(computeHashUpdate);
        updateTitle();
    }, 500);
    var _throttledUpdateTitle = throttle(updateTitle, 500);

    function hashchange() {
        var q = utilStringQs(window.location.hash);

        if (q.theme) {
          context.theme(q.theme);
        }

        if (q.locale && q.locale !== localizer.preferredLocaleCodes().join(',')) {
          localizer.preferredLocaleCodes(q.locale);
          context.ui().restart();
        }

        var mapArgs = (q.map || '').split('/').map(Number);
        if (mapArgs.length < 3 || mapArgs.some(isNaN)) {
            // replace bogus hash
            patchHash(computeHashUpdate);
            updateTitle();
        } else {
            // don't update if the new hash already reflects the state of iD
            if (window.location.hash === getNewHash(computeHashUpdate)) return;

            var mode = context.mode();

            context.map().centerZoom([mapArgs[2], Math.min(_latitudeLimit, Math.max(-_latitudeLimit, mapArgs[1]))], mapArgs[0]);

            if (q.id && mode) {
                var ids = q.id.split(',').filter(function(id) {
                    return context.hasEntity(id) || id.startsWith('note/');
                });
                if (ids.length && ['browse', 'select-note', 'select'].includes(mode.id)) {
                    if (ids.length === 1 && ids[0].startsWith('note/')) {
                        context.enter(modeSelectNote(context, ids[0]));
                    } else if (!utilArrayIdentical(mode.selectedIDs(), ids)) {
                        context.enter(modeSelect(context, ids));
                    }
                    return;
                }
            }

            var center = context.map().center();
            var dist = geoSphericalDistance(center, [mapArgs[2], mapArgs[1]]);
            var maxdist = 500;

            // Don't allow the hash location to change too much while drawing
            // This can happen if the user accidentally hit the back button.  #3996
            if (mode && mode.id.match(/^draw/) !== null && dist > maxdist) {
                context.enter(modeBrowse(context));
                return;
            }
        }
    }

    function behavior() {
        context.map()
            .on('move.behaviorHash', _throttledUpdate);

        context.history()
            .on('change.behaviorHash', _throttledUpdateTitle);

        context
            .on('enter.behaviorHash', _throttledUpdate);

        d3_select(window)
            .on('hashchange.behaviorHash', hashchange);

        var q = utilStringQs(window.location.hash);

        if (q.id) {
            // targeting specific features: download, select, and zoom to them
            const selectIds = q.id.split(',');
            if (selectIds.length === 1 && selectIds[0].startsWith('note/')) {
                const noteId = selectIds[0].split('/')[1];
                context.moveToNote(noteId, !q.map);
            } else {
                context.zoomToEntities(
                    // convert ids to short form id: node/123 -> n123
                    selectIds.map(id => id.replace(/([nwr])[^/]*\//, '$1')),
                    !q.map);
            }
        }

        if (q.walkthrough === 'true') {
            behavior.startWalkthrough = true;
        }

        if (q.map) {
            behavior.hadLocation = true;
        } else if (!q.id && prefs('map-location')) {
            // center map at last visited map location
            const mapArgs = prefs('map-location').split('/').map(Number);
            context.map().centerZoom([mapArgs[2], Math.min(_latitudeLimit, Math.max(-_latitudeLimit, mapArgs[1]))], mapArgs[0]);

            patchHash(computeHashUpdate);

            behavior.hadLocation = true;
        }

        hashchange();

        updateTitle(false /* includeChangeCount */);
    }

    behavior.off = function() {
        _throttledUpdate.cancel();
        _throttledUpdateTitle.cancel();

        context.map()
            .on('move.behaviorHash', null);

        context
            .on('enter.behaviorHash', null);

        d3_select(window)
            .on('hashchange.behaviorHash', null);

        window.location.hash = '';
    };

    return behavior;
}
