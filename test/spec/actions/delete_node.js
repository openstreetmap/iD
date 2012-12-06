describe("iD.actions.DeleteNode", function () {
    it("removes the node from the graph", function () {
        var node   = iD.Node(),
            action = iD.actions.DeleteNode(node.id),
            graph  = action(iD.Graph([node]));
        expect(graph.entity(node.id)).to.be.undefined;
    });

    it("removes the node from parent ways", function () {
        var node   = iD.Node(),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteNode(node.id),
            graph  = action(iD.Graph([node, way]));
        expect(graph.entity(way.id).nodes).not.to.contain(node.id);
    });

    it("removes the node from parent relations", function () {
        var node     = iD.Node(),
            relation = iD.Relation({members: [node.id]}),
            action   = iD.actions.DeleteNode(node.id),
            graph    = action(iD.Graph([node, relation]));
        expect(graph.entity(relation.id).members).not.to.contain(node.id);
    });
});
