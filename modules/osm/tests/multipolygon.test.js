import _ from 'lodash';

import { coreGraph } from '../../core/graph';

import { osmWay } from '../way';
import { osmNode } from '../node';
import { osmRelation } from '../relation';
import {
    osmIsSimpleMultipolygonOuterMember, 
    osmSimpleMultipolygonOuterMember,
    osmJoinWays
} from '../multipolygon';

describe('osmIsSimpleMultipolygonOuterMember', function() {
    it('returns the parent relation of a simple multipolygon outer', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(relation);
    });

    it('returns the parent relation of a simple multipolygon outer, assuming role outer if unspecified', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer.id}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(relation);
    });

    it('returns false if entity is not a way', function() {
        var outer = osmNode({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(false);
    });

    it('returns false if entity does not have interesting tags', function() {
        var outer = osmWay({tags: {'tiger:reviewed':'no'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(false);
    });

    it('returns false if entity does not have a parent relation', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            graph = coreGraph([outer]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(false);
    });

    it('returns false if the parent is not a multipolygon', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'route'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(false);
    });

    it('returns false if the parent has interesting tags', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {natural: 'wood', type: 'multipolygon'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(false);
    });

    it('returns the parent relation of a simple multipolygon outer, ignoring uninteresting parent tags', function() {
        var outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {'tiger:reviewed':'no', type: 'multipolygon'},
                members: [{id: outer.id, role: 'outer'}]}),
            graph = coreGraph([outer, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer, graph)).toBe(relation);
    });

    it('returns false if the parent has multiple outer ways', function() {
        var outer1 = osmWay({tags: {'natural':'wood'}}),
            outer2 = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer1.id, role: 'outer'}, {id: outer2.id, role: 'outer'}]}),
            graph = coreGraph([outer1, outer2, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer1, graph)).toBe(false);
        expect(osmIsSimpleMultipolygonOuterMember(outer2, graph)).toBe(false);
    });

    it('returns false if the parent has multiple outer ways, assuming role outer if unspecified', function() {
        var outer1 = osmWay({tags: {'natural':'wood'}}),
            outer2 = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: outer1.id}, {id: outer2.id}]}),
            graph = coreGraph([outer1, outer2, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(outer1, graph)).toBe(false);
        expect(osmIsSimpleMultipolygonOuterMember(outer2, graph)).toBe(false);
    });

    it('returns false if the entity is not an outer', function() {
        var inner = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'},
                members: [{id: inner.id, role: 'inner'}]}),
            graph = coreGraph([inner, relation]);
        expect(osmIsSimpleMultipolygonOuterMember(inner, graph)).toBe(false);
    });
});


describe('osmSimpleMultipolygonOuterMember', function() {
    it('returns the outer member of a simple multipolygon', function() {
        var inner = osmWay(),
            outer = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'}, members: [
                {id: outer.id, role: 'outer'},
                {id: inner.id, role: 'inner'}]
            }),
            graph = coreGraph([inner, outer, relation]);

        expect(osmSimpleMultipolygonOuterMember(inner, graph)).toBe(outer);
        expect(osmSimpleMultipolygonOuterMember(outer, graph)).toBe(outer);
    });

    it('returns falsy for a complex multipolygon', function() {
        var inner = osmWay(),
            outer1 = osmWay({tags: {'natural':'wood'}}),
            outer2 = osmWay({tags: {'natural':'wood'}}),
            relation = osmRelation({tags: {type: 'multipolygon'}, members: [
                {id: outer1.id, role: 'outer'},
                {id: outer2.id, role: 'outer'},
                {id: inner.id, role: 'inner'}]
            }),
            graph = coreGraph([inner, outer1, outer2, relation]);

        expect(osmSimpleMultipolygonOuterMember(inner, graph)).not.toBeTruthy();
        expect(osmSimpleMultipolygonOuterMember(outer1, graph)).not.toBeTruthy();
        expect(osmSimpleMultipolygonOuterMember(outer2, graph)).not.toBeTruthy();
    });

    it('handles incomplete relations', function() {
        var way = osmWay({id: 'w'}),
            relation = osmRelation({id: 'r', tags: {type: 'multipolygon'}, members: [
                {id: 'o', role: 'outer'},
                {id: 'w', role: 'inner'}]
            }),
            graph = coreGraph([way, relation]);

        expect(osmSimpleMultipolygonOuterMember(way, graph)).not.toBeTruthy();
    });
});


describe('osmJoinWays', function() {
    it('returns an array of members with nodes properties', function() {
        var node = osmNode({loc: [0, 0]}),
            way  = osmWay({nodes: [node.id]}),
            member = {id: way.id, type: 'way'},
            graph = coreGraph([node, way]),
            result = osmJoinWays([member], graph);

        expect(result.length).toBe(1);
        expect(result[0].nodes.length).toBe(1);
        expect(result[0].nodes[0]).toBe(node);
        expect(result[0].length).toBe(1);
        expect(result[0][0]).toBe(member);
    });

    it('returns the members in the correct order', function() {
        // a<===b--->c~~~>d
        var graph = coreGraph([
            osmNode({id: 'a', loc: [0, 0]}),
            osmNode({id: 'b', loc: [0, 0]}),
            osmNode({id: 'c', loc: [0, 0]}),
            osmNode({id: 'd', loc: [0, 0]}),
            osmWay({id: '=', nodes: ['b', 'a']}),
            osmWay({id: '-', nodes: ['b', 'c']}),
            osmWay({id: '~', nodes: ['c', 'd']}),
            osmRelation({id: 'r', members: [
                {id: '-', type: 'way'},
                {id: '~', type: 'way'},
                {id: '=', type: 'way'}
            ]})
        ]);

        var result = osmJoinWays(graph.entity('r').members, graph);
        expect(_.map(result[0], 'id')).toEqual(['=', '-', '~']);
    });

    it('reverses member tags of reversed segements', function() {
        // a --> b <== c
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = coreGraph([
                osmNode({id: 'a'}),
                osmNode({id: 'b'}),
                osmNode({id: 'c'}),
                osmWay({id: '-', nodes: ['a', 'b']}),
                osmWay({id: '=', nodes: ['c', 'b'], tags: {'oneway': 'yes', 'lanes:forward': 2}})
            ]);

        var result = osmJoinWays([graph.entity('-'), graph.entity('=')], graph);
        expect(result[0][1].tags).toEqual({'oneway': '-1', 'lanes:backward': 2});
    });

    it('ignores non-way members', function() {
        var node = osmNode({loc: [0, 0]}),
            member = {id: 'n', type: 'node'},
            graph = coreGraph([node]);
        expect(osmJoinWays([member], graph)).toEqual([]);
    });

    it('ignores incomplete members', function() {
        var member = {id: 'w', type: 'way'},
            graph = coreGraph();
        expect(osmJoinWays([member], graph)).toEqual([]);
    });
});
