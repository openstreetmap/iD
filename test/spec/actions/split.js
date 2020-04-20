describe('iD.actionSplit', function () {

    describe('#disabled', function () {
        it('returns falsy for a non-end node of a single way', function () {
            //
            //  a ---> b ---> c         split at 'b' not disabled
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] })
            ]);

            expect(iD.actionSplit('b').disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for an intersection of two ways', function () {
            //
            //         c
            //         |
            //  a ---> * ---> b         split at '*' not disabled
            //         |
            //         d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [0, 1] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmNode({ id: '*', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', '*', 'b'] }),
                iD.osmWay({ id: '|', nodes: ['c', '*', 'd'] })
            ]);

            expect(iD.actionSplit('*').disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for an intersection of two ways with parent way specified', function () {
            //
            //         c
            //         |
            //  a ---> * ---> b         split '-' at '*' not disabled
            //         |
            //         d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [0, 1] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmNode({ id: '*', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', '*', 'b'] }),
                iD.osmWay({ id: '|', nodes: ['c', '*', 'd'] })
            ]);

            expect(iD.actionSplit('*').limitWays(['-']).disabled(graph)).not.to.be.ok;
        });

        it('returns falsy for a self-intersection', function () {
            //
            //  b -- c
            //  |   /
            //  |  /                    split '-' at 'a' not disabled
            //  | /
            //  a -- b
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 2] }),
                iD.osmNode({ id: 'c', loc: [1, 2] }),
                iD.osmNode({ id: 'd', loc: [1, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'a', 'd'] })
            ]);

            expect(iD.actionSplit('a').disabled(graph)).not.to.be.ok;
        });

        it('returns \'not_eligible\' for the first node of a single way', function () {
            //
            //  a ---> b                split at 'a' disabled - 'not eligible'
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b'] })
            ]);

            expect(iD.actionSplit('a').disabled(graph)).to.equal('not_eligible');
        });

        it('returns \'not_eligible\' for the last node of a single way', function () {
            //
            //  a ---> b                split at 'b' disabled - 'not eligible'
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b'] })
            ]);

            expect(iD.actionSplit('b').disabled(graph)).to.equal('not_eligible');
        });

        it('returns \'not_eligible\' for an intersection of two ways with non-parent way specified', function () {
            //
            //         c
            //         |
            //  a ---> * ---> b         split '-' and '=' at '*' disabled - 'not eligible'
            //         |                (there is no '=' here)
            //         d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [0, 1] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmNode({ id: '*', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', '*', 'b'] }),
                iD.osmWay({ id: '|', nodes: ['c', '*', 'd'] })
            ]);

            expect(iD.actionSplit('*').limitWays(['-', '=']).disabled(graph)).to.equal('not_eligible');
        });
    });


    describe('ways', function () {

        it('creates a new way with the appropriate nodes', function () {
            //
            // Situation:
            //    a ---> b ---> c         split at 'b'
            //
            // Expected result:
            //    a ---> b ===> c
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] })
            ]);

            graph = iD.actionSplit('b', ['='])(graph);

            expect(graph.entity('-').nodes).to.eql(['a', 'b']);
            expect(graph.entity('=').nodes).to.eql(['b', 'c']);
        });

        it('copies tags to the new way', function () {
            var tags = { highway: 'residential' };
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'], tags: tags })
            ]);

            graph = iD.actionSplit('b', ['='])(graph);

            // Immutable tags => should be shared by identity.
            expect(graph.entity('-').tags).to.equal(tags);
            expect(graph.entity('=').tags).to.equal(tags);
        });

        it('splits a way at a T-junction', function () {
            //
            // Situation:
            //    a ---- b ---- c        split at 'b'
            //           |
            //           d
            //
            // Expected result:
            //    a ---- b ==== c
            //           |
            //           d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 0] }),
                iD.osmNode({ id: 'c', loc: [1, 0] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '|', nodes: ['d', 'b']})
            ]);

            graph = iD.actionSplit('b', ['='])(graph);

            expect(graph.entity('-').nodes).to.eql(['a', 'b']);
            expect(graph.entity('=').nodes).to.eql(['b', 'c']);
            expect(graph.entity('|').nodes).to.eql(['d', 'b']);
        });

        it('splits multiple ways at an intersection', function () {
            //
            // Situation:
            //         c
            //         |
            //  a ---- * ---- b         split at '*'
            //         |
            //         d
            //
            // Expected result:
            //         c
            //         |
            //  a ---- * ==== b
            //         ¦
            //         d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [0, 1] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmNode({ id: '*', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', '*', 'b'] }),
                iD.osmWay({ id: '|', nodes: ['c', '*', 'd'] })
            ]);

            graph = iD.actionSplit('*', ['=', '¦'])(graph);

            expect(graph.entity('-').nodes).to.eql(['a', '*']);
            expect(graph.entity('=').nodes).to.eql(['*', 'b']);
            expect(graph.entity('|').nodes).to.eql(['c', '*']);
            expect(graph.entity('¦').nodes).to.eql(['*', 'd']);
        });

        it('splits the specified ways at an intersection', function () {
            //
            //         c
            //         |
            //  a ---- * ---- b         split at '*'
            //         |
            //         d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-1, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [0, 1] }),
                iD.osmNode({ id: 'd', loc: [0, -1] }),
                iD.osmNode({ id: '*', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', '*', 'b'] }),
                iD.osmWay({ id: '|', nodes: ['c', '*', 'd'] })
            ]);

            var g1 = iD.actionSplit('*', ['=']).limitWays(['-'])(graph);
            expect(g1.entity('-').nodes).to.eql(['a', '*']);
            expect(g1.entity('=').nodes).to.eql(['*', 'b']);
            expect(g1.entity('|').nodes).to.eql(['c', '*', 'd']);

            var g2 = iD.actionSplit('*', ['¦']).limitWays(['|'])(graph);
            expect(g2.entity('-').nodes).to.eql(['a', '*', 'b']);
            expect(g2.entity('|').nodes).to.eql(['c', '*']);
            expect(g2.entity('¦').nodes).to.eql(['*', 'd']);

            var g3 = iD.actionSplit('*', ['=', '¦']).limitWays(['-', '|'])(graph);
            expect(g3.entity('-').nodes).to.eql(['a', '*']);
            expect(g3.entity('=').nodes).to.eql(['*', 'b']);
            expect(g3.entity('|').nodes).to.eql(['c', '*']);
            expect(g3.entity('¦').nodes).to.eql(['*', 'd']);
        });

        it('splits self-intersecting ways', function () {
            //
            // Situation:
            //             b
            //            /|
            //           / |
            //          /  |
            //         c - a -- d       split at 'a'
            //
            // Expected result:
            //             b
            //            /|
            //           / |
            //          /  |
            //         c - a == d
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [0, 2] }),
                iD.osmNode({ id: 'c', loc: [-1, 0] }),
                iD.osmNode({ id: 'd', loc: [1, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'a', 'd'] })
            ]);

            graph = iD.actionSplit('a', ['='])(graph);

            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'a']);
            expect(graph.entity('=').nodes).to.eql(['a', 'd']);
        });

        it('splits a closed way at the given point and its antipode', function () {
            //
            // Situation:
            //    a ---- b
            //    |      |
            //    d ---- c
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 1] }),
                iD.osmNode({ id: 'b', loc: [1, 1] }),
                iD.osmNode({ id: 'c', loc: [1, 0] }),
                iD.osmNode({ id: 'd', loc: [0, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

            var g1 = iD.actionSplit('a', ['='])(graph);
            expect(g1.entity('-').nodes).to.eql(['a', 'b', 'c']);
            expect(g1.entity('=').nodes).to.eql(['c', 'd', 'a']);

            var g2 = iD.actionSplit('b', ['='])(graph);
            expect(g2.entity('-').nodes).to.eql(['b', 'c', 'd']);
            expect(g2.entity('=').nodes).to.eql(['d', 'a', 'b']);

            var g3 = iD.actionSplit('c', ['='])(graph);
            expect(g3.entity('-').nodes).to.eql(['c', 'd', 'a']);
            expect(g3.entity('=').nodes).to.eql(['a', 'b', 'c']);

            var g4 = iD.actionSplit('d', ['='])(graph);
            expect(g4.entity('-').nodes).to.eql(['d', 'a', 'b']);
            expect(g4.entity('=').nodes).to.eql(['b', 'c', 'd']);
        });
    });


    describe('relations', function () {

        function members(graph) {
            return graph.entity('r').members.map(function (m) { return m.id; });
        }


        it('handles incomplete relations', function () {
            //
            // Situation:
            //    a ---> b ---> c         split at 'b'
            //    Relation: ['~', '-']
            //
            // Expected result:
            //    a ---> b ===> c
            //    Relation: ['~', '-', '=']
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, 0] }),
                iD.osmNode({ id: 'b', loc: [1, 0] }),
                iD.osmNode({ id: 'c', loc: [2, 0] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                iD.osmRelation({id: 'r', members: [
                    { id: '~', type: 'way' },
                    { id: '-', type: 'way' }
                ]})
            ]);

            graph = iD.actionSplit('b', ['='])(graph);
            expect(members(graph)).to.eql(['~', '-', '=']);
        });


        describe('member ordering', function () {

            it('adds the new way to parent relations (simple)', function () {
                //
                // Situation:
                //    a ---> b ---> c         split at 'b'
                //    Relation: ['-']
                //
                // Expected result:
                //    a ---> b ===> c
                //    Relation: ['-', '=']
                //
                var graph = iD.coreGraph([
                    iD.osmNode({ id: 'a', loc: [0, 0] }),
                    iD.osmNode({ id: 'b', loc: [1, 0] }),
                    iD.osmNode({ id: 'c', loc: [2, 0] }),
                    iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                    iD.osmRelation({id: 'r', members: [
                        { id: '-', type: 'way', role: 'forward' }
                    ]})
                ]);

                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('r').members).to.eql([
                    { id: '-', type: 'way', role: 'forward' },
                    { id: '=', type: 'way', role: 'forward' }
                ]);
            });

            it('adds the new way to parent relations (forward order)', function () {
                //
                // Situation:
                //    a ---> b ---> c ~~~> d        split at 'b'
                //    Relation: ['-', '~']
                //
                // Expected result:
                //    a ---> b ===> c ~~~> d
                //    Relation: ['-', '=', '~']
                //
                var graph = iD.coreGraph([
                    iD.osmNode({ id: 'a', loc: [0, 0] }),
                    iD.osmNode({ id: 'b', loc: [1, 0] }),
                    iD.osmNode({ id: 'c', loc: [2, 0] }),
                    iD.osmNode({ id: 'd', loc: [3, 0] }),
                    iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                    iD.osmWay({ id: '~', nodes: ['c', 'd'] }),
                    iD.osmRelation({id: 'r', members: [
                        { id: '-', type: 'way' },
                        { id: '~', type: 'way' }
                    ]})
                ]);

                graph = iD.actionSplit('b', ['='])(graph);
                expect(members(graph)).to.eql(['-', '=', '~']);
            });

            it('adds the new way to parent relations (reverse order)', function () {
                //
                // Situation:
                //    a ---> b ---> c ~~~> d        split at 'b'
                //    Relation: ['~', '-']
                //
                // Expected result:
                //    a ---> b ===> c ~~~> d
                //    Relation: ['~', '=', '-']
                //
                var graph = iD.coreGraph([
                    iD.osmNode({ id: 'a', loc: [0, 0] }),
                    iD.osmNode({ id: 'b', loc: [1, 0] }),
                    iD.osmNode({ id: 'c', loc: [2, 0] }),
                    iD.osmNode({ id: 'd', loc: [3, 0] }),
                    iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                    iD.osmWay({ id: '~', nodes: ['c', 'd'] }),
                    iD.osmRelation({id: 'r', members: [
                        { id: '~', type: 'way' },
                        { id: '-', type: 'way' }
                    ]})
                ]);

                graph = iD.actionSplit('b', ['='])(graph);
                expect(members(graph)).to.eql(['~', '=', '-']);
            });

            it('reorders members as node, way, relation (for Public Transport routing)', function () {
                var graph = iD.coreGraph([
                    iD.osmNode({ id: 'a', loc: [0, 0] }),
                    iD.osmNode({ id: 'b', loc: [1, 0] }),
                    iD.osmNode({ id: 'c', loc: [2, 0] }),
                    iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                    iD.osmRelation({id: 'r', members: [
                        { id: 'n1', type: 'node', role: 'forward' },
                        { id: '-', type: 'way', role: 'forward' },
                        { id: 'r1', type: 'relation', role: 'forward' },
                        { id: 'n2', type: 'node', role: 'forward' }
                    ]})
                ]);

                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('r').members).to.eql([
                    { id: 'n1', type: 'node', role: 'forward' },
                    { id: 'n2', type: 'node', role: 'forward' },
                    { id: '-', type: 'way', role: 'forward' },
                    { id: '=', type: 'way', role: 'forward' },
                    { id: 'r1', type: 'relation', role: 'forward'}
                ]);
            });
        });

        describe('splitting out-and-back routes', function () {
            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [0, 2] });
            var d = iD.osmNode({ id: 'd', loc: [0, 3] });

            it('splits out-and-back1 route at b', function () {
                //
                // Situation:
                //    a ---> b ---> c ~~~> d                split at 'b'
                //    Relation: ['-', '~', '~', '-']
                //
                // Expected result:
                //    a ---> b ===> c ~~~> d
                //    Relation: ['-', '=', '~', '~', '=', '-']
                //
                var graph = iD.coreGraph([
                    a, b, c, d,
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                    iD.osmWay({id: '~', nodes: ['c', 'd']}),
                    iD.osmRelation({id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '-', type: 'way'}
                    ]})
                ]);
                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['a', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'c']);
                expect(graph.entity('~').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
            });

            it('splits out-and-back2 route at b', function () {
                //
                // Situation:
                //    a <--- b <--- c ~~~> d                split at 'b'
                //    Relation: ['-', '~', '~', '-']
                //
                // Expected result:
                //    a <=== b <--- c ~~~> d
                //    Relation: ['=', '-', '~', '~', '-', '=']
                //
                var graph = iD.coreGraph([
                    a, b, c, d,
                    iD.osmWay({id: '-', nodes: ['c', 'b', 'a']}),
                    iD.osmWay({id: '~', nodes: ['c', 'd']}),
                    iD.osmRelation({id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '-', type: 'way'}
                    ]})
                ]);
                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['c', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'a']);
                expect(graph.entity('~').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['=', '-', '~', '~', '-', '=']);
            });

            it('splits out-and-back3 route at b', function () {
                //
                // Situation:
                //    a ---> b ---> c <~~~ d                split at 'b'
                //    Relation: ['-', '~', '~', '-']
                //
                // Expected result:
                //    a ---> b ===> c <~~~ d
                //    Relation: ['-', '=', '~', '~', '=', '-']
                //
                var graph = iD.coreGraph([
                    a, b, c, d,
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                    iD.osmWay({id: '~', nodes: ['d', 'c']}),
                    iD.osmRelation({id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '-', type: 'way'}
                    ]})
                ]);
                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['a', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'c']);
                expect(graph.entity('~').nodes).to.eql(['d', 'c']);
                expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
            });

            it('splits out-and-back4 route at b', function () {
                //
                // Situation:
                //    a <--- b <--- c <~~~ d                split at 'b'
                //    Relation: ['-', '~', '~', '-']
                //
                // Expected result:
                //    a <=== b <--- c <~~~ d
                //    Relation: ['=', '-', '~', '~', '-', '=']
                //
                var graph = iD.coreGraph([
                    a, b, c, d,
                    iD.osmWay({id: '-', nodes: ['c', 'b', 'a']}),
                    iD.osmWay({id: '~', nodes: ['d', 'c']}),
                    iD.osmRelation({id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '-', type: 'way'}
                    ]})
                ]);
                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['c', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'a']);
                expect(graph.entity('~').nodes).to.eql(['d', 'c']);
                expect(members(graph)).to.eql(['=', '-', '~', '~', '-', '=']);
            });
        });

        describe('splitting hat routes', function () {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1, 0]});
            var c = iD.osmNode({id: 'c', loc: [2, 1]});
            var d = iD.osmNode({id: 'd', loc: [3, 0]});
            var e = iD.osmNode({id: 'e', loc: [4, 0]});

            //
            // Situation:
            //          ###> c >###
            //          #         #
            //    a --> b ~~~~~~> d ==> e
            //
            //    Relation: ['-', '#', '~', '#', '=']
            //
            var hat1a = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '#', nodes: ['b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['b', 'd']}),
                iD.osmWay({id: '=', nodes: ['d', 'e']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            //
            // Situation:
            //          ###> c >###
            //          #         #
            //    a --> b ~~~~~~> d ==> e
            //
            //    Relation: ['-', '~', '#', '~', '=']
            //
            var hat1b = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '#', nodes: ['b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['b', 'd']}),
                iD.osmWay({id: '=', nodes: ['d', 'e']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            //
            // Situation:
            //          ###< c <###
            //          #         #
            //    a --> b ~~~~~~> d ==> e
            //
            //    Relation: ['-', '#', '~', '#', '=']
            //
            var hat2 = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '#', nodes: ['d', 'c', 'b']}),
                iD.osmWay({id: '~', nodes: ['b', 'd']}),
                iD.osmWay({id: '=', nodes: ['d', 'e']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            //
            // Situation:
            //          ###< c <###
            //          #         #
            //    a --> b <~~~~~~ d ==> e
            //
            //    Relation: ['-', '#', '~', '#', '=']
            //
            var hat3 = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '#', nodes: ['d', 'c', 'b']}),
                iD.osmWay({id: '~', nodes: ['d', 'b']}),
                iD.osmWay({id: '=', nodes: ['d', 'e']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            //
            // Situation:
            //          ###> c >###
            //          #         #
            //    a --> b <~~~~~~ d ==> e
            //
            //    Relation: ['-', '#', '~', '#', '=']
            //
            var hat4 = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '#', nodes: ['b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['d', 'b']}),
                iD.osmWay({id: '=', nodes: ['d', 'e']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            //
            // Situation:
            //          ###> c >###
            //          #         #
            //    a <-- b ~~~~~~> d <== e
            //
            //    Relation: ['-', '#', '~', '#', '=']
            //
            var hat5 = iD.coreGraph([
                a, b, c, d, e,
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '#', nodes: ['b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['b', 'd']}),
                iD.osmWay({id: '=', nodes: ['e', 'd']}),
                iD.osmRelation({
                    id: 'r', members: [
                        {id: '-', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '~', type: 'way'},
                        {id: '#', type: 'way'},
                        {id: '=', type: 'way'}
                    ]
                })
            ]);

            it('splits hat1a route at c', function () {
                //
                // Expected result:
                //          ###> c >***
                //          #         *
                //    a --> b ~~~~~~> d ==> e
                //
                //    Relation: ['-', '#', '*', '~', '#', '*', '=']
                //
                var graph = hat1a;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['b', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['-', '#', '*', '~', '#', '*', '=']);
            });

            it('splits hat1b route at c', function () {
                //
                // Expected result:
                //          ###> c >***
                //          #         *
                //    a --> b ~~~~~~> d ==> e
                //
                //    Relation: ['-', '~', '*', '#', '~', '=']
                //
                var graph = hat1b;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['b', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['-', '~', '*', '#', '~', '=']);
            });

            it('splits hat2 route at c', function () {
                //
                // Expected result:
                //          ***< c <###
                //          *         #
                //    a --> b ~~~~~~> d ==> e
                //
                //    Relation: ['-', '*', '#', '~', '*', '#', '=']
                //
                var graph = hat2;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['d', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'b']);
                expect(members(graph)).to.eql(['-', '*', '#', '~', '*', '#', '=']);
            });

            it('splits hat3 route at c', function () {
                //
                // Expected result:
                //          ***< c <###
                //          *         #
                //    a --> b <~~~~~~ d ==> e
                //
                //    Relation: ['-', '*', '#', '~', '*', '#', '=']
                //
                var graph = hat3;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['d', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'b']);
                expect(members(graph)).to.eql(['-', '*', '#', '~', '*', '#', '=']);
            });

            it('splits hat4 route at c', function () {
                //
                // Expected result:
                //          ###> c >***
                //          #         *
                //    a --> b <~~~~~~ d ==> e
                //
                //    Relation: ['-', '*', '#', '~', '*', '#', '=']
                //
                var graph = hat4;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['b', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['-', '#', '*', '~', '#', '*', '=']);
            });

            it('splits hat5 route at c', function () {
                //
                // Expected result:
                //          ###> c >***
                //          #         *
                //    a <-- b ~~~~~~> d <== e
                //
                //    Relation: ['-', '#', '*', '~', '#', '*', '=']
                //
                var graph = hat5;
                graph = iD.actionSplit('c', ['*'])(graph);

                expect(graph.entity('#').nodes).to.eql(['b', 'c']);
                expect(graph.entity('*').nodes).to.eql(['c', 'd']);
                expect(members(graph)).to.eql(['-', '#', '*', '~', '#', '*', '=']);
            });

        });

        describe('splitting spoon routes', function () {
            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [1, 0] });
            var e = iD.osmNode({ id: 'e', loc: [2, 0] });
            var f = iD.osmNode({ id: 'f', loc: [3, 0] });

            //
            // Situation:
            //    b --> c
            //    |     |
            //    a <-- d ~~~> e ~~~> f
            //
            //    Relation: ['~', '-', '~']
            //
            var spoon1 = iD.coreGraph([
                a, b, c, d, e, f,
                iD.osmWay({id: '-', nodes: ['d', 'a', 'b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['d', 'e', 'f']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            //
            // Situation:
            //    b <-- c
            //    |     |
            //    a --> d ~~~> e ~~~> f
            //
            //    Relation: ['~', '-', '~']
            //
            var spoon2 = iD.coreGraph([
                a, b, c, d, e, f,
                iD.osmWay({id: '-', nodes: ['d', 'c', 'b', 'a', 'd']}),
                iD.osmWay({id: '~', nodes: ['d', 'e', 'f']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            //
            // Situation:
            //    b --> c
            //    |     |
            //    a <-- d <~~~ e <~~~ f
            //
            //    Relation: ['~', '-', '~']
            //
            var spoon3 = iD.coreGraph([
                a, b, c, d, e, f,
                iD.osmWay({id: '-', nodes: ['d', 'a', 'b', 'c', 'd']}),
                iD.osmWay({id: '~', nodes: ['f', 'e', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            //
            // Situation:
            //    b <-- c
            //    |     |
            //    a --> d <~~~ e <~~~ f
            //
            //    Relation: ['~', '-', '~']
            //
            var spoon4 = iD.coreGraph([
                a, b, c, d, e, f,
                iD.osmWay({id: '-', nodes: ['d', 'c', 'b', 'a', 'd']}),
                iD.osmWay({id: '~', nodes: ['f', 'e', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            it('splits spoon1 route at d', function () {
                //
                // Expected result:
                //    b ==> c
                //    |     ‖
                //    a <-- d ~~~> e ~~~> f
                //
                //    Relation: ['~', '-', '=', '~']
                //
                var graph = spoon1;
                graph = iD.actionSplit('d', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'a', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'c', 'd']);
                expect(graph.entity('~').nodes).to.eql(['d', 'e', 'f']);
                expect(members(graph)).to.eql(['~', '-', '=', '~']);
            });

            it('splits spoon2 route at d', function () {
                //
                // Expected result:
                //    b <-- c
                //    ‖     |
                //    a ==> d ~~~> e ~~~> f
                //
                //    Relation: ['~', '-', '=', '~']
                //
                var graph = spoon2;
                graph = iD.actionSplit('d', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'c', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'a', 'd']);
                expect(graph.entity('~').nodes).to.eql(['d', 'e', 'f']);
                expect(members(graph)).to.eql(['~', '-', '=', '~']);
            });

            it('splits spoon3 route at d', function () {
                //
                // Expected result:
                //    b ==> c
                //    |     ‖
                //    a <-- d <~~~ e <~~~ f
                //
                //    Relation: ['~', '-', '=', '~']
                //
                var graph = spoon3;
                graph = iD.actionSplit('d', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'a', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'c', 'd']);
                expect(graph.entity('~').nodes).to.eql(['f', 'e', 'd']);
                expect(members(graph)).to.eql(['~', '-', '=', '~']);
            });

            it('splits spoon4 route at d', function () {
                //
                // Expected result:
                //    b <-- c
                //    ‖     |
                //    a ==> d <~~~ e <~~~ f
                //
                //    Relation: ['~', '-', '=', '~']
                //
                var graph = spoon4;
                graph = iD.actionSplit('d', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'c', 'b']);
                expect(graph.entity('=').nodes).to.eql(['b', 'a', 'd']);
                expect(graph.entity('~').nodes).to.eql(['f', 'e', 'd']);
                expect(members(graph)).to.eql(['~', '-', '=', '~']);
            });

            it('splits spoon1 route at e', function () {
                //
                // Expected result:
                //    b --> c
                //    |     |
                //    a <-- d ~~~> e ===> f
                //
                //    Relation: ['=', '~', '-', '~', '=']
                //
                var graph = spoon1;
                graph = iD.actionSplit('e', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'a', 'b', 'c', 'd']);
                expect(graph.entity('~').nodes).to.eql(['d', 'e']);
                expect(graph.entity('=').nodes).to.eql(['e', 'f']);
                expect(members(graph)).to.eql(['=', '~', '-', '~', '=']);
            });

            it('splits spoon2 route at e', function () {
                //
                // Expected result:
                //    b <-- c
                //    |     |
                //    a --> d ~~~> e ===> f
                //
                //    Relation: ['=', '~', '-', '~', '=']
                //
                var graph = spoon2;
                graph = iD.actionSplit('e', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'c', 'b', 'a', 'd']);
                expect(graph.entity('~').nodes).to.eql(['d', 'e']);
                expect(graph.entity('=').nodes).to.eql(['e', 'f']);
                expect(members(graph)).to.eql(['=', '~', '-', '~', '=']);
            });

            it('splits spoon3 route at e', function () {
                //
                // Expected result:
                //    b --> c
                //    |     |
                //    a <-- d <=== e <~~~ f
                //
                //    Relation: ['~', '=', '-', '=', '~']
                //
                var graph = spoon3;
                graph = iD.actionSplit('e', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'a', 'b', 'c', 'd']);
                expect(graph.entity('~').nodes).to.eql(['f', 'e']);
                expect(graph.entity('=').nodes).to.eql(['e', 'd']);
                expect(members(graph)).to.eql(['~', '=', '-', '=', '~']);
            });

            it('splits spoon4 route at e', function () {
                //
                // Expected result:
                //    b <-- c
                //    |     |
                //    a --> d <=== e <~~~ f
                //
                //    Relation: ['~', '=', '-', '=', '~']
                //
                var graph = spoon4;
                graph = iD.actionSplit('e', ['='])(graph);

                expect(graph.entity('-').nodes).to.eql(['d', 'c', 'b', 'a', 'd']);
                expect(graph.entity('~').nodes).to.eql(['f', 'e']);
                expect(graph.entity('=').nodes).to.eql(['e', 'd']);
                expect(members(graph)).to.eql(['~', '=', '-', '=', '~']);
            });

        });


        describe('type = multipolygon', function () {

            it('splits an area by converting it to a multipolygon', function () {
                // Situation:
                //    a ---- b
                //    |      |
                //    d ---- c
                //
                // Split at a.
                //
                // Expected result:
                //    a ---- b
                //    ||     |
                //    d ==== c
                //
                var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0,1]}),
                    iD.osmNode({id: 'b', loc: [1,1]}),
                    iD.osmNode({id: 'c', loc: [1,0]}),
                    iD.osmNode({id: 'd', loc: [0,0]}),
                    iD.osmWay({id: '-', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);

                graph = iD.actionSplit('a', ['='])(graph);
                expect(graph.entity('-').tags).to.eql({});
                expect(graph.entity('=').tags).to.eql({});
                expect(graph.parentRelations(graph.entity('-'))).to.have.length(1);

                var relation = graph.parentRelations(graph.entity('-'))[0];
                expect(relation.tags).to.eql({type: 'multipolygon', area: 'yes'});
                expect(relation.members).to.eql([
                    {id: '-', role: 'outer', type: 'way'},
                    {id: '=', role: 'outer', type: 'way'}
                ]);
            });

            it('splits only the line of a node shared by a line and an area', function () {
                var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0,1]}),
                    iD.osmNode({id: 'b', loc: [1,1]}),
                    iD.osmNode({id: 'c', loc: [1,0]}),
                    iD.osmWay({id: '-',  nodes: ['a', 'b', 'c']}),
                    iD.osmWay({id: '=',  nodes: ['a', 'b', 'c', 'a'], tags: {area: 'yes'}})
                ]);

                graph = iD.actionSplit('b', ['~'])(graph);

                expect(graph.entity('-').nodes).to.eql(['a', 'b']);
                expect(graph.entity('~').nodes).to.eql(['b', 'c']);
                expect(graph.entity('=').nodes).to.eql(['a', 'b', 'c', 'a']);
                expect(graph.parentRelations(graph.entity('='))).to.have.length(0);
            });

            it('converts simple multipolygon to a proper multipolygon', function () {
                var graph = iD.coreGraph([
                    iD.osmNode({id: 'a'}),
                    iD.osmNode({id: 'b'}),
                    iD.osmNode({id: 'c'}),
                    iD.osmWay({'id': '-', nodes: ['a', 'b', 'c'], tags: { area: 'yes' }}),
                    iD.osmRelation({id: 'r', members: [{id: '-', type: 'way', role: 'outer'}], tags: {type: 'multipolygon'}})
                ]);

                graph = iD.actionSplit('b', ['='])(graph);

                expect(graph.entity('-').tags).to.eql({});
                expect(graph.entity('r').tags).to.eql({type: 'multipolygon', area: 'yes' });
                var ids = graph.entity('r').members.map(function(m) { return m.id; });
                expect(ids).to.have.ordered.members(['-', '=']);
            });
        });


        ['restriction', 'restriction:bus', 'manoeuvre'].forEach(function (type) {
            describe('type = ' + type, function () {

                it('updates a restriction\'s \'from\' role - via node', function () {
                    // Situation:
                    //    a ----> b ----> c ~~~~ d
                    // A restriction from ---- to ~~~~ via node c.
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //    a ----> b ====> c ~~~~ d
                    // A restriction from ==== to ~~~~ via node c.
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '~', nodes: ['c', 'd']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '-', role: 'from', type: 'way'},
                            {id: '~', role: 'to', type: 'way'},
                            {id: 'c', role: 'via', type: 'node'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '=', role: 'from', type: 'way'},
                        {id: '~', role: 'to', type: 'way'},
                        {id: 'c', role: 'via', type: 'node'}
                    ]);
                });

                it('updates a restriction\'s \'to\' role - via node', function () {
                    // Situation:
                    //    a ----> b ----> c ~~~~ d
                    // A restriction from ~~~~ to ---- via node c.
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //    a ----> b ====> c ~~~~ d
                    // A restriction from ~~~~ to ==== via node c.
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '~', nodes: ['c', 'd']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '~', role: 'from', type: 'way'},
                            {id: '-', role: 'to', type: 'way'},
                            {id: 'c', role: 'via', type: 'node'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '~', role: 'from', type: 'way'},
                        {id: '=', role: 'to', type: 'way'},
                        {id: 'c', role: 'via', type: 'node'}
                    ]);
                });

                it('updates both \'to\' and \'from\' roles for via-node u-turn restrictions', function () {
                    // Situation:
                    //    a ----> b ----> c ~~~~ d
                    // A restriction from ---- to ---- via node c.
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //    a ----> b ====> c ~~~~ d
                    // A restriction from ==== to ==== via node c.
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '~', nodes: ['c', 'd']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '-', role: 'from', type: 'way'},
                            {id: '-', role: 'to', type: 'way'},
                            {id: 'c', role: 'via', type: 'node'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '=', role: 'from', type: 'way'},
                        {id: '=', role: 'to', type: 'way'},
                        {id: 'c', role: 'via', type: 'node'}
                    ]);
                });

                it('updates a restriction\'s \'from\' role - via way', function () {
                    // Situation:
                    //            e <~~~~ d
                    //                    |
                    //                    |
                    //    a ----> b ----> c
                    //
                    // A restriction from ---- to ~~~~ via way |
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //            e <~~~~ d
                    //                    |
                    //                    |
                    //    a ----> b ====> c
                    //
                    // A restriction from ==== to ~~~~ via way |
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmNode({id: 'e'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '|', nodes: ['c', 'd']}),
                        iD.osmWay({id: '~', nodes: ['d', 'e']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '-', role: 'from', type: 'way'},
                            {id: '~', role: 'to', type: 'way'},
                            {id: '|', role: 'via', type: 'way'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '=', role: 'from', type: 'way'},
                        {id: '~', role: 'to', type: 'way'},
                        {id: '|', role: 'via', type: 'way'}
                    ]);
                });

                it('updates a restriction\'s \'to\' role - via way', function () {
                    // Situation:
                    //            e <~~~~ d
                    //                    |
                    //                    |
                    //    a ----> b ----> c
                    //
                    // A restriction from ~~~~ to ---- via way |
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //            e <~~~~ d
                    //                    |
                    //                    |
                    //    a ----> b ====> c
                    //
                    // A restriction from ~~~~ to ==== via way |
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmNode({id: 'e'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '|', nodes: ['c', 'd']}),
                        iD.osmWay({id: '~', nodes: ['d', 'e']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '~', role: 'from', type: 'way'},
                            {id: '-', role: 'to', type: 'way'},
                            {id: '|', role: 'via', type: 'way'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '~', role: 'from', type: 'way'},
                        {id: '=', role: 'to', type: 'way'},
                        {id: '|', role: 'via', type: 'way'}
                    ]);
                });


                it('updates a restriction\'s \'via\' role when splitting via way', function () {
                    // Situation:
                    //    d               e
                    //    |               ‖
                    //    |               ‖
                    //    a ----> b ----> c
                    //
                    // A restriction from | to ‖ via way ----
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //    d               e
                    //    |               ‖
                    //    |               ‖
                    //    a ----> b ====> c
                    //
                    // A restriction from | to ‖ via ways ----, ====
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmNode({id: 'e'}),
                        iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                        iD.osmWay({id: '|', nodes: ['d', 'a']}),
                        iD.osmWay({id: '‖', nodes: ['e', 'c']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '|', role: 'from', type: 'way'},
                            {id: '-', role: 'via', type: 'way'},
                            {id: '‖', role: 'to', type: 'way'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '|', role: 'from', type: 'way'},
                        {id: '-', role: 'via', type: 'way'},
                        {id: '=', role: 'via', type: 'way'},
                        {id: '‖', role: 'to', type: 'way'}
                    ]);
                });

                it('leaves unaffected restrictions unchanged', function () {
                    // Situation:
                    //    a <---- b <---- c ~~~~ d
                    // A restriction from ---- to ~~~~ via c.
                    //
                    // Split at b.
                    //
                    // Expected result:
                    //    a <==== b <---- c ~~~~ d
                    // A restriction from ---- to ~~~~ via c.
                    //
                    var graph = iD.coreGraph([
                        iD.osmNode({id: 'a'}),
                        iD.osmNode({id: 'b'}),
                        iD.osmNode({id: 'c'}),
                        iD.osmNode({id: 'd'}),
                        iD.osmWay({id: '-', nodes: ['c', 'b', 'a']}),
                        iD.osmWay({id: '~', nodes: ['c', 'd']}),
                        iD.osmRelation({id: 'r', tags: {type: type}, members: [
                            {id: '-', role: 'from', type: 'way'},
                            {id: '~', role: 'to', type: 'way'},
                            {id: 'c', role: 'via', type: 'node'}
                        ]})
                    ]);

                    graph = iD.actionSplit('b', ['='])(graph);

                    expect(graph.entity('r').members).to.eql([
                        {id: '-', role: 'from', type: 'way'},
                        {id: '~', role: 'to', type: 'way'},
                        {id: 'c', role: 'via', type: 'node'}
                    ]);
                });
            });

        });
    });
});
