import { t } from '../core/localizer';
import { behaviorOperation } from '../behavior/operation';
import { uiCmd } from '../ui/cmd';
import { utilArrayGroupBy, utilTotalExtent } from '../util';

export function operationCopy(context, selectedIDs) {

    function getFilteredIdsToCopy() {
        return selectedIDs.filter(function(selectedID) {
            var entity = context.graph().hasEntity(selectedID);
            // don't copy untagged vertices separately from ways
            return entity.hasInterestingTags() || entity.geometry(context.graph()) !== 'vertex';
        });
    }

    var operation = function() {

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
        if (_point &&
            (canCopy.length !== 1 || graph.entity(canCopy[0]).type !== 'node')) {
            // store the anchor coordinates if copying more than a single node
            context.copyLonLat(context.projection.invert(_point));
        } else {
            context.copyLonLat(null);
        }

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


    operation.available = function() {
        return getFilteredIdsToCopy().length > 0;
    };


    operation.disabled = function() {
        var extent = utilTotalExtent(getFilteredIdsToCopy(), context.graph());
        if (extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        }
        return false;
    };


    operation.availableForKeypress = function() {
        var selection = window.getSelection && window.getSelection();
        // if the user has text selected then let them copy that, not the selected feature
        return !selection || !selection.toString();
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t.append('operations.copy.' + disable, { n: selectedIDs.length }) :
            t.append('operations.copy.description', { n: selectedIDs.length });
    };


    operation.annotation = function() {
        return t('operations.copy.annotation', { n: selectedIDs.length });
    };


    var _point;
    operation.point = function(val) {
        _point = val;
        return operation;
    };


    operation.id = 'copy';
    operation.keys = [uiCmd('⌘C')];
    operation.title = t.append('operations.copy.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
