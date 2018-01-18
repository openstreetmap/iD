describe('iD.actionJoin', function () {
    describe('#disabled', function () {
        it('returns falsy for ways that share an end/start node', function () {
            // a --> b ==> c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share a start/end node', function () {
            // a <-- b <== c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '=', nodes: ['c', 'b']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share a start/start node', function () {
            // a <-- b ==> c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share an end/end node', function () {
            // a --> b <== c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'b']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for more than two ways when connected, regardless of order', function () {
            // a --> b ==> c ~~> d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']})
            ]);

            expect(iD.actionJoin(['-', '=', '~']).disabled(graph)).not.to.be.ok;
            expect(iD.actionJoin(['-', '~', '=']).disabled(graph)).not.to.be.ok;
            expect(iD.actionJoin(['=', '-', '~']).disabled(graph)).not.to.be.ok;
            expect(iD.actionJoin(['=', '~', '-']).disabled(graph)).not.to.be.ok;
            expect(iD.actionJoin(['~', '=', '-']).disabled(graph)).not.to.be.ok;
            expect(iD.actionJoin(['~', '-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns \'not_eligible\' for non-line geometries', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'})
            ]);

            expect(iD.actionJoin(['a']).disabled(graph)).to.equal('not_eligible');
        });

        it('returns \'not_adjacent\' for ways that don\'t share the necessary nodes', function () {
            // a -- b -- c
            //      |
            //      d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '=', nodes: ['b', 'd']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('not_adjacent');
        });

        it('returns \'restriction\' in situations where a turn restriction would be damaged (a)', function () {
            // a --> b ==> c
            // from: -
            // to: =
            // via: b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                    {type: 'way', id: '-', role: 'from'},
                    {type: 'way', id: '=', role: 'to'},
                    {type: 'node', id: 'b', role: 'via'}
                ]})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('restriction');
        });

        it('returns \'restriction\' in situations where a turn restriction would be damaged (b)', function () {
            // a --> b ==> c
            //       |
            //       d
            // from: -
            // to: |
            // via: b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '|', nodes: ['b', 'd']}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                    {type: 'way', id: '-', role: 'from'},
                    {type: 'way', id: '|', role: 'to'},
                    {type: 'node', id: 'b', role: 'via'}
                ]})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('restriction');
        });

        it('returns falsy in situations where a turn restriction wouldn\'t be damaged (a)', function () {
            // a --> b ==> c
            // |
            // d
            // from: -
            // to: |
            // via: a
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '|', nodes: ['a', 'd']}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                    {type: 'way', id: '-', role: 'from'},
                    {type: 'way', id: '|', role: 'to'},
                    {type: 'node', id: 'a', role: 'via'}
                ]})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy in situations where a turn restriction wouldn\'t be damaged (b)', function () {
            //       d
            //       |
            // a --> b ==> c
            //       \
            //        e
            // from: |
            // to: \
            // via: b
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmNode({id: 'd'}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '|', nodes: ['d', 'b']}),
                iD.osmWay({id: '\\', nodes: ['b', 'e']}),
                iD.osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                    {type: 'way', id: '|', role: 'from'},
                    {type: 'way', id: '\\', role: 'to'},
                    {type: 'node', id: 'b', role: 'via'}
                ]})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns \'conflicting_tags\' for two entities that have conflicting tags', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {highway: 'primary'}}),
                iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {highway: 'secondary'}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('conflicting_tags');
        });

        it('takes tag reversals into account when calculating conflicts', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {'oneway': 'yes'}}),
                iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'oneway': '-1'}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for exceptions to tag conflicts: missing tag', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {highway: 'primary'}}),
                iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for exceptions to tag conflicts: uninteresting tag', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a'}),
                iD.osmNode({id: 'b'}),
                iD.osmNode({id: 'c'}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {'tiger:cfcc': 'A41'}}),
                iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {'tiger:cfcc': 'A42'}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });
    });

    it('joins a --> b ==> c', function () {
        // Expected result:
        // a --> b --> c
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['b', 'c']})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.hasEntity('=')).to.be.undefined;
    });

    it('joins a <-- b <== c', function () {
        // Expected result:
        // a <-- b <-- c
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['b', 'a']}),
            iD.osmWay({id: '=', nodes: ['c', 'b']})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.hasEntity('=')).to.be.undefined;
    });

    it('joins a <-- b ==> c', function () {
        // Expected result:
        // a --> b --> c
        // tags on --- reversed
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['b', 'a'], tags: {'lanes:forward': 2}}),
            iD.osmWay({id: '=', nodes: ['b', 'c']})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.entity('-').tags).to.eql({'lanes:backward': 2});
    });

    it('joins a --> b <== c', function () {
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'lanes:forward': 2}})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.entity('-').tags).to.eql({'lanes:backward': 2});
    });

    it('joins a --> b <== c <++ d **> e', function () {
        // Expected result:
        // a --> b --> c --> d --> e
        // tags on === reversed
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmNode({id: 'e'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'lanes:forward': 2}}),
            iD.osmWay({id: '+', nodes: ['d', 'c']}),
            iD.osmWay({id: '*', nodes: ['d', 'e'], tags: {'lanes:backward': 2}})
        ]);

        graph = iD.actionJoin(['-', '=', '+', '*'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd', 'e']);
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.hasEntity('+')).to.be.undefined;
        expect(graph.hasEntity('*')).to.be.undefined;
        expect(graph.entity('-').tags).to.eql({'lanes:backward': 2});
    });

    it('prefers to keep existing ways', function () {
        // a --> b ==> c ++> d
        // --- is new, === is existing, +++ is new
        // Expected result:
        // a ==> b ==> c ==> d
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmWay({id: 'w-1', nodes: ['a', 'b']}),
            iD.osmWay({id: 'w1', nodes: ['b', 'c']}),
            iD.osmWay({id: 'w-2', nodes: ['c', 'd']})
        ]);

        graph = iD.actionJoin(['w-1', 'w1', 'w-2'])(graph);

        expect(graph.entity('w1').nodes).to.eql(['a', 'b', 'c', 'd']);
        expect(graph.hasEntity('w-1')).to.be.undefined;
        expect(graph.hasEntity('w-2')).to.be.undefined;
    });

    it('merges tags', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmNode({id: 'd'}),
            iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {a: 'a', b: '-', c: 'c'}}),
            iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {a: 'a', b: '=', d: 'd'}}),
            iD.osmWay({id: '+', nodes: ['c', 'd'], tags: {a: 'a', b: '=', e: 'e'}})
        ]);

        graph = iD.actionJoin(['-', '=', '+'])(graph);

        expect(graph.entity('-').tags).to.eql({a: 'a', b: '-;=', c: 'c', d: 'd', e: 'e'});
    });

    it('merges relations', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['b', 'c']}),
            iD.osmRelation({id: 'r1', members: [
                {id: '=', role: 'r1', type: 'way'}
            ]}),
            iD.osmRelation({id: 'r2', members: [
                {id: '=', role: 'r2', type: 'way'},
                {id: '-', role: 'r2', type: 'way'}
            ]})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('r1').members).to.eql([{id: '-', role: 'r1', type: 'way'}]);
        expect(graph.entity('r2').members).to.eql([{id: '-', role: 'r2', type: 'way'}]);
    });

    it('preserves duplicate route segments in relations', function () {
        //
        // Situation:
        //    a ---> b ===> c ~~~~> d                        join '-' and '='
        //    Relation: ['-', '=', '~', '~', '=', '-']
        //
        // Expected result:
        //    a ---> b ---> c ~~~~> d
        //    Relation: ['-', '~', '~', '-']
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, 0] }),
            iD.osmNode({ id: 'b', loc: [1, 0] }),
            iD.osmNode({ id: 'c', loc: [2, 0] }),
            iD.osmNode({ id: 'd', loc: [3, 0] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b'] }),
            iD.osmWay({ id: '=', nodes: ['b', 'c'] }),
            iD.osmWay({ id: '~', nodes: ['c', 'd'] }),
            iD.osmRelation({id: 'r', members: [
                {id: '-', role: 'forward', type: 'way'},
                {id: '=', role: 'forward', type: 'way'},
                {id: '~', role: 'forward', type: 'way'},
                {id: '~', role: 'forward', type: 'way'},
                {id: '=', role: 'forward', type: 'way'},
                {id: '-', role: 'forward', type: 'way'}
            ]})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('~').nodes).to.eql(['c', 'd']);
        expect(graph.entity('r').members).to.eql([
                {id: '-', role: 'forward', type: 'way'},
                {id: '~', role: 'forward', type: 'way'},
                {id: '~', role: 'forward', type: 'way'},
                {id: '-', role: 'forward', type: 'way'}
        ]);
    });

});
