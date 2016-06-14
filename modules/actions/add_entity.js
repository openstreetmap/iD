export function AddEntity(way) {
    return function(graph) {
        return graph.replace(way);
    };
}
