describe('GeoJSON', function() {

  describe('#mapping', function() {
      it('should be able to map a node to geojson', function() {
          expect(iD.format.GeoJSON.mapping({ type: 'node', lat: 38, lon: -77 }).geometry.type).toEqual('Point');
      });
      it('should be able to map a way to geojson', function() {
          var way = { type: 'way', nodes: [] };
          var gj = iD.format.GeoJSON.mapping(way);
          expect(gj.type).toEqual('Feature');
          expect(gj.geometry.type).toEqual('LineString');
      });
  });
});
