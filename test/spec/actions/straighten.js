describe("iD.actions.Straighten", function () {
    var projection = d3.geo.mercator();

    it("deletes empty nodes", function() {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0], tags: {}}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            });

        graph = iD.actions.Straighten('-', projection)(graph);
        
        expect(graph.hasEntity('b')).to.eq(undefined);
    });

    it("does not delete tagged nodes", function() {
       var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0], tags: {foo: 'bar'}}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            });

        graph = iD.actions.Straighten('-', projection)(graph);
        
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
    });
    
    it("does not delete nodes connected to other ways", function() {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']}),
                '=': iD.Way({id: '=', nodes: ['b']})
            });

        graph = iD.actions.Straighten('-', projection)(graph);
        
        expect(graph.entity('-').nodes).to.have.length(3);
    });
});
