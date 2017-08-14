describe('iD.actionAddEntity', function () {
    it('adds an entity to the graph', function () {
        var entity = iD.Way(),
            graph = iD.actionAddEntity(entity)(iD.Graph());
        expect(graph.entity(entity.id)).to.equal(entity);
    });
});
