describe('iD.format.GeoJSON', function() {
  describe('#mapping', function() {
      it('converts a node to GeoJSON', function() {
          var node = iD.Node({loc: [-77, 38]}),
              graph = iD.Graph([node]);
          expect(iD.format.GeoJSON.mapping(node, graph).geometry.type).to.equal('Point');
      });

      it('converts a way to GeoJSON', function() {
          var way = iD.Way(),
              graph = iD.Graph([way]),
              json = iD.format.GeoJSON.mapping(way, graph);
          expect(json.type).to.equal('Feature');
          expect(json.geometry.type).to.equal('LineString');
      });
  });
});
