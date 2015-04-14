describe("iD.actions.Connect", function() {
    it("removes all but the final node", function() {
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'})
            ]);

        graph = iD.actions.Connect(['a', 'b', 'c'])(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.entity('c')).not.to.be.undefined;
    });

    it("replaces non-surviving nodes in parent ways", function() {
        // a --- b --- c
        //
        //       e
        //       |
        //       d
        //
        // Connect [e, b].
        //
        // Expected result:
        //
        // a --- b --- c
        //       |
        //       d
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Node({id: 'e'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                iD.Way({id: '|', nodes: ['d', 'e']})
            ]);

        graph = iD.actions.Connect(['e', 'b'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it("handles circular ways", function() {
        // c -- a   d === e
        // |   /
        // |  /
        // | /
        // b
        //
        // Connect [a, d].
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'd'}),
                iD.Node({id: 'e'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'a']}),
                iD.Way({id: '=', nodes: ['d', 'e']})
            ]);

        graph = iD.actions.Connect(['a', 'd'])(graph);

        expect(graph.entity('-').nodes).to.eql(['d', 'b', 'c', 'd']);
    });

    it("merges adjacent nodes", function() {
        // a --- b --- c
        //
        // Connect [b, c]
        //
        // Expected result:
        //
        // a --- c
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            ]);

        graph = iD.actions.Connect(['b', 'c'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'c']);
        expect(graph.hasEntity('b')).to.be.undefined;
    });

    it("merges adjacent nodes with connections", function() {
        // a --- b --- c
        //       |
        //       d
        //
        // Connect [b, c]
        //
        // Expected result:
        //
        // a --- c
        //       |
        //       d
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'c'}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                iD.Way({id: '|', nodes: ['b', 'd']})
            ]);

        graph = iD.actions.Connect(['b', 'c'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'c']);
        expect(graph.entity('|').nodes).to.eql(['c', 'd']);
        expect(graph.hasEntity('b')).to.be.undefined;
    });

    it("deletes a degenerate way", function() {
        // a --- b
        //
        // Connect [a, b]
        //
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Way({id: '-', nodes: ['a', 'b']})
            ]);

        graph = iD.actions.Connect(['a', 'b'])(graph);

        expect(graph.hasEntity('a')).to.be.undefined;
        expect(graph.hasEntity('-')).to.be.undefined;
    });

    it("merges tags to the surviving node", function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', tags: {a: 'a'}}),
                iD.Node({id: 'b', tags: {b: 'b'}}),
                iD.Node({id: 'c', tags: {c: 'c'}})
            ]);

        graph = iD.actions.Connect(['a', 'b', 'c'])(graph);

        expect(graph.entity('c').tags).to.eql({a: 'a', b: 'b', c: 'c'});
    });

    it("merges memberships to the surviving node", function() {
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Node({id: 'c'}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['c', 'd']}),
                iD.Relation({id: 'r1', members: [{id: 'b', role: 'r1', type: 'node'}]}),
                iD.Relation({id: 'r2', members: [{id: 'b', role: 'r2', type: 'node'}, {id: 'c', role: 'r2', type: 'node'}]})
            ]);

        graph = iD.actions.Connect(['b', 'c'])(graph);

        expect(graph.entity('r1').members).to.eql([{id: 'c', role: 'r1', type: 'node'}]);
        expect(graph.entity('r2').members).to.eql([{id: 'c', role: 'r2', type: 'node'}]);
    });
});
