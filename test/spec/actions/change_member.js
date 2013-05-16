describe("iD.actions.ChangeMember", function () {
    it("updates the member at the specified index", function () {
        var node     = iD.Node(),
            relation = iD.Relation({members: [{id: node.id}]}),
            action   = iD.actions.ChangeMember(relation.id, {id: node.id, role: 'node'}, 0),
            graph    = action(iD.Graph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([{id: node.id, role: 'node'}]);
    });
});
