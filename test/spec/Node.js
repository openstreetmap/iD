describe('Node', function() {
  var node;

  beforeEach(function() {
      node = new iD.Node(10, 38, -77);
  });

  it('is a node entity', function() {
      expect(node.type).toEqual('node');
  });

  it('should be initialized with a proper ID, lat, and lon', function() {
      expect(node.id).toEqual(10);
      expect(node.lat).toEqual(38);
      expect(node.lon).toEqual(-77);
  });

  it('knows if it is within a bounding box', function() {
      expect(node.intersects([[-90, 90], [90, -90]])).toBeTruthy();
  });
});
