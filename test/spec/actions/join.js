describe('iD.actionJoin', function () {
    describe('#disabled', function () {
        it('returns falsy for ways that share an end/start node', function () {
            // a --> b ==> c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share a start/end node', function () {
            // a <-- b <== c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '=', nodes: ['c', 'b']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share a start/start node', function () {
            // a <-- b ==> c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for ways that share an end/end node', function () {
            // a --> b <== c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'b']})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for more than two ways when connected, regardless of order', function () {
            // a --> b ==> c ~~> d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmNode({id: 'd', loc: [6,0]}),
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
                iD.osmNode({id: 'a', loc: [0,0]})
            ]);

            expect(iD.actionJoin(['a']).disabled(graph)).to.equal('not_eligible');
        });

        it('returns \'not_adjacent\' for ways that don\'t share the necessary nodes', function () {
            // a -- b -- c
            //      |
            //      d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmNode({id: 'd', loc: [2,2]}),
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
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
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
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmNode({id: 'd', loc: [2,2]}),
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

        it('returns \'paths_intersect\' if resulting way intersects itself', function () {
            //   d
            //   |
            // a ---b
            //   |  /
            //   | /
            //   c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [0,10]}),
                iD.osmNode({id: 'c', loc: [5,5]}),
                iD.osmNode({id: 'd', loc: [-5,5]}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('paths_intersect');
        });

        it('returns falsy in situations where a turn restriction wouldn\'t be damaged (a)', function () {
            // a --> b ==> c
            // |
            // d
            // from: -
            // to: |
            // via: a
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmNode({id: 'd', loc: [0,2]}),
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
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmNode({id: 'd', loc: [2,-2]}),
                iD.osmNode({id: 'e', loc: [3,2]}),
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
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {highway: 'primary'}}),
                iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {highway: 'secondary'}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).to.equal('conflicting_tags');
        });

        it('takes tag reversals into account when calculating conflicts', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {'oneway': 'yes'}}),
                iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'oneway': '-1'}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for exceptions to tag conflicts: missing tag', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {highway: 'primary'}}),
                iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {}})
            ]);

            expect(iD.actionJoin(['-', '=']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for exceptions to tag conflicts: uninteresting tag', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0,0]}),
                iD.osmNode({id: 'b', loc: [2,0]}),
                iD.osmNode({id: 'c', loc: [4,0]}),
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
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
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
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['b', 'a']}),
            iD.osmWay({id: '=', nodes: ['c', 'b']})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);
        expect(graph.entity('-').nodes).to.eql(['c', 'b', 'a']);
        expect(graph.hasEntity('=')).to.be.undefined;
    });

    it('joins a <-- b ==> c', function () {
        // Expected result:
        // a --> b --> c
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['b', 'a'], tags: {'lanes:forward': 2}}),
            iD.osmWay({id: '=', nodes: ['b', 'c']})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['c', 'b', 'a']);
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.entity('-').tags).to.eql({'lanes:forward': 2});
    });

    it('joins a --> b <== c', function () {
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
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
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmNode({id: 'd', loc: [6,0]}),
            iD.osmNode({id: 'e', loc: [8,0]}),
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
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmNode({id: 'd', loc: [6,0]}),
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
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmNode({id: 'd', loc: [6,0]}),
            iD.osmNode({id: 'e', loc: [8,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b'], tags: {a: 'a', b: '-', c: 'c'}}),
            iD.osmWay({id: '=', nodes: ['b', 'c'], tags: {a: 'a', b: '=', d: 'd'}}),
            iD.osmWay({id: '+', nodes: ['c', 'd'], tags: {a: 'a', b: '=', e: 'e'}})
        ]);

        graph = iD.actionJoin(['-', '=', '+'])(graph);

        expect(graph.entity('-').tags).to.eql({a: 'a', b: '-;=', c: 'c', d: 'd', e: 'e'});
    });

    it('preserves sidedness of start segment, co-directional lines', function () {
        // a -----> b =====> c
        //   v v v
        //
        //  Expected result:
        // a -----> b -----> c
        //   v v v    v v v
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b'], tags: { natural: 'cliff' }}),
            iD.osmWay({id: '=', nodes: ['b', 'c']})
        ]);
        graph = iD.actionJoin(['-', '='])(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('-').tags).to.eql({ natural: 'cliff' });
    });

    it('preserves sidedness of end segment, co-directional lines', function () {
        // a -----> b =====> c
        //            v v v
        //
        //  Expected result:
        // a =====> b =====> c
        //   v v v    v v v
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['b', 'c'], tags: { natural: 'cliff' }})
        ]);
        graph = iD.actionJoin(['-', '='])(graph);
        expect(graph.entity('=').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('=').tags).to.eql({ natural: 'cliff' });
    });

    it('preserves sidedness of start segment, contra-directional lines', function () {
        // a -----> b <===== c
        //   v v v
        //
        //  Expected result:
        // a -----> b -----> c
        //   v v v    v v v
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b'], tags: { natural: 'cliff' }}),
            iD.osmWay({id: '=', nodes: ['c', 'b']})
        ]);
        graph = iD.actionJoin(['-', '='])(graph);
        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(graph.entity('-').tags).to.eql({ natural: 'cliff' });
    });

    it('preserves sidedness of end segment, contra-directional lines', function () {
        // a -----> b <===== c
        //             v v v
        //
        //  Expected result:
        // a <===== b <===== c
        //    v v v    v v v
        //
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['c', 'b'], tags: { natural: 'cliff' }})
        ]);
        graph = iD.actionJoin(['-', '='])(graph);
        expect(graph.entity('=').nodes).to.eql(['c', 'b', 'a']);
        expect(graph.entity('=').tags).to.eql({ natural: 'cliff' });
    });


    it('merges relations', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [2,0]}),
            iD.osmNode({id: 'c', loc: [4,0]}),
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

    it('collapses resultant single-member multipolygon into basic area', function () {
        // Situation:
        // b --> c
        // |#####|
        // |# m #|
        // |#####|
        // a <== d
        //
        //  Expected result:
        // a --> b
        // |#####|
        // |#####|
        // |#####|
        // d <-- c
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [0,2]}),
            iD.osmNode({id: 'c', loc: [2,2]}),
            iD.osmNode({id: 'd', loc: [2,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']}),
            iD.osmWay({id: '=', nodes: ['d', 'a']}),
            iD.osmRelation({id: 'm', members: [
                {id: '-', role: 'outer', type: 'way'},
                {id: '=', role: 'outer', type: 'way'}
            ], tags: {
                type: 'multipolygon',
                man_made: 'pier'
            }})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd', 'a']);
        expect(graph.entity('-').tags).to.eql({ man_made: 'pier', area: 'yes' });
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.hasEntity('m')).to.be.undefined;
    });

    it('does not collapse resultant single-member multipolygon into basic area when tags conflict', function () {
        // Situation:
        // b --> c
        // |#####|
        // |# m #|
        // |#####|
        // a <== d
        //
        //  Expected result:
        // a --> b
        // |#####|
        // |# m #|
        // |#####|
        // d <-- c
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0,0]}),
            iD.osmNode({id: 'b', loc: [0,2]}),
            iD.osmNode({id: 'c', loc: [2,2]}),
            iD.osmNode({id: 'd', loc: [2,0]}),
            iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd'], tags: { surface: 'paved' }}),
            iD.osmWay({id: '=', nodes: ['d', 'a']}),
            iD.osmRelation({id: 'm', members: [
                {id: '-', role: 'outer', type: 'way'},
                {id: '=', role: 'outer', type: 'way'}
            ], tags: {
                type: 'multipolygon',
                man_made: 'pier',
                surface: 'wood'
            }})
        ]);

        graph = iD.actionJoin(['-', '='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd', 'a']);
        expect(graph.entity('-').tags).to.eql({ surface: 'paved' });
        expect(graph.hasEntity('=')).to.be.undefined;
        expect(graph.hasEntity('m').tags).to.eql({
            type: 'multipolygon',
            man_made: 'pier',
            surface: 'wood'
        });
    });

});
