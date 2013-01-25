describe("iD.actions.DeleteWay", function () {
    it("removes the way from the graph", function () {
        var way    = iD.Way(),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([way]).update(action);
        expect(graph.entity(way.id)).to.be.undefined;
    });

    it("removes a way from parent relations", function () {
        var way      = iD.Way(),
            relation = iD.Relation({members: [{ id: way.id }]}),
            action   = iD.actions.DeleteWay(way.id),
            graph    = iD.Graph([way, relation]).update(action);
        expect(_.pluck(graph.entity(relation.id).members, 'id')).not.to.contain(way.id);
    });

    it("deletes member nodes not referenced by another parent", function () {
        var node   = iD.Node(),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([node, way]).update(action);
        expect(graph.entity(node.id)).to.be.undefined;
    });

    it("does not delete member nodes referenced by another parent", function () {
        var node   = iD.Node(),
            way1   = iD.Way({nodes: [node.id]}),
            way2   = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way1.id),
            graph  = iD.Graph([node, way1, way2]).update(action);
        expect(graph.entity(node.id)).not.to.be.undefined;
    });

    // See #508
    xit("deletes multiple member nodes", function () {
        var a      = iD.Node(),
            b      = iD.Node(),
            way    = iD.Way({nodes: [a.id, b.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([a, b, way]).update(action);
        expect(graph.entity(a.id)).to.be.undefined;
        expect(graph.entity(b.id)).to.be.undefined;
    });

    xit("deletes a circular way's start/end node", function () {
        var a      = iD.Node(),
            b      = iD.Node(),
            c      = iD.Node(),
            way    = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([a, b, way]).update(action);
        expect(graph.entity(a.id)).to.be.undefined;
        expect(graph.entity(b.id)).to.be.undefined;
        expect(graph.entity(c.id)).to.be.undefined;
    });

    it("does not delete member nodes with interesting tags", function () {
        var node   = iD.Node({tags: {highway: 'traffic_signals'}}),
            way    = iD.Way({nodes: [node.id]}),
            action = iD.actions.DeleteWay(way.id),
            graph  = iD.Graph([node, way]).update(action);
        expect(graph.entity(node.id)).not.to.be.undefined;
    });
});
