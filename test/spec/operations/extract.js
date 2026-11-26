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
            graph = iD.coreGraph([
                iD.osmNode(createFakeNode('a', true)),
                iD.osmNode(createFakeNode('b', true)),
                iD.osmNode(createFakeNode('c', false)),
                iD.osmNode(createFakeNode('d', false)),
                iD.osmNode(createFakeNode('e', true)),
                iD.osmNode(createFakeNode('f', false)),
                iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c', 'd'] }),
                iD.osmWay({ id: 'y', nodes: ['b', 'd'] })
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationExtract(fakeContext, []).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for unknown selected id', function () {
            var result = iD.operationExtract(fakeContext, ['z']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for selected way', function () {
            var result = iD.operationExtract(fakeContext, ['x']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for selected node with tags, no parent way', function () {
            var result = iD.operationExtract(fakeContext, ['e']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for selected node with no tags, no parent way', function () {
            var result = iD.operationExtract(fakeContext, ['f']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for selected node with no tags, parent way', function () {
            var result = iD.operationExtract(fakeContext, ['c']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for selected node with no tags, two parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['d']).available();
            expect(result).to.be.not.ok;
        });

        it('is available for selected node with tags, parent way', function () {
            var result = iD.operationExtract(fakeContext, ['a']).available();
            expect(result).to.be.ok;
        });

        it('is available for selected node with tags, two parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['b']).available();
            expect(result).to.be.ok;
        });

        it('is available for two selected nodes with tags and parent ways', function () {
            var result = iD.operationExtract(fakeContext, ['a', 'b']).available();
            expect(result).to.be.ok;
        });
    });


    describe('disabled', function () {
        it('returns enabled for non-related node', function () {
            graph = iD.coreGraph([
                iD.osmNode(createFakeNode('a', false)),
                iD.osmNode(createFakeNode('b', true)),
                iD.osmNode(createFakeNode('c', false)),
                iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] })
            ]);
            var result = iD.operationExtract(fakeContext, ['b']).disabled();
            expect(result).to.be.not.ok;
        });

        it('returns enabled for non-restriction related node', function () {
            graph = iD.coreGraph([
                iD.osmNode(createFakeNode('a', false)),
                iD.osmNode(createFakeNode('b', true)),
                iD.osmNode(createFakeNode('c', false)),
                iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] }),
                iD.osmRelation({ id: 'r', members: [{ id: 'b', role: 'label' }] })
            ]);
            var result = iD.operationExtract(fakeContext, ['b']).disabled();
            expect(result).to.be.not.ok;
        });

        it('returns enabled for via node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = iD.coreGraph([
                iD.osmNode(createFakeNode('a', false)),
                iD.osmNode(createFakeNode('b', false)),
                iD.osmNode(createFakeNode('c', false)),
                iD.osmNode(createFakeNode('d', true)),
                iD.osmNode(createFakeNode('e', false)),
                iD.osmNode(createFakeNode('f', false)),
                iD.osmNode(createFakeNode('g', false)),
                iD.osmWay({ id: 'x', nodes: ['a', 'b', 'c'] }),
                iD.osmWay({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'no_right_turn'},
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'd', type: 'node', role: 'via' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationExtract(fakeContext, ['d']).disabled();
            expect(result).to.be.not.ok;
        });

        it('returns enabled for location_hint node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = iD.coreGraph([
                iD.osmNode(createFakeNode('a', false)),
                iD.osmNode(createFakeNode('b', false)),
                iD.osmNode(createFakeNode('c', false)),
                iD.osmNode(createFakeNode('d', true)),
                iD.osmNode(createFakeNode('e', false)),
                iD.osmNode(createFakeNode('f', false)),
                iD.osmNode(createFakeNode('g', false)),
                iD.osmWay({ id: 'x', nodes: ['a', 'b'] }),
                iD.osmWay({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.osmRelation({id: 'r', tags: {type: 'restriction', restriction: 'no_right_turn'},
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'c', type: 'node', role: 'via' },
                        { id: 'd', type: 'node', role: 'location_hint' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationExtract(fakeContext, ['d']).disabled();
            expect(result).to.be.not.ok;
        });
    });
});
