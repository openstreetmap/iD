describe("iD.actions.RemoveRelationMember", function () {
    it("removes a member from a relation", function () {
        var node     = iD.Node(),
            relation = iD.Way({members: [{ id: node.id }]}),
            graph    = iD.actions.RemoveRelationMember(relation.id, node.id)(iD.Graph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([]);
    });
});
