describe("iD.util.relevantChanges", function() {
    var base = iD.Graph({
        'a': iD.Node({id: 'a', loc: [0, 0]}),
        'b': iD.Node({id: 'b', loc: [2, 0]}),
        'c': iD.Node({id: 'c', loc: [2, 2]}),
        'd': iD.Node({id: 'd', loc: [0, 2]}),
        'e': iD.Node({id: 'e', loc: [0, 2]}),
        '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
    });

    it("returns a way that changed", function() {
        var way = iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']}),
            graph = base.replace(way),
            changes = { modified: [way] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'modified',
            entity: way
        }]);
    });

    it("reports an existing modified way, leaving out the verticies", function() {
        var way = iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
            vertex = iD.Node({id: 'e', loc: [0, 3]}),
            graph = base.replace(way).replace(vertex),
            changes = { modified: [way, vertex] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'modified',
            entity: way
        }]);
    });

    it("reports an existing way as modified when a member vertex is modified", function() {
        var vertex = base.entity('e').move([0,3]),
            graph = base.replace(vertex),
            changes = { modified: [vertex], deleted: [] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'modified',
            entity: graph.entity('-')
        }]);
    });

    it("reports a created way containing a moved vertex as being created", function() {
        var vertex = base.entity('e').move([0,3]),
            way = iD.Way({id: '+', nodes: ['e']}),
            graph = base.replace(way).replace(vertex),
            changes = { created: [way], modified: [vertex, graph.entity('-')] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'created',
            entity: way
        }, {
            changeType: 'modified',
            entity: graph.entity('-')
        }]);
    });

    it("reports an existing way with an added vertex as being modified", function() {
        var vertex = iD.Node({id: 'f'}),
            graph = base.replace(vertex).replace(base.entity('-').addNode('f'));
            var changes = {
                created: [vertex],
                modified: [graph.entity('-')]
            },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'modified',
            entity: graph.entity('-')
        }]);
    });

    it("reports a created way with a created vertex as being created", function() {
        var vertex = iD.Node({id: 'f'}),
            way = iD.Way({id: '+', nodes: ['f']}),
            graph = base.replace(vertex).replace(way),
            changes = { created: [way, vertex] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'created',
            entity: way
        }]);
    });

    it("reports an existing vertex with added tags as modified", function() {
        var vertex = iD.Node({id: 'f', tags: {yes: 'it works'}}),
            graph = base.replace(vertex),
            changes = { modified: [vertex] },
            a = iD.util.relevantChanges(graph, changes, base);
        expect(a).to.eql([{
            changeType: 'modified',
            entity: vertex
        }]);
    });
});
