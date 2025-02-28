describe('iD.actionAddEntity', function () {
    it('adds an entity to the graph', function () {
        const entity = iD.osmEntity(),
            graph = iD.actionAddEntity(entity)(iD.coreGraph());
        expect(graph.entity(entity.id)).to.equal(entity);
    });
});
