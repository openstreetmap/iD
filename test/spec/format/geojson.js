describe('iD.format.GeoJSON', function() {

  describe('#mapping', function() {
      it('should be able to map a node to geojson', function() {
          expect(iD.format.GeoJSON.mapping({ type: 'node', loc: [-77, 38] }).geometry.type).to.equal('Point');
      });
      it('should be able to map a way to geojson', function() {
          var way = { type: 'way', nodes: [] };
          var gj = iD.format.GeoJSON.mapping(way);
          expect(gj.type).to.equal('Feature');
          expect(gj.geometry.type).to.equal('LineString');
      });
  });
});
