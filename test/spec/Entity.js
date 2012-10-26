describe('Entity', function () {
    var entity;

    beforeEach(function () {
        entity = iD.Entity();
    });

    it('has no entity type', function () {
        expect(entity.entityType).toEqual('');
    });

    describe('#parentWays', function () {
        it('returns an array of parents with entityType way', function () {
            entity.addParent({_id: 1, entityType: 'way'});
            entity.addParent({_id: 2, entityType: 'node'});
            expect(entity.parentWays()).toEqual([{_id: 1, entityType: 'way'}]);
        });
    });

    describe('#parentRelations', function () {
        it('returns an array of parents with entityType relation', function () {
            entity.addParent({_id: 1, entityType: 'way'});
            entity.addParent({_id: 2, entityType: 'relation'});
            expect(entity.parentRelations()).toEqual([{_id: 2, entityType: 'relation'}]);
        });
    })
});
