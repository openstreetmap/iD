describe('iD.clone_address', function () {
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
                iD.osmNode({ id: 'n1', type: 'node', tags: { 'addr:housenumber': 'foo' } }),
                iD.osmNode({ id: 'n2', type: 'node' }),
                iD.osmNode({ id: 'n3', type: 'node' }),
                iD.osmNode({ id: 'n4', type: 'node' }),
                iD.osmNode({ id: 'n5', type: 'node' }),
                iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'], tags: { 'addr:street': 'foo', 'addr:city':'bar' } }),
                iD.osmWay({ id: 'w2', nodes: ['n3', 'n4'] }),
                iD.osmWay({ id: 'w3', nodes: ['n4', 'n5'] })
            ]);
        });

        it('is not available for no selected ids', function () {
            var result = iD.operationCloneAddress(fakeContext, []).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 1 selected node', function () {
            var result = iD.operationCloneAddress(fakeContext, ['n1']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 1 selected way', function () {
            var result = iD.operationCloneAddress(fakeContext, ['w1']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 2 selected nodes if the first one doesn\'t have an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['n2', 'n3']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available for 2 selected ways if the first one doesn\'t have an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['w2', 'w3']).available();
            expect(result).to.be.not.ok;
        });

        it('is available for 2 selected nodes if the first one has an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['n1', 'n3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 2 selected ways if the first one has an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['w1', 'w3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 3 selected nodes if the first one has an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['n1', 'n2', 'n3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 3 selected ways if the first one an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['w1', 'w2', 'w3']).available();
            expect(result).to.be.ok;
        });

        it('is available for 1 selected node et 1 selected way if the first one has an address tag', function () {
            var result = iD.operationCloneAddress(fakeContext, ['n1', 'w2']).available();
            expect(result).to.be.ok;
        });

    });
});
