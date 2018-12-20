import _extend from 'lodash-es/extend';
import _groupBy from 'lodash-es/groupBy';
import _map from 'lodash-es/map';

import { event as d3_event } from 'd3-selection';
import { uiCmd } from '../ui';


export function behaviorCopy(context) {

    function groupEntities(ids, graph) {
        var entities = ids.map(function (id) { return graph.entity(id); });
        return _extend({relation: [], way: [], node: []},
            _groupBy(entities, function(entity) { return entity.type; }));
    }


    function getDescendants(id, graph, descendants) {
        var entity = graph.entity(id);
        var children;

        descendants = descendants || {};

        if (entity.type === 'relation') {
            children = _map(entity.members, 'id');
        } else if (entity.type === 'way') {
            children = entity.nodes;
        } else {
            children = [];
        }

        for (var i = 0; i < children.length; i++) {
            if (!descendants[children[i]]) {
                descendants[children[i]] = true;
                descendants = getDescendants(children[i], graph, descendants);
            }
        }

        return descendants;
    }


    function getSelectionText() {
        return window.getSelection().toString();
    }


    function doCopy() {
        if (!getSelectionText()) {
            d3_event.preventDefault();
        }

        var graph = context.graph();
        var selected = groupEntities(context.selectedIDs(), graph);
        var canCopy = [];
        var skip = {};
        var entity;
        var i;

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


    function behavior() {
        context.keybinding().on(uiCmd('⌘C'), doCopy);
        return behavior;
    }

    behavior.off = function() {
        context.keybinding().off(uiCmd('⌘C'));
    };


    return behavior;
}
