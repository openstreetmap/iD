import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import {
    actionMergeTags
} from '../actions';

import { uiCmd } from '../ui';


export function behaviorPasteTags(context) {
    var keybinding = d3_keybinding('paste');


    function doPasteTags() {
        d3_event.preventDefault();
        var action = actionMergeTags(context.copyIDs(), context.selectedIDs());
        context.perform(action);
    }


    function pasteTags() {
        keybinding.on(uiCmd('⌘V'), doPasteTags);
        d3_select(document).call(keybinding);
        return pasteTags;
    }


    pasteTags.off = function() {
        d3_select(document).call(keybinding.off);
    };


    return pasteTags;
}
