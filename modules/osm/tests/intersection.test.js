import _ from 'lodash';

import { coreGraph } from '../../core/graph';

import { osmNode } from '../node';
import { osmWay } from '../way';
import { osmRelation } from '../relation';
import { osmIntersection } from '../intersection';

describe('osmIntersection', function() {
    describe('highways', function() {
        it('excludes non-highways', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*']}),
                osmWay({id: '-', nodes: ['*', 'w']})
            ]);
            expect(osmIntersection(graph, '*').ways).toEqual([]);
        });

        it('excludes degenerate highways', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                osmWay({id: '-', nodes: ['*'], tags: {highway: 'residential'}})
            ]);
            expect(_.map(osmIntersection(graph, '*').ways, 'id')).toEqual(['=']);
        });

        it('excludes coincident highways', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                osmWay({id: '-', nodes: ['u', '*'], tags: {highway: 'residential'}})
            ]);
            expect(osmIntersection(graph, '*').ways).toEqual([]);
        });

        it('includes line highways', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                osmWay({id: '-', nodes: ['*', 'w']})
            ]);
            expect(_.map(osmIntersection(graph, '*').ways, 'id')).toEqual(['=']);
        });

        it('excludes area highways', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'pedestrian', area: 'yes'}})
            ]);
            expect(osmIntersection(graph, '*').ways).toEqual([]);
        });

        it('auto-splits highways at the intersection', function() {
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(_.map(osmIntersection(graph, '*').ways, 'id')).toEqual(['=-a', '=-b']);
        });
    });

    describe('#turns', function() {
        it('permits turns onto a way forward', function() {
            // u====*--->w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it('permits turns onto a way backward', function() {
            // u====*<---w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it('permits turns from a way that must be split', function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmNode({id: 'x'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('w');

            expect(turns.length).toEqual(3);
            expect(turns[0]).toEqual({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
            expect(turns[1]).toEqual({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            });
            expect(turns[2]).toEqual({
                from: {node: 'w', way: '-'},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                u: true
            });
        });

        it('permits turns to a way that must be split', function() {
            //     w
            //     |
            // u===*
            //     |
            //     x
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmNode({id: 'x'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['w', '*', 'x'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(3);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'x', way: '-'}
            });
            expect(turns[2]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it('permits turns from a oneway forward', function() {
            // u===>v----w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns).toEqual([{
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            }]);
        });

        it('permits turns from a reverse oneway backward', function() {
            // u<===*----w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: '-1'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns).toEqual([{
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            }]);
        });

        it('omits turns from a oneway backward', function() {
            // u<===*----w
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential', oneway: 'yes'}}),
                osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(osmIntersection(graph, '*').turns('u')).toEqual([]);
        });

        it('omits turns from a reverse oneway forward', function() {
            // u===>*----w
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
            ]);
            expect(osmIntersection(graph, '*').turns('u')).toEqual([]);
        });

        it('permits turns onto a oneway forward', function() {
            // u====*--->w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: 'yes'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it('permits turns onto a reverse oneway backward', function() {
            // u====*<---w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: '-1'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'}
            });
        });

        it('omits turns onto a oneway backward', function() {
            // u====*<---w
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential', oneway: 'yes'}})
            ]);
            expect(osmIntersection(graph, '*').turns('u').length).toEqual(1);
        });

        it('omits turns onto a reverse oneway forward', function() {
            // u====*--->w
            var graph = coreGraph([
                osmNode({id: 'u'}),
                osmNode({id: '*'}),
                osmNode({id: 'w'}),
                osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential', oneway: '-1'}})
            ]);
            expect(osmIntersection(graph, '*').turns('u').length).toEqual(1);
        });

        it('includes U-turns', function() {
            // u====*--->w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it('restricts turns with a restriction relation', function() {
            // u====*--->w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'w'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}}),
                    osmRelation({id: 'r', tags: {type: 'restriction'}, members: [
                        {id: '=', role: 'from', type: 'way'},
                        {id: '-', role: 'to', type: 'way'},
                        {id: '*', role: 'via', type: 'node'}
                    ]})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'r'
            });
        });

        it('restricts turns affected by an only_* restriction relation', function() {
            // u====*~~~~v
            //      |
            //      w
            var graph = coreGraph([
                    osmNode({id: 'u'}),
                    osmNode({id: 'v'}),
                    osmNode({id: 'w'}),
                    osmNode({id: '*'}),
                    osmWay({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '~', nodes: ['v', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '-', nodes: ['w', '*'], tags: {highway: 'residential'}}),
                    osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'only_right_turn'}, members: [
                        {id: '=', role: 'from', type: 'way'},
                        {id: '-', role: 'to', type: 'way'},
                        {id: '*', role: 'via', type: 'node'}
                    ]})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(3);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'v', way: '~'},
                restriction: 'r',
                indirect_restriction: true
            });
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'w', way: '-'},
                restriction: 'r'
            });
            expect(turns[2]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                restriction: 'r',
                indirect_restriction: true,
                u: true
            });
        });

        it('permits turns to a circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(3);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[2]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it('permits turns from a circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('a');

            expect(turns.length).toEqual(3);
            expect(turns[0]).toEqual({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
            expect(turns[2]).toEqual({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'},
                u: true
            });
        });

        it('permits turns to a oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it('permits turns to a reverse oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('u');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'u', way: '='},
                via:  {node: '*'},
                to:   {node: 'u', way: '='},
                u: true
            });
        });

        it('permits turns from a oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: 'yes'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('c');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'c', way: '-'},
                via:  {node: '*'},
                to:   {node: 'a', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'c', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
        });

        it('permits turns from a reverse oneway circular way', function() {
            //
            //  b -- c
            //  |    |
            //  a -- * === u
            //
            var graph = coreGraph([
                    osmNode({id: 'a'}),
                    osmNode({id: 'b'}),
                    osmNode({id: 'c'}),
                    osmNode({id: '*'}),
                    osmNode({id: 'u'}),
                    osmWay({id: '-', nodes: ['*', 'a', 'b', 'c', '*'], tags: {highway: 'residential', oneway: '-1'}}),
                    osmWay({id: '=', nodes: ['*', 'u'], tags: {highway: 'residential'}})
                ]),
                turns = osmIntersection(graph, '*').turns('a');

            expect(turns.length).toEqual(2);
            expect(turns[0]).toEqual({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'c', way: '-'}
            });
            expect(turns[1]).toEqual({
                from: {node: 'a', way: '-'},
                via:  {node: '*'},
                to:   {node: 'u', way: '='}
            });
        });

    });
});
