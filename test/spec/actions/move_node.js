describe("iD.actions.MoveNode", function () {
    it("changes a node's location", function () {
        var node   = iD.Node(),
            loc    = [2, 3],
            graph  = iD.actions.MoveNode(node.id, loc)(iD.Graph([node]));
        expect(graph.entity(node.id).loc).to.eql(loc);
    });
});
