iD.behavior.Copy = function(context) {
    var keybinding = d3.keybinding('copy');

    function groupEntities(ids, graph) {
        var entities = ids.map(function (id) { return graph.entity(id); });
        return _.extend({relation: [], way: [], node: []},
            _.groupBy(entities, function(entity) { return entity.type; }));
    }

    function getDescendants(id, graph, descendants) {
        var entity = graph.entity(id),
            i, children;

        descendants = descendants || {};

        if (entity.type === 'relation') {
            children = _.pluck(entity.members, 'id');
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
        d3.event.preventDefault();
        if (context.inIntro()) return;

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
        keybinding.on(iD.ui.cmd('⌘C'), doCopy);
        d3.select(document).call(keybinding);
        return copy;
    }

    copy.off = function() {
        d3.select(document).call(keybinding.off);
    };

    return copy;
};
