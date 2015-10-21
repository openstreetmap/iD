describe("iD.geo.Intersection", function() {
    describe('highways', function() {
        it('excludes non-highways', function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*']}),
                iD.Way({id: '-', nodes: ['*', 'w']})
            ]);
            expect(iD.geo.Intersection(graph, '*').ways).to.eql([]);
        });

        it("excludes degenerate highways", function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['*'], tags: {highway: 'residential'}})
            ]);
            expect(_.pluck(iD.geo.Intersection(graph, '*').ways, 'id')).to.eql(['=']);
        });

        it("excludes coincident highways", function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['u', '*'], tags: {highway: 'residential'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').ways).to.eql([]);
        });

        it('includes line highways', function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['*', 'w']})
            ]);
            expect(_.pluck(iD.geo.Intersection(graph, '*').ways, 'id')).to.eql(['=']);
        });

        it('excludes area highways', function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'pedestrian', area: 'yes'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').ways).to.eql([]);
        });

        it('auto-splits highways at the intersection', function() {
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(_.pluck(iD.geo.Intersection(graph, '*').ways, 'id')).to.eql(['=-a', '=-b']);
        });
    });

    describe('#turns', function() {
        it("permits turns onto a way forward", function() {
            // u====*--->w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it("permits turns onto a way backward", function() {
            // u====*<---w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it("permits turns from a way that must be split", function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Node({id: 'x'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('w');

            expect(turns.length).to.eql(3);
            expect(turns[0]).to.eql({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
            expect(turns[1]).to.eql({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            });
            expect(turns[2]).to.eql({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                u: true
            });
        });

        it("permits turns to a way that must be split", function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Node({id: 'x'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(3);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            });
            expect(turns[2]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it("permits turns from a oneway forward", function() {
            // u===>v----w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns).to.eql([{
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            }]);
        });

        it("permits turns from a reverse oneway backward", function() {
            // u<===*----w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: '-1'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns).to.eql([{
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            }]);
        });

        it("omits turns from a oneway backward", function() {
            // u<===*----w
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').turns('u')).to.eql([]);
        });

        it("omits turns from a reverse oneway forward", function() {
            // u===>*----w
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').turns('u')).to.eql([]);
        });

        it("permits turns onto a oneway forward", function() {
            // u====*--->w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: 'yes'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it("permits turns onto a reverse oneway backward", function() {
            // u====*<---w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: '-1'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it("omits turns onto a oneway backward", function() {
            // u====*<---w
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: 'yes'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').turns('u').length).to.eql(1);
        });

        it("omits turns onto a reverse oneway forward", function() {
            // u====*--->w
            var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: '-1'}})
            ]);
            expect(iD.geo.Intersection(graph, '*').turns('u').length).to.eql(1);
        });

        it("includes U-turns", function() {
            // u====*--->w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it("restricts turns with a restriction relation", function() {
            // u====*--->w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'w'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}}),
                    iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                        {id: '=', role: 'from', type: 'way'},
                        {id: '-', role: 'to', type: 'way'},
                        {id: '*', role: 'via', type: 'node'}
                    ]})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'r'
            });
        });

        it("restricts turns affected by an only_* restriction relation", function() {
            // u====*~~~~v
            //      |
            //      w
            var graph = iD.Graph([
                    iD.Node({id: 'u'}),
                    iD.Node({id: 'v'}),
                    iD.Node({id: 'w'}),
                    iD.Node({id: '*'}),
                    iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '~', nodes: ['v', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}}),
                    iD.Relation({id: 'r', tags: {type: 'restriction', restriction: 'only_right_turn'}, members: [
                        {id: '=', role: 'from', type: 'way'},
                        {id: '-', role: 'to', type: 'way'},
                        {id: '*', role: 'via', type: 'node'}
                    ]})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(3);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'v', way: '~'},
                restriction: 'r',
                indirect_restriction: true
            });
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'r'
            });
            expect(turns[2]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                restriction: 'r',
                indirect_restriction: true,
                u: true
            });
        });

        it("permits turns to a circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(3);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[2]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it("permits turns from a circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('a');

            expect(turns.length).to.eql(3);
            expect(turns[0]).to.eql({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
            expect(turns[2]).to.eql({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'},
                u: true
            });
        });

        it("permits turns to a oneway circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it("permits turns to a reverse oneway circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('u');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it("permits turns from a oneway circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('c');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'c', way: '-'},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'c', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
        });

        it("permits turns from a reverse oneway circular way", function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = iD.Graph([
                    iD.Node({id: 'a'}),
                    iD.Node({id: 'b'}),
                    iD.Node({id: 'c'}),
                    iD.Node({id: '*'}),
                    iD.Node({id: 'u'}),
                    iD.Way({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                    iD.Way({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = iD.geo.Intersection(graph, '*').turns('a');

            expect(turns.length).to.eql(2);
            expect(turns[0]).to.eql({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).to.eql({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
        });

    });
});
