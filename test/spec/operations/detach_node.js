describe('iD.operationDetachNode', function () {
    var fakeContext;
    var graph;

    // Some common setup functions
    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function () {
        return graph;
    };
    var fakeTags = { 'name': 'fake' };
    // Set up graph
    var createFakeNode = function (id, hasTags) {
        return hasTags
            ? { id: id, type: 'node', tags: fakeTags }
            : { id: id, type: 'node' };
    };

    describe('available', function () {
        beforeEach(function () {
            // a - node with tags & parent way
            // b - node with tags & 2 parent ways
            // c - node with no tags, parent way
            // d - node with no tags, 2 parent ways
            // e - node with tags, no parent way
            // f - node with no tags, no parent way
            graph = iD.Graph([
                iD.Node(createFakeNode('a', true)),
                iD.Node(createFakeNode('b', true)),
                iD.Node(createFakeNode('c', false)),
                iD.Node(createFakeNode('d', false)),
                iD.Node(createFakeNode('e', true)),
                iD.Node(createFakeNode('f', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b', 'c', 'd'] }),
                iD.Way({ id: 'y', nodes: ['b', 'd'] })
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationDetachNode([], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for two selected ids', function () {
            var result = iD.operationDetachNode(['a', 'b'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for unkown selected id', function () {
            var result = iD.operationDetachNode(['z'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for selected way', function () {
            var result = iD.operationDetachNode(['x'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for selected node with tags, no parent way', function () {
            var result = iD.operationDetachNode(['e'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for selected node with no tags, no parent way', function () {
            var result = iD.operationDetachNode(['f'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for selected node with no tags, parent way', function () {
            var result = iD.operationDetachNode(['c'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is not available for selected node with no tags, two parent ways', function () {
            var result = iD.operationDetachNode(['d'], fakeContext).available();
            expect(result).to.eql(false);
        });

        it('is available for selected node with tags, parent way', function () {
            var result = iD.operationDetachNode(['a'], fakeContext).available();
            expect(result).to.eql(true);
        });

        it('is available for selected node with tags, two parent ways', function () {
            var result = iD.operationDetachNode(['b'], fakeContext).available();
            expect(result).to.eql(true);
        });
    });

    describe('disabled', function () {
        it('returns enabled for non-related node', function () {
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', true)),
                iD.Node(createFakeNode('c', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b', 'c'] })
            ]);
            var result = iD.operationDetachNode(['b'], fakeContext).disabled();
            expect(result).to.eql(false);
        });

        it('returns enabled for non-restriction related node', function () {
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', true)),
                iD.Node(createFakeNode('c', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b', 'c'] }),
                iD.Relation({ id: 'r', members: [{ id: 'b', role: 'label' }] })
            ]);
            var result = iD.operationDetachNode(['b'], fakeContext).disabled();
            expect(result).to.eql(false);
        });

        it('returns not-enabled for via node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', false)),
                iD.Node(createFakeNode('c', false)),
                iD.Node(createFakeNode('d', true)),
                iD.Node(createFakeNode('e', false)),
                iD.Node(createFakeNode('f', false)),
                iD.Node(createFakeNode('g', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b', 'c'] }),
                iD.Way({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.Relation({
                    id: 'r',
                    tags: {
                        type: 'restriction',
                        restriction: 'no_right_turn'
                    },
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'd', type: 'node', role: 'via' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationDetachNode(['d'], fakeContext).disabled();
            expect(result).not.to.eql(false);
        });

        it('returns not-enabled for via node in restriction and other non-restriction relation', function () {
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', false)),
                iD.Node(createFakeNode('c', false)),
                iD.Node(createFakeNode('d', true)),
                iD.Node(createFakeNode('e', false)),
                iD.Node(createFakeNode('f', false)),
                iD.Node(createFakeNode('g', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b', 'c'] }),
                iD.Way({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.Relation({
                    id: 'r',
                    tags: {
                        type: 'restriction',
                        restriction: 'no_right_turn'
                    },
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'd', type: 'node', role: 'via' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                }),
                iD.Relation({
                    id: 's',
                    members: [
                        { id: 'x', type: 'way' },
                        { id: 'd', type: 'node' },
                    ]
                })
            ]);
            var result = iD.operationDetachNode(['d'], fakeContext).disabled();
            expect(result).not.to.eql(false);
        });

        it('returns not-enabled for location_hint node in restriction', function () {
            // https://wiki.openstreetmap.org/wiki/Relation:restriction indicates that
            // from & to roles are only appropriate for Ways
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', false)),
                iD.Node(createFakeNode('c', false)),
                iD.Node(createFakeNode('d', true)),
                iD.Node(createFakeNode('e', false)),
                iD.Node(createFakeNode('f', false)),
                iD.Node(createFakeNode('g', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b'] }),
                iD.Way({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.Relation({
                    id: 'r',
                    tags: {
                        type: 'restriction',
                        restriction: 'no_right_turn'
                    },
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'c', type: 'node', role: 'via' },
                        { id: 'd', type: 'node', role: 'location_hint' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                })
            ]);
            var result = iD.operationDetachNode(['d'], fakeContext).disabled();
            expect(result).not.to.eql(false);
        });

        it('returns not-enabled for location_hint node in restriction and other non-restriction relation', function () {
            graph = iD.Graph([
                iD.Node(createFakeNode('a', false)),
                iD.Node(createFakeNode('b', false)),
                iD.Node(createFakeNode('c', false)),
                iD.Node(createFakeNode('d', true)),
                iD.Node(createFakeNode('e', false)),
                iD.Node(createFakeNode('f', false)),
                iD.Node(createFakeNode('g', false)),
                iD.Way({ id: 'x', nodes: ['a', 'b'] }),
                iD.Way({ id: 'y', nodes: ['e', 'f', 'g'] }),
                iD.Relation({
                    id: 'r',
                    tags: {
                        type: 'restriction',
                        restriction: 'no_right_turn'
                    },
                    members: [
                        { id: 'x', type: 'way', role: 'from' },
                        { id: 'c', type: 'node', role: 'via' },
                        { id: 'd', type: 'node', role: 'location_hint' },
                        { id: 'z', type: 'way', role: 'to' }
                    ]
                }),
                iD.Relation({
                    id: 's',
                    members: [
                        { id: 'x', type: 'way' },
                        { id: 'd', type: 'node' },
                    ]
                })
            ]);
            var result = iD.operationDetachNode(['d'], fakeContext).disabled();
            expect(result).not.to.eql(false);
        });
    });
});
