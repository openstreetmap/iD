describe("iD.actions.Move", function () {
    it("changes an entity's location", function () {
        var entity = iD.Entity(),
            loc    = [2, 3],
            graph  = iD.actions.Move(entity.id, loc)(iD.Graph([entity]));
        expect(graph.entity(entity.id).loc).to.eql(loc);
    });
});
