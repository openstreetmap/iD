describe('Way', function() {
  var way;

  beforeEach(function() {
      way = new iD.Way();
  });

  it('is a way', function() {
      expect(way.entityType).toEqual('way');
  });

  it('has zero nodes by default', function() {
      expect(way.length()).toEqual(0);
  });
});
