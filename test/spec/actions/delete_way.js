describe("iD.actions.DeleteWay", function () {
    it("removes the way from the graph", function () {
        var way    = iD.Way(),
            action = iD.actions.DeleteWay(way),
            graph  = action(iD.Graph([way]));
        expect(graph.entity(way.id)).to.be.undefined;
    });

    it("removes a way from parent relations", function () {
        var way      = iD.Way(),
            relation = iD.Relation({members: [way.id]}),
            action   = iD.actions.DeleteWay(way),
            graph    = action(iD.Graph([way, relation]));
        expect(graph.entity(relation.id).members).not.to.contain(way.id);
    });

    it("deletes member nodes not referenced by another parent", function () {
        var node   = iD.Node(),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way),
            graph  = action(iD.Graph([node, way]));
        expect(graph.entity(node.id)).to.be.undefined;
    });

    it("does not delete member nodes referenced by another parent", function () {
        var node   = iD.Node(),
            way1   = iD.Way({nodes: [node.id]}),
            way2   = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way1),
            graph  = action(iD.Graph([node, way1, way2]));
        expect(graph.entity(node.id)).not.to.be.undefined;
    });

    it("does not delete member nodes with interesting tags");
    it("registers member nodes with interesting tags as POIs");
});
