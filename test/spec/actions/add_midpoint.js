describe("iD.actions.AddMidpoint", function () {
    it("adds the node at the midpoint location", function () {
        var node = iD.Node(),
            midpoint = {loc: [1, 2], ways: []},
            graph = iD.actions.AddMidpoint(midpoint, node)(iD.Graph());

        expect(graph.entity(node.id).loc).to.eql([1, 2]);
    });

    it("adds the node to all ways at the respective indexes", function () {
        var node = iD.Node(),
            a = iD.Node(),
            b = iD.Node(),
            w1 = iD.Way(),
            w2 = iD.Way({nodes: [a.id, b.id]}),
            midpoint = {loc: [1, 2], ways: [{id: w1.id, index: 0}, {id: w2.id, index: 1}]},
            graph = iD.actions.AddMidpoint(midpoint, node)(iD.Graph([a, b, w1, w2]));

        expect(graph.entity(w1.id).nodes).to.eql([node.id]);
        expect(graph.entity(w2.id).nodes).to.eql([a.id, node.id, b.id]);
    });
});
