describe("iD.actions.UnjoinNode", function () {
    describe("#permitted", function () {
        it("returns false for a node shared by less than two ways", function () {
            var graph = iD.Graph({'a': iD.Node()});

            expect(iD.actions.UnjoinNode('a').permitted(graph)).to.equal(false);
        });

        it("returns true for a node shared by two or more ways", function () {
            //    a ---- b ---- c
            //           |
            //           d
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'd'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                    '|': iD.Way({id: '|', nodes: ['d', 'b']})
                });

            expect(iD.actions.UnjoinNode('b').permitted(graph)).to.equal(true);
        });
    });

    it("replaces the node with a new node in all but the first way", function () {
        // Situation:
        //    a ---- b ---- c
        //           |
        //           d
        // Split at b.
        //
        // Expected result:
        //    a ---- b ---- c
        //
        //           e
        //           |
        //           d
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '|': iD.Way({id: '|', nodes: ['d', 'b']})
            });

        graph = iD.actions.UnjoinNode('b', 'e')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'e']);
    });

    it("copies location and tags to the new nodes", function () {
        var tags  = {highway: 'traffic_signals'},
            loc   = [1, 2],
            graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b', loc: loc, tags: tags}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '|': iD.Way({id: '|', nodes: ['d', 'b']})
            });

        graph = iD.actions.UnjoinNode('b', 'e')(graph);

        // Immutable loc => should be shared by identity.
        expect(graph.entity('b').loc).to.equal(loc);
        expect(graph.entity('e').loc).to.equal(loc);

        // Immutable tags => should be shared by identity.
        expect(graph.entity('b').tags).to.equal(tags);
        expect(graph.entity('e').tags).to.equal(tags);
    });
});
