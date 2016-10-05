import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';

import {
    actionChangeTags,
    actionCopyEntities,
    actionMove
} from '../actions/index';

import {
    geoExtent,
    geoPointInPolygon
} from '../geo/index';

import { modeMove } from '../modes/index';
import { uiCmd } from '../ui/index';


export function behaviorPaste(context) {
    var keybinding = d3keybinding('paste');

    function omitTag(v, k) {
        return (
            k === 'phone' ||
            k === 'fax' ||
            k === 'email' ||
            k === 'website' ||
            k === 'url' ||
            k === 'note' ||
            k === 'description' ||
            k.indexOf('name') !== -1 ||
            k.indexOf('wiki') === 0 ||
            k.indexOf('addr:') === 0 ||
            k.indexOf('contact:') === 0
        );
    }


    function doPaste() {
        d3.event.preventDefault();
        if (context.inIntro()) return;

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
        for (var id in copies) {
            var oldEntity = oldGraph.entity(id),
                newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));
            newIDs.push(newEntity.id);
            context.perform(
                actionChangeTags(newEntity.id, _.omit(newEntity.tags, omitTag))
            );
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(actionMove(newIDs, delta, projection));
        context.enter(modeMove(context, newIDs, baseGraph));
    }


    function paste() {
        keybinding.on(uiCmd('⌘V'), doPaste);
        d3.select(document).call(keybinding);
        return paste;
    }


    paste.off = function() {
        d3.select(document).call(keybinding.off);
    };


    return paste;
}
