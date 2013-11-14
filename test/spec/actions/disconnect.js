describe("iD.actions.Disconnect", function () {
    describe("#disabled", function () {
        it("returns 'not_connected' for a node shared by less than two ways", function () {
            var graph = iD.Graph([iD.Node({id: 'a'})]);

            expect(iD.actions.Disconnect('a').disabled(graph)).to.equal('not_connected');
        });

        it("returns falsy for a node appearing twice in the same way", function () {
            //    a ---- b
            //    |      |
            //    d ---- c
            var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Way({id: 'w', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
            expect(iD.actions.Disconnect('a').disabled(graph)).not.to.be.ok;
        });

        it("returns falsy for a node shared by two or more ways", function () {
            //    a ---- b ---- c
            //           |
            //           d
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: 'd'}),
                    iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                    iD.Way({id: '|', nodes: ['d', 'b']})
                ]);

            expect(iD.actions.Disconnect('b').disabled(graph)).not.to.be.ok;
        });

        it("returns falsy for an intersection of two ways with parent way specified", function () {
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                    iD.Way({id: '|', nodes: ['*', 'd']})
            ]);

            expect(iD.actions.Disconnect('*', ['|']).disabled(graph)).not.to.be.ok;
        });
    });

    it("replaces the node with a new node in all but the first way", function () {
        // Situation:
        //    a ---- b ---- c
        //           |
        //           d
        // Disconnect at b.
        //
        // Expected result:
        //    a ---- b ---- c
        //
        //           e
        //           |
        //           d
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                iD.Way({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actions.Disconnect('b', 'e')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'e']);
    });

    it("replaces the node with a new node in the specified ways", function () {
        // Situation:
        //    a ---- b ==== c
        //           |
        //           d
        // Disconnect - at b.
        //
        // Expected result:
        //    a ---- e  b ==== c
        //              |
        //              d
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['b', 'c']}),
                iD.Way({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actions.Disconnect('b', 'e').limitWays(['-'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'e']);
        expect(graph.entity('=').nodes).to.eql(['b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it("replaces later occurrences in a self-intersecting way", function() {
        // Situtation:
        //  a ---- b
        //   \_    |
        //     \__ c
        //  Disconnect at a
        //
        // Expected result:
        //  a ---- b ---- c ---- d
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Way({id: 'w', nodes: ['a', 'b', 'c', 'a']})
            ]);
        graph = iD.actions.Disconnect('a', 'd')(graph);
        expect(graph.entity('w').nodes).to.eql(['a', 'b', 'c', 'd']);
    });

    it("disconnects a way with multiple intersection points", function() {
        // Situtation:
        //  a = b - c
        //      |   |
        //      e - d
        // Where b starts/ends -.
        // Disconnect at b

        var graph = iD.Graph([
            iD.Node({id: 'a'}),
            iD.Node({id: 'b'}),
            iD.Node({id: 'c'}),
            iD.Node({id: 'd'}),
            iD.Node({id: 'e'}),
            iD.Way({id: 'w1', nodes: ['a', 'b']}),
            iD.Way({id: 'w2', nodes: ['b', 'c', 'd', 'e', 'b']})
        ]);

        graph = iD.actions.Disconnect('b', '*')(graph);

        expect(graph.entity('w1').nodes).to.eql(['a', 'b']);
        expect(graph.entity('w2').nodes).to.eql(['*', 'c', 'd', 'e', '*']);
    });

    it("copies location and tags to the new nodes", function () {
        var tags  = {highway: 'traffic_signals'},
            loc   = [1, 2],
            graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b', loc: loc, tags: tags}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                iD.Way({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actions.Disconnect('b', 'e')(graph);

        // Immutable loc => should be shared by identity.
        expect(graph.entity('b').loc).to.equal(loc);
        expect(graph.entity('e').loc).to.equal(loc);

        // Immutable tags => should be shared by identity.
        expect(graph.entity('b').tags).to.equal(tags);
        expect(graph.entity('e').tags).to.equal(tags);
    });
});
