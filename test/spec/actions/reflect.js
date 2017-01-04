describe('iD.actionReflect', function() {
    var projection = d3.geoMercator();

    it('does not create or remove nodes', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [4, 0]}),
                iD.Node({id: 'c', loc: [4, 2]}),
                iD.Node({id: 'd', loc: [1, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('-').nodes).to.have.length(5);
    });


    it('reflects across long axis', function () {
        //
        //    d -- c      a ---- b
        //   /     |  ->   \     |
        //  a ---- b        d -- c
        //
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [4, 0]}),
                iD.Node({id: 'c', loc: [4, 2]}),
                iD.Node({id: 'd', loc: [1, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('a').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('c').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
        expect(graph.entity('d').loc[1]).to.be.closeTo(0, 1e-6);
    });


    it('reflects across short axis', function () {
        //
        //    d -- c      c -- d
        //   /     |  ->  |     \
        //  a ---- b      b ---- a
        //
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [4, 0]}),
                iD.Node({id: 'c', loc: [4, 2]}),
                iD.Node({id: 'd', loc: [1, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph);
        expect(graph.entity('a').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('b').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('c').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('d').loc[0]).to.be.closeTo(3, 1e-6);
        expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
    });

});
