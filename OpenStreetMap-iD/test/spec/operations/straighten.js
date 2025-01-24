describe('iD.operationStraighten', function () {
    var fakeContext;
    var graph;

    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function() { return graph; };
    fakeContext.entity = function(id) { return graph.entity(id); };
    fakeContext.hasHiddenConnections = function() { return false; };

    describe('#available', function () {
        beforeEach(function () {
            // w1 - way with 2 nodes
            // w1-2 - way with 2 nodes connected to w1
            // w2 - way with 3 nodes connected to w1
            // w3 - way with 3 nodes connected to w2
            // w4 - way with 3 nodes connected to w3
            // w5 - way with 4 nodes not connected to any other nodes
            graph = iD.coreGraph([
                iD.osmNode({ id: 'n1', type: 'node' }),
                iD.osmNode({ id: 'n2', type: 'node' }),
                iD.osmNode({ id: 'n2-1', type: 'node' }),
                iD.osmNode({ id: 'n3', type: 'node' }),
                iD.osmNode({ id: 'n4', type: 'node' }),
                iD.osmNode({ id: 'n5', type: 'node' }),
                iD.osmNode({ id: 'n6', type: 'node' }),
                iD.osmNode({ id: 'n7', type: 'node' }),
                iD.osmNode({ id: 'n8', type: 'node' }),
                iD.osmNode({ id: 'n9', type: 'node' }),
                iD.osmNode({ id: 'n10', type: 'node' }),
                iD.osmNode({ id: 'n11', type: 'node' }),
                iD.osmNode({ id: 'n12', type: 'node' }),
                iD.osmNode({ id: 'n13', type: 'node' }),
                iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] }),
                iD.osmWay({ id: 'w1-2', nodes: ['n2', 'n2-1'] }),
                iD.osmWay({ id: 'w2', nodes: ['n2', 'n3', 'n4'] }),
                iD.osmWay({ id: 'w2-2', nodes: ['n4', 'n13', 'n2'] }), // w-2 reversed
                iD.osmWay({ id: 'w3', nodes: ['n4', 'n5', 'n6'] }),
                iD.osmWay({ id: 'w4', nodes: ['n6', 'n7', 'n8'] }),
                iD.osmWay({ id: 'w5', nodes: ['n9', 'n10', 'n11', 'n12'] }),
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationStraighten(fakeContext, []).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for way with only 2 nodes', function () {
            var result = iD.operationStraighten(fakeContext, ['w1']).available();
            expect(result).to.be.not.ok;
        });

        it('is available for way with only 2 nodes connected to another 2-node way', function () {
            var result = iD.operationStraighten(fakeContext, ['w1', 'w1-2']).available();
            expect(result).to.be.ok;
        });

        it('is not available for non-continuous ways', function () {
            var result = iD.operationStraighten(fakeContext, ['w2', 'w4']).available();
            expect(result).to.be.not.ok;
        });

        it('is available for selected way with more than 2 nodes', function () {
            var result = iD.operationStraighten(fakeContext, ['w2']).available();
            expect(result).to.be.ok;
        });

        it('is available for selected, ordered, continuous ways', function () {
            var result = iD.operationStraighten(fakeContext, ['w1', 'w2', 'w3']).available();
            expect(result).to.be.ok;
        });

        it('is available for selected, un-ordered, continuous ways', function () {
            var result = iD.operationStraighten(fakeContext, ['w1', 'w3', 'w2']).available();
            expect(result).to.be.ok;
        });

        it('is available for selected, continuous ways with different way-directions', function () {
            var result = iD.operationStraighten(fakeContext, ['w1', 'w3', 'w2-2']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected nodes in the same way, more than one node apart', function () {
            var result = iD.operationStraighten(fakeContext, ['w5', 'n9', 'n11']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected nodes in adjacent ways, more than one node apart', function () {
            var result = iD.operationStraighten(fakeContext, ['w2', 'w3', 'n5', 'n3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected nodes in non-adjacent ways, providing in between ways are selected', function () {
            var result = iD.operationStraighten(fakeContext, ['n2', 'n7', 'w4', 'w1', 'w3', 'w2']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected nodes in non-adjacent, non-same-directional ways, providing in between ways are selected', function () {
            var result = iD.operationStraighten(fakeContext, ['n2', 'n7', 'w4', 'w1', 'w3', 'w2-2']).available();
            expect(result).to.be.ok;
        });

        it('is not available for nodes not on selected ways', function () {
            var result = iD.operationStraighten(fakeContext, ['w5', 'n4', 'n11']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for one selected node', function () {
            var result = iD.operationStraighten(fakeContext, ['w5', 'n9']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for more than two selected nodes', function () {
            var result = iD.operationStraighten(fakeContext, ['w5', 'n9', 'n11', 'n12']).available();
            expect(result).to.be.not.ok;
        });
    });
});
