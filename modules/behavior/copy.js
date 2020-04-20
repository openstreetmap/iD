import { event as d3_event } from 'd3-selection';

import { uiCmd } from '../ui/cmd';
import { utilArrayGroupBy } from '../util';


export function behaviorCopy(context) {

    function groupEntities(ids, graph) {
        var entities = ids.map(function (id) { return graph.entity(id); });
        return Object.assign(
            { relation: [], way: [], node: [] },
            utilArrayGroupBy(entities, 'type')
        );
    }


    function getDescendants(id, graph, descendants) {
        var entity = graph.entity(id);
        var children;

        descendants = descendants || {};

        if (entity.type === 'relation') {
            children = entity.members.map(function(m) { return m.id; });
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
        // prevent copy during low zoom selection
        if (!context.map().withinEditableZoom()) return;

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
