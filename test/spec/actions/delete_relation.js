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
});
