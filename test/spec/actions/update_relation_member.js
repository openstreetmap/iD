describe("iD.actions.UpdateRelationMember", function () {
    it("updates the properties of the relation member at the specified index", function () {
        var node     = iD.Node(),
            relation = iD.Relation({members: [{id: node.id, role: 'forward'}]}),
            graph    = iD.actions.UpdateRelationMember(relation.id, {role: 'backward'}, 0)(iD.Graph([node, relation]));
        expect(graph.entity(relation.id).members).to.eql([{id: node.id, role: 'backward'}]);
    });
});
