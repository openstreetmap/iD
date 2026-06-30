describe('iD.actionAddEntity', function () {
    it('adds an entity to the graph', function () {
        var entity = new iD.osmNode(),
            graph = iD.actionAddEntity(entity)(new iD.coreGraph());
        expect(graph.entity(entity.id)).to.equal(entity);
    });
});
