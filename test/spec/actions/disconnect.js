describe('iD.actionDisconnect', function () {
    describe('#disabled', function () {
        it('returns \'not_connected\' for a node shared by less than two ways', function () {
            var graph = iD.coreGraph([iD.osmNode({id: 'a'})]);
            expect(iD.actionDisconnect('a').disabled(graph)).to.equal('not_connected');
        });

        it('returns falsy for the closing node in a closed line', function () {
            //    a ---- b
            //    |      |
            //    d ---- c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: 'w', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
            expect(iD.actionDisconnect('a').disabled(graph)).not.to.be.ok;
        });

        it('returns not_connected for the closing node in a closed area', function () {
            //    a ---- b
            //    |      |
            //    d ---- c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: 'w', nodes: ['a', 'b', 'c', 'd', 'a'], tags: {area: 'yes'}})
            ]);
            expect(iD.actionDisconnect('a').disabled(graph)).to.equal('not_connected');
        });

        it('returns falsy for a shared non-closing node in an area', function () {
            //    a --- b --- c
            //          |     |
            //          e --- d
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a'}),
                    iD.osmNode({id: 'b'}),
                    iD.osmNode({id: 'c'}),
                    iD.osmNode({id: 'd'}),
                    iD.osmNode({id: 'e'}),
                    iD.osmWay({id: 'w', nodes: ['a', 'b', 'c', 'd', 'e', 'b', 'a'], tags: {area: 'yes'}})
            ]);

            expect(iD.actionDisconnect('b').disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for a node shared by two or more ways', function () {
            //    a ---- b ---- c
            //           |
            //           d
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a'}),
                    iD.osmNode({id: 'b'}),
                    iD.osmNode({id: 'c'}),
                    iD.osmNode({id: 'd'}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                    iD.osmWay({id: '|', nodes: ['d', 'b']})
                ]);

            expect(iD.actionDisconnect('b').disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for an intersection of two ways with parent way specified', function () {
            //    a ---- b ---- c
            //           |
            //           d
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a'}),
                    iD.osmNode({id: 'b'}),
                    iD.osmNode({id: 'c'}),
                    iD.osmNode({id: 'd'}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                    iD.osmWay({id: '|', nodes: ['d', 'b']})
            ]);

            expect(iD.actionDisconnect('b', ['|']).disabled(graph)).not.to.be.ok;
        });

        it('returns \'relation\' for a node connecting any two members of the same relation', function () {
            // Covers restriction relations, routes, multipolygons.
            // a ---- b ---- c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: 'f', nodes: ['a', 'b']}),
                iD.osmWay({id: 't', nodes: ['b', 'c']}),
                iD.osmRelation({id: 'r', members: [
                    { id: 'f' },
                    { id: 't' }
                ]})
            ]);

            expect(iD.actionDisconnect('b').disabled(graph)).to.eql('relation');
        });

        it('returns falsy for a node connecting two members of an unaffected relation', function () {
            // a ---- b ---- c
            //        |
            //        d

            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: 'f', nodes: ['a', 'b']}),
                iD.osmWay({id: 't', nodes: ['b', 'c']}),
                iD.osmWay({id: '|', nodes: ['b', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    { id: 'f' },
                    { id: 't' }
                ]})
            ]);

            expect(iD.actionDisconnect('b').limitWays(['|']).disabled(graph)).not.to.be.ok;
        });
    });

    it('replaces the node with a new node in all but the first way', function () {
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
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actionDisconnect('b', 'e')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'e']);
    });

    it('replaces the node with a new node in the specified ways', function () {
        // Situation:
        //    a ---- b ==== c
        //           |
        //           d
        // Disconnect - at b.
        //
        // Expected result:
        //    a ---- e   b ==== c
        //               |
        //               d
        //
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actionDisconnect('b', 'e').limitWays(['-'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'e']);
        expect(graph.entity('=').nodes).to.eql(['b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it('preserves the closed way when part of a larger disconnect operation', function () {
        // Situation:
        //    a ---- bb === c
        //           =   ==
        //           = ==
        //           d
        // Disconnect - at b (whilst == is selected).
        //
        // Expected result:
        //    a ---- b   ee === c
        //               =   ==
        //               = ==
        //               d
        //
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c', 'd', 'b']})
            ]);

        graph = iD.actionDisconnect('b', 'e').limitWays(['='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b']);
        expect(graph.entity('=').nodes).to.eql(['e', 'c', 'd', 'e']);
    });

    it('replaces later occurrences in a self-intersecting way', function() {
        // Situation:
        //  a --- b
        //   \   /
        //    \ /
        //     c
        // Disconnect at a
        //
        // Expected result:
        //  a --- b
        //        |
        //  d --- c
        //
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: 'w', nodes: ['a', 'b', 'c', 'a']})
            ]);
        graph = iD.actionDisconnect('a', 'd')(graph);
        expect(graph.entity('w').nodes).to.eql(['a', 'b', 'c', 'd']);
    });

    it('disconnects a way with multiple intersection points', function() {
        // Situation:
        //  a == b -- c
        //       |    |
        //       e -- d
        // 2 ways a-b  and  b-c-d-e-b
        //
        // Disconnect at b
        //
        // Expected Result:
        //  a == b   * -- c
        //           |    |
        //           e -- d
        // 2 ways a-b  and  *-c-d-e-*
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: 'w1', nodes: ['a', 'b']}),
            iD.osmWay({id: 'w2', nodes: ['b', 'c', 'd', 'e', 'b']})
        ]);

        graph = iD.actionDisconnect('b', '*')(graph);

        expect(graph.entity('w1').nodes).to.eql(['a', 'b']);
        expect(graph.entity('w2').nodes).to.eql(['*', 'c', 'd', 'e', '*']);
    });

    it('disconnects a shared non-closing node in an area', function() {
        // Situation:
        //  a -- b -- c
        //       |    |
        //       e -- d
        //
        // Disconnect at b
        //
        // Expected Result:
        //  a -- b -- c
        //  |         |
        //  * -- e -- d
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: 'w', nodes: ['a', 'b', 'c', 'd', 'e', 'b', 'a'], tags: {area: 'yes'}})
        ]);

        graph = iD.actionDisconnect('b', '*')(graph);

        expect(graph.entity('w').nodes).to.eql(['a', 'b', 'c', 'd', 'e', '*', 'a']);
    });

    it('disconnects the closing node of an area without breaking the area', function() {
        // Situation:
        // a --- b --- d
        //  \   / \   /
        //   \ /   \ /
        //    c     e
        // 2 areas: a-b-c-a  and  b-d-e-b
        //
        // Disconnect at b
        //
        // Expected Result:
        // a --- b   * --- d
        //  \   /     \   /
        //   \ /       \ /
        //    c         e
        // 2 areas: a-b-c-a  and  *-d-e-*

        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: 'w1', nodes: ['a', 'b', 'c', 'a'], tags: {area: 'yes'}}),
            iD.osmWay({id: 'w2', nodes: ['b', 'd', 'e', 'b'], tags: {area: 'yes'}})
        ]);

        graph = iD.actionDisconnect('b', '*')(graph);

        expect(graph.entity('w1').nodes).to.eql(['a', 'b', 'c', 'a']);
        expect(graph.entity('w2').nodes).to.eql(['*', 'd', 'e', '*']);
    });

    it('disconnects multiple closing nodes of multiple areas without breaking the areas', function() {
        // Situation:
        // a --- b --- d
        //  \   / \   /
        //   \ /   \ /
        //    c     e
        // 2 areas: b-c-a-b  and  b-d-e-b
        //
        // Disconnect at b
        //
        // Expected Result:
        // a --- b   * --- d
        //  \   /     \   /
        //   \ /       \ /
        //    c         e
        // 2 areas: b-c-a-b  and  *-d-e-*

        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: 'w1', nodes: ['b', 'c', 'a', 'b'], tags: {area: 'yes'}}),
            iD.osmWay({id: 'w2', nodes: ['b', 'd', 'e', 'b'], tags: {area: 'yes'}})
        ]);

        graph = iD.actionDisconnect('b', '*')(graph);

        expect(graph.entity('w1').nodes).to.eql(['b', 'c', 'a', 'b']);
        expect(graph.entity('w2').nodes).to.eql(['*', 'd', 'e', '*']);
    });

    it('copies location and tags to the new nodes', function () {
        var tags  = {highway: 'traffic_signals'},
            loc   = [1, 2],
            graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b', loc: loc, tags: tags}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['d', 'b']})
            ]);

        graph = iD.actionDisconnect('b', 'e')(graph);

        // Immutable loc => should be shared by identity.
        expect(graph.entity('b').loc).to.equal(loc);
        expect(graph.entity('e').loc).to.equal(loc);

        // Immutable tags => should be shared by identity.
        expect(graph.entity('b').tags).to.equal(tags);
        expect(graph.entity('e').tags).to.equal(tags);
    });
});
