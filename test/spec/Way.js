describe('Way', function() {
  var way;

  beforeEach(function() {
      way = new iD.Way();
  });

  it('is a way', function() {
      expect(way.entityType).toEqual('way');
  });

  it('has zero nodes by default', function() {
      expect(way.nodes.length).toEqual(0);
  });

  it('is closed by default', function() {
      expect(way.isClosed()).toEqual(true);
  });
});
