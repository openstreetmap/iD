describe('iD.operationSnap', function () {

    var fakeContext;
    var graph;

    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function () { return graph; };
    fakeContext.entity = function(id) { return graph.entity(id); };
    fakeContext.hasHiddenConnections = function() { return false; };
    fakeContext.inIntro = function() { return true; };

    beforeEach(function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        //
        //           e
        //           |
        //    g ---- f
        graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [2, 0]}),
            iD.osmNode({id: 'c', loc: [2, 2]}),
            iD.osmNode({id: 'd', loc: [0, 2]}),
            iD.osmNode({id: 'e', loc: [0, 0]}),
            iD.osmNode({id: 'f', loc: [3, 0]}),
            iD.osmNode({id: 'g', loc: [3, 3]}),
            iD.osmWay({id: 'x', nodes: ['a', 'b', 'c', 'd', 'a']}),
            iD.osmWay({id: 'y', nodes: ['e','f','g']}),
            iD.osmWay({id: 'z', nodes: ['c','e','f','g']}),
            iD.osmWay({id: 'w', nodes: ['b', 'a', 'g', 'f']}),
            iD.osmWay({id: 'v', nodes: ['e', 'f', 'e']}),
        ]);
    });

    describe('#available', function () {

        it('is not available if no entities are selected', function () {
            var result = iD.operationSnap(fakeContext, []).available();
            expect(result).to.be.not.ok;
        });

        it('is not available if only one entity is selected', function () {
            var result = iD.operationSnap(fakeContext, ['x']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available if 1 way and 1 node are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'a']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available if 3 ways are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'y', 'z']).available();
            expect(result).to.be.not.ok;
        });

        it('is not available if more than 4 entities are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'y', 'a', 'b', 'c']).available();
            expect(result).to.be.not.ok;
        });

        it('is available if 2 ways are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'y']).available();
            expect(result).to.be.ok;
        });

        it('is available if 2 ways and 1 node are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'y', 'a']).available();
            expect(result).to.be.ok;
        });

        it('is available if 2 ways and 2 nodes are selected', function () {
            var result = iD.operationSnap(fakeContext, ['x', 'y', 'a', 'b']).available();
            expect(result).to.be.ok;
        });

    });


    describe('disabled', function () {

        it('returns disabled if the 2 ways are not connected', function() {
            var result = iD.operationSnap(fakeContext, ['x','y']).disabled();
            expect(result).to.eql('nodes_are_not_shared_by_both_ways');
        });

        it('returns disabled if the 2 ways only have 1 commun node', function() {
            var result = iD.operationSnap(fakeContext, ['x','z']).disabled();
            expect(result).to.eql('nodes_are_not_shared_by_both_ways');
        });

        it('return disabled if target is closed but has less than 4 nodes', function() {
            var result = iD.operationSnap(fakeContext, ['v', 'z']).disabled();
            expect(result).to.eql('source_or_target_way_is_closed_but_has_less_than_4_nodes');
        });

        it('return disabled if source is closed but has less than 4 nodes', function() {
            var result = iD.operationSnap(fakeContext, ['z', 'v']).disabled();
            expect(result).to.eql('source_or_target_way_is_closed_but_has_less_than_4_nodes');
        });

        it('returns enabled if the 2 ways have 2 commun nodes', function() {
            var result = iD.operationSnap(fakeContext, ['x','w']).disabled();
            expect(result).to.be.not.ok;
        });

    });

});
