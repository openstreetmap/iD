describe('Entity', function() {
  var entity;

  beforeEach(function() {
      entity = new iD.Entity();
  });

  it('has no entity type', function() {
      expect(entity.entityType).toEqual('');
  });

  it('can count its tags', function() {
      expect(entity.numTags()).toEqual(0);
      entity.tags = {
          foo: 'bar',
          alice: 'bar'
      };
      expect(entity.numTags()).toEqual(2);
  });
});
