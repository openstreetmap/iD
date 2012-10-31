describe('GeoJSON', function() {

  describe('#mapping', function() {
      it('should be able to map a node to geojson', function() {
          var node = new iD.Node(10, 38, -77);
          expect(iD.GeoJSON.mapping(node).geometry.type).toEqual('Point');
      });
      it('should be able to map a way to geojson', function() {
          var way = new iD.Way();
          var gj = iD.GeoJSON.mapping(way);
          expect(gj.type).toEqual('Feature');
          expect(gj.geometry.type).toEqual('LineString');
      });
  });
});
