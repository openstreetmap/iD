describe("iD.actions.Join", function () {
    describe("#enabled", function () {
        it("returns true for ways that share an end/start node", function () {
            // a --> b ==> c
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                    '=': iD.Way({id: '=', nodes: ['b', 'c']})
                });

            expect(iD.actions.Join('-', '=').enabled(graph)).to.be.true;
        });

        it("returns true for ways that share a start/end node", function () {
            // a <-- b <== c
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['b', 'a']}),
                    '=': iD.Way({id: '=', nodes: ['c', 'b']})
                });

            expect(iD.actions.Join('-', '=').enabled(graph)).to.be.true;
        });

        it("returns true for ways that share a start/start node", function () {
            // a <-- b ==> c
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['b', 'a']}),
                    '=': iD.Way({id: '=', nodes: ['b', 'c']})
                });

            expect(iD.actions.Join('-', '=').enabled(graph)).to.be.true;
        });

        it("returns true for ways that share an end/end node", function () {
            // a --> b <== c
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                    '=': iD.Way({id: '=', nodes: ['c', 'b']})
                });

            expect(iD.actions.Join('-', '=').enabled(graph)).to.be.true;
        });

        it("returns false for ways that don't share the necessary nodes", function () {
            // a -- b -- c
            //      |
            //      d
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'd'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                    '=': iD.Way({id: '=', nodes: ['b', 'd']})
                });

            expect(iD.actions.Join('-', '=').enabled(graph)).to.be.false;
        });
    });

    it("joins a --> b ==> c", function () {
        // Expected result:
        // a --> b --> c
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                '=': iD.Way({id: '=', nodes: ['b', 'c']})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('=')).to.be.undefined;
    });

    it("joins a <-- b <== c", function () {
        // Expected result:
        // a <-- b <-- c
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['b', 'a']}),
                '=': iD.Way({id: '=', nodes: ['c', 'b']})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['c', 'b', 'a']);
        expect(graph.entity('=')).to.be.undefined;
    });

    it("joins a <-- b ==> c", function () {
        // Expected result:
        // a <-- b <-- c
        // tags on === reversed
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['b', 'a']}),
                '=': iD.Way({id: '=', nodes: ['b', 'c']})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['c', 'b', 'a']);
        expect(graph.entity('=')).to.be.undefined;
    });

    it("joins a --> b <== c", function () {
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                '=': iD.Way({id: '=', nodes: ['c', 'b']})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('=')).to.be.undefined;
    });

    it("merges tags", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b'], tags: {a: 'a', b: '-', c: 'c'}}),
                '=': iD.Way({id: '=', nodes: ['b', 'c'], tags: {a: 'a', b: '=', d: 'd'}})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('-').tags).to.eql({a: 'a', b: '-; =', c: 'c', d: 'd'});
    });

    it("merges relations", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b']}),
                '=': iD.Way({id: '=', nodes: ['b', 'c']}),
                'r1': iD.Relation({id: 'r1', members: [{id: '=', role: 'r1', type: 'way'}]}),
                'r2': iD.Relation({id: 'r2', members: [{id: '=', role: 'r1', type: 'way'}, {id: '-', role: 'r2', type: 'way'}]})
            });

        graph = iD.actions.Join('-', '=')(graph);

        expect(graph.entity('r1').members).to.eql([{id: '-', role: 'r1', type: 'way'}]);
        expect(graph.entity('r2').members).to.eql([{id: '-', role: 'r2', type: 'way'}]);
    });
});
