describe("iD.actions.AddNode", function () {
    it("adds a node to the graph", function () {
        var node = iD.Node(),
            graph = iD.actions.AddNode(node)(iD.Graph());
        expect(graph.entity(node.id)).to.equal(node);
    });
});
