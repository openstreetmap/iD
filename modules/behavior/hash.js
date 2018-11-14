import _assign from 'lodash-es/assign';
import _omit from 'lodash-es/omit';
import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';

import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes';

import {
    utilQsString,
    utilStringQs
} from '../util';


export function behaviorHash(context) {
    var s0 = null; // cached window.location.hash
    var lat = 90 - 1e-8; // allowable latitude range


    var parser = function(map, s) {
        var q = utilStringQs(s);
        var args = (q.map || '').split('/').map(Number);

        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash

        } else if (s !== formatter(map).slice(1)) {   // hash has changed
            var mode = context.mode(),
                dist = geoSphericalDistance(map.center(), [args[2], args[1]]),
                maxdist = 500;

            // Don't allow the hash location to change too much while drawing
            // This can happen if the user accidently hit the back button.  #3996
            if (mode && mode.id.match(/^draw/) !== null && dist > maxdist) {
                context.enter(modeBrowse(context));
            }

            map.centerZoom([args[2], Math.min(lat, Math.max(-lat, args[1]))], args[0]);
        }
    };


    var formatter = function(map) {
        var center = map.center();
        var zoom = map.zoom();
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var q = _omit(utilStringQs(window.location.hash.substring(1)),
            ['comment', 'source', 'hashtags', 'walkthrough']
        );
        var newParams = {};

        delete q.id;
        var selected = context.selectedIDs().filter(function(id) {
            return !context.entity(id).isNew();
        });
        if (selected.length) {
            newParams.id = selected.join(',');
        }

        newParams.map = zoom.toFixed(2) +
            '/' + center[1].toFixed(precision) +
            '/' + center[0].toFixed(precision);

        return '#' + utilQsString(_assign(q, newParams), true);
    };


    function update() {
        if (context.inIntro()) return;
        var s1 = formatter(context.map());
        if (s0 !== s1) {
            window.location.replace(s0 = s1);  // don't recenter the map!
        }
    }


    var throttledUpdate = _throttle(update, 500);


    function hashchange() {
        if (window.location.hash === s0) return;  // ignore spurious hashchange events
        if (parser(context.map(), (s0 = window.location.hash).substring(1))) {
            update(); // replace bogus hash
        }
    }


    function behavior() {
        context.map()
            .on('move.hash', throttledUpdate);

        context
            .on('enter.hash', throttledUpdate);

        d3_select(window)
            .on('hashchange.hash', hashchange);

        if (window.location.hash) {
            var q = utilStringQs(window.location.hash.substring(1));

            if (q.id) {
                context.zoomToEntity(q.id.split(',')[0], !q.map);
            }

            if (q.comment) {
                context.storage('comment', q.comment);
                context.storage('commentDate', Date.now());
            }

            if (q.source) {
                context.storage('source', q.source);
                context.storage('commentDate', Date.now());
            }

            if (q.hashtags) {
                context.storage('hashtags', q.hashtags);
            }

            if (q.walkthrough === 'true') {
                behavior.startWalkthrough = true;
            }

            hashchange();

            if (q.map) {
                behavior.hadHash = true;
            }
        }
    }


    behavior.off = function() {
        throttledUpdate.cancel();

        context.map()
            .on('move.hash', null);

        context
            .on('enter.hash', null);

        d3_select(window)
            .on('hashchange.hash', null);

        window.location.hash = '';
    };


    return behavior;
}
