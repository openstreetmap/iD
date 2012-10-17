describe('Entity', function() {
  var entity;

  beforeEach(function() {
      entity = new iD.Entity();
  });

  it('has no entity type', function() {
      expect(entity.entityType).toEqual('');
  });
});
