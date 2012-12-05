// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/AddCommand.java
iD.actions.AddNode = function(node) {
    return function(graph) {
        return graph.replace(node, 'added a place');
    };
};
