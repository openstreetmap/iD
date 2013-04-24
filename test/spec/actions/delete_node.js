describe("iD.actions.DeleteNode", function () {
    it("removes the node from the graph", function () {
        var node   = iD.Node(),
            action = iD.actions.DeleteNode(node.id),
            graph  = action(iD.Graph([node]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it("removes the node from parent ways", function () {
        var node1  = iD.Node(),
            node2  = iD.Node(),
            node3  = iD.Node(),
            way    = iD.Way({nodes: [node1.id, node2.id, node3.id]}),
            action = iD.actions.DeleteNode(node1.id),
            graph  = action(iD.Graph([node1, node2, node3, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node3.id]);
    });

    it("removes the node from parent relations", function () {
        var node1    = iD.Node(),
            node2    = iD.Node(),
            relation = iD.Relation({members: [{ id: node1.id }, { id: node2.id }]}),
            action   = iD.actions.DeleteNode(node1.id),
            graph    = action(iD.Graph([node1, node2, relation]));
        expect(graph.entity(relation.id).members).to.eql([{ id: node2.id }]);
    });

    it("deletes parent ways that would otherwise have less than two nodes", function () {
        var node1  = iD.Node(),
            node2  = iD.Node(),
            way    = iD.Way({nodes: [node1.id, node2.id]}),
            action = iD.actions.DeleteNode(node1.id),
            graph  = action(iD.Graph([node1, node2, way]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it("deletes degenerate circular ways", function () {
        var node1  = iD.Node(),
            node2  = iD.Node(),
            way    = iD.Way({nodes: [node1.id, node2.id, node1.id]}),
            action = iD.actions.DeleteNode(node2.id),
            graph  = action(iD.Graph([node1, node2, way]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });
});
