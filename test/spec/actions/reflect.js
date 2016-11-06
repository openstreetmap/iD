describe('iD.actionReflect', function() {

     it('reflects horizontally - does not change graph length', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes'}})
            ]);

        graph = iD.actionReflect('-')(graph);

        expect(graph.entity('-').nodes).to.have.length(5);
     });

     it('reflects horizontally - alters x value', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes'}})
            ]);
        graph = iD.actionReflect('-')(graph);
        expect(graph.entity('a').loc[0]).to.equal(2); // A should be 2,0 now
        expect(graph.entity('b').loc[0]).to.equal(0); // B should be 0,0 now
        expect(graph.entity('c').loc[0]).to.equal(0); // C should be 0,2 now
        expect(graph.entity('d').loc[0]).to.equal(2); // D should be 2,2 now
    });

     it('reflects horizontally - does not alter y value', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes'}})
            ]);
        graph = iD.actionReflect('-')(graph);
        expect(graph.entity('a').loc[1]).to.equal(0); // A should be 2,0 now
        expect(graph.entity('b').loc[1]).to.equal(0); // B should be 0,0 now
        expect(graph.entity('c').loc[1]).to.equal(2); // C should be 0,2 now
        expect(graph.entity('d').loc[1]).to.equal(2); // D should be 2,2 now
    });

    it('does not flip horizontally if not an area - does not alter x value', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect('-')(graph);
        // should be no change
        expect(graph.entity('a').loc[0]).to.equal(0); 
        expect(graph.entity('b').loc[0]).to.equal(2); 
        expect(graph.entity('c').loc[0]).to.equal(2); 
        expect(graph.entity('d').loc[0]).to.equal(0); 
    });

     it('does not flip horizontally if not an area - does not alter y value', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect('-')(graph);
        // should be no change
        expect(graph.entity('a').loc[1]).to.equal(0); 
        expect(graph.entity('b').loc[1]).to.equal(0); 
        expect(graph.entity('c').loc[1]).to.equal(2); 
        expect(graph.entity('d').loc[1]).to.equal(2); 
    });
});
