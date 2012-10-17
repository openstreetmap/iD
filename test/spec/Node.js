describe('Node', function() {
  var node;

  beforeEach(function() {
      node = new iD.Node(null, 10, 38, -77);
  });

  it('is a node entity', function() {
      expect(node.entityType).toEqual('node');
  });

  it('should be initialized with a proper ID, lat, and lon', function() {
      expect(node.id).toEqual(10);
      expect(node.lat).toEqual(38);
      expect(node.lon).toEqual(-77);
  });

  it('reprojects a latp parameter', function() {
      expect(node.latp).toBeCloseTo(41.1376);
      node.project();
      expect(node.latp).toBeCloseTo(41.1376);
  });

  it('knows if it is within a bounding box', function() {
      expect(node.within(-90, 90, 90, -90)).toBeTruthy();
  });

  it('knows if it is without a bounding box', function() {
      expect(node.within(-90, -85, 90, -90)).toBeFalsy();
  });
});
