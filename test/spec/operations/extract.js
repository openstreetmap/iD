describe('iD.operationExtract', function () {
    var fakeContext;
    var graph;

    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function () { return graph; };
    fakeContext.hasHiddenConnections = function () { return false; };
    fakeContext.map = function() {
        return {
            extent: function() {
                return iD.geoExtent([-180, -90], [180, 90]);
            }
        };
    };

    var fakeTags = { 'name': 'fake' };

    // Set up graph
    var createFakeNode = function (id, hasTags) {
        return hasTags
            ? { id: id, type: 'node', loc: [0, 0], tags: fakeTags }
            : { id: id, type: 'node', loc: [0, 0] };
    };

    describe('available', function () {
        beforeEach(function () {
            // a - node with tags & parent way
            // b - node with tags & 2 parent ways
            // c - node with no tags, parent way
            // d - node with no tags, 2 parent ways
            // e - node with tags, no parent way
            // f - node with no tags, no parent way
            graph = new iD.coreGraph([
                new iD.osmNode(createFakeNode('a', true)),
                new iD.osmNode(createFakeNode('b', true)),
                new iD.osmNode(createFakeNode('c', false)),
                new iD.osmNode(createFakeNode('d', false)),
                new iD.osmNode(createFakeNode('e', true)),
                new iD.osmNode(createFakeNode('f', false)),
                new iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c', 'd'] }),
                new iD.osmWay({ id: 'y', nodes: ['b', 'd'] })
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationExtract(fakeContext, []).available();
            expect(result).toBeFalsy();
        });

        it('is not available for unknown selected id', function () {
            var result = iD.operationExtract(fakeContext, ['z']).available();
            expect(result).toBeFalsy();
        });

        it('is not available for selected way', function () {
            var result = iD.operationExtract(fakeContext, ['x']).available();
            expect(result).toBeFalsy();
        });

        it('is available for address-only building areas', function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, 0] }),
                new iD.osmNode({ id: 'b', loc: [1, 0] }),
                new iD.osmNode({ id: 'c', loc: [1, 1] }),
                new iD.osmNode({ id: 'd', loc: [0, 1] }),
                new iD.osmWay({
                    id: 'x',
                    nodes: ['a', 'b', 'c', 'd', 'a'],
                    tags: { building: 'yes', 'addr:housenumber': '123', 'addr:street': 'Main Street' }
                })
            ]);

            var result = iD.operationExtract(fakeContext, ['x']).available();
            expect(result).toBeTruthy();
        });

        it('is not available for selected node with tags, no parent way', function () {
            var result = iD.operationExtract(fakeContext, ['e']).available();
            expect(result).toBeFalsy();
        });

        it('is not available for selected node with no tags, no parent way', function () {
            var result = iD.operationExtract(fakeContext, ['f']).available();
            expect(result).toBeFalsy();
        });

        it('is not available for selected node with no tags, parent way', function () {
            var result = iD.operationExtract(fakeContext, ['c']).available();
            expect(result).toBeFalsy();
        });

        it('is not available for selected node with no tags, two parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['d']).available();
            expect(result).toBeFalsy();
        });

        it('is available for selected node with tags, parent way', function () {
            var result = iD.operationExtract(fakeContext, ['a']).available();
            expect(result).toBeTruthy();
        });

        it('is available for selected node with tags, two parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['b']).available();
            expect(result).toBeTruthy();
        });

        it('is available for two selected nodes with tags and parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['a', 'b']).available();
            expect(result).toBeTruthy();
        });
    });


    describe('disabled', function () {
        it('returns enabled for non-related node', function () {
            graph = new iD.coreGraph([
                new iD.osmNode(createFakeNode('a', false)),
                new iD.osmNode(createFakeNode('b', true)),
                new iD.osmNode(createFakeNode('c', false)),
                new iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] })
            ]);
            var result = iD.operationExtract(fakeContext, ['b']).disabled();
            expect(result).toBeFalsy();
        });

        it('returns enabled for non-restriction related node', function () {
            graph = new iD.coreGraph([
                new iD.osmNode(createFakeNode('a', false)),
                new iD.osmNode(createFakeNode('b', true)),
                new iD.osmNode(createFakeNode('c', false)),
                new iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] }),
                new iD.osmRelation({ id: 'r', members: [{ id: 'b', role: 'label' }] })
            ]);
            var result = iD.operationExtract(fakeContext, ['b']).disabled();
            expect(result).toBeFalsy();
        });

        it('returns enabled for via node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = new iD.coreGraph([
                new iD.osmNode(createFakeNode('a', false)),
                new iD.osmNode(createFakeNode('b', false)),
                new iD.osmNode(createFakeNode('c', false)),
                new iD.osmNode(createFakeNode('d', true)),
                new iD.osmNode(createFakeNode('e', false)),
                new iD.osmNode(createFakeNode('f', false)),
                new iD.osmNode(createFakeNode('g', false)),
                new iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] }),
                new iD.osmWay({ id: 'y', nodes: ['e', 'f', 'g'] }),
                new iD.osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'no_right_turn'},
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'd', type: 'node', role: 'via' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationExtract(fakeContext, ['d']).disabled();
            expect(result).toBeFalsy();
        });

        it('returns enabled for location_hint node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = new iD.coreGraph([
                new iD.osmNode(createFakeNode('a', false)),
                new iD.osmNode(createFakeNode('b', false)),
                new iD.osmNode(createFakeNode('c', false)),
                new iD.osmNode(createFakeNode('d', true)),
                new iD.osmNode(createFakeNode('e', false)),
                new iD.osmNode(createFakeNode('f', false)),
                new iD.osmNode(createFakeNode('g', false)),
                new iD.osmWay({ id: 'x', nodes: ['a', 'b'] }),
                new iD.osmWay({ id: 'y', nodes: ['e', 'f', 'g'] }),
                new iD.osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'no_right_turn'},
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'c', type: 'node', role: 'via' },
                        { id: 'd', type: 'node', role: 'location_hint' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationExtract(fakeContext, ['d']).disabled();
            expect(result).toBeFalsy();
        });
    });
});
