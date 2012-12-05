describe("iD.actions.remove", function () {
    it("removes the entity from the graph", function () {
        var entity = iD.Way(),
            action = iD.actions.remove(entity),
            graph  = action(iD.Graph().replace(entity));
        expect(graph.entity(entity.id)).to.be.undefined;
    });

    it("removes a node from parent ways", function () {
        var node   = iD.Node(),
            way    = iD.Way().update({nodes: [node.id]}),
            action = iD.actions.remove(node),
            graph  = action(iD.Graph().replace(node).replace(way));
        expect(graph.entity(way.id).nodes).not.to.contain(node.id);
    });

    it("removes a way from parent relations", function () {
        var way      = iD.Way(),
            relation = iD.Relation().update({members: [way.id]}),
            action   = iD.actions.remove(way),
            graph    = action(iD.Graph().replace(way).replace(relation));
        expect(graph.entity(relation.id).members).not.to.contain(way.id);
    });
});
