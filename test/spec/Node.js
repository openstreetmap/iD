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

  it('knows if it is within a bounding box', function() {
      expect(node.within([{ lat: 90, lon: -180 }, { lat: -90, lon: 180 }])).toBeTruthy();
  });

  it('can provide geojson', function() {
      var gj = node.toGeoJSON();
      expect(gj.type).toEqual('Feature');
      expect(gj.geometry.type).toEqual('Point');
  });
});
