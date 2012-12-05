iD.actions.changeTags = function(node, tags) {
    return function(graph) {
        return graph.replace(node.update({
            tags: tags
        }), 'changed tags');
    };
};
