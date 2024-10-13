describe('iD.clone_turn_lanes', function () {
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
            // w2 - way with 2 nodes
            graph = iD.coreGraph([
                iD.osmNode({ id: 'n1', type: 'node', tags: { 'turn:lanes': 'foo' } }),
                iD.osmNode({ id: 'n2', type: 'node' }),
                iD.osmNode({ id: 'n3', type: 'node' }),
                iD.osmNode({ id: 'n4', type: 'node' }),
                iD.osmNode({ id: 'n5', type: 'node' }),
                iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'], tags: { 'turn:lanes:forward': 'foo', 'turn:lanes:backward':'bar' } }),
                iD.osmWay({ id: 'w2', nodes: ['n3', 'n4'] }),
                iD.osmWay({ id: 'w3', nodes: ['n4', 'n5'] })
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, []).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 1 selected node', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['n1']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 1 selected way', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['w1']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 2 selected nodes if the first one doesn\'t have a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['n2', 'n3']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 2 selected ways if the first one doesn\'t have a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['w2', 'w3']).available();
            expect(result).to.be.not.ok;
        });

        it('is available for 2 selected nodes if the first one has a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['n1', 'n3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected ways if the first one has a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['w1', 'w3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 3 selected nodes if the first one has a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['n1', 'n2', 'n3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 3 selected ways if the first one a turn lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['w1', 'w2', 'w3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 1 selected node et 1 selected way if the first one has a bus lane tag', function () {
            var result = iD.operationCloneTurnLanes(fakeContext, ['n1', 'w2']).available();
            expect(result).to.be.ok;
        });

    });
});
