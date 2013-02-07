describe("iD.actions.Connect", function() {
    describe("#enabled", function () {
        it("returns true for two or more nodes", function () {
            expect(iD.actions.Connect(['a', 'b']).enabled()).to.be.true;
        });

        it("returns false for less than two nodes", function () {
            expect(iD.actions.Connect(['a']).enabled()).to.be.false;
        });
    });

    it("removes all but the final node", function() {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'})
            });

        graph = iD.actions.Connect(['a', 'b', 'c'])(graph);

        expect(graph.entity('a')).to.be.undefined;
        expect(graph.entity('b')).to.be.undefined;
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
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                'e': iD.Node({id: 'e'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '|': iD.Way({id: '|', nodes: ['d', 'e']})
            });

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
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                'e': iD.Node({id: 'e'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'a']}),
                '=': iD.Way({id: '=', nodes: ['d', 'e']})
            });

        graph = iD.actions.Connect(['a', 'd'])(graph);

        expect(graph.entity('-').nodes).to.eql(['d', 'b', 'c', 'd']);
    });

    it("merges tags to the surviving node", function() {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', tags: {a: 'a'}}),
                'b': iD.Node({id: 'b', tags: {b: 'b'}}),
                'c': iD.Node({id: 'c', tags: {c: 'c'}})
            });

        graph = iD.actions.Connect(['a', 'b', 'c'])(graph);

        expect(graph.entity('c').tags).to.eql({a: 'a', b: 'b', c: 'c'});
    });

    it("merges memberships to the surviving node", function() {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                '=': iD.Way({id: '=', nodes: ['c', 'd']}),
                'r1': iD.Relation({id: 'r1', members: [{id: 'b', role: 'r1', type: 'node'}]}),
                'r2': iD.Relation({id: 'r2', members: [{id: 'b', role: 'r2', type: 'node'}, {id: 'c', role: 'r2', type: 'node'}]})
            });

        graph = iD.actions.Connect(['b', 'c'])(graph);

        expect(graph.entity('r1').members).to.eql([{id: 'c', role: 'r1', type: 'node'}]);
        expect(graph.entity('r2').members).to.eql([{id: 'c', role: 'r2', type: 'node'}]);
    });
});
