import _ from 'lodash';

import { coreGraph } from '../../core/graph';
import { geoExtent } from '../../geo/index';

import { osmNode, Node } from '../node';
import { osmWay, Way } from '../way';
import { osmRelation, Relation } from '../relation';

describe('iD.osmRelation', function () {
    // if (iD.debug) {
    //     it('freezes nodes', function () {
    //         expect(Object.isFrozen(osmRelation().members)).to.be.true;
    //     });
    // }

    it('returns a relation', function () {
        expect(osmRelation()).toBeInstanceOf(Relation);
        expect(osmRelation().type).toBe('relation');
    });

    it('defaults members to an empty array', function () {
        expect(osmRelation().members).toEqual([]);
    });

    it('sets members as specified', function () {
        expect(osmRelation({members: ['n-1']}).members).toEqual(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(osmRelation().tags).toEqual({});
    });

    it('sets tags as specified', function () {
        expect(osmRelation({tags: {foo: 'bar'}}).tags).toEqual({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Relation', function () {
            var r = osmRelation({id: 'r'}),
                result = r.copy(null, {});

            expect(result).toBeInstanceOf(Relation);
            expect(result).not.toBe(r);
        });

        it('adds the new Relation to input object', function () {
            var r = osmRelation({id: 'r'}),
                copies = {},
                result = r.copy(null, copies);
            expect(Object.keys(copies)).toHaveLength(1);
            expect(copies.r).toBe(result);
        });

        it('returns an existing copy in input object', function () {
            var r = osmRelation({id: 'r'}),
                copies = {},
                result1 = r.copy(null, copies),
                result2 = r.copy(null, copies);
            expect(Object.keys(copies)).toHaveLength(1);
            expect(result1).toBe(result2);
        });

        it('deep copies members', function () {
            var a = osmNode({id: 'a'}),
                b = osmNode({id: 'b'}),
                c = osmNode({id: 'c'}),
                w = osmWay({id: 'w', nodes: ['a','b','c','a']}),
                r = osmRelation({id: 'r', members: [{id: 'w', role: 'outer'}]}),
                graph = coreGraph([a, b, c, w, r]),
                copies = {},
                result = r.copy(graph, copies);

            expect(Object.keys(copies)).toHaveLength(5);
            expect(copies.w).toBeInstanceOf(Way);
            expect(copies.a).toBeInstanceOf(Node);
            expect(copies.b).toBeInstanceOf(Node);
            expect(copies.c).toBeInstanceOf(Node);
            expect(result.members[0].id).not.toBe(r.members[0].id);
            expect(result.members[0].role).toBe(r.members[0].role);
        });

        it('deep copies non-tree relation graphs without duplicating children', function () {
            var w = osmWay({id: 'w'}),
                r1 = osmRelation({id: 'r1', members: [{id: 'r2'}, {id: 'w'}]}),
                r2 = osmRelation({id: 'r2', members: [{id: 'w'}]}),
                graph = coreGraph([w, r1, r2]),
                copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).toHaveLength(3);
            expect(copies.r1).toBeInstanceOf(Relation);
            expect(copies.r2).toBeInstanceOf(Relation);
            expect(copies.w).toBeInstanceOf(Way);
            expect(copies.r1.members[0].id).toBe(copies.r2.id);
            expect(copies.r1.members[1].id).toBe(copies.w.id);
            expect(copies.r2.members[0].id).toBe(copies.w.id);
        });

        it('deep copies cyclical relation graphs without issue', function () {
            var r1 = osmRelation({id: 'r1', members: [{id: 'r2'}]}),
                r2 = osmRelation({id: 'r2', members: [{id: 'r1'}]}),
                graph = coreGraph([r1, r2]),
                copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).toHaveLength(2);
            expect(copies.r1.members[0].id).toBe(copies.r2.id);
            expect(copies.r2.members[0].id).toBe(copies.r1.id);
        });

        it('deep copies self-referencing relations without issue', function () {
            var r = osmRelation({id: 'r', members: [{id: 'r'}]}),
                graph = coreGraph([r]),
                copies = {};
            r.copy(graph, copies);

            expect(Object.keys(copies)).toHaveLength(1);
            expect(copies.r.members[0].id).toBe(copies.r.id);
         });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing the extents of all members', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [5, 10]}),
                r = osmRelation({members: [{id: a.id}, {id: b.id}]}),
                graph = coreGraph([a, b, r]);

            expect(r.extent(graph).equals([[0, 0], [5, 10]])).toBeTruthy();
        });

        it('returns the known extent of incomplete relations', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [5, 10]}),
                r = osmRelation({members: [{id: a.id}, {id: b.id}]}),
                graph = coreGraph([a, r]);

            expect(r.extent(graph).equals([[0, 0], [0, 0]])).toBeTruthy();
        });

        it('does not error on self-referencing relations', function () {
            var r = osmRelation();
            r = r.addMember({id: r.id});
            expect(r.extent(coreGraph([r]))).toEqual(geoExtent());
        });
    });

    describe('#geometry', function () {
        it('returns \'area\' for multipolygons', function () {
            expect(osmRelation({tags: {type: 'multipolygon'}}).geometry(coreGraph())).toBe('area');
        });

        it('returns \'relation\' for other relations', function () {
            expect(osmRelation().geometry(coreGraph())).toBe('relation');
        });
    });

    describe('#isDegenerate', function () {
        it('returns true for a relation without members', function () {
            expect(osmRelation().isDegenerate()).toBe(true);
        });

        it('returns false for a relation with members', function () {
            expect(osmRelation({members: [{id: 'a', role: 'inner'}]}).isDegenerate()).toBe(false);
        });
    });

    describe('#memberByRole', function () {
        it('returns the first member with the given role', function () {
            var r = osmRelation({members: [
                {id: 'a', role: 'inner'},
                {id: 'b', role: 'outer'},
                {id: 'c', role: 'outer'}]});
            expect(r.memberByRole('outer')).toEqual({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(osmRelation().memberByRole('outer')).toBeUndefined();
        });
    });

    describe('#memberById', function () {
        it('returns the first member with the given id', function () {
            var r = osmRelation({members: [
                {id: 'a', role: 'outer'},
                {id: 'b', role: 'outer'},
                {id: 'b', role: 'inner'}]});
            expect(r.memberById('b')).toEqual({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(osmRelation().memberById('b')).toBeUndefined();
        });
    });

    describe('#isRestriction', function () {
        it('returns true for \'restriction\' type', function () {
            expect(osmRelation({tags: {type: 'restriction'}}).isRestriction()).toBe(true);
        });

        it('returns true for \'restriction:type\' types', function () {
            expect(osmRelation({tags: {type: 'restriction:bus'}}).isRestriction()).toBe(true);
        });

        it('returns false otherwise', function () {
            expect(osmRelation().isRestriction()).toBe(false);
            expect(osmRelation({tags: {type: 'multipolygon'}}).isRestriction()).toBe(false);
        });
    });

    describe('#indexedMembers', function () {
        it('returns an array of members extended with indexes', function () {
            var r = osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.indexedMembers()).toEqual([{id: '1', index: 0}, {id: '3', index: 1}]);
        });
    });

    describe('#addMember', function () {
        it('adds a member at the end of the relation', function () {
            var r = osmRelation();
            expect(r.addMember({id: '1'}).members).toEqual([{id: '1'}]);
        });

        it('adds a member at index 0', function () {
            var r = osmRelation({members: [{id: '1'}]});
            expect(r.addMember({id: '2'}, 0).members).toEqual([{id: '2'}, {id: '1'}]);
        });

        it('adds a member at a positive index', function () {
            var r = osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, 1).members).toEqual([{id: '1'}, {id: '2'}, {id: '3'}]);
        });

        it('adds a member at a negative index', function () {
            var r = osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, -1).members).toEqual([{id: '1'}, {id: '2'}, {id: '3'}]);
        });
    });

    describe('#updateMember', function () {
        it('updates the properties of the relation member at the specified index', function () {
            var r = osmRelation({members: [{role: 'forward'}]});
            expect(r.updateMember({role: 'backward'}, 0).members).toEqual([{role: 'backward'}]);
        });
    });

    describe('#removeMember', function () {
        it('removes the member at the specified index', function () {
            var r = osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'c'}]});
            expect(r.removeMember(1).members).toEqual([{id: 'a'}, {id: 'c'}]);
        });
    });

    describe('#removeMembersWithID', function () {
        it('removes members with the given ID', function () {
            var r = osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'a'}]});
            expect(r.removeMembersWithID('a').members).toEqual([{id: 'b'}]);
        });
    });

    describe('#replaceMember', function () {
        it('returns self if self does not contain needle', function () {
            var r = osmRelation({members: []});
            expect(r.replaceMember({id: 'a'}, {id: 'b'})).toBe(r);
        });

        it('replaces a member which doesn\'t already exist', function () {
            var r = osmRelation({members: [{id: 'a', role: 'a'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members).toEqual([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('preserves the existing role', function () {
            var r = osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members).toEqual([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('uses the replacement type', function () {
            var r = osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'way'}).members).toEqual([{id: 'b', role: 'a', type: 'way'}]);
        });

        it('removes members if replacing them would produce duplicates', function () {
            var r = osmRelation({members: [
                {id: 'a', role: 'b', type: 'node'},
                {id: 'b', role: 'b', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members).toEqual([{id: 'b', role: 'b', type: 'node'}]);
        });
    });

    describe('#asJXON', function () {
        it('converts a relation to jxon', function() {
            var relation = osmRelation({id: 'r-1', members: [{id: 'w1', role: 'forward', type: 'way'}], tags: {type: 'route'}});
            expect(relation.asJXON()).toEqual({relation: {
                '@id': '-1',
                '@version': 0,
                member: [{keyAttributes: {ref: '1', role: 'forward', type: 'way'}}],
                tag: [{keyAttributes: {k: 'type', v: 'route'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(osmRelation().asJXON('1234').relation['@changeset']).toBe('1234');
        });
    });

    describe('#asGeoJSON', function (){
        it('converts a multipolygon to a GeoJSON MultiPolygon geometry', function() {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [3, 3]}),
                c = osmNode({loc: [2, 2]}),
                w = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                r = osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
                g = coreGraph([a, b, c, w, r]),
                json = r.asGeoJSON(g);

            expect(json.type).toBe('MultiPolygon');
            expect(json.coordinates).toEqual([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('forces clockwise winding order for outer multipolygon ways', function() {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                w = osmWay({nodes: [a.id, c.id, b.id, a.id]}),
                r = osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
                g = coreGraph([a, b, c, w, r]),
                json = r.asGeoJSON(g);

            expect(json.coordinates[0][0]).toEqual([a.loc, b.loc, c.loc, a.loc]);
        });

        it('forces counterclockwise winding order for inner multipolygon ways', function() {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                d = osmNode({loc: [0.1, 0.1]}),
                e = osmNode({loc: [0.1, 0.2]}),
                f = osmNode({loc: [0.2, 0.1]}),
                outer = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                inner = osmWay({nodes: [d.id, e.id, f.id, d.id]}),
                r = osmRelation({members: [{id: outer.id, type: 'way'}, {id: inner.id, role: 'inner', type: 'way'}]}),
                g = coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)[0][1]).toEqual([d.loc, f.loc, e.loc, d.loc]);
        });

        it('converts a relation to a GeoJSON FeatureCollection', function() {
            var a = osmNode({loc: [1, 1]}),
                r = osmRelation({tags: {type: 'type'}, members: [{id: a.id, role: 'role'}]}),
                g = coreGraph([a, r]),
                json = r.asGeoJSON(g);

            expect(json.type).toBe('FeatureCollection');
            expect(json.properties).toEqual({type: 'type'});
            expect(json.features).toEqual([_.extend({role: 'role'}, a.asGeoJSON(g))]);
        });
    });

    describe('#multipolygon', function () {
        it('single polygon consisting of a single way', function () {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [3, 3]}),
                c = osmNode({loc: [2, 2]}),
                w = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                r = osmRelation({members: [{id: w.id, type: 'way'}]}),
                g = coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('single polygon consisting of multiple ways', function () {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [3, 3]}),
                c = osmNode({loc: [2, 2]}),
                w1 = osmWay({nodes: [a.id, b.id]}),
                w2 = osmWay({nodes: [b.id, c.id, a.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('single polygon consisting of multiple ways, one needing reversal', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [3, 3]}),
                c  = osmNode({loc: [2, 2]}),
                w1 = osmWay({nodes: [a.id, b.id]}),
                w2 = osmWay({nodes: [a.id, c.id, b.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('multiple polygons consisting of single ways', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [3, 3]}),
                c  = osmNode({loc: [2, 2]}),
                d  = osmNode({loc: [4, 4]}),
                e  = osmNode({loc: [6, 6]}),
                f  = osmNode({loc: [5, 5]}),
                w1 = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                w2 = osmWay({nodes: [d.id, e.id, f.id, d.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, d, e, f, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc]], [[d.loc, e.loc, f.loc, d.loc]]]);
        });

        it('invalid geometry: unclosed ring consisting of a single way', function () {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [3, 3]}),
                c = osmNode({loc: [2, 2]}),
                w = osmWay({nodes: [a.id, b.id, c.id]}),
                r = osmRelation({members: [{id: w.id, type: 'way'}]}),
                g = coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc]]]);
        });

        it('invalid geometry: unclosed ring consisting of multiple ways', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [3, 3]}),
                c  = osmNode({loc: [2, 2]}),
                w1 = osmWay({nodes: [a.id, b.id]}),
                w2 = osmWay({nodes: [b.id, c.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc]]]);
        });

        it('invalid geometry: unclosed ring consisting of multiple ways, alternate order', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [2, 2]}),
                c  = osmNode({loc: [3, 3]}),
                d  = osmNode({loc: [4, 4]}),
                w1 = osmWay({nodes: [c.id, d.id]}),
                w2 = osmWay({nodes: [a.id, b.id, c.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[d.loc, c.loc, b.loc, a.loc]]]);
        });

        it('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [2, 2]}),
                c  = osmNode({loc: [3, 3]}),
                d  = osmNode({loc: [4, 4]}),
                w1 = osmWay({nodes: [a.id, b.id, c.id]}),
                w2 = osmWay({nodes: [d.id, c.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[d.loc, c.loc, b.loc, a.loc]]]);
        });

        it('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal, alternate order', function () {
            var a  = osmNode({loc: [1, 1]}),
                b  = osmNode({loc: [2, 2]}),
                c  = osmNode({loc: [3, 3]}),
                d  = osmNode({loc: [4, 4]}),
                w1 = osmWay({nodes: [c.id, d.id]}),
                w2 = osmWay({nodes: [c.id, b.id, a.id]}),
                r  = osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).toEqual([[[d.loc, c.loc, b.loc, a.loc]]]);
        });

        it('single polygon with single single-way inner', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                d = osmNode({loc: [0.1, 0.1]}),
                e = osmNode({loc: [0.2, 0.1]}),
                f = osmNode({loc: [0.1, 0.2]}),
                outer = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                inner = osmWay({nodes: [d.id, e.id, f.id, d.id]}),
                r = osmRelation({members: [{id: outer.id, type: 'way'}, {id: inner.id, role: 'inner', type: 'way'}]}),
                g = coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        it('single polygon with single multi-way inner', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                d = osmNode({loc: [0.1, 0.1]}),
                e = osmNode({loc: [0.2, 0.1]}),
                f = osmNode({loc: [0.2, 0.1]}),
                outer = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                inner1 = osmWay({nodes: [d.id, e.id]}),
                inner2 = osmWay({nodes: [e.id, f.id, d.id]}),
                r = osmRelation({members: [
                    {id: outer.id, type: 'way'},
                    {id: inner1.id, role: 'inner', type: 'way'},
                    {id: inner2.id, role: 'inner', type: 'way'}]}),
                graph = coreGraph([a, b, c, d, e, f, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).toEqual([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        it('single polygon with multiple single-way inners', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                d = osmNode({loc: [0.1, 0.1]}),
                e = osmNode({loc: [0.2, 0.1]}),
                f = osmNode({loc: [0.1, 0.2]}),
                g = osmNode({loc: [0.2, 0.2]}),
                h = osmNode({loc: [0.3, 0.2]}),
                i = osmNode({loc: [0.2, 0.3]}),
                outer = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                inner1 = osmWay({nodes: [d.id, e.id, f.id, d.id]}),
                inner2 = osmWay({nodes: [g.id, h.id, i.id, g.id]}),
                r = osmRelation({members: [
                    {id: outer.id, type: 'way'},
                    {id: inner1.id, role: 'inner', type: 'way'},
                    {id: inner2.id, role: 'inner', type: 'way'}]}),
                graph = coreGraph([a, b, c, d, e, f, g, h, i, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).toEqual(
                [[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc], [g.loc, h.loc, i.loc, g.loc]]]
            );
        });

        it('multiple polygons with single single-way inner', function () {
            var a = osmNode({loc: [0, 0]}),
                b = osmNode({loc: [0, 1]}),
                c = osmNode({loc: [1, 0]}),
                d = osmNode({loc: [0.1, 0.1]}),
                e = osmNode({loc: [0.2, 0.1]}),
                f = osmNode({loc: [0.1, 0.2]}),
                g = osmNode({loc: [0, 0]}),
                h = osmNode({loc: [0, -1]}),
                i = osmNode({loc: [-1, 0]}),
                outer1 = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                outer2 = osmWay({nodes: [g.id, h.id, i.id, g.id]}),
                inner = osmWay({nodes: [d.id, e.id, f.id, d.id]}),
                r = osmRelation({members: [
                    {id: outer1.id, type: 'way'},
                    {id: outer2.id, type: 'way'},
                    {id: inner.id, role: 'inner', type: 'way'}]}),
                graph = coreGraph([a, b, c, d, e, f, g, h, i, outer1, outer2, inner, r]);

            expect(r.multipolygon(graph)).toEqual(
                [[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]], [[g.loc, h.loc, i.loc, g.loc]]]
            );
        });

        it('invalid geometry: unmatched inner', function () {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [2, 2]}),
                c = osmNode({loc: [3, 3]}),
                w = osmWay({nodes: [a.id, b.id, c.id, a.id]}),
                r = osmRelation({members: [{id: w.id, role: 'inner', type: 'way'}]}),
                g = coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('incomplete relation', function () {
            var a = osmNode({loc: [1, 1]}),
                b = osmNode({loc: [2, 2]}),
                c = osmNode({loc: [3, 3]}),
                w1 = osmWay({nodes: [a.id, b.id, c.id]}),
                w2 = osmWay(),
                r  = osmRelation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = coreGraph([a, b, c, w1, r]);

            expect(r.multipolygon(g)).toEqual([[[a.loc, b.loc, c.loc]]]);
        });
    });

    describe('.creationOrder comparator', function () {
        it('orders existing relations newest-first', function () {
            var a = osmRelation({ id: 'r1' }),
                b = osmRelation({ id: 'r2' });
            expect(Relation.creationOrder(a, b)).toBeGreaterThan(0);
            expect(Relation.creationOrder(b, a)).toBeLessThan(0);
        });

        it('orders new relations newest-first', function () {
            var a = osmRelation({ id: 'r-1' }),
                b = osmRelation({ id: 'r-2' });
            expect(Relation.creationOrder(a, b)).toBeGreaterThan(0);
            expect(Relation.creationOrder(b, a)).toBeLessThan(0);
        });
    });
});
