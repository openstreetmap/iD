describe("iD.actions.DeleteMember", function () {
    it("removes the member at the specified index", function () {
        var node     = iD.Node(),
            relation = iD.Relation({members: [node.id]}),
            action   = iD.actions.DeleteMember(relation.id, 0),
            graph    = action(iD.Graph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([]);
    });
});
