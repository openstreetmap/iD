module.exports = function(way) {
    return function(graph) {
        return graph.replace(way);
    };
};
