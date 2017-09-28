import _invert from 'lodash-es/invert';
import _mapValues from 'lodash-es/mapValues';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import {
    actionCopyEntities,
    actionMove
} from '../actions';

import {
    geoExtent,
    geoPointInPolygon
} from '../geo/';

import { modeMove } from '../modes';
import { uiCmd } from '../ui';


export function behaviorPaste(context) {
    var keybinding = d3_keybinding('paste');


    function doPaste() {
        d3_event.preventDefault();

        var baseGraph = context.graph(),
            mouse = context.mouse(),
            projection = context.projection,
            viewport = geoExtent(projection.clipExtent()).polygon();

        if (!geoPointInPolygon(mouse, viewport)) return;

        var extent = geoExtent(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            newIDs = [];

        if (!oldIDs.length) return;

        var action = actionCopyEntities(oldIDs, oldGraph);
        context.perform(action);

        var copies = action.copies();
        var originals = _invert(_mapValues(copies, 'id'));
        for (var id in copies) {
            var oldEntity = oldGraph.entity(id),
                newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));

            // Exclude child nodes from newIDs if their parent way was also copied.
            var parents = context.graph().parentWays(newEntity),
                parentCopied = false;
            for (var i = 0; i < parents.length; i++) {
                if (originals[parents[i].id]) {
                    parentCopied = true;
                    break;
                }
            }

            if (!parentCopied) {
                newIDs.push(newEntity.id);
            }
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(actionMove(newIDs, delta, projection));
        context.enter(modeMove(context, newIDs, baseGraph));
    }


    function paste() {
        keybinding.on(uiCmd('⌘V'), doPaste);
        d3_select(document).call(keybinding);
        return paste;
    }


    paste.off = function() {
        d3_select(document).call(keybinding.off);
    };


    return paste;
}
