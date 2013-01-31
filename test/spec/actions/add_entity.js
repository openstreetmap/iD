describe("iD.actions.AddEntity", function () {
    it("adds an entity to the graph", function () {
        var entity = iD.Entity(),
            graph = iD.actions.AddEntity(entity)(iD.Graph());
        expect(graph.entity(entity.id)).to.equal(entity);
    });
});
