import { fn } from '@vitest/spy';

describe('iD.operationCircularize', function () {
    let graph;

    // Set up the fake context
    const fakeContext = {};
    fakeContext.graph = function() { return graph; };
    fakeContext.entity = function(id) { return graph.entity(id); };
    fakeContext.hasHiddenConnections = function() { return false; };
    fakeContext.projection = p => p;
    fakeContext.projection.invert = p => p;
    fakeContext.map = function() {
        return {
            extent: function() {
                return iD.geoExtent([-180, -90], [180, 90]);
            }
        };
    };
    fakeContext.inIntro = () => false;
    fakeContext.connection = () => {};
    fakeContext.validator = () => ({ validate: () => {} });

    describe('#available', function () {
        beforeEach(function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', type: 'node', loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', type: 'node', loc: [0, 1] }),
                new iD.osmNode({ id: 'n3', type: 'node', loc: [1, 1] }),
                new iD.osmNode({ id: 'n11', type: 'node', loc: [10, 0] }),
                new iD.osmNode({ id: 'n12', type: 'node', loc: [10, 1] }),
                new iD.osmNode({ id: 'n13', type: 'node', loc: [11, 1] }),
                new iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] }),
                new iD.osmWay({ id: 'w2', nodes: ['n1', 'n2', 'n3', 'n1'] }),
                new iD.osmWay({ id: 'w3', nodes: ['n11', 'n12', 'n13', 'n11'] }),
                new iD.osmWay({ id: 'w4', nodes: ['n11', 'n12'] }),
                new iD.osmWay({ id: 'w5', nodes: ['n12', 'n13'] }),
                new iD.osmWay({ id: 'w6', nodes: ['n13', 'n11'] }),
            ]);
        });

        it('is not available for no selected ids', function () {
            expect(iD.operationCircularize(fakeContext, []).available()).to.be.not.ok;
        });

        it('is disabled for way with only 2 nodes', function () {
            const operation = iD.operationCircularize(fakeContext, ['w1']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql('not_closed');
        });

        it('is available for a closed way', function () {
            const operation = iD.operationCircularize(fakeContext, ['w2']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql(false);
        });

        it('is disabled for an unclosed way', function () {
            const operation = iD.operationCircularize(fakeContext, ['w4']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql('not_closed');
        });

        it('is available for a multiselection of closed ways', function () {
            const operation = iD.operationCircularize(fakeContext, ['w2', 'w3']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql(false);
        });

        it('is available for a multiselection of unclosed ways forming a ring', function () {
            const operation = iD.operationCircularize(fakeContext, ['w4', 'w5', 'w6']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql(false);
        });

        it('is disabled for a multiselection of unclosed ways not forming a ring', function () {
            const operation = iD.operationCircularize(fakeContext, ['w4', 'w6']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql('not_closed');
        });

        it('is not available for a multiselection of a closed way and a non-way entity', function () {
            const operation = iD.operationCircularize(fakeContext, ['w2', 'n11']);
            expect(operation.available()).to.be.not.ok;
        });

        it('is available for a multiselection of a closed way and some unclosed ways forming a loop', function () {
            const operation = iD.operationCircularize(fakeContext, ['w2', 'w4', 'w5', 'w6']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql(false);
        });

        it('is available for a multiselection of a closed way and some unclosed ways forming a loop', function () {
            const operation = iD.operationCircularize(fakeContext, ['w2', 'w4', 'w5']);
            expect(operation.available()).to.be.ok;
            expect(operation.disabled()).to.eql(false);
        });

        it('performs operation without creating superfluous entities', function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n11', type: 'node', loc: [10, 0] }),
                new iD.osmNode({ id: 'n12', type: 'node', loc: [10, 1] }),
                new iD.osmNode({ id: 'n13', type: 'node', loc: [11, 1] }),
                new iD.osmWay({ id: 'w4', nodes: ['n11', 'n12'] }),
                new iD.osmWay({ id: 'w5', nodes: ['n12', 'n13'] }),
                new iD.osmWay({ id: 'w6', nodes: ['n13', 'n11'] }),
            ]);
            const operation = iD.operationCircularize(fakeContext, ['w4', 'w5', 'w6']);
            fakeContext.perform = fn((action) => {
                const newGraph = action(graph);
                expect(
                    Object.values(newGraph.base().entities)
                        .filter(e => e && e.id[0] === 'w').length
                ).to.eql(3);
            });
            operation();
            expect(fakeContext.perform).toHaveBeenCalledOnce();
        });
    });
});
