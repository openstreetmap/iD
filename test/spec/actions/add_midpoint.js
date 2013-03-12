describe("iD.actions.AddMidpoint", function () {
    it("adds the node at the midpoint location", function () {
        var node = iD.Node(),
            a = iD.Node(),
            b = iD.Node(),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actions.AddMidpoint(midpoint, node)(iD.Graph([a, b]));

        expect(graph.entity(node.id).loc).to.eql([1, 2]);
    });

    it("adds the node to a way that contains the given edge in forward order", function () {
        var node = iD.Node(),
            a = iD.Node(),
            b = iD.Node(),
            w1 = iD.Way(),
            w2 = iD.Way({nodes: [a.id, b.id]}),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actions.AddMidpoint(midpoint, node)(iD.Graph([a, b, w1, w2]));

        expect(graph.entity(w1.id).nodes).to.eql([]);
        expect(graph.entity(w2.id).nodes).to.eql([a.id, node.id, b.id]);
    });

    it("adds the node to a way that contains the given edge in reverse order", function () {
        var node = iD.Node(),
            a = iD.Node(),
            b = iD.Node(),
            w1 = iD.Way(),
            w2 = iD.Way({nodes: [b.id, a.id]}),
            midpoint = {loc: [1, 2], edge: [a.id, b.id]},
            graph = iD.actions.AddMidpoint(midpoint, node)(iD.Graph([a, b, w1, w2]));

        expect(graph.entity(w1.id).nodes).to.eql([]);
        expect(graph.entity(w2.id).nodes).to.eql([b.id, node.id, a.id]);
    });
});
