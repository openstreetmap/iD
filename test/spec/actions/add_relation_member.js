describe("iD.actions.AddRelationMember", function () {
    it("adds a member at the end of the relation", function () {
        var relation = iD.Relation(),
            graph    = iD.Graph([relation]);

        graph = iD.actions.AddRelationMember(relation.id, {id: '1'})(graph);

        expect(graph.entity(relation.id).members).to.eql([{id: '1'}]);
    });

    it("adds a member at index 0", function () {
        var relation = iD.Relation({members: [{id: '1'}]}),
            graph    = iD.Graph([relation]);

        graph = iD.actions.AddRelationMember(relation.id, {id: '2'}, 0)(graph);

        expect(graph.entity(relation.id).members).to.eql([{id: '2'}, {id: '1'}]);
    });

    it("adds a member at a positive index", function () {
        var relation = iD.Relation({members: [{id: '1'}, {id: '3'}]}),
            graph    = iD.Graph([relation]);

        graph = iD.actions.AddRelationMember(relation.id, {id: '2'}, 1)(graph);

        expect(graph.entity(relation.id).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
    });

    it("adds a member at a negative index", function () {
        var relation = iD.Relation({members: [{id: '1'}, {id: '3'}]}),
            graph    = iD.Graph([relation]);

        graph = iD.actions.AddRelationMember(relation.id, {id: '2'}, -1)(graph);

        expect(graph.entity(relation.id).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
    });
});
