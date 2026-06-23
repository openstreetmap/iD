describe('iD.actionChangeTags', function () {
    it('changes an entity\'s tags', function () {
        var entity = new iD.osmNode(),
            tags   = {foo: 'bar'},
            graph  = iD.actionChangeTags(entity.id, tags)(new iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql(tags);
    });
});
