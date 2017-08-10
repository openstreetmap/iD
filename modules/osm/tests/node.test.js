import { osmNode, osmWay } from '../entityFactory';
import { Way } from '../way';
import { Node } from '../node';
import { coreGraph } from '../../core/graph';

describe('iD.osmNode', function () {
    it('returns a node', function () {
        expect(osmNode()).toBeInstanceOf(Node);
        expect(osmNode().type).toBe('node');
    });

    it('defaults tags to an empty object', function () {
        expect(osmNode().tags).toEqual({});
    });

    it('sets tags as specified', function () {
        expect(osmNode({tags: {foo: 'bar'}}).tags).toEqual({foo: 'bar'});
    });

    describe('#extent', function() {
        it('returns a point extent', function() {
            expect(osmNode({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).toBeTruthy();
        });
    });

    describe('#intersects', function () {
        it('returns true for a node within the given extent', function () {
            expect(osmNode({loc: [0, 0]}).intersects([[-5, -5], [5, 5]])).toBe(true);
        });

        it('returns false for a node outside the given extend', function () {
            expect(osmNode({loc: [6, 6]}).intersects([[-5, -5], [5, 5]])).toBe(false);
        });
    });

    describe('#geometry', function () {
        it('returns \'vertex\' if the node is a member of any way', function () {
            var node = osmNode(),
                way  = osmWay({nodes: [node.id]}),
                graph = coreGraph([node, way]);
            expect(node.geometry(graph)).toBe('vertex');
        });

        it('returns \'point\' if the node is not a member of any way', function () {
            var node = osmNode(),
                graph = coreGraph([node]);
            expect(node.geometry(graph)).toBe('point');
        });
    });

    describe('#isEndpoint', function () {
        it('returns true for a node at an endpoint along a linear way', function () {
            var a = osmNode({id: 'a'}),
                b = osmNode({id: 'b'}),
                c = osmNode({id: 'c'}),
                w = osmWay({nodes: ['a', 'b', 'c']}),
                graph = coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).toBe(true);
            expect(b.isEndpoint(graph)).toBe(false);
            expect(c.isEndpoint(graph)).toBe(true);
        });

        it('returns false for nodes along a circular way', function () {
            var a = osmNode({id: 'a'}),
                b = osmNode({id: 'b'}),
                c = osmNode({id: 'c'}),
                w = osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = coreGraph([a, b, c, w]);
            expect(a.isEndpoint(graph)).toBe(false);
            expect(b.isEndpoint(graph)).toBe(false);
            expect(c.isEndpoint(graph)).toBe(false);
        });
    });

    describe('#isConnected', function () {
        it('returns true for a node with multiple parent ways, at least one interesting', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id]}),
                w2 = osmWay({nodes: [node.id], tags: { highway: 'residential' }}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toBe(true);
        });

        it('returns false for a node with only area parent ways', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                w2 = osmWay({nodes: [node.id], tags: { area: 'yes' }}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toBe(false);
        });

        it('returns false for a node with only uninteresting parent ways', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id]}),
                w2 = osmWay({nodes: [node.id]}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isConnected(graph)).toBe(false);
        });

        it('returns false for a standalone node on a single parent way', function () {
            var node = osmNode(),
                way = osmWay({nodes: [node.id]}),
                graph = coreGraph([node, way]);
            expect(node.isConnected(graph)).toBe(false);
        });

        it('returns true for a self-intersecting node on a single parent way', function () {
            var a = osmNode({id: 'a'}),
                b = osmNode({id: 'b'}),
                c = osmNode({id: 'c'}),
                w = osmWay({nodes: ['a', 'b', 'c', 'b']}),
                graph = coreGraph([a, b, c, w]);
            expect(b.isConnected(graph)).toBe(true);
        });

        it('returns false for the connecting node of a closed way', function () {
            var a = osmNode({id: 'a'}),
                b = osmNode({id: 'b'}),
                c = osmNode({id: 'c'}),
                w = osmWay({nodes: ['a', 'b', 'c', 'a']}),
                graph = coreGraph([a, b, c, w]);
            expect(a.isConnected(graph)).toBe(false);
        });
    });

    describe('#isIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).toBe(true);
        });

        it('returns true for a node shared by more than one waterway', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isIntersection(graph)).toBe(true);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = osmWay({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).toBe(true);
        });

        it('returns false for a node shared by more than one waterway', function () {
            var node = osmNode(),
                w1 = osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = osmWay({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = coreGraph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).toBe(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true if node has invalid loc', function () {
            expect(osmNode().isDegenerate()).toBe(true);
            expect(osmNode({loc: ''}).isDegenerate()).toBe(true);
            expect(osmNode({loc: []}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0, 0, 0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [-181, 0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [181, 0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0, -91]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0, 91]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [Infinity, 0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0, Infinity]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [NaN, 0]}).isDegenerate()).toBe(true);
            expect(osmNode({loc: [0, NaN]}).isDegenerate()).toBe(true);
        });

        it('returns false if node has valid loc', function () {
            expect(osmNode({loc: [0, 0]}).isDegenerate()).toBe(false);
            expect(osmNode({loc: [-180, 0]}).isDegenerate()).toBe(false);
            expect(osmNode({loc: [180, 0]}).isDegenerate()).toBe(false);
            expect(osmNode({loc: [0, -90]}).isDegenerate()).toBe(false);
            expect(osmNode({loc: [0, 90]}).isDegenerate()).toBe(false);
        });
    });

    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = osmNode({id: 'n-1', loc: [-77, 38], tags: {amenity: 'cafe'}});
            expect(node.asJXON()).toEqual({node: {
                '@id': '-1',
                '@lon': -77,
                '@lat': 38,
                '@version': 0,
                tag: [{keyAttributes: {k: 'amenity', v: 'cafe'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(osmNode({loc: [0, 0]}).asJXON('1234').node['@changeset']).toBe('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts to a GeoJSON Point geometry', function () {
            var node = osmNode({tags: {amenity: 'cafe'}, loc: [1, 2]}),
                json = node.asGeoJSON();

            expect(json.type).toBe('Point');
            expect(json.coordinates).toEqual([1, 2]);
        });
    });
});
