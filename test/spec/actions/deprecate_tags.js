describe('iD.actions.DeprecateTags', function () {
    it('deprecates tags', function () {
        var entity = iD.Entity({ tags: { barrier: 'wire_fence' } }),
            graph = iD.actions.DeprecateTags(entity.id)(iD.Graph([entity])),
            undeprecated = {
                barrier: 'fence',
                fence_type: 'chain'
            };
        expect(graph.entity(entity.id).tags).to.eql(undeprecated);
    });

    it('does not overwrite explicit tags', function () {
        var entity = iD.Entity({ tags: { barrier: 'wire_fence', fence_type: 'foo' } }),
            graph = iD.actions.DeprecateTags(entity.id)(iD.Graph([entity])),
            undeprecated = {
                barrier: 'fence',
                fence_type: 'foo'
            };
        expect(graph.entity(entity.id).tags).to.eql(undeprecated);
    });

    it('leaves other tags alone', function () {
        var entity = iD.Entity({ tags: { highway: 'ford', name: 'Foo' } }),
            graph = iD.actions.DeprecateTags(entity.id)(iD.Graph([entity])),
            undeprecated = {
                ford: 'yes',
                name: 'Foo'
            };
        expect(graph.entity(entity.id).tags).to.eql(undeprecated);
    });

    it('replaces keys', function () {
        var entity = iD.Entity({ tags: { power_rating: '1 billion volts' } }),
            graph = iD.actions.DeprecateTags(entity.id)(iD.Graph([entity])),
            undeprecated = {
                'generator:output': '1 billion volts'
            };
        expect(graph.entity(entity.id).tags).to.eql(undeprecated);
    });
});
