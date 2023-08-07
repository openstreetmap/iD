import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';

import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { utilDisplayLabel, utilObjectOmit, utilQsString, utilStringQs } from '../util';
import { utilArrayIdentical } from '../util/array';
import { t } from '../core/localizer';
import { prefs } from '../core/preferences';

export function behaviorHash(context) {

    // cached window.location.hash
    var _cachedHash = null;
    // allowable latitude range
    var _latitudeLimit = 90 - 1e-8;

    function computedHashParameters() {
        var map = context.map();
        var center = map.center();
        var zoom = map.zoom();
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var oldParams = utilObjectOmit(utilStringQs(window.location.hash),
            ['comment', 'source', 'hashtags', 'walkthrough']
        );
        var newParams = {};

        delete oldParams.id;
        var selected = context.selectedIDs().filter(function(id) {
            return context.hasEntity(id);
        });
        if (selected.length) {
            newParams.id = selected.join(',');
        }

        newParams.map = zoom.toFixed(2) +
            '/' + center[1].toFixed(precision) +
            '/' + center[0].toFixed(precision);

        return Object.assign(oldParams, newParams);
    }

    function computedHash() {
        return '#' + utilQsString(computedHashParameters(), true);
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

    function updateTitle(includeChangeCount) {
        if (!context.setsDocumentTitle()) return;

        var newTitle = computedTitle(includeChangeCount);
        if (document.title !== newTitle) {
            document.title = newTitle;
        }
    }

    function updateHashIfNeeded() {
        if (context.inIntro()) return;

        var latestHash = computedHash();
        if (_cachedHash !== latestHash) {
            _cachedHash = latestHash;

            // Update the URL hash without affecting the browser navigation stack,
            // though unavoidably creating a browser history entry
            window.history.replaceState(null, computedTitle(false /* includeChangeCount */), latestHash);

            // set the title we want displayed for the browser tab/window
            updateTitle(true /* includeChangeCount */);

            // save last used map location for future
            const q = utilStringQs(latestHash);
            if (q.map) {
                prefs('map-location', q.map);
            }
        }
    }

    var _throttledUpdate = _throttle(updateHashIfNeeded, 500);
    var _throttledUpdateTitle = _throttle(function() {
        updateTitle(true /* includeChangeCount */);
    }, 500);

    function hashchange() {

        // ignore spurious hashchange events
        if (window.location.hash === _cachedHash) return;

        _cachedHash = window.location.hash;

        var q = utilStringQs(_cachedHash);
        var mapArgs = (q.map || '').split('/').map(Number);

        if (mapArgs.length < 3 || mapArgs.some(isNaN)) {
            // replace bogus hash
            updateHashIfNeeded();

        } else {
            // don't update if the new hash already reflects the state of iD
            if (_cachedHash === computedHash()) return;

            var mode = context.mode();

            context.map().centerZoom([mapArgs[2], Math.min(_latitudeLimit, Math.max(-_latitudeLimit, mapArgs[1]))], mapArgs[0]);

            if (q.id && mode) {
                var ids = q.id.split(',').filter(function(id) {
                    return context.hasEntity(id);
                });
                if (ids.length &&
                    (mode.id === 'browse' || (mode.id === 'select' && !utilArrayIdentical(mode.selectedIDs(), ids)))) {
                    context.enter(modeSelect(context, ids));
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
            //if (!context.history().hasRestorableChanges()) {
            // targeting specific features: download, select, and zoom to them
            context.zoomToEntity(q.id.split(',')[0], !q.map);
            //}
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

            updateHashIfNeeded();

            behavior.hadLocation = true;
        }

        hashchange();

        updateTitle(false);
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
