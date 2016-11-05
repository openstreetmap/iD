describe('iD.actionFlip', function() {
    var projection = d3.geoMercator();

     it('flips horizontally - does not change graph length', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes'}})
            ]);

        graph = iD.actionFlip('-', false, projection)(graph);

        expect(graph.entity('-').nodes).to.have.length(5);
     });

     it('flips horizontally - alters x value', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes'}})
            ]);
        graph = iD.actionFlip('-', false, projection)(graph);

         expect(graph.entity('a').loc[0]).to.equal(2); // A should be 2,0 now
         expect(graph.entity('b').loc[0]).to.equal(0); // B should be 0,0 now
         expect(graph.entity('c').loc[0]).to.equal(0); // C should be 0,2 now
         expect(graph.entity('d').loc[0]).to.equal(2); // D should be 2,0 now
    });

});
