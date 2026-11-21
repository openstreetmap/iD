describe('iD.actionStraightenNode', function () {
    var projection = function (loc) { return loc; };
    projection.invert = projection;

    it('moves only the selected node onto the line between its neighbors', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [5, 2] }),
            new iD.osmNode({ id: 'c', loc: [10, 0] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] })
        ]);

        graph = iD.actionStraightenNode('w', 'b', projection)(graph);

        expect(graph.entity('a').loc).toEqual([0, 0]);
        expect(graph.entity('b').loc[0]).toBeCloseTo(5, 6);
        expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('c').loc).toEqual([10, 0]);
    });

    it('rejects an endpoint of an open way', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [5, 2] }),
            new iD.osmNode({ id: 'c', loc: [10, 0] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] })
        ]);

        expect(iD.actionStraightenNode('w', 'a', projection).disabled(graph)).toEqual('invalid');
    });

    it('rejects a node shared by multiple ways', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [5, 2] }),
            new iD.osmNode({ id: 'c', loc: [10, 0] }),
            new iD.osmNode({ id: 'd', loc: [5, 5] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] }),
            new iD.osmWay({ id: 'w2', nodes: ['b', 'd'] })
        ]);

        expect(iD.actionStraightenNode('w', 'b', projection).disabled(graph)).toEqual('invalid');
    });

    it('handles the first node of a closed way', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [2, 2] }),
            new iD.osmNode({ id: 'b', loc: [4, 0] }),
            new iD.osmNode({ id: 'c', loc: [0, 0] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c', 'a'] })
        ]);

        graph = iD.actionStraightenNode('w', 'a', projection)(graph);

        expect(graph.entity('a').loc[0]).toBeCloseTo(2, 6);
        expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('b').loc).toEqual([4, 0]);
        expect(graph.entity('c').loc).toEqual([0, 0]);
    });

    it('rejects a missing way', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [5, 2] }),
            new iD.osmNode({ id: 'c', loc: [10, 0] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] })
        ]);

        var action = iD.actionStraightenNode('w-missing', 'b', projection);

        expect(function () {
            action.disabled(graph);
        }).not.toThrow();
        expect(action.disabled(graph)).toEqual('invalid');
    });

    it('rejects a missing selected node', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'c', loc: [10, 0] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] })
        ]);

        var action = iD.actionStraightenNode('w', 'b', projection);

        expect(function () {
            action.disabled(graph);
        }).not.toThrow();
        expect(action.disabled(graph)).toEqual('invalid');
    });

    it('rejects neighbors at the same location', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [5, 5] }),
            new iD.osmNode({ id: 'b', loc: [5, 2] }),
            new iD.osmNode({ id: 'c', loc: [5, 5] }),
            new iD.osmWay({ id: 'w', nodes: ['a', 'b', 'c'] })
        ]);

        var action = iD.actionStraightenNode('w', 'b', projection);

        expect(function () {
            action.disabled(graph);
        }).not.toThrow();
        expect(action.disabled(graph)).toEqual('invalid');
    });
});
