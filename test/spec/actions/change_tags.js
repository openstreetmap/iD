describe('iD.actionChangeTags', function () {
    it('changes an entity\'s tags', function () {
        var entity = iD.Entity(),
            tags   = {foo: 'bar'},
            graph  = iD.actionChangeTags(entity.id, tags)(iD.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql(tags);
    });
});
