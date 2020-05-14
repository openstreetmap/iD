import { event as d3_event } from 'd3-selection';

import { t } from '../core/localizer';
import { behaviorOperation } from '../behavior/operation';
import { uiCmd } from '../ui/cmd';
import { utilArrayGroupBy } from '../util';

export function operationCopy(context, selectedIDs) {

    function getFilteredIdsToCopy() {
        return selectedIDs.filter(function(selectedID) {
            var entity = context.graph().hasEntity(selectedID);
            // don't copy untagged vertices separately from ways
            return entity.hasInterestingTags() || entity.geometry(context.graph()) !== 'vertex';
        });
    }

    var operation = function() {

        if (!getSelectionText()) {
            d3_event.preventDefault();
        }

        var graph = context.graph();
        var selected = groupEntities(getFilteredIdsToCopy(), graph);
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
    };


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


    operation.available = function() {
        return getFilteredIdsToCopy().length > 0;
    };


    operation.disabled = function() {
        return false;
    };


    operation.tooltip = function() {
        return selectedIDs.length === 1 ?
            t('operations.copy.description.single') :
            t('operations.copy.description.multiple');
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.copy.annotation.single') :
            t('operations.copy.annotation.multiple', { n: selectedIDs.length.toString() });
    };


    operation.id = 'copy';
    operation.keys = [uiCmd('⌘C')];
    operation.title = t('operations.copy.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
