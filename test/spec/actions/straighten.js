describe('iD.actionStraighten', function () {
    var projection = d3.geoMercator();

    describe('#disabled', function () {
        it('returns falsy for ways with internal nodes near centerline', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0.01]}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Node({id: 'd', loc: [3, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);
            expect(iD.actionStraighten('-', projection).disabled(graph)).not.to.be.ok;
        });

        it('returns \'too_bendy\' for ways with internal nodes far off centerline', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 1]}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Node({id: 'd', loc: [3, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);
            expect(iD.actionStraighten('-', projection).disabled(graph)).to.equal('too_bendy');
        });

        it('returns \'too_bendy\' for ways with coincident start/end nodes', function () {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0]}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Node({id: 'd', loc: [0, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);
            expect(iD.actionStraighten('-', projection).disabled(graph)).to.equal('too_bendy');
        });
    });


    it('deletes empty nodes', function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0.01], tags: {}}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            ]);

        graph = iD.actionStraighten('-', projection)(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'c']);
        expect(graph.hasEntity('b')).to.eq(undefined);
    });

    it('does not delete tagged nodes', function() {
       var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            ]);

        graph = iD.actionStraighten('-', projection)(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
    });

    it('does not delete nodes connected to other ways', function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0.01]}),
                iD.Node({id: 'c', loc: [2, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                iD.Way({id: '=', nodes: ['b']})
            ]);

        graph = iD.actionStraighten('-', projection)(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionStraighten().transitionable).to.be.true;
        });

        it('straighten at t = 0', function() {
           var graph = iD.Graph([
                    iD.Node({id: 'a', loc: [0, 0]}),
                    iD.Node({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                    iD.Node({id: 'c', loc: [2, -0.01]}),
                    iD.Node({id: 'd', loc: [3, 0]}),
                    iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

            graph = iD.actionStraighten('-', projection)(graph, 0);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0.01, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(-0.01, 1e-6);
        });

        it('straighten at t = 0.5', function() {
           var graph = iD.Graph([
                    iD.Node({id: 'a', loc: [0, 0]}),
                    iD.Node({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                    iD.Node({id: 'c', loc: [2, -0.01]}),
                    iD.Node({id: 'd', loc: [3, 0]}),
                    iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

            graph = iD.actionStraighten('-', projection)(graph, 0.5);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0.005, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(-0.005, 1e-6);
        });

        it('straighten at t = 1', function() {
           var graph = iD.Graph([
                    iD.Node({id: 'a', loc: [0, 0]}),
                    iD.Node({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                    iD.Node({id: 'c', loc: [2, -0.01]}),
                    iD.Node({id: 'd', loc: [3, 0]}),
                    iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

            graph = iD.actionStraighten('-', projection)(graph, 1);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'd']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.hasEntity('c')).to.eq(undefined);
        });
    });

});
