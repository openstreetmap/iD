describe("iD.actions.DeleteRelation", function () {
    it("removes the relation from the graph", function () {
        var relation = iD.Relation(),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([relation]));
        expect(graph.entity(relation.id)).to.be.undefined;
    });

    it("removes the relation from parent relations", function () {
        var a      = iD.Relation(),
            b      = iD.Relation(),
            parent = iD.Relation({members: [{ id: a.id }, { id: b.id }]}),
            action = iD.actions.DeleteRelation(a.id),
            graph  = action(iD.Graph([a, b, parent]));
        expect(graph.entity(parent.id).members).to.eql([{ id: b.id }]);
    });

    it("deletes member nodes not referenced by another parent", function() {
        var node     = iD.Node(),
            relation = iD.Relation({members: [{id: node.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([node, relation]));
        expect(graph.entity(node.id)).to.be.undefined;
    });

    it("does not delete member nodes referenced by another parent", function() {
        var node     = iD.Node(),
            way      = iD.Way({nodes: [node.id]}),
            relation = iD.Relation({members: [{id: node.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([node, way, relation]));
        expect(graph.entity(node.id)).not.to.be.undefined;
    });

    it("does not delete member nodes with interesting tags", function() {
        var node     = iD.Node({tags: {highway: 'traffic_signals'}}),
            relation = iD.Relation({members: [{id: node.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([node, relation]));
        expect(graph.entity(node.id)).not.to.be.undefined;
    });

    it("deletes member ways not referenced by another parent", function() {
        var way      = iD.Way(),
            relation = iD.Relation({members: [{id: way.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([way, relation]));
        expect(graph.entity(way.id)).to.be.undefined;
    });

    it("does not delete member ways referenced by another parent", function() {
        var way       = iD.Way(),
            relation1 = iD.Relation({members: [{id: way.id}]}),
            relation2 = iD.Relation({members: [{id: way.id}]}),
            action    = iD.actions.DeleteRelation(relation1.id),
            graph     = action(iD.Graph([way, relation1, relation2]));
        expect(graph.entity(way.id)).not.to.be.undefined;
    });

    it("does not delete member ways with interesting tags", function() {
        var way      = iD.Node({tags: {highway: 'residential'}}),
            relation = iD.Relation({members: [{id: way.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([way, relation]));
        expect(graph.entity(way.id)).not.to.be.undefined;
    });

    it("deletes nodes of deleted member ways", function() {
        var node     = iD.Node(),
            way      = iD.Way({nodes: [node.id]}),
            relation = iD.Relation({members: [{id: way.id}]}),
            action   = iD.actions.DeleteRelation(relation.id),
            graph    = action(iD.Graph([node, way, relation]));
        expect(graph.entity(node.id)).to.be.undefined;
    });
});
