import _extend from 'lodash-es/extend';
import _groupBy from 'lodash-es/groupBy';
import _map from 'lodash-es/map';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { uiCmd } from '../ui';


export function behaviorCopy(context) {
    var keybinding = d3_keybinding('copy');


    function groupEntities(ids, graph) {
        var entities = ids.map(function (id) { return graph.entity(id); });
        return _extend({relation: [], way: [], node: []},
            _groupBy(entities, function(entity) { return entity.type; }));
    }


    function getDescendants(id, graph, descendants) {
        var entity = graph.entity(id),
            i, children;

        descendants = descendants || {};

        if (entity.type === 'relation') {
            children = _map(entity.members, 'id');
        } else if (entity.type === 'way') {
            children = entity.nodes;
        } else {
            children = [];
        }

        for (i = 0; i < children.length; i++) {
            if (!descendants[children[i]]) {
                descendants[children[i]] = true;
                descendants = getDescendants(children[i], graph, descendants);
            }
        }

        return descendants;
    }


    function doCopy() {
        if (!getSelectionText()) d3_event.preventDefault();

        var graph = context.graph(),
            selected = groupEntities(context.selectedIDs(), graph),
            canCopy = [],
            skip = {},
            i, entity;

        for (i = 0; i < selected.relation.length; i++) {
            entity = selected.relation[i];
            if (!skip[entity.id] && entity.isComplete(graph)) {
                canCopy.push(entity.id);
                skip = getDescendants(entity.id, graph, skip);
            }
        }
        for (i = 0; i < selected.way.length; i++) {
            entity = selected.way[i];
            if (!skip[entity.id]) {
                canCopy.push(entity.id);
                skip = getDescendants(entity.id, graph, skip);
            }
        }
        for (i = 0; i < selected.node.length; i++) {
            entity = selected.node[i];
            if (!skip[entity.id]) {
                canCopy.push(entity.id);
            }
        }

        context.copyIDs(canCopy);
    }


    function copy() {
        keybinding.on(uiCmd('⌘C'), doCopy);
        d3_select(document).call(keybinding);
        return copy;
    }

    function getSelectionText() {
        return window.getSelection().toString();
    }

    copy.off = function() {
        d3_select(document).call(keybinding.off);
    };


    return copy;
}
