describe('Entity', function () {
    var entity;

    beforeEach(function () {
        entity = new iD.Entity();
    });

    describe('#parentWays', function () {
        it('returns an array of parents with entityType way', function () {
            entity.addParent({_id: 1, type: 'way'});
            entity.addParent({_id: 2, type: 'node'});
            expect(entity.parentWays()).toEqual([{_id: 1, type: 'way'}]);
        });
    });

    describe('#parentRelations', function () {
        it('returns an array of parents with entityType relation', function () {
            entity.addParent({_id: 1, type: 'way'});
            entity.addParent({_id: 2, type: 'relation'});
            expect(entity.parentRelations()).toEqual([{_id: 2, type: 'relation'}]);
        });
    });
});
