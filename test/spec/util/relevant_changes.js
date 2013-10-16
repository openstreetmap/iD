describe("iD.util.relevantChanges", function() {
    var graph = iD.Graph({
        'a': iD.Node({id: 'a', loc: [0, 0]}),
        'b': iD.Node({id: 'b', loc: [2, 0]}),
        'c': iD.Node({id: 'c', loc: [2, 2]}),
        'd': iD.Node({id: 'd', loc: [0, 2]}),
        'e': iD.Node({id: 'e', loc: [0, 2]}),
        '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
    });

    it("returns a way that changed", function() {
        var entities = [graph.entity('-')],
            a = iD.util.relevantChanges(graph, entities);
        expect(a).to.eql(entities);
    });

    it("just returns the way that changed, leaving out the verticies", function() {
        var entities = [
            graph.entity('a'),
            graph.entity('b'),
            graph.entity('c'),
            graph.entity('d'),
            graph.entity('e'),
            graph.entity('-')],
            a = iD.util.relevantChanges(graph, entities),
            way = [graph.entity('-')];
        expect(a).to.eql(way);
    });
});
