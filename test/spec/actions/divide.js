describe('iD.actionDivide', function () {
    var mockProjection = function (coord) { return coord; };
    mockProjection.invert = function (coord) { return coord; };

    beforeEach(() => {
        iD.osmEntity.id.next = {
            changeset: -1, node: -1, way: -1, relation: -1
        };
    });

    it('splits a way into a grid of smaller ways', function () {
        //    B
        //   / \
        //  /   C
        // A   /
        //  \ /
        //   D
        //
        // this test only makes sense with the diagram:
        // https://desmos.com/calculator/c9j1euq7nf
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'A', loc: [0, 2] }),
            iD.osmNode({ id: 'B', loc: [3, 5] }),
            iD.osmNode({ id: 'C', loc: [5, 3] }),
            iD.osmNode({ id: 'D', loc: [2, 0] }),
            iD.osmWay({ id: 'tmp', nodes: ['A', 'B', 'C', 'D', 'A'], tags: { amenity: 'parking_space' } })
        ]);

        // split into a 2x3 grid (2 along the short edge, 3 along long edge)
        graph = iD.actionDivide('tmp', mockProjection)(2, 3)(graph);

        // the original way is still here
        expect(!!graph.hasEntity('tmp')).to.be.true;

        // the original nodes (A,B,C,D) also still exist
        expect(!!graph.hasEntity('A')).to.be.true;

        // in our 2x3 grid, we now have 2*3 ways, made up of (2+1)*(3+1) nodes

        // the first way is row 0, col 0. It re-uses node A.
        expect(graph.entity('tmp').nodes).to.eql(['A', 'n-1', 'n-2', 'n-3', 'A']);
        expect(graph.entity('w-1').nodes).to.eql(['n-3', 'n-2', 'n-4', 'n-5', 'n-3']);
        expect(graph.entity('w-2').nodes).to.eql(['n-5', 'n-4', 'n-6', 'B', 'n-5']);
        expect(graph.entity('w-3').nodes).to.eql(['n-1', 'D', 'n-7', 'n-2', 'n-1']);
        expect(graph.entity('w-4').nodes).to.eql(['n-2', 'n-7', 'n-8', 'n-4', 'n-2']);
        expect(graph.entity('w-5').nodes).to.eql(['n-4', 'n-8', 'C', 'n-6', 'n-4']);
        // the last way is row 1, col 2. It re-uses node C.

        expect(graph.entity('n-1').loc).to.eql([1, 1]);
        expect(graph.entity('n-2').loc).to.eql([2, 2]);
        expect(graph.entity('n-3').loc).to.eql([1, 3]);
        expect(graph.entity('n-4').loc).to.eql([3, 3]);
        expect(graph.entity('n-5').loc).to.eql([2, 4]);
        expect(graph.entity('n-6').loc).to.eql([4, 4]);
        expect(graph.entity('n-7').loc).to.eql([3, 1]);
        expect(graph.entity('n-8').loc).to.eql([4, 2]);

        // check that it copies the tags to all its ways
        expect(graph.entity('w-1').tags).to.eql({ amenity: 'parking_space' });
        expect(graph.entity('w-5').tags).to.eql({ amenity: 'parking_space' });
        expect(graph.entity('tmp').tags).to.eql({ amenity: 'parking_space' });
    });
});
