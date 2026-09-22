describe('iD.actionAddMidpoint', function () {
    it('adds the node at the midpoint location', function () {
        var node = new iD.osmNode(),
            a = new iD.osmNode(),
            b = new iD.osmNode(),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actionAddMidpoint(midpoint, node)(new iD.coreGraph([a, b]));

        expect(graph.entity(node.id).loc).toEqual([1, 2]);
    });

    it('adds the node to a way that contains the given edge in forward order', function () {
        var node = new iD.osmNode(),
            a = new iD.osmNode(),
            b = new iD.osmNode(),
            w1 = new iD.osmWay(),
            w2 = new iD.osmWay({nodes: [a.id, b.id]}),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actionAddMidpoint(midpoint, node)(new iD.coreGraph([a, b, w1, w2]));

        expect(graph.entity(w1.id).nodes).toEqual([]);
        expect(graph.entity(w2.id).nodes).toEqual([a.id, node.id, b.id]);
    });

    it('adds the node to a way that contains the given edge in reverse order', function () {
        var node = new iD.osmNode(),
            a = new iD.osmNode(),
            b = new iD.osmNode(),
            w1 = new iD.osmWay(),
            w2 = new iD.osmWay({nodes: [b.id, a.id]}),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actionAddMidpoint(midpoint, node)(new iD.coreGraph([a, b, w1, w2]));

        expect(graph.entity(w1.id).nodes).toEqual([]);
        expect(graph.entity(w2.id).nodes).toEqual([b.id, node.id, a.id]);
    });

    it('turns an invalid double-back into a self-intersection', function () {
        // a====b (aba)
        // Expected result (converts to a valid loop):
        // a---b (acba)
        //  \ /
        //   c

        var a = new iD.osmNode(),
            b = new iD.osmNode(),
            c = new iD.osmNode(),
            w = new iD.osmWay({nodes: [a.id, b.id, a.id]}),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actionAddMidpoint(midpoint, c)(new iD.coreGraph([a, b, w]));

        expect(graph.entity(w.id).nodes).toEqual([a.id, c.id, b.id, a.id]);
    });
});
