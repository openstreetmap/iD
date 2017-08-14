import { coreGraph } from '../../core/graph';

import { osmEntity } from '../entityFactory';
import { Entity } from '../entityStatic';
import { entityBase } from '../entityBase';
import { osmNode, Node } from '../node';
import { osmWay, Way } from '../way';
import { osmRelation, Relation } from '../relation';

describe('iD.osmEntity', function() {
    it('returns a subclass of the appropriate type', function() {
        expect(osmEntity({ type: 'node' })).toBeInstanceOf(Node);
        expect(osmEntity({ type: 'way' })).toBeInstanceOf(Way);
        expect(osmEntity({ type: 'relation' })).toBeInstanceOf(Relation);
        expect(osmEntity({ id: 'n1' })).toBeInstanceOf(Node);
        expect(osmEntity({ id: 'w1' })).toBeInstanceOf(Way);
        expect(osmEntity({ id: 'r1' })).toBeInstanceOf(Relation);
    });

    // if (debug) {
    //     it('is frozen', function () {
    //         expect(Object.isFrozen(osmEntity())).toBe(true);
    //     });

    //     it('freezes tags', function () {
    //         expect(Object.isFrozen(osmEntity().tags)).toBe(true);
    //     });
    // }

    describe('.id', function() {
        it('generates unique IDs', function() {
            expect(Entity.id('node')).not.toBe(Entity.id('node'));
        });

        describe('.fromOSM', function() {
            it('returns a ID string unique across entity types', function() {
                expect(Entity.id.fromOSM('node', '1')).toBe('n1');
            });
        });

        describe('.toOSM', function() {
            it('reverses fromOSM', function() {
                expect(Entity.id.toOSM(Entity.id.fromOSM('node', '1'))).toBe(
                    '1'
                );
            });
        });
    });

    describe('#copy', function() {
        it('returns a new Entity', function() {
            var n = osmEntity({ id: 'n' }),
                result = n.copy(null, {});
            expect(result).toBeInstanceOf(Node);
            expect(result).not.toBe(n);
        });

        it('adds the new Entity to input object', function() {
            var n = osmEntity({ id: 'n' }),
                copies = {},
                result = n.copy(null, copies);
            expect(Object.keys(copies)).toHaveLength(1);
            expect(copies.n).toBe(result);
        });

        it('returns an existing copy in input object', function() {
            var n = osmEntity({ id: 'n' }),
                copies = {},
                result1 = n.copy(null, copies),
                result2 = n.copy(null, copies);
            expect(Object.keys(copies)).toHaveLength(1);
            expect(result1).toBe(result2);
        });

        it('resets \'id\', \'user\', and \'version\' properties', function() {
            var n = osmEntity({ id: 'n', version: 10, user: 'user' }),
                copies = {};
            n.copy(null, copies);
            expect(copies.n.isNew()).toBeTruthy();
            expect(copies.n.version).toBeUndefined();
            expect(copies.n.user).toBeUndefined();
        });

        it('copies tags', function() {
            var n = osmEntity({ id: 'n', tags: { foo: 'foo' } }),
                copies = {};
            n.copy(null, copies);
            expect(copies.n.tags).toBe(n.tags);
        });
    });

    describe('#update', function() {
        it('returns a new Entity', function() {
            var a = osmEntity({ id: 'r1' }),
                b = a.update({});
            expect(b instanceof Relation).toBe(true);
            expect(a).not.toBe(b);
        });

        it('updates the specified attributes', function() {
            var tags = { foo: 'bar' },
                e = osmEntity({ id: 'w1' }).update({ tags: tags });
            expect(e.tags).toBe(tags);
        });

        it('preserves existing attributes', function() {
            var e = osmEntity({ id: 'w1' });
            expect(e.id).toBe('w1');
        });

        it('doesn\'t modify the input', function() {
            var attrs = { tags: { foo: 'bar' } };
            osmEntity({ id: 'w1' }).update(attrs);
            expect(attrs).toEqual({ tags: { foo: 'bar' } });
        });

        it('doesn\'t copy prototype properties', function() {
            expect(
                osmEntity({ id: 'w1' }).update({}).hasOwnProperty('update')
            ).toBe(false);
        });

        it('sets v to 1 if previously undefined', function() {
            expect(osmEntity({ id: 'w1' }).update({}).v).toBe(1);
        });

        it('increments v', function() {
            expect(osmEntity({ id: 'w1', v: 1 }).update({}).v).toBe(2);
        });
    });

    describe('#mergeTags', function() {
        it('returns self if unchanged', function() {
            var a = osmEntity({ id: 'w1', tags: { a: 'a' } }),
                b = a.mergeTags({ a: 'a' });
            expect(a).toBe(b);
        });

        it('returns a new Entity if changed', function() {
            var a = osmEntity({ id: 'n1', tags: { a: 'a' } }),
                b = a.mergeTags({ a: 'b' });
            expect(b instanceof Node).toBe(true);
            expect(a).not.toBe(b);
        });

        it('merges tags', function() {
            var a = osmEntity({ id: 'r1', tags: { a: 'a' } }),
                b = a.mergeTags({ b: 'b' });
            expect(b.tags).toEqual({ a: 'a', b: 'b' });
        });

        it('combines non-conflicting tags', function() {
            var a = osmEntity({ id: 'n1', tags: { a: 'a' } }),
                b = a.mergeTags({ a: 'a' });
            expect(b.tags).toEqual({ a: 'a' });
        });

        it('combines conflicting tags with semicolons', function() {
            var a = osmEntity({ id: 'w1', tags: { a: 'a' } }),
                b = a.mergeTags({ a: 'b' });
            expect(b.tags).toEqual({ a: 'a;b' });
        });

        it('combines combined tags', function() {
            var a = osmEntity({ id: 'w1', tags: { a: 'a;b' } }),
                b = osmEntity({ id: 'w1', tags: { a: 'b' } });

            expect(a.mergeTags(b.tags).tags).toEqual({ a: 'a;b' });
            expect(b.mergeTags(a.tags).tags).toEqual({ a: 'b;a' });
        });

        it('combines combined tags with whitespace', function() {
            var a = osmEntity({ id: 'w1', tags: { a: 'a; b' } }),
                b = osmEntity({ id: 'n1', tags: { a: 'b' } });

            expect(a.mergeTags(b.tags).tags).toEqual({ a: 'a;b' });
            expect(b.mergeTags(a.tags).tags).toEqual({ a: 'b;a' });
        });
    });

    describe('#osmId', function() {
        it('returns an OSM ID as a string', function() {
            expect(osmEntity({ id: 'w1234' }).osmId()).toEqual('1234');
            expect(osmEntity({ id: 'n1234' }).osmId()).toEqual('1234');
            expect(osmEntity({ id: 'r1234' }).osmId()).toEqual('1234');
        });
    });

    describe('#intersects', function() {
        it('returns true for a way with a node within the given extent', function() {
            var node = osmNode({ loc: [0, 0] }),
                way = osmWay({ nodes: [node.id] }),
                graph = coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).toBe(true);
        });

        it('returns false for way with no nodes within the given extent', function() {
            var node = osmNode({ loc: [6, 6] }),
                way = osmWay({ nodes: [node.id] }),
                graph = coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).toBe(false);
        });
    });

    describe('#isUsed', function () {
        it('returns false for an entity without tags', function () {
            var node = osmNode();
             var   graph = coreGraph([node]);
            expect(node.isUsed(graph)).toBe(false);
        });

        it('returns true for an entity with tags', function () {
            var node = osmNode({tags: {foo: 'bar'}}),
                graph = coreGraph([node]);
            expect(node.isUsed(graph)).toBe(true);
        });

        it('returns false for an entity with only an area=yes tag', function () {
            var node = osmNode({tags: {area: 'yes'}}),
                graph = coreGraph([node]);
            expect(node.isUsed(graph)).toBe(false);
        });

        it('returns true for an entity that is a relation member', function () {
            var node = osmNode(),
                relation = osmRelation({members: [{id: node.id}]}),
                graph = coreGraph([node, relation]);
            expect(node.isUsed(graph)).toBe(true);
        });
    });

    describe('#hasDeprecatedTags', function () {
        it('returns false if entity has no tags', function () {
            expect(osmNode().deprecatedTags()).toEqual({});
        });

        it('returns true if entity has deprecated tags', function () {
            expect(osmNode({ tags: { barrier: 'wire_fence' } }).deprecatedTags()).toEqual({ barrier: 'wire_fence' });
        });
    });

    describe('#hasInterestingTags', function () {
        it('returns false if the entity has no tags', function () {
            expect(osmNode().hasInterestingTags()).toBe(false);
            expect(osmWay().hasInterestingTags()).toBe(false);
            expect(osmRelation().hasInterestingTags()).toBe(false);
        });

        it('returns true if the entity has tags other than \'attribution\', \'created_by\', \'source\', \'odbl\' and tiger tags', function () {
            expect(osmNode({tags: {foo: 'bar'}}).hasInterestingTags()).toBe(true);
            expect(osmWay({tags: {foo: 'bar'}}).hasInterestingTags()).toBe(true);
            expect(osmRelation({tags: {foo: 'bar'}}).hasInterestingTags()).toBe(true);
        });

        it('return false if the entity has only uninteresting tags', function () {
            expect(osmNode({tags: {source: 'Bing'}}).hasInterestingTags()).toBe(false);
        });

        it('return false if the entity has only tiger tags', function () {
            expect(osmNode({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).toBe(false);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns false', function () {
            expect(entityBase.isHighwayIntersection()).toBe(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true', function () {
            expect(entityBase.isDegenerate()).toBe(true);
        });
    });
});
